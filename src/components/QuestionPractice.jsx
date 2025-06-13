import React, { useEffect, useState } from 'react';
import { Card, Button, Radio, Checkbox, message, Input, Select, Space, Progress } from 'antd';
import { getQuestions, saveStudentRecord, getStudentRecord } from '../utils/storage';
import CodeEditor from './CodeEditor';

const { Option } = Select;

export default function QuestionPractice() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState([]);
  const [code, setCode] = useState('');
  const [lang, setLang] = useState('python');
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [record, setRecord] = useState([]);

  useEffect(() => {
    getQuestions().then(qs => setQuestions(qs));
    getStudentRecord().then(setRecord);
  }, []);

  if (!questions.length) return <Card>暂无题目，请联系教师添加。</Card>;
  const q = questions[current];

  const handleNext = () => {
    setCurrent((c) => (c + 1) % questions.length);
    setAnswer([]);
    setCode('');
    setLang('python');
  };

  const handleSubmit = async () => {
    if (q.type === 'single' || q.type === 'multiple') {
      const ans = (q.type === 'single' ? [Number(answer)] : answer.map(Number));
      const correct = JSON.stringify(ans.sort()) === JSON.stringify((Array.isArray(q.answer) ? q.answer : [Number(q.answer)]).sort());
      const s = correct ? 100 : 0;
      message.success(`本题得分：${s}`);
      await saveStudentRecord({ qid: q.id, score: s });
      setScore(s);
      setRecord(await getStudentRecord());
    } else if (q.type === 'code') {
      setLoading(true);
      let pass = 0;
      for (const tc of q.testCases) {
        const res = await judgeCode(lang, code, tc.input, tc.output);
        if (res) pass++;
      }
      const s = Math.round((pass / q.testCases.length) * 100);
      message.success(`本题得分：${s}`);
      await saveStudentRecord({ qid: q.id, score: s });
      setScore(s);
      setRecord(await getStudentRecord());
      setLoading(false);
    }
  };

  return (
    <Card title={`第${current + 1}题 / 共${questions.length}题`}>
      <div style={{ marginBottom: 16 }}>{q.question}</div>
      {q.type === 'single' && (
        <Radio.Group onChange={e => setAnswer(e.target.value)} value={answer}>
          {q.options.split(',').map((opt, idx) => <Radio key={idx} value={idx}>{opt}</Radio>)}
        </Radio.Group>
      )}
      {q.type === 'multiple' && (
        <Checkbox.Group options={q.options.split(',').map((opt, idx) => ({ label: opt, value: idx }))} value={answer} onChange={setAnswer} />
      )}
      {q.type === 'code' && (
        <>
          <Space style={{ marginBottom: 8 }}>
            <span>语言：</span>
            <Select value={lang} onChange={setLang} style={{ width: 120 }}>
              <Option value="python">Python</Option>
              <Option value="cpp">C++</Option>
              <Option value="javascript">JavaScript</Option>
            </Select>
          </Space>
          <CodeEditor language={lang} value={code} onChange={setCode} />
        </>
      )}
      <div style={{ marginTop: 16 }}>
        <Button type="primary" onClick={handleSubmit} loading={loading}>提交</Button>
        <Button style={{ marginLeft: 8 }} onClick={handleNext}>下一题</Button>
      </div>
      <div style={{ marginTop: 16 }}>
        <Progress percent={score} size="small" />
      </div>
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