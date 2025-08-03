import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Progress, Button, Modal, Descriptions, Space, Statistic, Row, Col } from 'antd';
import { getStudentAnswerStats, getQuestionAnswerStats } from '../utils/storage';

export default function StudentAnswerStats() {
  const [studentStats, setStudentStats] = useState([]);
  const [questionStats, setQuestionStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [students, questions] = await Promise.all([
        getStudentAnswerStats(),
        getQuestionAnswerStats()
      ]);
      setStudentStats(students);
      setQuestionStats(questions);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    loadStats();
  }, []);

  const showStudentDetail = (student) => {
    setSelectedStudent(student);
    setDetailModalVisible(true);
  };

  const studentColumns = [
    {
      title: '学生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (text, record) => (
        <Button type="link" onClick={() => showStudentDetail(record)}>
          {text}
        </Button>
      ),
    },
    {
      title: '完成率',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (rate) => (
        <Progress 
          percent={rate} 
          size="small" 
          status={rate === 100 ? 'success' : rate >= 80 ? 'normal' : 'exception'}
        />
      ),
    },
    {
      title: '正确率',
      dataIndex: 'accuracyRate',
      key: 'accuracyRate',
      render: (rate) => (
        <Progress 
          percent={rate} 
          size="small" 
          status={rate >= 80 ? 'success' : rate >= 60 ? 'normal' : 'exception'}
        />
      ),
    },
    {
      title: '平均分',
      dataIndex: 'averageScore',
      key: 'averageScore',
      render: (score, record) => {
        const totalPossibleScore = record.totalPossibleScore || record.questionStats.reduce((sum, q) => sum + (q.questionScore || 100), 0);
        const averagePercentage = totalPossibleScore > 0 ? Math.round((record.totalScore / totalPossibleScore) * 100) : 0;
        return (
          <div>
            <Tag color={averagePercentage >= 80 ? 'green' : averagePercentage >= 60 ? 'orange' : 'red'}>
              {score}分
            </Tag>
            <br />
            <small style={{ color: '#666' }}>({averagePercentage}%)</small>
          </div>
        );
      },
    },
    {
      title: '答题情况',
      key: 'summary',
      render: (_, record) => (
        <span>
          {record.answeredQuestions}/{record.totalQuestions} 题
          ({record.correctQuestions} 正确)
        </span>
      ),
    },
  ];

  const questionColumns = [
    {
      title: '题目',
      dataIndex: 'questionTitle',
      key: 'questionTitle',
      render: (text) => text.length > 30 ? text.slice(0, 30) + '...' : text,
    },
    {
      title: '类型',
      dataIndex: 'questionType',
      key: 'questionType',
      render: (type) => {
        const typeMap = {
          single: { text: '单选', color: 'blue' },
          multiple: { text: '多选', color: 'green' },
          code: { text: '编程', color: 'orange' },
        };
        const config = typeMap[type] || { text: type, color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '答题人数',
      dataIndex: 'totalAttempts',
      key: 'totalAttempts',
    },
    {
      title: '正确率',
      dataIndex: 'correctRate',
      key: 'correctRate',
      render: (rate) => (
        <Progress 
          percent={rate} 
          size="small" 
          status={rate >= 80 ? 'success' : rate >= 60 ? 'normal' : 'exception'}
        />
      ),
    },
    {
      title: '平均分',
      dataIndex: 'averageScore',
      key: 'averageScore',
      render: (score, record) => {
        const questionScore = record.questionScore || 100;
        const percentage = questionScore > 0 ? Math.round((score / questionScore) * 100) : 0;
        return (
          <div>
            <Tag color={percentage >= 80 ? 'green' : percentage >= 60 ? 'orange' : 'red'}>
              {score}分
            </Tag>
            <br />
            <small style={{ color: '#666' }}>({percentage}%)</small>
          </div>
        );
      },
    },
  ];

  const detailColumns = [
    {
      title: '题号',
      dataIndex: 'questionId',
      key: 'questionId',
      width: 80,
    },
    {
      title: '题目',
      dataIndex: 'questionTitle',
      key: 'questionTitle',
      render: (text) => text.length > 25 ? text.slice(0, 25) + '...' : text,
    },
    {
      title: '类型',
      dataIndex: 'questionType',
      key: 'questionType',
      width: 80,
      render: (type) => {
        const typeMap = {
          single: { text: '单选', color: 'blue' },
          multiple: { text: '多选', color: 'green' },
          code: { text: '编程', color: 'orange' },
        };
        const config = typeMap[type] || { text: type, color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        if (!record.hasAnswered) {
          return <Tag color="default">未答题</Tag>;
        }
        return record.isCorrect ? 
          <Tag color="success">正确</Tag> : 
          <Tag color="error">错误</Tag>;
      },
    },
    {
      title: '分数',
      key: 'score',
      width: 100,
      render: (_, record) => {
        if (!record.hasAnswered) {
          return <span>-</span>;
        }
        const score = record.score;
        const questionScore = record.questionScore || 100;
        const color = score === questionScore ? 'green' : score > 0 ? 'orange' : 'red';
        return (
          <Tag color={color}>
            {score}/{questionScore}分
          </Tag>
        );
      },
    },
    {
      title: '答题时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
      render: (timestamp) => timestamp ? 
        new Date(timestamp).toLocaleString() : '-',
    },
  ];

  return (
    <div>
      <Card title="学生答题统计" extra={<Button onClick={loadStats} loading={loading}>刷新</Button>}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic 
              title="总学生数" 
              value={studentStats.length} 
              suffix="人" 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="总题目数" 
              value={questionStats.length} 
              suffix="题" 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="平均完成率" 
              value={studentStats.length > 0 ? 
                Math.round(studentStats.reduce((sum, s) => sum + s.completionRate, 0) / studentStats.length) : 0
              } 
              suffix="%" 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="平均正确率" 
              value={studentStats.length > 0 ? 
                Math.round(studentStats.reduce((sum, s) => sum + s.accuracyRate, 0) / studentStats.length) : 0
              } 
              suffix="%" 
            />
          </Col>
        </Row>

        <Table
          title={() => <h3>学生答题情况</h3>}
          columns={studentColumns}
          dataSource={studentStats}
          loading={loading}
          rowKey="studentUsername"
          pagination={false}
          size="small"
        />
      </Card>

      <Card title="题目答题统计" style={{ marginTop: 16 }}>
        <Table
          columns={questionColumns}
          dataSource={questionStats}
          loading={loading}
          rowKey="questionId"
          pagination={false}
          size="small"
        />
      </Card>

      <Modal
        title={`${selectedStudent?.studentName} 的详细答题情况`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedStudent && (
          <div>
            <Descriptions bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="学生姓名">{selectedStudent.studentName}</Descriptions.Item>
              <Descriptions.Item label="完成率">
                <Progress percent={selectedStudent.completionRate} size="small" />
              </Descriptions.Item>
              <Descriptions.Item label="正确率">
                <Progress percent={selectedStudent.accuracyRate} size="small" />
              </Descriptions.Item>
              <Descriptions.Item label="平均分">
                <Tag color={selectedStudent.averageScore >= 80 ? 'green' : selectedStudent.averageScore >= 60 ? 'orange' : 'red'}>
                  {selectedStudent.averageScore}分
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="答题情况">
                {selectedStudent.answeredQuestions}/{selectedStudent.totalQuestions} 题
                ({selectedStudent.correctQuestions} 正确)
              </Descriptions.Item>
              <Descriptions.Item label="总分">
                {selectedStudent.totalScore}分
              </Descriptions.Item>
            </Descriptions>

            <Table
              columns={detailColumns}
              dataSource={selectedStudent.questionStats}
              rowKey="questionId"
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>
    </div>
  );
} 