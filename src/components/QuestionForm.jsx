import React, { useState } from 'react';
import { Form, Input, Button, Select, Space, Card, message } from 'antd';
import { addQuestion } from '../utils/storage';

const { Option } = Select;

export default function QuestionForm({ onAddQuestion }) {
  const [form] = Form.useForm();
  const [type, setType] = useState('single');
  const [testCases, setTestCases] = useState([{ 
    input: '', 
    output: '', 
    inputType: 'number', 
    outputType: 'number' 
  }]);
  const [options, setOptions] = useState(['']);

  const handleTypeChange = (value) => {
    setType(value);
    form.setFieldsValue({ type: value });
    setTestCases([{ 
      input: '', 
      output: '', 
      inputType: 'number', 
      outputType: 'number' 
    }]);
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
    setTestCases([{ 
      input: '', 
      output: '', 
      inputType: 'number', 
      outputType: 'number' 
    }]);
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
            <Form.Item 
              label={type === 'single' ? '正确答案' : '正确答案'} 
              name="answer" 
              rules={[{ required: true, message: '请输入正确答案' }]}
              extra={type === 'single' ? 
                '单选题：输入字母(A,B,C,D)' : 
                '多选题：输入字母(A,B,C,D)，多个答案用逗号分隔，如：A,B'
              }
            >
              <Input placeholder={type === 'single' ? '如：A' : '如：A,B'} />
            </Form.Item>
          </>
        )}
        {type === 'code' && (
          <>
            <Form.Item label="测试用例">
              {testCases.map((tc, idx) => (
                <div key={idx} style={{ border: '1px solid #d9d9d9', padding: 12, marginBottom: 8, borderRadius: 6 }}>
                  <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <span>输入：</span>
                    <Select 
                      value={tc.inputType} 
                      onChange={value => {
                        const arr = [...testCases]; 
                        arr[idx].inputType = value; 
                        setTestCases(arr);
                      }}
                      style={{ width: 80 }}
                    >
                      <Option value="number">数字</Option>
                      <Option value="string">字符串</Option>
                    </Select>
                    <Input 
                      placeholder={tc.inputType === 'number' ? "如：2" : "如：hello"} 
                      value={tc.input} 
                      onChange={e => {
                        const arr = [...testCases]; 
                        arr[idx].input = e.target.value; 
                        setTestCases(arr);
                      }} 
                      style={{ width: 120 }} 
                    />
                  </Space>
                  <Space style={{ display: 'flex' }} align="baseline">
                    <span>输出：</span>
                    <Select 
                      value={tc.outputType} 
                      onChange={value => {
                        const arr = [...testCases]; 
                        arr[idx].outputType = value; 
                        setTestCases(arr);
                      }}
                      style={{ width: 80 }}
                    >
                      <Option value="number">数字</Option>
                      <Option value="string">字符串</Option>
                    </Select>
                    <Input 
                      placeholder={tc.outputType === 'number' ? "如：4" : "如：hello world"} 
                      value={tc.output} 
                      onChange={e => {
                        const arr = [...testCases]; 
                        arr[idx].output = e.target.value; 
                        setTestCases(arr);
                      }} 
                      style={{ width: 120 }} 
                    />
                    <Button 
                      onClick={() => setTestCases(testCases.filter((_, i) => i !== idx))} 
                      disabled={testCases.length === 1}
                    >
                      删除
                    </Button>
                  </Space>
                </div>
              ))}
              <Button onClick={() => setTestCases([...testCases, { 
                input: '', 
                output: '', 
                inputType: 'number', 
                outputType: 'number' 
              }])}>
                添加用例
              </Button>
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