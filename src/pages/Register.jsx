import React, { useState } from 'react';
import { Form, Input, Button, Select, Card, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../utils/storage';

const { Option } = Select;

export default function Register() {
  const [form] = Form.useForm();
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRoleChange = (value) => {
    setRole(value);
    form.resetFields();
    form.setFieldsValue({ role: value });
  };

  const onFinish = async (values) => {
    setLoading(true);
    let user;
    if (values.role === 'student') {
      user = {
        role: 'student',
        username: values.studentId,
        name: values.studentName,
        class: values.studentClass,
        major: values.studentMajor,
        password: values.password,
      };
    } else {
      user = {
        role: 'teacher',
        username: values.teacherId,
        name: values.teacherName,
        college: values.teacherCollege,
        password: values.password,
      };
    }
    const ok = await registerUser(user);
    setLoading(false);
    if (ok) {
      message.success('注册成功，请登录');
      navigate('/login', { replace: true });
    } else {
      message.error('账号已存在');
    }
  };

  return (
    <Card style={{ maxWidth: 500, margin: '40px auto' }}>
      <h2 style={{ textAlign: 'center' }}>用户注册</h2>
      <Form key={role} form={form} layout="vertical" onFinish={onFinish} initialValues={{ role }} autoComplete="off" validateTrigger="onChange" onValuesChange={(changed, all) => { console.log('Register form values:', all); }}>
        <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}> <Select onChange={handleRoleChange}> <Option value="student">学生</Option> <Option value="teacher">教师</Option> </Select> </Form.Item>
        {role === 'student' ? (
          <>
            <Form.Item label="学号" name="studentId" rules={[{ required: true, message: '请输入学号' }]}> <Input autoComplete="off" /> </Form.Item>
            <Form.Item label="姓名" name="studentName" rules={[{ required: true, message: '请输入姓名' }]}> <Input autoComplete="off" /> </Form.Item>
            <Form.Item label="班级" name="studentClass" rules={[{ required: true, message: '请输入班级' }]}> <Input autoComplete="off" /> </Form.Item>
            <Form.Item label="专业" name="studentMajor" rules={[{ required: true, message: '请输入专业' }]}> <Input autoComplete="off" /> </Form.Item>
          </>
        ) : (
          <>
            <Form.Item label="工号" name="teacherId" rules={[{ required: true, message: '请输入工号' }]}> <Input autoComplete="off" /> </Form.Item>
            <Form.Item label="姓名" name="teacherName" rules={[{ required: true, message: '请输入姓名' }]}> <Input autoComplete="off" /> </Form.Item>
            <Form.Item label="所属学院" name="teacherCollege" rules={[{ required: true, message: '请输入所属学院' }]}> <Input autoComplete="off" /> </Form.Item>
          </>
        )}
        <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}> <Input.Password autoComplete="new-password" /> </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>注册</Button>
        </Form.Item>
        <Form.Item style={{ textAlign: 'center', marginBottom: 0 }}>
          已有账号？<Link to="/login">登录</Link>
        </Form.Item>
      </Form>
    </Card>
  );
} 