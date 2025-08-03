import { get, set } from 'idb-keyval';

const QUESTION_KEY = 'tm_questions';
const USER_KEY = 'tm_users';

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
    const answerStr = updatedQuestion.answer.trim();
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