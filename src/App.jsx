import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Login from './pages/Login';
import Register from './pages/Register';

const { Header, Content } = Layout;

const ROLE_KEY = 'tm_role';

export default function App() {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('tm_user');
    return u ? JSON.parse(u) : null;
  });

  useEffect(() => {
    const onStorage = () => {
      const u = localStorage.getItem('tm_user');
      setUser(u ? JSON.parse(u) : null);
    };
    
    // 监听 localStorage 变化
    window.addEventListener('storage', onStorage);
    
    // 监听自定义事件，用于登录成功后的状态更新
    const onUserChange = () => {
      const u = localStorage.getItem('tm_user');
      setUser(u ? JSON.parse(u) : null);
    };
    
    window.addEventListener('userLogin', onUserChange);
    window.addEventListener('userLogout', onUserChange);
    
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('userLogin', onUserChange);
      window.removeEventListener('userLogout', onUserChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tm_user');
    setUser(null);
    // 触发自定义事件
    window.dispatchEvent(new Event('userLogout'));
  };

  const handleRoleChange = () => {
    if (user) {
      // 清除当前用户信息，需要重新登录
      localStorage.removeItem('tm_user');
      setUser(null);
      // 触发自定义事件
      window.dispatchEvent(new Event('userLogout'));
    }
  };

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Menu theme="dark" mode="horizontal" selectedKeys={[]}>
            <Menu.Item key="home">
              <Link to="/">首页</Link>
            </Menu.Item>
            {user && user.role === 'teacher' && (
              <Menu.Item key="teacher">
                <Link to="/teacher">教师端</Link>
              </Menu.Item>
            )}
            {user && user.role === 'student' && (
              <Menu.Item key="student">
                <Link to="/student">学生端</Link>
              </Menu.Item>
            )}
          </Menu>
          <div>
            {user ? (
              <Space>
                <span style={{ color: '#fff' }}>当前用户: {user.name || user.username}（{user.role === 'teacher' ? '教师' : '学生'}）</span>
                <Button 
                  icon={<SwapOutlined />}
                  size="small"
                  onClick={handleRoleChange}
                >
                  切换角色
                </Button>
                <Button onClick={handleLogout} size="small">退出登录</Button>
              </Space>
            ) : null}
          </div>
        </Header>
        <Content style={{ padding: 24 }}>
          <Routes>
            <Route path="/login" element={
              user ? (
                <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />
              ) : (
                <Login />
              )
            } />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              user ? (
                <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } />
            <Route path="/teacher/*" element={
              user && user.role === 'teacher' ? (
                <TeacherDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            } />
            <Route path="/student/*" element={
              user && user.role === 'student' ? (
                <StudentDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            } />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
} 