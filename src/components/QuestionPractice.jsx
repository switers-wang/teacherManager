import React, { useEffect, useState } from 'react';
import { Card, Button, Radio, Checkbox, message, Input, Select, Space, Progress, Table, Tag } from 'antd';
import { getQuestions, saveStudentRecord, getStudentRecord } from '../utils/storage';
import CodeEditor from './CodeEditor';

const { Option } = Select;

export default function QuestionPractice() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qid]: { answer, code, lang } }
  const [answer, setAnswer] = useState([]);
  const [code, setCode] = useState('');
  const [lang, setLang] = useState('python');
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [record, setRecord] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [scores, setScores] = useState({}); // { [qid]: 分数 }
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    getQuestions().then(qs => setQuestions(qs));
    getStudentRecord().then(setRecord);
  }, []);

  useEffect(() => {
    if (!questions.length) return;
    const q = questions[current];
    const saved = answers[q.id] || {};
    if (q.type === 'multiple') {
      setAnswer(Array.isArray(saved.answer) ? saved.answer : []);
    } else {
      setAnswer(saved.answer !== undefined ? saved.answer : '');
    }
    setCode(saved.code || '');
    setLang(saved.lang || 'python');
    setTestResult(null);
    setScore(scores[q.id] || 0);
  }, [current, questions, scores]);

  if (!questions.length) return <Card>暂无题目，请联系教师添加。</Card>;
  const q = questions[current];

  const handlePrev = () => {
    setAnswers({
      ...answers,
      [q.id]: { answer, code, lang },
    });
    setCurrent((c) => (c - 1 + questions.length) % questions.length);
  };

  const handleNext = () => {
    setAnswers({
      ...answers,
      [q.id]: { answer, code, lang },
    });
    setCurrent((c) => (c + 1) % questions.length);
  };

  const handleAnswerChange = (val) => {
    setAnswer(val);
    setAnswers({
      ...answers,
      [q.id]: { ...answers[q.id], answer: val, code, lang },
    });
  };

  const handleCodeChange = (val) => {
    setCode(val);
    setAnswers({
      ...answers,
      [q.id]: { ...answers[q.id], code: val, answer, lang },
    });
  };

  const handleLangChange = (val) => {
    setLang(val);
    setAnswers({
      ...answers,
      [q.id]: { ...answers[q.id], lang: val, code, answer },
    });
  };

  const handleSubmit = async () => {
    // 合法性校验
    if (q.type === 'single') {
      // 单选题校验
      if (!answer || answer === '') {
        message.error('请选择一个答案');
        return;
      }
      if (!/^[A-Za-z]$/.test(answer)) {
        message.error('单选题答案格式错误，请选择A、B、C、D中的一个');
        return;
      }
    } else if (q.type === 'multiple') {
      // 多选题校验
      if (!Array.isArray(answer) || answer.length === 0) {
        message.error('请至少选择一个答案');
        return;
      }
      for (const ans of answer) {
        if (!/^[A-Za-z]$/.test(ans)) {
          message.error('多选题答案格式错误，请选择A、B、C、D中的选项');
          return;
        }
      }
    } else if (q.type === 'code') {
      // 编程题校验
      if (!code || code.trim() === '') {
        message.error('请编写代码');
        return;
      }
      if (!lang) {
        message.error('请选择编程语言');
        return;
      }
    }
    
    // 保存当前题目的答案
    setAnswers({
      ...answers,
      [q.id]: { answer, code, lang },
    });
    
    let currentScore = 0;
    
    // 判断当前题目的对错
    if (q.type === 'single') {
      // 单选题：直接比较字母答案
      const userAnswer = answer ? answer.toUpperCase() : '';
      const correctAnswer = q.answer[0]; // 标准答案（字母）
      console.log('单选题判题:', { userAnswer, correctAnswer, questionId: q.id });
      currentScore = userAnswer === correctAnswer ? 100 : 0;
      
    } else if (q.type === 'multiple') {
      // 多选题：直接比较字母答案数组
      const userAnswers = Array.isArray(answer) ? 
        answer.map(ans => ans.toUpperCase()) : []; // 用户答案数组（字母）
      const correctAnswers = q.answer; // 标准答案数组（字母）
      console.log('多选题判题:', { userAnswers, correctAnswers, questionId: q.id });
      
      // 简单比较：长度相同且内容相同
      const isCorrect = userAnswers.length === correctAnswers.length &&
        userAnswers.every((ans, index) => ans === correctAnswers[index]);
      currentScore = isCorrect ? 100 : 0;
      
    } else if (q.type === 'code') {
      // 编程题：运行所有测试用例，只有全部通过才算正确
      setLoading(true);
      let passedTests = 0;
      let totalTests = q.testCases.length;
      
      for (const testCase of q.testCases) {
        const isPassed = await judgeCode(lang, code, testCase.input, testCase.output, testCase.inputType, testCase.outputType);
        if (isPassed) passedTests++;
      }
      
      // 只有全部测试用例通过才算正确
      currentScore = passedTests === totalTests ? 100 : 0;
      setLoading(false);
      
      // 显示测试结果
      if (passedTests === totalTests) {
        message.success(`恭喜！所有测试用例都通过了！`);
      } else {
        message.error(`测试失败：${passedTests}/${totalTests} 个测试用例通过`);
      }
    }
    
    // 保存当前题目的得分
    await saveStudentRecord({ qid: q.id, score: currentScore });
    setRecord(await getStudentRecord());
    
    // 更新当前题目的分数显示
    setScore(currentScore);
    setScores({ ...scores, [q.id]: currentScore });
    
    // 显示当前题目的结果
    const resultMessage = currentScore === 100 ? '回答正确！' : '回答错误，请重新尝试。';
    message.success(`当前题目：${resultMessage}`);
  };

  const handleTestCode = async () => {
    if (!q.testCases || !q.testCases.length) {
      setTestResult('当前题目无测试用例');
      return;
    }
    
    setTestLoading(true);
    let testResults = [];
    let passedTests = 0;
    let totalTests = q.testCases.length;
    
    // 测试当前题目的每个测试用例
    for (const testCase of q.testCases) {
      const output = await runCodeWithInput(lang, code, testCase.input, testCase.inputType);
      
      // 检查输出是否包含错误信息
      const isError = output.startsWith('错误:') || output.startsWith('执行错误:');
      
      // 根据输出类型判断是否通过
      let isPassed = false;
      if (!isError) {
        // 默认使用字符串比较，除非明确指定为数字类型
        const outputType = testCase.outputType || 'string';
        if (outputType === 'number') {
          // 数字类型：转换为数字后比较
          const actualNum = parseFloat(output);
          const expectedNum = parseFloat(testCase.output);
          isPassed = !isNaN(actualNum) && !isNaN(expectedNum) && actualNum === expectedNum;
        } else {
          // 字符串类型：直接比较
          const actualTrimmed = output.trim();
          const expectedTrimmed = testCase.output.trim();
          isPassed = actualTrimmed === expectedTrimmed;
        }
      }
      
      if (isPassed) passedTests++;
      
      testResults.push({ 
        input: testCase.input, 
        inputType: testCase.inputType,
        expected: testCase.output,
        expectedType: testCase.outputType,
        actual: output, 
        pass: isPassed 
      });
    }
    
    setTestResult(testResults);
    setTestLoading(false);
    
    // 显示测试总结
    if (passedTests === totalTests) {
      message.success(`测试完成：${passedTests}/${totalTests} 个测试用例通过`);
    } else {
      message.warning(`测试完成：${passedTests}/${totalTests} 个测试用例通过`);
    }
  };

  function getStatus(qid) {
    // 获取指定题目的记录
    const questionRecords = record.filter(r => r.qid === qid);
    
    if (!questionRecords.length) {
      return '未做';
    }
    
    // 获取该题目的最高分
    const maxScore = Math.max(...questionRecords.map(r => r.score));
    
    if (maxScore >= 100) {
      return '做对';
    } else if (maxScore > 0) {
      return '部分正确';
    } else {
      return '做错';
    }
  }

  return (
    <Card>
      {!showDetail ? (
        <div style={{ marginBottom: 16 }}>
          <Table
            size="small"
            pagination={false}
            dataSource={questions.map((item, idx) => {
              const status = getStatus(item.id);
              let color = 'default';
              if (status === '做对') color = 'green';
              else if (status === '部分正确') color = 'orange';
              else if (status === '做错') color = 'red';
              
              // 题目类型显示
              let typeText = '';
              let typeColor = '';
              if (item.type === 'single') {
                typeText = '单选';
                typeColor = 'blue';
              } else if (item.type === 'multiple') {
                typeText = '多选';
                typeColor = 'green';
              } else if (item.type === 'code') {
                typeText = '编程';
                typeColor = 'orange';
              }
              
              return {
                key: item.id,
                idx: idx + 1,
                title: item.question.length > 20 ? item.question.slice(0, 20) + '...' : item.question,
                type: typeText,
                typeColor,
                status,
                color,
                active: current === idx,
                onClick: () => { setCurrent(idx); setShowDetail(true); },
              };
            })}
            columns={[
              { title: '题号', dataIndex: 'idx', key: 'idx', width: 60, render: (v, r) => <b style={{ color: r.active ? '#1677ff' : undefined }}>{v}</b> },
              { title: '类型', dataIndex: 'type', key: 'type', width: 80, render: (v, r) => <Tag color={r.typeColor}>{v}</Tag> },
              { title: '题目', dataIndex: 'title', key: 'title', render: (v, r) => <span style={{ color: r.active ? '#1677ff' : undefined, cursor: 'pointer' }} onClick={r.onClick}>{v}</span> },
              { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v, r) => <Tag color={r.color}>{v}</Tag> },
            ]}
            rowClassName={r => r.active ? 'ant-table-row-selected' : ''}
            onRow={r => ({ onClick: r.onClick, style: { cursor: 'pointer' } })}
            style={{ marginBottom: 24 }}
          />
        </div>
      ) : (
        <>
          <Button onClick={() => setShowDetail(false)} style={{ marginBottom: 16 }}>返回题目列表</Button>
          <div style={{ marginBottom: 16 }}><b>题目内容：</b> {q.question}</div>
          {q.type === 'single' && (
            <Radio.Group onChange={e => handleAnswerChange(e.target.value)} value={answer}>
              {(Array.isArray(q.options) ? q.options : q.options.split(',')).map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx); // A, B, C, D
                return <Radio key={idx} value={letter}>{letter}. {opt}</Radio>;
              })}
            </Radio.Group>
          )}
          {q.type === 'multiple' && (
            <Checkbox.Group 
              options={(Array.isArray(q.options) ? q.options : q.options.split(',')).map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx); // A, B, C, D
                return { label: `${letter}. ${opt}`, value: letter };
              })} 
              value={Array.isArray(answer) ? answer : []} 
              onChange={handleAnswerChange} 
            />
          )}
          {q.type === 'code' && (
            <>
              <Space style={{ marginBottom: 8 }}>
                <span>语言：</span>
                <Select value={lang} onChange={handleLangChange} style={{ width: 120 }}>
                  <Option value="python">Python</Option>
                  <Option value="cpp">C++</Option>
                  <Option value="javascript">JavaScript</Option>
                </Select>
              </Space>
              <CodeEditor language={lang} value={code} onChange={handleCodeChange} />
              <Button onClick={handleTestCode} loading={testLoading} style={{ marginBottom: 8 }}>跑测试用例</Button>
              {testResult && Array.isArray(testResult) && (
                <Table
                  size="small"
                  pagination={false}
                  dataSource={testResult.map((r, i) => ({ ...r, key: i }))}
                  columns={[{
                    title: '输入', dataIndex: 'input', key: 'input', width: 120
                  }, {
                    title: '期望输出', dataIndex: 'expected', key: 'expected', width: 120
                  }, {
                    title: '实际输出', dataIndex: 'actual', key: 'actual', width: 120
                  }, {
                    title: '结果', dataIndex: 'pass', key: 'pass', width: 80, render: pass => pass ? <span style={{color:'green'}}>通过</span> : <span style={{color:'red'}}>未通过</span>
                  }]}
                  style={{ marginBottom: 8 }}
                />
              )}
              {testResult && typeof testResult === 'string' && <div style={{ marginBottom: 8 }}>{testResult}</div>}
            </>
          )}
          <div style={{ marginTop: 16 }}>
            <Button type="primary" onClick={handleSubmit} loading={loading}>提交</Button>
          </div>
        </>
      )}
    </Card>
  );
}

