import React from 'react';
import ReactECharts from 'echarts-for-react';

const DetailedLineGraph = ({ data, parameter }) => {
  const getParameterConfig = (param) => {
    switch(param.toLowerCase()) {
      case 'current':
        return { label: 'Current (A)', color: '#2563eb' };
      case 'power':
        return { label: 'Power (kW)', color: '#16a34a' };
      case 'energy':
        return { label: 'Energy (kWh)', color: '#9333ea' };
      default:
        return { label: param, color: '#2563eb' };
    }
  };

  const config = getParameterConfig(parameter);

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const dataPoint = params[0];
        return `
          <div class="font-sans">
            <div class="font-medium">${dataPoint.name}</div>
            <div>${config.label}: ${dataPoint.value.toFixed(2)}</div>
          </div>
        `;
      }
    },
    grid: {
      top: 40,
      right: 30,
      bottom: 60,
      left: 60,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.timestamp),
      axisLabel: {
        rotate: 45,
        formatter: (value) => {
          // Return the full time string as is
          return value;
        },
        fontWeight: 'bold',
        margin: 15 // Add some margin to prevent label cutoff
      },
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value',
      name: config.label,
      nameLocation: 'middle',
      nameGap: 50,
      nameTextStyle: {
        fontWeight: 'bold',
        fontSize: 12
      },
      axisLabel: {
        fontWeight: 'bold'
      },
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [{
      data: data.map(item => item.value),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        color: config.color,
        width: 3
      },
      itemStyle: {
        color: config.color
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: `${config.color}33` // 20% opacity
          }, {
            offset: 1,
            color: `${config.color}11` // 7% opacity
          }]
        }
      }
    }],
    dataZoom: [{
      type: 'slider',
      show: true,
      start: 0,
      end: 100,
      bottom: 10
    }, {
      type: 'inside',
      start: 0,
      end: 100
    }]
  };

  return (
    <div className="w-full h-[500px] bg-white rounded-lg p-4">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};

export default DetailedLineGraph;