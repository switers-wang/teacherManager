import { get, set } from 'idb-keyval';

const QUESTION_KEY = 'tm_questions';
const USER_KEY = 'tm_users';
const ANSWER_RECORD_KEY = 'tm_answer_records';

export async function getQuestions() {
  return (await get(QUESTION_KEY)) || [];
}

export async function addQuestion(q) {
  const qs = await getQuestions();
  q.id = q.id || Date.now() + Math.random().toString(36).slice(2, 8);
  if (q.type === 'single' || q.type === 'multiple') {
    q.options = q.options;
    // 处理答案：只支持字母格式，直接存储字母
    const answerStr = q.answer.trim();
    if (q.type === 'single') {
      // 单选题：单个答案
      if (!/^[A-Za-z]$/.test(answerStr)) {
        throw new Error('单选题答案格式错误，请输入字母(A,B,C,D)');
      }
      q.answer = [answerStr.toUpperCase()];
      console.log('单选题答案处理:', { original: answerStr, processed: q.answer });
    } else {
      // 多选题：多个答案
      const answerParts = answerStr.split(',').map(s => s.trim());
      const answerLetters = answerParts.map(part => {
        if (!/^[A-Za-z]$/.test(part)) {
          throw new Error('多选题答案格式错误，请输入字母(A,B,C,D)，多个答案用逗号分隔');
        }
        return part.toUpperCase();
      });
      q.answer = answerLetters;
      console.log('多选题答案处理:', { original: answerStr, processed: q.answer });
    }
  }
  qs.push(q);
  await set(QUESTION_KEY, qs);
  console.log('题目保存成功:', { id: q.id, type: q.type, answer: q.answer });
}

export async function removeQuestion(id) {
  const qs = await getQuestions();
  await set(QUESTION_KEY, qs.filter(q => q.id !== id));
}

export async function updateQuestion(id, updatedQuestion) {
  const qs = await getQuestions();
  const index = qs.findIndex(q => q.id === id);
  
  if (index === -1) {
    throw new Error('题目不存在');
  }
  
  // 处理答案格式
  if (updatedQuestion.type === 'single' || updatedQuestion.type === 'multiple') {
    // 确保answer是字符串类型
    const answerStr = typeof updatedQuestion.answer === 'string' ? updatedQuestion.answer.trim() : String(updatedQuestion.answer || '');
    
    if (updatedQuestion.type === 'single') {
      // 单选题：单个答案
      if (!/^[A-Za-z]$/.test(answerStr)) {
        throw new Error('单选题答案格式错误，请输入字母(A,B,C,D)');
      }
      updatedQuestion.answer = [answerStr.toUpperCase()];
    } else {
      // 多选题：多个答案
      const answerParts = answerStr.split(',').map(s => s.trim());
      const answerLetters = answerParts.map(part => {
        if (!/^[A-Za-z]$/.test(part)) {
          throw new Error('多选题答案格式错误，请输入字母(A,B,C,D)，多个答案用逗号分隔');
        }
        return part.toUpperCase();
      });
      updatedQuestion.answer = answerLetters;
    }
  }
  
  // 保持原有的ID
  updatedQuestion.id = id;
  qs[index] = updatedQuestion;
  await set(QUESTION_KEY, qs);
  console.log('题目更新成功:', { id: updatedQuestion.id, type: updatedQuestion.type, answer: updatedQuestion.answer });
}



export async function getUsers() {
  return (await get(USER_KEY)) || [];
}

export async function registerUser(user) {
  const users = await getUsers();
  if (users.find(u => u.username === user.username && u.role === user.role)) return false;
  users.push(user);
  await set(USER_KEY, users);
  return true;
}

export async function loginUser({ role, username, password }) {
  const users = await getUsers();
  if (role === 'student') {
    return users.find(u => u.role === 'student' && u.username === username && u.password === password) || null;
  } else {
    return users.find(u => u.role === 'teacher' && u.username === username && u.password === password) || null;
  }
}

// 新增：保存学生答题记录
export async function saveAnswerRecord(studentUsername, questionId, answerData, score) {
  try {
    const records = await getAnswerRecords();
    
    const record = {
      id: Date.now() + Math.random().toString(36).slice(2, 8),
      studentUsername,
      questionId,
      answerData,
      score,
      timestamp: new Date().toISOString(),
    };
    
    records.push(record);
    await set(ANSWER_RECORD_KEY, records);
    return record;
  } catch (error) {
    console.error('保存答题记录失败:', error);
    throw error;
  }
}

// 新增：获取所有答题记录
export async function getAnswerRecords() {
  try {
    const records = await get(ANSWER_RECORD_KEY);
    return records || [];
  } catch (error) {
    console.error('获取答题记录失败:', error);
    return [];
  }
}

