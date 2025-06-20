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
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
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
    setAnswers({
      ...answers,
      [q.id]: { answer, code, lang },
    });
    let s = 0;
    if (q.type === 'single' || q.type === 'multiple') {
      let ansArr;
      if (q.type === 'single') {
        ansArr = [Number(answer)];
      } else {
        ansArr = Array.isArray(answer) ? answer.map(Number) : [];
      }
      const stdAnsArr = Array.isArray(q.answer) ? q.answer.map(Number) : [];
      const correct = ansArr.length === stdAnsArr.length &&
        ansArr.sort().every((v, i) => v === stdAnsArr.sort()[i]);
      s = correct ? 100 : 0;
      message.success(`本题得分：${s}`);
      await saveStudentRecord({ qid: q.id, score: s });
      setRecord(await getStudentRecord());
    } else if (q.type === 'code') {
      setLoading(true);
      let pass = 0;
      for (const tc of q.testCases) {
        const res = await judgeCode(lang, code, tc.input, tc.output);
        if (res) pass++;
      }
      s = Math.round((pass / q.testCases.length) * 100);
      message.success(`本题得分：${s}`);
      await saveStudentRecord({ qid: q.id, score: s });
      setRecord(await getStudentRecord());
      setLoading(false);
    }
    setScore(s);
    setScores({ ...scores, [q.id]: s });
  };

  const handleTestCode = async () => {
    if (!q.testCases || !q.testCases.length) {
      setTestResult('无测试用例');
      return;
    }
    setTestLoading(true);
    let results = [];
    for (const tc of q.testCases) {
      const output = await runCodeWithInput(lang, code, tc.input);
      results.push({ input: tc.input, expected: tc.output, actual: output, pass: output.trim() === tc.output.trim() });
    }
    setTestResult(results);
    setTestLoading(false);
  };

  const handleRunCustomInput = async () => {
    setTestLoading(true);
    setCustomOutput('');
    try {
      const output = await runCodeWithInput(lang, code, customInput);
      setCustomOutput(output);
    } finally {
      setTestLoading(false);
    }
  };

  function getStatus(qid) {
    const rec = record.filter(r => r.qid === qid);
    if (!rec.length) return '未做';
    const maxScore = Math.max(...rec.map(r => r.score));
    if (maxScore >= 100) return '做对';
    return '做错';
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
              else if (status === '做错') color = 'red';
              return {
                key: item.id,
                idx: idx + 1,
                title: item.question.length > 20 ? item.question.slice(0, 20) + '...' : item.question,
                status,
                color,
                active: current === idx,
                onClick: () => { setCurrent(idx); setShowDetail(true); },
              };
            })}
            columns={[
              { title: '题号', dataIndex: 'idx', key: 'idx', width: 60, render: (v, r) => <b style={{ color: r.active ? '#1677ff' : undefined }}>{v}</b> },
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
              {(Array.isArray(q.options) ? q.options : q.options.split(',')).map((opt, idx) => <Radio key={idx} value={idx}>{opt}</Radio>)}
            </Radio.Group>
          )}
          {q.type === 'multiple' && (
            <Checkbox.Group options={(Array.isArray(q.options) ? q.options : q.options.split(',')).map((opt, idx) => ({ label: opt, value: idx }))} value={Array.isArray(answer) ? answer : []} onChange={handleAnswerChange} />
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
              <div style={{ margin: '16px 0 8px 0' }}><b>自定义输入</b></div>
              <Input.TextArea rows={3} value={customInput} onChange={e => setCustomInput(e.target.value)} placeholder="请输入自定义输入（stdin）" style={{ marginBottom: 8 }} />
              <Button onClick={handleRunCustomInput} loading={testLoading} style={{ marginBottom: 8 }}>运行</Button>
              {customOutput && (
                <div style={{ background: '#f6f6f6', padding: 8, borderRadius: 4, marginBottom: 8 }}>
                  <b>输出：</b>
                  <pre style={{ margin: 0 }}>{customOutput}</pre>
                </div>
              )}
            </>
          )}
          <div style={{ marginTop: 16 }}>
            <Button type="primary" onClick={handleSubmit} loading={loading}>提交</Button>
          </div>
          <div style={{ marginTop: 16 }}>
            <Progress percent={score} size="small" />
          </div>
        </>
      )}
    </Card>
  );
}

async function judgeCode(language, source, input, expectedOutput) {
  // 使用 judge0 API 判题
  const langMap = { python: 71, cpp: 54, javascript: 63 };
  const resp = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': '', // 可选，免费额度无需
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
    },
    body: JSON.stringify({
      source_code: source,
      language_id: langMap[language],
      stdin: input,
    })
  });
  const data = await resp.json();
  return data.stdout && data.stdout.trim() === expectedOutput.trim();
}

async function runCodeWithInput(language, source, input) {
  const langMap = { python: 71, cpp: 54, javascript: 63 };
  const resp = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': '',
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
    },
    body: JSON.stringify({
      source_code: source,
      language_id: langMap[language],
      stdin: input,
    })
  });
  const data = await resp.json();
  return data.stdout || data.stderr || '';
} 