import { get, set } from 'idb-keyval';

const QUESTION_KEY = 'tm_questions';
const RECORD_KEY = 'tm_student_record';
const USER_KEY = 'tm_users';

export async function getQuestions() {
  return (await get(QUESTION_KEY)) || [];
}

export async function addQuestion(q) {
  const qs = await getQuestions();
  q.id = q.id || Date.now() + Math.random().toString(36).slice(2, 8);
  if (q.type === 'single' || q.type === 'multiple') {
    q.options = q.options;
    q.answer = q.answer.split(',').map(s => Number(s.trim()));
  }
  qs.push(q);
  await set(QUESTION_KEY, qs);
}

export async function removeQuestion(id) {
  const qs = await getQuestions();
  await set(QUESTION_KEY, qs.filter(q => q.id !== id));
}

export async function getStudentRecord() {
  return (await get(RECORD_KEY)) || [];
}

export async function saveStudentRecord({ qid, score }) {
  const rec = await getStudentRecord();
  rec.push({ qid, score, time: Date.now() });
  await set(RECORD_KEY, rec);
}

export async function getUsers() {
  return (await get(USER_KEY)) || [];
}

export async function registerUser(user) {
  const users = await getUsers();
  if (users.find(u => u.username === user.username && u.role === user.role)) return false;
  users.push(user);
  await set(USER_KEY, users);
  return true;
}

export async function loginUser({ role, studentId, teacherId, password }) {
  const users = await getUsers();
  if (role === 'student') {
    return users.find(u => u.role === 'student' && u.username === studentId && u.password === password) || null;
  } else {
    return users.find(u => u.role === 'teacher' && u.username === teacherId && u.password === password) || null;
  }
} 