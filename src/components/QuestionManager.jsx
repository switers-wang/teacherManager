import React, { useEffect, useState } from 'react';
import { Table, Button, Popconfirm, Tag } from 'antd';
import { getQuestions, removeQuestion } from '../utils/storage';

export default function QuestionManager() {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    getQuestions().then(setQuestions);
  }, []);

  const handleDelete = async (id) => {
    await removeQuestion(id);
    setQuestions(await getQuestions());
  };

  const columns = [
    { title: '题目类型', dataIndex: 'type', key: 'type', render: t => t === 'single' ? <Tag color="blue">单选</Tag> : t === 'multiple' ? <Tag color="green">多选</Tag> : <Tag color="orange">编程</Tag> },
    { title: '题干', dataIndex: 'question', key: 'question', ellipsis: true },
    { title: '操作', key: 'action', render: (_, record) => (
      <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
        <Button danger size="small">删除</Button>
      </Popconfirm>
    ) },
  ];

  return <Table rowKey="id" columns={columns} dataSource={questions} pagination={{ pageSize: 5 }} />;
} 