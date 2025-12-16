// src/Components/GaugeChart.jsx
import React from 'react';
import ReactECharts from 'echarts-for-react';

const CustomGaugeChart = ({ title, value, unit }) => {
  const option = {
    tooltip: {
      formatter: `{a} <br/>{b} : {c}${unit}`,
    },
    series: [
      {
        name: title,
        type: 'gauge',
        center: ['50%', '60%'],
        radius: '90%',
        progress: {
          show: true,
          width: 12,
        },
        axisLine: {
          lineStyle: {
            width: 12,
          },
        },
        detail: {
          fontSize: 16,
          valueAnimation: true,
          formatter: `{value} ${unit}`,
          offsetCenter: [0, '70%'],
          color: '#666',
        },
        data: [
          {
            value: value,
            name: title,
            fontSize: 14,
          },
        ],
      },
    ],
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <ReactECharts option={option} style={{ height: '200px', width: '200px' }} />
    </div>
  );
};

export default CustomGaugeChart;