async function judgeCode(language, source, input, expectedOutput, inputType = 'number', outputType = 'number') {
  try {
    // 纯前端代码执行
    const actualOutput = await executeCodeFrontend(language, source, input, inputType);
    const isError = actualOutput.startsWith('错误:') || actualOutput.startsWith('执行错误:');
    
    if (isError) {
      return false;
    }
    
    // 根据输出类型进行比较
    // 默认使用字符串比较，除非明确指定为数字类型
    const finalOutputType = outputType || 'string';
    if (finalOutputType === 'number') {
      // 数字类型：转换为数字后比较
      const actualNum = parseFloat(actualOutput);
      const expectedNum = parseFloat(expectedOutput);
      return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum === expectedNum;
    } else {
      // 字符串类型：直接比较
      return actualOutput.trim() === expectedOutput.trim();
    }
  } catch (error) {
    console.error('判题错误:', error);
    return false;
  }
}

async function runCodeWithInput(language, source, input, inputType = 'number') {
  try {
    // 纯前端代码执行
    const output = await executeCodeFrontend(language, source, input, inputType);
    return output;
  } catch (error) {
    console.error('代码执行错误:', error);
    return `执行错误: ${error.message}`;
  }
}

// 纯前端代码执行函数
function executeCodeFrontend(language, source, input, inputType = 'number') {
  return new Promise((resolve) => {
    try {
      let result;
      
      if (language === 'javascript') {
        // JavaScript: 直接执行函数
        // 检测函数名
        const functionName = detectFunctionName(source, 'javascript');
        if (!functionName) {
          resolve(`错误: 未找到函数定义`);
          return;
        }
        
        // 创建一个安全的执行环境
        const safeEval = new Function('input', `
          ${source}
          return ${functionName}(input);
        `);
        
        // 根据输入类型转换输入
        let processedInput;
        if (inputType === 'number') {
          if (input.includes('.')) {
            processedInput = parseFloat(input);
          } else {
            processedInput = parseInt(input);
          }
          
          if (isNaN(processedInput)) {
            resolve(`错误: 输入格式错误，期望数字`);
            return;
          }
        } else {
          // 字符串类型，直接使用
          processedInput = input;
        }
        
        result = safeEval(processedInput);
        
      } else if (language === 'python') {
        // Python: 使用Pyodide或其他Python运行时
        // 这里我们使用一个简化的Python语法解析器
        result = executePythonCode(source, input, inputType);
        
      } else if (language === 'cpp') {
        // C++: 使用Emscripten或其他C++编译器
        // 这里我们使用一个简化的C++语法解析器
        result = executeCppCode(source, input, inputType);
        
      } else {
        resolve(`错误: 不支持的语言 ${language}`);
        return;
      }
      
      // 处理结果
      if (result === undefined || result === null) {
        resolve(`错误: 函数未返回有效值`);
      } else {
        resolve(String(result));
      }
      
    } catch (error) {
      resolve(`错误: ${error.message}`);
    }
  });
}

