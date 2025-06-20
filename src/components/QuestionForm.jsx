import React, { useState } from 'react';
import { Form, Input, Button, Select, Space, Card, message } from 'antd';
import { addQuestion } from '../utils/storage';

const { Option } = Select;

export default function QuestionForm({ onAddQuestion }) {
  const [form] = Form.useForm();
  const [type, setType] = useState('single');
  const [testCases, setTestCases] = useState([{ input: '', output: '' }]);
  const [options, setOptions] = useState(['']);

  const handleTypeChange = (value) => {
    setType(value);
    form.setFieldsValue({ type: value });
    setTestCases([{ input: '', output: '' }]);
    setOptions(['']);
  };

  const handleOptionChange = (idx, val) => {
    const arr = [...options];
    arr[idx] = val;
    setOptions(arr);
    form.setFieldsValue({ options: arr });
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (idx) => {
    if (options.length === 1) return;
    const arr = options.filter((_, i) => i !== idx);
    setOptions(arr);
    form.setFieldsValue({ options: arr });
  };

  const onFinish = async (values) => {
    let question = { ...values, type };
    if (type === 'single' || type === 'multiple') {
      question.options = options;
    }
    if (type === 'code') {
      question.testCases = testCases.filter(tc => tc.input && tc.output);
      question.language = ['python', 'cpp', 'javascript'];
    }
    await addQuestion(question);
    message.success('题目添加成功');
    form.resetFields();
    setType('single');
    setTestCases([{ input: '', output: '' }]);
    setOptions(['']);
    if (typeof onAddQuestion === 'function') onAddQuestion();
  };

  return (
    <Card>
      <Form key={type} form={form} layout="vertical" onFinish={onFinish} initialValues={{ type: 'single', options }} validateTrigger="onChange" onValuesChange={(changed, all) => { console.log('QuestionForm values:', all); }}>
        <Form.Item label="题目类型" name="type" rules={[{ required: true, message: '请选择题目类型' }]}><Select style={{ width: 120 }} onChange={handleTypeChange}><Option value="single">单选题</Option><Option value="multiple">多选题</Option><Option value="code">编程题</Option></Select></Form.Item>
        <Form.Item label="题干" name="question" rules={[{ required: true, message: '请输入题干' }]}><Input.TextArea rows={2} /></Form.Item>
        {(type === 'single' || type === 'multiple') && (
          <>
            <Form.Item label="选项" required>
              {options.map((opt, idx) => (
                <Space key={idx} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Input placeholder={`选项${String.fromCharCode(65 + idx)}`} value={opt} onChange={e => handleOptionChange(idx, e.target.value)} style={{ width: 200 }} />
                  <Button onClick={() => handleRemoveOption(idx)} disabled={options.length === 1}>删除</Button>
                </Space>
              ))}
              <Button onClick={handleAddOption} type="dashed">添加选项</Button>
            </Form.Item>
            <Form.Item label={type === 'single' ? '正确答案（填下标，如0或A）' : '正确答案（填多个下标，如0,1或A,B）'} name="answer" rules={[{ required: true, message: '请输入正确答案' }]}><Input /></Form.Item>
          </>
        )}
        {type === 'code' && (
          <>
            <Form.Item label="用例">
              {testCases.map((tc, idx) => (
                <Space key={idx} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Input placeholder="输入" value={tc.input} onChange={e => {
                    const arr = [...testCases]; arr[idx].input = e.target.value; setTestCases(arr);
                  }} style={{ width: 120 }} />
                  <Input placeholder="输出" value={tc.output} onChange={e => {
                    const arr = [...testCases]; arr[idx].output = e.target.value; setTestCases(arr);
                  }} style={{ width: 120 }} />
                  <Button onClick={() => setTestCases(testCases.filter((_, i) => i !== idx))} disabled={testCases.length === 1}>删除</Button>
                </Space>
              ))}
              <Button onClick={() => setTestCases([...testCases, { input: '', output: '' }])}>添加用例</Button>
            </Form.Item>
          </>
        )}
        <Form.Item>
          <Button type="primary" htmlType="submit">提交</Button>
        </Form.Item>
      </Form>
    </Card>
  );
} 