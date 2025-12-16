// src/Components/LineGraph.jsx
import React from 'react';
import ReactECharts from 'echarts-for-react';

const LineGraph = ({ data }) => {
  // Define the start time
  const startTime = new Date();
  startTime.setHours(8, 30, 0, 0); // Set to 8:30 AM

  // Filter data to start from 8:30 AM
  const filteredData = data.filter(item => new Date(item.timestamp) >= startTime);

  // If no data points are available after 8:30 AM, add a default "OFF" state
  if (filteredData.length === 0) {
    filteredData.push({ timestamp: startTime.toISOString(), value: 0 }); // Default "OFF" state
  }

  // Prepare data for the chart
  const chartData = filteredData.map(item => [new Date(item.timestamp).getTime(), item.value]);

  const option = {
    title: {
      text: 'Line Graph',
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'time', // Set type to 'time' for time-based X-axis
      min: startTime.getTime(), // Set minimum to 8:30 AM
      axisLabel: {
        formatter: (value) => {
          const date = new Date(value);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Format time
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Values', // Label for Y-axis
    },
    series: [
      {
        name: 'Values',
        type: 'line',
        data: chartData, // Use formatted data for the series
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '400px', width: '100%' }} />;
};

export default LineGraph;