// 检测函数名
function detectFunctionName(source, language) {
  if (language === 'javascript') {
    // 检测JavaScript函数定义
    const patterns = [
      /function\s+(\w+)\s*\([^)]*\)/,  // function name() {}
      /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/,  // const name = () => {}
      /let\s+(\w+)\s*=\s*\([^)]*\)\s*=>/,    // let name = () => {}
      /var\s+(\w+)\s*=\s*\([^)]*\)\s*=>/,    // var name = () => {}
      /(\w+)\s*:\s*function\s*\([^)]*\)/,    // name: function() {}
      /const\s+(\w+)\s*=\s*function\s*\([^)]*\)/,  // const name = function() {}
      /let\s+(\w+)\s*=\s*function\s*\([^)]*\)/,    // let name = function() {}
      /var\s+(\w+)\s*=\s*function\s*\([^)]*\)/,    // var name = function() {}
    ];
    
    for (const pattern of patterns) {
      const match = source.match(pattern);
      if (match) {
        return match[1];
      }
    }
  } else if (language === 'python') {
    // 检测Python函数定义
    const match = source.match(/def\s+(\w+)\s*\([^)]*\)/);
    if (match) {
      return match[1];
    }
  } else if (language === 'cpp') {
    // 检测C++函数定义
    const patterns = [
      /(\w+)\s+(\w+)\s*\([^)]*\)/,  // type name() {}
      /(\w+)\s*(\w+)\s*\([^)]*\)/,   // type name() {}
    ];
    
    for (const pattern of patterns) {
      const match = source.match(pattern);
      if (match) {
        return match[2]; // 返回函数名
      }
    }
  }
  
  return null;
}

