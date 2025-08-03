import React, { useState } from 'react';
import { Table, Button, Popconfirm, Tag, Modal, Form, Input, Select, Space, message } from 'antd';
import { removeQuestion, updateQuestion } from '../utils/storage';

const { Option } = Select;

export default function QuestionManager({ questions, onDelete, onUpdate }) {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editForm] = Form.useForm();
  const [editType, setEditType] = useState('single');
  const [editOptions, setEditOptions] = useState(['']);
  const [editTestCases, setEditTestCases] = useState([{ 
    input: '', 
    output: '', 
    inputType: 'number', 
    outputType: 'number' 
  }]);

  const handleDelete = async (id) => {
    await removeQuestion(id);
    onDelete && onDelete();
  };

  const handleEdit = (record) => {
    setEditingQuestion(record);
    setEditType(record.type);
    
    // 设置表单初始值
    if (record.type === 'single' || record.type === 'multiple') {
      setEditOptions(Array.isArray(record.options) ? record.options : record.options.split(','));
      
      // 处理答案格式：如果是数组，转换为字符串
      let answerValue = record.answer;
      if (Array.isArray(record.answer)) {
        if (record.type === 'single') {
          answerValue = record.answer[0] || '';
        } else {
          answerValue = record.answer.join(',');
        }
      }
      
      editForm.setFieldsValue({
        question: record.question,
        answer: answerValue,
        score: record.score || 100,
        options: Array.isArray(record.options) ? record.options : record.options.split(',')
      });
    } else if (record.type === 'code') {
      setEditTestCases(record.testCases || [{ 
        input: '', 
        output: '', 
        inputType: 'number', 
        outputType: 'number' 
      }]);
      editForm.setFieldsValue({
        question: record.question,
        score: record.score || 100
      });
    }
    
    setEditModalVisible(true);
  };

  const handleEditOptionChange = (idx, val) => {
    const arr = [...editOptions];
    arr[idx] = val;
    setEditOptions(arr);
    editForm.setFieldsValue({ options: arr });
  };

  const handleAddEditOption = () => {
    setEditOptions([...editOptions, '']);
  };

  const handleRemoveEditOption = (idx) => {
    if (editOptions.length === 1) return;
    const arr = editOptions.filter((_, i) => i !== idx);
    setEditOptions(arr);
    editForm.setFieldsValue({ options: arr });
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      let updatedQuestion = { ...editingQuestion, ...values, type: editType };
      
      if (editType === 'single' || editType === 'multiple') {
        updatedQuestion.options = editOptions;
      }
      if (editType === 'code') {
        updatedQuestion.testCases = editTestCases.filter(tc => tc.input && tc.output);
        updatedQuestion.language = ['python', 'cpp', 'javascript'];
      }
      
      await updateQuestion(editingQuestion.id, updatedQuestion);
      message.success('题目更新成功');
      setEditModalVisible(false);
      setEditingQuestion(null);
      editForm.resetFields();
      onUpdate && onUpdate();
    } catch (error) {
      console.error('更新题目失败:', error);
    }
  };

  const handleEditCancel = () => {
    setEditModalVisible(false);
    setEditingQuestion(null);
    editForm.resetFields();
  };

  const columns = [
    { title: '题目类型', dataIndex: 'type', key: 'type', render: t => t === 'single' ? <Tag color="blue">单选</Tag> : t === 'multiple' ? <Tag color="green">多选</Tag> : <Tag color="orange">编程</Tag> },
    { title: '题干', dataIndex: 'question', key: 'question', ellipsis: true },
    { title: '分数', dataIndex: 'score', key: 'score', width: 80, render: score => <Tag color="blue">{score || 100}分</Tag> },
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="primary" size="small" onClick={() => handleEdit(record)}>编辑</Button>
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
          <Button danger size="small">删除</Button>
        </Popconfirm>
      </Space>
    ) },
  ];

  return (
    <>
      <Table rowKey="id" columns={columns} dataSource={questions} pagination={{ pageSize: 5 }} />
      
      <Modal
        title="编辑题目"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={handleEditCancel}
        width={600}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="题目类型">
            <Select value={editType} onChange={setEditType} disabled>
              <Option value="single">单选题</Option>
              <Option value="multiple">多选题</Option>
              <Option value="code">编程题</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="题干" name="question" rules={[{ required: true, message: '请输入题干' }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          
          <Form.Item 
            label="题目分数" 
            name="score" 
            rules={[{ required: true, message: '请输入题目分数' }]}
            initialValue={editingQuestion?.score || 100}
          >
            <Input type="number" min={1} max={100} placeholder="请输入题目分数" />
          </Form.Item>
          
          {(editType === 'single' || editType === 'multiple') && (
            <>
              <Form.Item label="选项" required>
                {editOptions.map((opt, idx) => (
                  <Space key={idx} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Input 
                      placeholder={`选项${String.fromCharCode(65 + idx)}`} 
                      value={opt} 
                      onChange={e => handleEditOptionChange(idx, e.target.value)} 
                      style={{ width: 200 }} 
                    />
                    <Button onClick={() => handleRemoveEditOption(idx)} disabled={editOptions.length === 1}>删除</Button>
                  </Space>
                ))}
                <Button onClick={handleAddEditOption} type="dashed">添加选项</Button>
              </Form.Item>
              
              <Form.Item 
                label={editType === 'single' ? '正确答案' : '正确答案'} 
                name="answer" 
                rules={[{ required: true, message: '请输入正确答案' }]}
                extra={editType === 'single' ? 
                  '单选题：输入字母(A,B,C,D)' : 
                  '多选题：输入字母(A,B,C,D)，多个答案用逗号分隔，如：A,B'
                }
              >
                <Input placeholder={editType === 'single' ? '如：A' : '如：A,B'} />
              </Form.Item>
            </>
          )}
          
          {editType === 'code' && (
            <>
              <Form.Item label="测试用例">
                {editTestCases.map((tc, idx) => (
                  <div key={idx} style={{ border: '1px solid #d9d9d9', padding: 12, marginBottom: 8, borderRadius: 6 }}>
                    <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <span>输入：</span>
                      <Select 
                        value={tc.inputType} 
                        onChange={value => {
                          const arr = [...editTestCases]; 
                          arr[idx].inputType = value; 
                          setEditTestCases(arr);
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
                          const arr = [...editTestCases]; 
                          arr[idx].input = e.target.value; 
                          setEditTestCases(arr);
                        }} 
                        style={{ width: 120 }} 
                      />
                    </Space>
                    <Space style={{ display: 'flex' }} align="baseline">
                      <span>输出：</span>
                      <Select 
                        value={tc.outputType} 
                        onChange={value => {
                          const arr = [...editTestCases]; 
                          arr[idx].outputType = value; 
                          setEditTestCases(arr);
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
                          const arr = [...editTestCases]; 
                          arr[idx].output = e.target.value; 
                          setEditTestCases(arr);
                        }} 
                        style={{ width: 120 }} 
                      />
                      <Button 
                        onClick={() => setEditTestCases(editTestCases.filter((_, i) => i !== idx))} 
                        disabled={editTestCases.length === 1}
                      >
                        删除
                      </Button>
                    </Space>
                  </div>
                ))}
                <Button onClick={() => setEditTestCases([...editTestCases, { 
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
        </Form>
      </Modal>
    </>
  );
} 