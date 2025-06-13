import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { getStudentRecord } from '../utils/storage';

export default function GrowthChart() {
  const chartRef = useRef();

  useEffect(() => {
    let chart;
    getStudentRecord().then(records => {
      if (!chartRef.current) return;
      chart = echarts.init(chartRef.current);
      const data = records.map((r, i) => ({ x: i + 1, y: r.score }));
      chart.setOption({
        title: { text: '成长线', left: 'center' },
        xAxis: { type: 'category', data: data.map(d => d.x), name: '刷题次数' },
        yAxis: { type: 'value', min: 0, max: 100, name: '分数' },
        series: [{ type: 'line', data: data.map(d => d.y), smooth: true }],
        tooltip: { trigger: 'axis' },
      });
    });
    return () => chart && chart.dispose();
  }, []);

  return <div ref={chartRef} style={{ width: '100%', height: 400 }} />;
} 