import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button } from 'antd';
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
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tm_user');
    setUser(null);
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
              <>
                <span style={{ color: '#fff', marginRight: 8 }}>当前用户: {user.name || user.username}（{user.role === 'teacher' ? '教师' : '学生'}）</span>
                <Button onClick={handleLogout}>退出登录</Button>
              </>
            ) : null}
          </div>
        </Header>
        <Content style={{ padding: 24 }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} /> : <Navigate to="/login" />} />
            <Route path="/teacher/*" element={user && user.role === 'teacher' ? <TeacherDashboard /> : <Navigate to="/login" />} />
            <Route path="/student/*" element={user && user.role === 'student' ? <StudentDashboard /> : <Navigate to="/login" />} />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
} 