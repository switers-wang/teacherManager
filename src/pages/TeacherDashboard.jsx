import React, { useEffect, useState, useRef } from 'react';
import { Tabs } from 'antd';
import QuestionManager from '../components/QuestionManager';
import QuestionForm from '../components/QuestionForm';
import StudentAnswerStats from '../components/StudentAnswerStats';
import { getQuestions } from '../utils/storage';

export default function TeacherDashboard() {
  const [questions, setQuestions] = useState([]);
  const [activeKey, setActiveKey] = useState('1');
  const tabsRef = useRef();

  const refreshQuestions = async () => {
    setQuestions(await getQuestions());
  };

  useEffect(() => {
    refreshQuestions();
  }, []);

  const handleAddQuestion = async () => {
    await refreshQuestions();
    setActiveKey('1'); // 切换到题目管理Tab
  };

  return (
    <Tabs
      ref={tabsRef}
      activeKey={activeKey}
      onChange={setActiveKey}
      defaultActiveKey="1"
      items={[
        { key: '1', label: '题目管理', children: <QuestionManager questions={questions} onDelete={refreshQuestions} onUpdate={refreshQuestions} /> },
        { key: '2', label: '题目录入', children: <QuestionForm onAddQuestion={handleAddQuestion} /> },
        { key: '3', label: '学生答题统计', children: <StudentAnswerStats /> },
      ]}
    />
  );
} 