// 简化的Python代码执行器
function executePythonCode(source, input, inputType) {
  try {
    // 检测函数名
    const functionName = detectFunctionName(source, 'python');
    if (!functionName) {
      throw new Error('未找到函数定义');
    }
    
    // 根据输入类型解析输入
    let processedInput;
    if (inputType === 'number') {
      if (input.includes('.')) {
        processedInput = parseFloat(input);
      } else {
        processedInput = parseInt(input);
      }
      
      if (isNaN(processedInput)) {
        throw new Error('输入格式错误，期望数字');
      }
    } else {
      // 字符串类型，直接使用
      processedInput = input;
    }
    
    // 简单的Python语法转换和JavaScript执行
    const jsCode = convertPythonToJS(source, functionName);
    const safeEval = new Function('input', jsCode);
    
    return safeEval(processedInput);
    
  } catch (error) {
    throw new Error(`Python执行错误: ${error.message}`);
  }
}

// 简化的C++代码执行器
function executeCppCode(source, input, inputType) {
  try {
    // 检测函数名
    const functionName = detectFunctionName(source, 'cpp');
    if (!functionName) {
      throw new Error('未找到函数定义');
    }
    
    // 根据输入类型解析输入
    let processedInput;
    if (inputType === 'number') {
      if (input.includes('.')) {
        processedInput = parseFloat(input);
      } else {
        processedInput = parseInt(input);
      }
      
      if (isNaN(processedInput)) {
        throw new Error('输入格式错误，期望数字');
      }
    } else {
      // 字符串类型，直接使用
      processedInput = input;
    }
    
    // 简单的C++语法转换和JavaScript执行
    const jsCode = convertCppToJS(source, functionName);
    const safeEval = new Function('input', jsCode);
    
    return safeEval(processedInput);
    
  } catch (error) {
    throw new Error(`C++执行错误: ${error.message}`);
  }
}

