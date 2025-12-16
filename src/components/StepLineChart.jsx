// src/Componnets/StepLineChart.jsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import moment from 'moment';
import { Card } from 'antd';

const StepLineChart = ({ dataPoints, machineName, selectedDate }) => {
  const chartRef = React.useRef(null);
  const isZoomed = React.useRef(false);
  console.log('Raw dataPoints received:', dataPoints);
  
  // Create date in GMT timezone at component level
  const gmtMoment = moment.utc(selectedDate);
  
  // Calculate start and end of day in GMT
  const startOfDay = gmtMoment.clone().set({ hour: 8, minute: 0, second: 0, millisecond: 0 }).valueOf();
  const endOfDay = gmtMoment.clone().set({ hour: 18, minute: 0, second: 0, millisecond: 0 }).valueOf();
  
  // Calculate the maximum time to show based on data points
  let maxDataTime = startOfDay;
  if (dataPoints?.dataPoints?.length > 0) {
    // Find the maximum time from all data points
    dataPoints.dataPoints.forEach(point => {
      if (point.value && point.value[1] > maxDataTime) {
        maxDataTime = point.value[1];
      }
    });
  }
  
  // Add 1 minute to ensure we see the last data point and don't go beyond 18:00
  const currentTime = Math.min(
    moment.utc(maxDataTime).add(1, 'minute').valueOf(),
    endOfDay
  );

  const transformData = () => {
    // Use the component-level gmtMoment for consistency
    const currentGmtMoment = gmtMoment.clone();
    
    // Recalculate start and end of day using the current moment to ensure consistency
    const currentStartOfDay = currentGmtMoment.clone().set({ hour: 8, minute: 0, second: 0, millisecond: 0 }).valueOf();
    const currentEndOfDay = currentGmtMoment.clone().set({ hour: 18, minute: 0, second: 0, millisecond: 0 }).valueOf();

    // Start with OFF status for the entire day
    let chartData = [
      { name: 'OFF', value: [currentStartOfDay, 'OFF'] }
    ];
    
    // If no data points, return OFF status for the entire day
    if (!dataPoints?.dataPoints || dataPoints.dataPoints.length === 0) {
      console.log('No dataPoints available, returning default OFF status');
      chartData.push({
        name: 'OFF',
        value: [currentEndOfDay, 'OFF']
      });
      return chartData;
    }

    // Filter and sort all dataPoints by their start times
    const validDataPoints = dataPoints.dataPoints
      .filter(point => point.value && point.value[0] && point.value[1] && point.value[0] !== point.value[1])
      .sort((a, b) => a.value[0] - b.value[0]);
      
    console.log('Filtered and sorted dataPoints:', validDataPoints);

    // Create a timeline of status changes
    let statusChanges = [];
    
    // Add all status changes to array (both start and end points)
    validDataPoints.forEach(point => {
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
    });
    
    // Sort all status changes by time
    statusChanges.sort((a, b) => a.time - b.time);
    console.log('Status changes:', statusChanges);
    
    // Track active statuses throughout the day
    let activeStatuses = {};
    let currentStatus = 'OFF';
    
    // Reset chart data
    chartData = [];
    
    // Always start with OFF status at 8:00 AM
    chartData.push({
      name: 'OFF',
      value: [currentStartOfDay, 'OFF']
    });
    
    // If there are no status changes, we're done
    if (statusChanges.length === 0) {
      chartData.push({
        name: 'OFF',
        value: [currentEndOfDay, 'OFF']
      });
      return chartData;
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
        // If this is the first status change after OFF, make sure we have a point at the exact time
        if (currentStatus === 'OFF' && chartData.length === 1) {
          // Add a point right before the status change to maintain the OFF state
          chartData.push({
            name: 'OFF',
            value: [change.time - 1, 'OFF']
          });
        }
        
        // Add the new status point
        chartData.push({
          name: newStatus,
          value: [change.time, newStatus]
        });
        currentStatus = newStatus;
      }
    });
    
    // Add final status until end of day
    if (chartData.length > 0) {
      // If we have data points, extend the last status to the end of the day
      const lastPoint = chartData[chartData.length - 1];
      if (lastPoint.value[0] < currentEndOfDay) {
        chartData.push({
          name: lastPoint.name,
          value: [currentEndOfDay, lastPoint.name]
        });
      }
    } else {
      // If no data points, show OFF for the entire day
      chartData.push({
        name: 'OFF',
        value: [currentEndOfDay, 'OFF']
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
      max: currentTime,
      boundaryGap: false,
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          opacity: 0.3
        }
      },
      axisLabel: {
        formatter: (value) => `{b|${moment.utc(value).format('HH:mm')}}`,
        interval: 'auto',
        showMinLabel: true,
        showMaxLabel: true,
        rich: {
          b: {
            fontWeight: 'bold',
            fontSize: 12
          }
        }
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
        interval: 0,
        fontWeight: 'bold',
        formatter: function(value) {
          return `{b|${value}}`;
        },
        rich: {
          b: {
            fontWeight: 'bold',
            fontSize: 12
          }
        }
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
      bottom: '10%',
      top: '8%',
      containLabel: true
    },
    dataZoom: [
      {
        id: 'dataZoomX',
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        bottom: 5,
        height: 20,
        start: 0,
        end: 100,
        handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7v-1.2h6.6z',
        handleSize: '80%',
        handleStyle: {
          color: '#fff',
          shadowBlur: 3,
          shadowColor: 'rgba(0, 0, 0, 0.6)',
          shadowOffsetX: 2,
          shadowOffsetY: 2
        },
        brushSelect: false
      },
      {
        type: 'inside',
        xAxisIndex: [0],
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: false
      }
    ]
  };

  // Save the chart instance and zoom state
  const onChartReady = (echarts) => {
    chartRef.current = echarts;
    
    // Track when user starts zooming/panning
    echarts.on('dataZoom', (params) => {
      // Check if this is a user interaction
      const isUserInteraction = params.batch ? 
        params.batch.some(zoom => zoom.from !== 'dataZoom') : 
        params.from !== 'dataZoom';
      
      if (isUserInteraction) {
        isZoomed.current = true;
      }
      
      if (params.batch) {
        // For multiple dataZoom components
        params.batch.forEach(zoom => {
          if (zoom.dataZoomId === 'dataZoomX') {
            chartRef.current.userZoom = {
              start: zoom.start,
              end: zoom.end
            };
          }
        });
      } else if (params.dataZoomId === 'dataZoomX') {
        // For single dataZoom component
        chartRef.current.userZoom = {
          start: params.start,
          end: params.end
        };
      }
    });
    
    // Reset zoom state when user clicks the reset button
    echarts.on('restore', () => {
      isZoomed.current = false;
    });
  };

  // Update chart options without resetting zoom
  React.useEffect(() => {
    if (chartRef.current && !isZoomed.current) {
      const savedZoom = chartRef.current.userZoom || { start: 0, end: 100 };
      
      // Update options while preserving zoom
      chartRef.current.setOption(option, {
        replaceMerge: ['series'],
        notMerge: true
      });
      
      // Restore zoom state after a small delay
      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.dispatchAction({
            type: 'dataZoom',
            dataZoomId: 'dataZoomX',
            start: savedZoom.start,
            end: savedZoom.end,
            startValue: null,
            endValue: null,
            from: 'dataZoom' // Mark this as programmatic zoom
          });
        }
      }, 0);
    }
  }, [option]);

  return (
    <Card className="shadow-lg rounded-lg">
      <ReactECharts
        option={option}
        style={{ height: '250px' }}
        opts={{ renderer: 'svg' }}
        onChartReady={onChartReady}
        notMerge={true}
      />
    </Card>
  );
};

export default StepLineChart;
