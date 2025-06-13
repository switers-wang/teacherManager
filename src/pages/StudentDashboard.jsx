import React from 'react';
import { Tabs } from 'antd';
import QuestionPractice from '../components/QuestionPractice';
import GrowthChart from '../components/GrowthChart';

export default function StudentDashboard() {
  return (
    <Tabs defaultActiveKey="1" items={[
      { key: '1', label: '刷题', children: <QuestionPractice /> },
      { key: '2', label: '成长线', children: <GrowthChart /> },
    ]} />
  );
} 