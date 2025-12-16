// src/Componnets/StepLineChart.jsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import moment from 'moment';
import { Card } from 'antd';

const StepLineChart = ({ dataPoints, machineName, selectedDate }) => {
  console.log('Raw dataPoints received:', dataPoints);
  
  // Create date in GMT timezone at component level
  const gmtMoment = moment.utc(selectedDate);
  
  // Calculate start and end of day in GMT
  const startOfDay = gmtMoment.clone().set({ hour: 8, minute: 0, second: 0, millisecond: 0 }).valueOf();
  const endOfDay = gmtMoment.clone().set({ hour: 18, minute: 0, second: 0, millisecond: 0 }).valueOf();

  const transformData = () => {
    // Use the component-level gmtMoment for consistency
    const currentGmtMoment = gmtMoment.clone();
    
    // Start with OFF status for the entire day
    let chartData = [
      { name: 'OFF', value: [startOfDay, 'OFF'] }
    ];
    
    if (!dataPoints?.dataPoints || dataPoints.dataPoints.length === 0) {
      console.log('No dataPoints available, returning default OFF status');
      return chartData;
    }
    
    // Recalculate start and end of day using the current moment to ensure consistency
    const currentStartOfDay = currentGmtMoment.clone().set({ hour: 8, minute: 0, second: 0, millisecond: 0 }).valueOf();
    const currentEndOfDay = currentGmtMoment.clone().set({ hour: 18, minute: 0, second: 0, millisecond: 0 }).valueOf();

    // First, we need to sort all dataPoints by their start times
    const sortedDataPoints = [...dataPoints.dataPoints].sort((a, b) => a.value[0] - b.value[0]);
    console.log('Sorted dataPoints:', sortedDataPoints);

    // Create a timeline of status changes
    let statusChanges = [];
    
    // Add all status changes to array (both start and end points)
    sortedDataPoints.forEach(point => {
      // Only add valid time periods (where start time != end time)
      if (point.value[0] !== point.value[1]) {
        // Convert timestamps to numbers to ensure proper comparison
        const startTime = Number(point.value[0]);
        const endTime = Number(point.value[1]);
        
        // Start time
        statusChanges.push({
          time: startTime,
          status: point.name,
          isStart: true
        });
        
        // End time
        statusChanges.push({
          time: endTime,
          status: point.name,
          isStart: false
        });
      }
    });
    
    // Sort all status changes by time
    statusChanges.sort((a, b) => a.time - b.time);
    console.log('Status changes:', statusChanges);
    
    // Track active statuses throughout the day
    let activeStatuses = {};
    let currentStatus = 'OFF';
    
    // Reset chart data
    chartData = [];
    
    // Add initial OFF status if first status change is after start of day
    if (statusChanges.length === 0 || statusChanges[0].time > currentStartOfDay) {
      chartData.push({
        name: 'OFF',
        value: [currentStartOfDay, 'OFF']
      });
    }
    
    // Process all status changes
    statusChanges.forEach((change) => {
      // Update active statuses
      if (change.isStart) {
        activeStatuses[change.status] = true;
      } else {
        delete activeStatuses[change.status];
      }
      
      // Determine current status based on priorities
      const newStatus = activeStatuses['PRODUCTION'] ? 'PRODUCTION' : 
                       activeStatuses['ON'] ? 'ON' : 'OFF';
      
      // Only add point if status changed
      if (newStatus !== currentStatus) {
        chartData.push({
          name: newStatus,
          value: [change.time, newStatus]
        });
        currentStatus = newStatus;
      }
    });
    
    // Add final status until end of day if needed
    if (statusChanges.length > 0 && statusChanges[statusChanges.length - 1].time < currentEndOfDay) {
      chartData.push({
        name: currentStatus,
        value: [currentEndOfDay, currentStatus]
      });
    }
    
    // Ensure chart has at least one data point
    if (chartData.length === 0) {
      chartData.push({
        name: 'OFF',
        value: [currentStartOfDay, 'OFF']
      });
    }
    
    console.log('Final chart data:', chartData);
    return chartData;
  };

  const data = transformData();

  const option = {
    title: {
      text: `${machineName} Production Status`,
      left: 'center',
      top: 5,
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const time = moment.utc(params[0].data.value[0]).format('HH:mm:ss');
        const status = params[0].data.value[1];
        return `Time (GMT): ${time}<br/>Status: ${status}`;
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: '#6E7079',
          width: 2,
          type: 'solid'
        }
      }
    },
    xAxis: {
      type: 'time',
      min: gmtMoment.clone().set({ hour: 8, minute: 0, second: 0, millisecond: 0 }).valueOf(),
      max: gmtMoment.clone().set({ hour: 18, minute: 0, second: 0, millisecond: 0 }).valueOf(),
      boundaryGap: false,
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          opacity: 0.3
        }
      },
      axisLabel: {
        formatter: (value) => moment.utc(value).format('HH:mm'),
        interval: 'auto',
        showMinLabel: true,
        showMaxLabel: true
      },
      axisLine: {
        lineStyle: {
          color: '#333'
        }
      },
      axisPointer: {
        label: {
          formatter: function(params) {
            return moment.utc(params.value).format('HH:mm:ss');
          }
        }
      },
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'category',
      data: ['OFF', 'ON', 'PRODUCTION'],
      axisLabel: {
        interval: 0
      }
    },
    series: [
      {
        name: 'Machine Status',
        type: 'line',
        step: 'start',
        data: data,
        lineStyle: {
          width: 3
        },
        itemStyle: {
          color: (params) => {
            // Different colors for different statuses
            switch(params.data.value[1]) {
              case 'OFF': return '#64748B'; // Softer gray
              case 'ON': return '#F59E0B'; // Warmer orange
              case 'PRODUCTION': return '#10B981'; // Richer green
              default: return '#2c6e49';
            }
          }
        },
        encode: {
          x: 0,
          y: 1
        },
        symbolSize: 6
      }
    ],
    grid: {
      left: '5%',
      right: '5%',
      bottom: '15%',
      top: '12%',
      containLabel: true
    },
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        bottom: 5,
        height: 20,
        startValue: moment(selectedDate).set({ hour: 8, minute: 0, second: 0 }).valueOf(),
        endValue: moment(selectedDate).set({ hour: 18, minute: 0, second: 0 }).valueOf()
      },
      {
        type: 'inside',
        xAxisIndex: [0]
      }
    ]
  };

  return (
    <Card className="shadow-lg rounded-lg">
      <ReactECharts
        option={option}
        style={{ height: '300px' }}
        opts={{ renderer: 'svg' }}
        notMerge={true}
      />
    </Card>
  );
};

export default StepLineChart;
