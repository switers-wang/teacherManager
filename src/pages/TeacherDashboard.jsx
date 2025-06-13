import React from 'react';
import { Tabs } from 'antd';
import QuestionManager from '../components/QuestionManager';
import QuestionForm from '../components/QuestionForm';

export default function TeacherDashboard() {
  return (
    <Tabs defaultActiveKey="1" items={[
      { key: '1', label: '题目管理', children: <QuestionManager /> },
      { key: '2', label: '题目录入', children: <QuestionForm /> },
    ]} />
  );
} 