// Python到JavaScript的简单转换
function convertPythonToJS(pythonCode, functionName) {
  // 移除def functionName(a): 并提取函数体
  const defPattern = new RegExp(`def\\s+${functionName}\\s*\\([^)]*\\)\\s*:(.*)`, 's');
  const match = pythonCode.match(defPattern);
  if (!match) {
    throw new Error(`未找到函数定义 ${functionName}`);
  }
  
  let jsCode = match[1];
  
  // 转换Python语法到JavaScript
  jsCode = jsCode
    .replace(/\bdef\b/g, 'function')
    .replace(/\bprint\b/g, 'return')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\b/g, '!')
    .replace(/\bif\b/g, 'if')
    .replace(/\belif\b/g, 'else if')
    .replace(/\belse\b/g, 'else')
    .replace(/\bfor\b/g, 'for')
    .replace(/\bwhile\b/g, 'while')
    .replace(/\breturn\b/g, 'return')
    .replace(/\bpass\b/g, '')
    .replace(/\bNone\b/g, 'null');
  
  return jsCode;
}

// C++到JavaScript的简单转换
function convertCppToJS(cppCode, functionName) {
  // 提取函数体
  const functionPattern = new RegExp(`\\w+\\s+${functionName}\\s*\\([^)]*\\)\\s*{(.*)}`, 's');
  const match = cppCode.match(functionPattern);
  if (!match) {
    throw new Error(`无法解析C++函数 ${functionName}`);
  }
  
  let jsCode = match[1];
  
  // 转换C++语法到JavaScript
  jsCode = jsCode
    .replace(/\bdouble\b/g, '')
    .replace(/\bint\b/g, '')
    .replace(/\bfloat\b/g, '')
    .replace(/\bstring\b/g, '')
    .replace(/\bcout\s*<<\s*/g, 'return ')
    .replace(/\bendl\b/g, '')
    .replace(/\bstd::/g, '')
    .replace(/\busing namespace std;/g, '');
  
  return jsCode;
} 