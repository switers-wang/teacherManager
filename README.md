# teacherManager

题目管理系统（React + Vite）
# 环境安装
https://nodejs.org/zh-cn/download 点击mac安装
或者在命令行执行 brew install node

下载安装完之后 check一下是否安装成功，如下
确保在命令行
```
node -v
npm -v
```
都已安装，即可本地启动
## 启动

```bash
npm install
npm run dev
```

## 功能

- 教师端：题目管理、题目录入（单选、多选、编程题）
- 学生端：刷题、编程题判题、分数统计
- 题库和答题记录前端存储（IndexedDB）
- 代码编辑器（Monaco Editor）
- 判题（集成 judge0 API）

## 账号

- 角色切换在页面右上角 