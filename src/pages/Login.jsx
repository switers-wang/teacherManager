import React, { useState } from 'react';
import { Form, Input, Button, Select, Card, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../utils/storage';

const { Option } = Select;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    const user = await loginUser(values);
    setLoading(false);
    if (user) {
      localStorage.setItem('tm_user', JSON.stringify(user));
      message.success('登录成功');
      navigate(user.role === 'teacher' ? '/teacher' : '/student', { replace: true });
    } else {
      message.error('账号或密码错误');
    }
  };

  return (
    <Card style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2 style={{ textAlign: 'center' }}>用户登录</h2>
      <Form
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={({ values, errorFields, outOfDate }) => {
          console.log('验证失败:', values, errorFields, outOfDate);
        }}
        initialValues={{ role: 'student' }}
        autoComplete="off"
        validateTrigger="onChange"
        onValuesChange={(changed, all) => { console.log('Login form values:', all); }}
      >
        <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}> <Select> <Option value="student">学生</Option> <Option value="teacher">教师</Option> </Select> </Form.Item>
        <Form.Item label="账号" name="username" rules={[{ required: true, message: '请输入账号' }]}> <Input autoComplete="username" /> </Form.Item>
        <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}> <Input.Password autoComplete="current-password" /> </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>登录</Button>
        </Form.Item>
        <Form.Item style={{ textAlign: 'center', marginBottom: 0 }}>
          没有账号？<Link to="/register">注册</Link>
        </Form.Item>
      </Form>
    </Card>
  );
} 