// 新增：获取学生答题统计
export async function getStudentAnswerStats() {
  const records = await getAnswerRecords();
  const questions = await getQuestions();
  const users = await getUsers();
  
  // 获取所有学生用户
  const students = users.filter(user => user.role === 'student');
  
  // 按学生分组统计
  const stats = students.map(student => {
    const studentRecords = records.filter(record => record.studentUsername === student.username);
    
    // 统计每个题目的答题情况
    const questionStats = questions.map(question => {
      // 获取该学生对该题目的所有答题记录，按时间倒序排列
      const studentQuestionRecords = studentRecords
        .filter(record => record.questionId === question.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // 只取最新的答题记录
      const questionRecord = studentQuestionRecords[0];
      const questionScore = question.score || 100;
      
      // 判断答案正确性
      let isCorrect = false;
      if (questionRecord && questionRecord.answerData) {
        const answerData = questionRecord.answerData;
        
        if (question.type === 'single') {
          const userAnswer = answerData.answer ? answerData.answer.toUpperCase() : '';
          const correctAnswer = question.answer[0];
          isCorrect = userAnswer === correctAnswer;
        } else if (question.type === 'multiple') {
          const userAnswers = Array.isArray(answerData.answer) ? 
            answerData.answer.map(ans => ans.toUpperCase()) : [];
          const correctAnswers = question.answer;
          isCorrect = userAnswers.length === correctAnswers.length &&
            userAnswers.every((ans, index) => ans === correctAnswers[index]);
        } else if (question.type === 'code') {
          // 编程题基于分数判断
          isCorrect = questionRecord.score === questionScore;
        }
      }
      
      return {
        questionId: question.id,
        questionTitle: question.question,
        questionType: question.type,
        questionScore: questionScore,
        hasAnswered: !!questionRecord,
        score: questionRecord ? questionRecord.score : 0,
        isCorrect: isCorrect,
        answerData: questionRecord ? questionRecord.answerData : null,
        timestamp: questionRecord ? questionRecord.timestamp : null,
      };
    });
    
    // 计算总体统计
    const totalQuestions = questions.length;
    const answeredQuestions = questionStats.filter(q => q.hasAnswered).length;
    const correctQuestions = questionStats.filter(q => q.isCorrect).length;
    const totalScore = questionStats.reduce((sum, q) => sum + q.score, 0);
    const totalPossibleScore = questionStats.reduce((sum, q) => sum + (q.questionScore || 100), 0);
    const averageScore = answeredQuestions > 0 ? Math.round(totalScore / answeredQuestions) : 0;
    
    // 计算正确率：基于得分率而不是完全正确的题目数量
    let accuracyRate = 0;
    if (answeredQuestions > 0) {
      if (totalPossibleScore > 0) {
        // 基于总得分率计算正确率
        accuracyRate = Math.round((totalScore / totalPossibleScore) * 100);
      } else {
        // 如果没有设置题目分数，使用原来的逻辑
        accuracyRate = Math.round((correctQuestions / answeredQuestions) * 100);
      }
    }
    
    return {
      studentUsername: student.username,
      studentName: student.name || student.username,
      questionStats,
      totalQuestions,
      answeredQuestions,
      correctQuestions,
      totalScore,
      totalPossibleScore,
      averageScore,
      completionRate: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
      accuracyRate: accuracyRate,
    };
  });
  
  return stats;
}

// 新增：获取题目答题统计
export async function getQuestionAnswerStats() {
  const records = await getAnswerRecords();
  const questions = await getQuestions();
  
  return questions.map(question => {
    const questionRecords = records.filter(record => record.questionId === question.id);
    
    // 只计算不同学生的答题次数，每个学生只计算最后一次答题
    const uniqueStudentRecords = [];
    const studentMap = new Map();
    
    // 按时间倒序排列，确保取最新的答题记录
    const sortedRecords = questionRecords.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    // 只保留每个学生的最后一次答题
    for (const record of sortedRecords) {
      if (!studentMap.has(record.studentUsername)) {
        studentMap.set(record.studentUsername, record);
        uniqueStudentRecords.push(record);
      }
    }
    
    const totalAttempts = uniqueStudentRecords.length;
    const questionScore = question.score || 100;
    const correctAttempts = uniqueStudentRecords.filter(record => record.score === questionScore).length;
    const totalScore = uniqueStudentRecords.reduce((sum, record) => sum + record.score, 0);
    const totalPossibleScore = totalAttempts * questionScore;
    const averageScore = totalAttempts > 0 ? 
      Math.round(totalScore / totalAttempts) : 0;
    
    // 计算正确率：基于平均得分率
    let correctRate = 0;
    if (totalAttempts > 0 && totalPossibleScore > 0) {
      correctRate = Math.round((totalScore / totalPossibleScore) * 100);
    }
    
    return {
      questionId: question.id,
      questionTitle: question.question,
      questionType: question.type,
      questionScore: questionScore,
      totalAttempts,
      correctAttempts,
      incorrectAttempts: totalAttempts - correctAttempts,
      averageScore,
      correctRate: correctRate,
    };
  });
} 