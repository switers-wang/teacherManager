import React, { useState } from 'react';
import { Form, Input, Button, Select, Space, Card, message } from 'antd';
import { addQuestion } from '../utils/storage';

const { Option } = Select;

export default function QuestionForm() {
  const [form] = Form.useForm();
  const [type, setType] = useState('single');
  const [testCases, setTestCases] = useState([{ input: '', output: '' }]);

  const handleTypeChange = (value) => {
    setType(value);
    form.setFieldsValue({ type: value });
    setTestCases([{ input: '', output: '' }]);
  };

  const onFinish = async (values) => {
    let question = { ...values, type };
    if (type === 'code') {
      question.testCases = testCases.filter(tc => tc.input && tc.output);
      question.language = ['python', 'cpp', 'javascript'];
    }
    await addQuestion(question);
    message.success('题目添加成功');
    form.resetFields();
    setType('single');
    setTestCases([{ input: '', output: '' }]);
  };

  return (
    <Card>
      <Form key={type} form={form} layout="vertical" onFinish={onFinish} initialValues={{ type: 'single' }} validateTrigger="onChange" onValuesChange={(changed, all) => { console.log('QuestionForm values:', all); }}>
        <Form.Item label="题目类型" name="type" rules={[{ required: true, message: '请选择题目类型' }]}> <Select style={{ width: 120 }} onChange={handleTypeChange}> <Option value="single">单选题</Option> <Option value="multiple">多选题</Option> <Option value="code">编程题</Option> </Select> </Form.Item>
        <Form.Item label="题干" name="question" rules={[{ required: true, message: '请输入题干' }]}> <Input.TextArea rows={2} /> </Form.Item>
        {(type === 'single' || type === 'multiple') && (
          <>
            <Form.Item label="选项（用英文逗号分隔）" name="options" rules={[{ required: true, message: '请输入选项' }]}> <Input /> </Form.Item>
            <Form.Item label="正确答案（单选填一个下标，多选填多个下标，用英文逗号分隔）" name="answer" rules={[{ required: true, message: '请输入正确答案' }]}> <Input /> </Form.Item>
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