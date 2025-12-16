// src/Components/Report.jsx
import React, { useEffect, useState } from 'react';
import { Layout, Typography, Spin, Table, message, Button } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import cmtiImage from '../Assets/cmti_pic.png';
import { getDailyReportURL, getWeeklyReportURL, API_ENDPOINTS, getShiftLiveHistoryURL, getTotalEnergyCostsURL, getDailyEnergyConsumptionURL, getGraphDataURL } from './apiEndpoints';
import moment from 'moment';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LabelList } from 'recharts';
import ReactECharts from 'echarts-for-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsXRange from 'highcharts/modules/xrange';
import { DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
const { Content } = Layout;
const { Title, Text } = Typography;

const tableStyles = {
  header: {
    backgroundColor: '#3B97B4',
    color: 'white',
    fontWeight: 'bold',
  },
  summary: {
    backgroundColor: '#f0f8ff',
    fontWeight: 'bold',
  }
};

// Initialize xrange module
if (typeof Highcharts === 'object') {
  HighchartsXRange(Highcharts);
}

function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const { date } = location.state || {};
  const [shiftData, setShiftData] = useState(null);
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyEnergyData, setDailyEnergyData] = useState([]);
  const [productionData, setProductionData] = useState(null);
  const [machines, setMachines] = useState([]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch shift live history data
      const shiftUrl = `${API_ENDPOINTS.SHIFT_LIVE_HISTORY}?date=${moment(date).format('YYYY-MM-DD')}`;
      const shiftResponse = await fetch(shiftUrl);
      const shiftResult = await shiftResponse.json();
      console.log('Shift data:', shiftResult);
      setShiftData(shiftResult);

      // Fetch total energy costs
      const costsUrl = getTotalEnergyCostsURL(moment(date).format('YYYY-MM-DD'));
      const costsResponse = await fetch(costsUrl);
      const costsResult = await costsResponse.json();
      console.log('Costs data:', costsResult);
      setCostData(costsResult);

      // Fetch daily energy consumption data for the past 7 days
      const dailyEnergyUrl = getDailyEnergyConsumptionURL(date);
      const dailyEnergyResponse = await fetch(dailyEnergyUrl);
      const dailyEnergyResult = await dailyEnergyResponse.json();
      console.log('Daily energy data:', dailyEnergyResult);
      
      // Sort the data by date
      const sortedData = dailyEnergyResult.daily_energy_consumption.sort((a, b) => 
        moment(a.date).valueOf() - moment(b.date).valueOf()
      );
      
      setDailyEnergyData(sortedData);
      
      // Fetch production graph data
      const productionUrl = `${API_ENDPOINTS.PROD_GRAPH_DATA}?date=${moment(date).format('YYYY-MM-DD')}`;
      const productionResponse = await fetch(productionUrl);
      if (!productionResponse.ok) {
        throw new Error(`HTTP error! status: ${productionResponse.status}`);
      }
      const productionResult = await productionResponse.json();
      console.log('Production data:', productionResult);
      setProductionData(productionResult);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      message.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (date) {
      fetchReportData();
    }
  }, [date]);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.MACHINES);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const machineData = await response.json();
        console.log('Fetched machine data:', machineData); // Debug log
        setMachines(machineData);
      } catch (error) {
        console.error('Error fetching machines:', error);
        message.error('Failed to fetch machine names');
      }
    };
    fetchMachines();
  }, []);

  const getMachineName = (id) => {
    const machine = machines.find(m => Number(m.id) === Number(id));
    return machine ? machine.machine_name : `Machine ${id}`;
  };

  const columns = [
    {
      title: 'MACHINES',
      dataIndex: 'machine_name',
      key: 'machine_name',
      width: 150,
      onHeaderCell: () => ({
        style: tableStyles.header,
      }),
    },
    {
      title: 'FIRST SHIFT (kWh)',
      dataIndex: 'first_shift',
      key: 'first_shift',
      width: 120,
      render: (value) => value?.toFixed(2) || '0',
      onHeaderCell: () => ({
        style: tableStyles.header,
      }),
    },
    {
      title: 'SECOND SHIFT (kWh)',
      dataIndex: 'second_shift',
      key: 'second_shift',
      width: 120,
      render: (value) => value?.toFixed(2) || '0',
      onHeaderCell: () => ({
        style: tableStyles.header,
      }),
    },
    {
      title: 'THIRD SHIFT (kWh)',
      dataIndex: 'third_shift',
      key: 'third_shift',
      width: 120,
      render: (value) => value?.toFixed(2) || '0',
      onHeaderCell: () => ({
        style: tableStyles.header,
      }),
    },
    {
      title: 'ALL SHIFTS (kWh)',
      dataIndex: 'total_energy',
      key: 'total_energy',
      width: 120,
      render: (value) => value?.toFixed(3) || '0',
      onHeaderCell: () => ({
        style: tableStyles.header,
      }),
    },
    {
      title: 'TOTAL COST (Rs)',
      dataIndex: 'total_cost',
      key: 'total_cost',
      width: 120,
      render: (value) => `â‚¹${value?.toFixed(2) || '0'}`,
      onHeaderCell: () => ({
        style: tableStyles.header,
      }),
    },
  ];

  // Add this function to prepare the bar chart options
  const getBarChartOptions = () => {
    // Find the highest energy consumption
    const maxEnergy = Math.max(...dailyEnergyData.map(item => item.energy_consumption));

    // Function to get shortened day name
    const getShortDay = (day) => {
      return day.substring(0, 3); // Takes first 3 characters of the day name
    };

    return {
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        // Map full day names to shortened versions
        data: dailyEnergyData.map(item => getShortDay(item.day)),
        axisLabel: {
          color: '#666',
          interval: 0,
          rotate: 0
        }
      },
      yAxis: {
        type: 'value',
        name: 'Energy (kWh)',
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: {
          color: '#666',
          formatter: (value) => value.toFixed(1)
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          const data = dailyEnergyData[params[0].dataIndex];
          return `${getShortDay(data.day)}, ${moment(data.date).format('MMM D')}<br/>
                  Energy: ${data.energy_consumption.toFixed(2)} kWh`;
        }
      },
      series: [{
        data: dailyEnergyData.map(item => ({
          value: item.energy_consumption,
          itemStyle: {
            // Color the bar red if it's the highest value
            color: item.energy_consumption === maxEnergy ? '#ff4d4f' : '#3B97B4'
          }
        })),
        type: 'bar',
        label: {
          show: true,
          position: 'top',
          formatter: (params) => params.value.toFixed(1),
          color: '#666'
        }
      }]
    };
  };

  const getBarChartOptionsNew = () => {
    return {
      xAxis: {
        type: 'category',
        // Map full day names to shortened versions
        data: dailyEnergyData.map(item => getShortDay(item.day)),
        axisLabel: {
          color: '#666',
          interval: 0,
          rotate: 0
        }
      },
      yAxis: {
        type: 'value',
        name: 'Energy (kWh)',
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: {
          color: '#666',
          formatter: (value) => value.toFixed(1)
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          const data = dailyEnergyData[params[0].dataIndex];
          return `${getShortDay(data.day)}, ${moment(data.date).format('MMM D')}<br/>
                  Energy: ${data.energy_consumption.toFixed(2)} kWh`;
        },
        itemGap: 10,
        padding: [15, 0],
        textStyle: {
          fontSize: 12,
          lineHeight: 20
        }
      },
      series: [{
        data: dailyEnergyData.map(item => ({
          value: item.energy_consumption,
          itemStyle: {
            color: '#1890ff',
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            shadowBlur: 10
          }
        })),
        type: 'bar',
        label: {
          show: true,
          position: 'top',
          formatter: (params) => params.value.toFixed(1),
          color: '#666'
        }
      }]
    };
  };

  // Pie chart options
  const pieChartOptions = {
    title: {
      text: 'Machine Distribution',
      left: 'center',
      top: 20,
      textStyle: {
        color: '#555'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: shiftData?.map(item => item.machine_name) || []
    },
    series: [{
      name: 'Machine Distribution',
      type: 'pie',
      radius: ['50%', '70%'],
      center: ['50%', '40%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      data: shiftData?.map(item => ({
        value: item.total_energy,
        name: item.machine_name,
        itemStyle: {
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`
        }
      })) || [],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      label: {
        show: true,
        position: 'center',
        formatter: function(params) {
          const { name, percent } = params;
          return `{name|${name}}\n{percent|${percent}%}\n\n{title|Total Amount for ${moment(date).format('MMM DD')}}\n{value|Rs.${shiftData?.reduce((acc, curr) => acc + Number(curr.total_cost), 0).toFixed(2)}}`;
        },
        rich: {
          name: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#333',
            padding: [5, 0]
          },
          percent: {
            fontSize: 18,
            color: '#1890ff',
            padding: [0, 0, 10, 0]
          },
          title: {
            fontSize: 12,
            color: '#666',
            padding: [10, 0, 5, 0],
            display: 'block'
          },
          value: {
            fontSize: 16,
            color: '#52c41a',
            fontWeight: 'bold',
            padding: [0, 0, 10, 0],
            display: 'block'
          }
        }
      },
      labelLine: {
        show: false
      }
    }]
  };

  const getEnergyTimeChartOptions = () => {
    return {
      title: {
        text: `Energy Time Details of Workshop - ${moment(date).format('MMMM D, YYYY')}`,
        left: 'center',
        top: 20
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['Energy Shift 1', 'Energy Shift 2', 'Energy Shift 3', 'Time'],
        top: 60
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 100,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: shiftData?.map(item => item.machine_name) || [],
        axisLabel: {
          interval: 0,
          rotate: 30
        }
      },
      yAxis: [{
        type: 'value',
        name: 'Energy',
        min: 0,
        max: 25,
        interval: 5,
        axisLabel: {
          formatter: '{value}'
        }
      }, {
        type: 'value',
        name: 'Time',
        min: 0,
        max: 25,
        interval: 5,
        axisLabel: {
          formatter: '{value}'
        }
      }],
      series: [
        {
          name: 'Energy Shift 1',
          type: 'bar',
          stack: 'energy',
          itemStyle: { color: '#ff9999' },
          data: shiftData?.map(item => item.first_shift) || []
        },
        {
          name: 'Energy Shift 2',
          type: 'bar',
          stack: 'energy',
          itemStyle: { color: '#ffb366' },
          data: shiftData?.map(item => item.second_shift) || []
        },
        {
          name: 'Energy Shift 3',
          type: 'bar',
          stack: 'energy',
          itemStyle: { color: '#ff9900' },
          data: shiftData?.map(item => item.third_shift) || []
        }
      ],
      center: ['50%', '40%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'center',
        formatter: [
          `{title|Total Amount for ${moment(date).format('MMM DD')}}`,
          `{value|Rs.${shiftData?.reduce((acc, curr) => acc + Number(curr.total_cost), 0).toFixed(2)}}`
        ].join('\n'),
        rich: {
          title: {
            fontSize: 11,
            lineHeight: 20,
            color: '#666'
          },
          value: {
            fontSize: 11,
          fontWeight: 'bold',
          color: '#333',
          padding: [5, 0, 0, 0]
        }
      }
    }
  };

  const getProductionTimelineOptions = (productionData) => {
    if (!productionData) {
      console.log('No production data available');
      return {};
    }
    
    // Handle case where dataPoints might be directly in productionData or in a nested property
    const dataPoints = Array.isArray(productionData) ? productionData : 
                      (productionData.dataPoints || []);
    
    if (dataPoints.length === 0) {
      console.log('No data points available for the selected date');
      return {};
    }
    
    console.log(`Processing ${dataPoints.length} data points`);

    // Set time range from 8 AM selected day to 8 AM next day in UTC
    const baseDate = moment.utc(date).startOf('day');
    const startTime = baseDate.clone().set({ hour: 8, minute: 0, second: 0 });  // 8 AM UTC selected day
    const endTime = baseDate.clone().add(1, 'day').set({ hour: 8, minute: 0, second: 0 });   // 8 AM UTC next day
    
    console.log('Date range for production data (UTC):', {
      selectedDate: date,
      startTime: startTime.format('YYYY-MM-DD HH:mm:ss [UTC]'),
      endTime: endTime.format('YYYY-MM-DD HH:mm:ss [UTC]'),
      startTimeLocal: startTime.local().format('YYYY-MM-DD HH:mm:ss Z'),
      endTimeLocal: endTime.local().format('YYYY-MM-DD HH:mm:ss Z')
    });

    // Create a map to store machine timelines
    const machineTimelines = {};
    
    // Define machine IDs in the order they should appear in the chart (top to bottom)
    const machineOrder = [5, 4, 3, 2, 1, 7, 6];
    const machineCategories = machineOrder.map(id => {
      const machine = machines.find(m => Number(m.id) === Number(id));
      return machine ? machine.machine_name : `Machine ${id}`;
    });

    // Initialize timelines for each machine based on the order
    machineOrder.forEach((machineId, index) => {
      machineTimelines[machineId] = [];
    });

    // Process all data points
    let validPoints = 0;
    dataPoints.forEach((point, idx) => {
      console.log(`Processing point ${idx}:`, point);
      try {
        // Handle different possible data structures
        let startTime, endTime, machineId, status;
        
        // Check if point is in the expected format
        if (point.value && Array.isArray(point.value) && point.value.length >= 2) {
          // Format: { value: [start, end], machine_id: X, name: 'status' }
          startTime = moment.utc(point.value[0]);
          endTime = moment.utc(point.value[1]);
          machineId = point.machine_id;
          status = point.name || 'ON';
        } else if (point.start_time && point.end_time) {
          // Alternative format: { start_time: '...', end_time: '...', machine_id: X, status: '...' }
          startTime = moment.utc(point.start_time);
          endTime = moment.utc(point.end_time);
          machineId = point.machine_id;
          status = point.status || 'ON';
        } else {
          console.log('Skipping point with unknown format:', point);
          return;
        }
        
        if (!startTime.isValid() || !endTime.isValid()) {
          console.log('Skipping point with invalid dates:', point);
          return;
        }
        
        const timeline = machineTimelines[machineId];
        
        if (timeline === undefined) {
          console.log(`Machine ID ${machineId} not found in machine order, skipping point:`, point);
          return;
        }
        
        // Add the point to the machine's timeline
        const pointData = {
          startTime: startTime,
          endTime: endTime,
          status: status,
          color: getStatusColor(status)
        };
        timeline.push(pointData);
        validPoints++;
        console.log(`Added point for machine ${machineId}:`, {
          start: startTime.format('YYYY-MM-DD HH:mm:ss [UTC]'),
          end: endTime.format('YYYY-MM-DD HH:mm:ss [UTC]'),
          status: status
        });
        
      } catch (error) {
        console.error('Error processing point:', point, error);
      }
    });
    
    console.log(`Finished processing points. Valid points: ${validPoints} out of ${dataPoints.length}`);
    
    if (validPoints === 0) {
      console.log('No valid points found in the selected date range');
      return {};
    }
    
    // Log machine timelines before processing
    const timelineLog = Object.entries(machineTimelines).map(([id, points]) => {
      const machine = machines.find(m => Number(m.id) === Number(id));
      const machineName = machine ? machine.machine_name : `Machine ${id}`;
      
      return {
        machineId: id,
        machineName: machineName,
        pointCount: points.length,
        points: points.map(p => ({
          start: p.startTime.format('YYYY-MM-DD HH:mm:ss [UTC]'),
          end: p.endTime.format('YYYY-MM-DD HH:mm:ss [UTC]'),
          status: p.status,
          duration: p.endTime.diff(p.startTime, 'minutes') + ' minutes'
        }))
      };
    });
    
    console.log('Machine timelines before processing:', timelineLog);
    
    // Process each machine's timeline
    const allPoints = [];
    
    machineOrder.forEach((machineId, index) => {
      const timeline = machineTimelines[machineId];
      const machinePoints = [];
      
      // Sort points by start time
      timeline.sort((a, b) => a.startTime.valueOf() - b.startTime.valueOf());
      
      // Add initial OFF state if needed
      if (timeline.length === 0 || timeline[0].startTime.valueOf() > startTime.valueOf()) {
        machinePoints.push({
          x: startTime.valueOf(),
          x2: timeline.length > 0 ? timeline[0].startTime.valueOf() : endTime.valueOf(),
          y: index,
          status: 'OFF',
          color: getStatusColor('OFF')
        });
      }
      
      // Add all points with OFF states in between
      timeline.forEach((point, i) => {
        // Add the point itself
        machinePoints.push({
          x: Math.max(point.startTime.valueOf(), startTime.valueOf()),
          x2: Math.min(point.endTime.valueOf(), endTime.valueOf()),
          y: index,
          status: point.status,
          color: getStatusColor(point.status)
        });
        
        // Add OFF state to next point if there's a gap
        if (i < timeline.length - 1 && point.endTime.valueOf() < timeline[i + 1].startTime.valueOf()) {
          machinePoints.push({
            x: point.endTime.valueOf(),
            x2: timeline[i + 1].startTime.valueOf(),
            y: index,
            status: 'OFF',
            color: getStatusColor('OFF')
          });
        }
      });
      
      // Add final OFF state if needed
      if (timeline.length > 0) {
        const lastPoint = timeline[timeline.length - 1];
        if (lastPoint.endTime.valueOf() < endTime.valueOf()) {
          machinePoints.push({
            x: lastPoint.endTime.valueOf(),
            x2: endTime.valueOf(),
            y: index,
            status: 'OFF',
            color: getStatusColor('OFF')
          });
        }
      }
      
      allPoints.push(...machinePoints);
    });
    
    console.log('Processed all points:', allPoints);

    return {
      chart: {
        type: 'xrange',
        height: 400,
        marginLeft: 150
      },
      title: {
        text: 'Workshop Production'
      },
      xAxis: {
        type: 'datetime',
        min: startTime.valueOf(),
        max: endTime.valueOf(),
        labels: {
          format: '{value:%H:%M}',
          style: {
            fontSize: '12px'
          },
          formatter: function() {
            return moment.utc(this.value).format('HH:mm');  // Format in UTC time
          }
        },
        tickInterval: 3600 * 1000, // One hour intervals
        tickPositions: Array.from({ length: 25 }, (_, i) => {
          return startTime.valueOf() + (i * 3600 * 1000);
        }),
        minPadding: 0,
        maxPadding: 0,
        startOnTick: true,
        endOnTick: true,
        gridLineWidth: 1,
        crosshair: true,
        title: {
          text: 'Time (8:00 AM - 8:00 AM)',
          style: {
            fontSize: '12px',
            fontWeight: 'bold'
          }
        },
        plotLines: [{
          // Add a vertical line at midnight
          color: '#666',
          dashStyle: 'dash',
          width: 1,
          value: baseDate.clone().endOf('day').valueOf(),
          label: {
            text: 'Midnight',
            style: {
              color: '#666'
            }
          }
        }]
      },
      yAxis: {
        title: {
          text: ''
        },
        categories: machineCategories,
        reversed: false,
        labels: {
          style: {
            fontSize: '11px',  // Decreased font size
            fontFamily: 'Arial',
            fontWeight: '500'  // Added medium weight for better readability
          },
          padding: 4  // Added some padding for better spacing
        }
      },
      tooltip: {
        formatter: function() {
          const machineName = machineCategories[this.point.y];
          const startTime = moment(this.x);
          const endTime = moment(this.x2);
          const duration = moment.duration(endTime.diff(startTime));
          const hours = Math.floor(duration.asHours());
          const minutes = Math.floor(duration.asMinutes() % 60);
          
          return `<b>${machineName}</b><br/>
                  Status: ${this.point.status}<br/>
                  Time: ${startTime.format('HH:mm')} - ${endTime.format('HH:mm')}<br/>
                  Duration: ${hours}h ${minutes}m`;
        }
      },
      series: [{
        name: 'Machine Status',
        pointWidth: 20,
        data: allPoints,
        borderRadius: 2  // Optional: adds slightly rounded corners to the bars
      }]
    };
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'PRODUCTION': '#006400',  // Dark Green
      'ON': '#FF8C00',         // Dark Orange
      'OFF': '#808080'         // Light Grey
    };
    return colorMap[status] || '#808080';
  };

  const handlePrint = async () => {
    try {
      const pages = document.querySelectorAll('.page-container');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      }
      
      pdf.save(`Workshop_Report_${moment(date).format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Failed to generate PDF');
    }
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-8">
        {/* Header buttons */}
        <div className="flex justify-end mb-4">
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={handlePrint}
            size="large"
            className="mr-4"
          >
            Download Report
          </Button>
          <Button 
            type="default" 
            onClick={() => navigate(-1)}
            size="large"
            icon={<ArrowLeftOutlined />}
          >
            Back
          </Button>
        </div>

        {/* Update the container classes */}
        <div className="flex justify-center gap-8">
          {/* Page 1 */}
          <div className="w-[20cm] h-[35cm] bg-white shadow-lg rounded-lg mb-8 page-container">
            {/* Header with border and padding */}
            <div className="flex justify-between items-start p-6 border-b ">
              <img src={cmtiImage} alt="CMTI Logo" className="h-16" />
              <div className="text-right">
                <Text className="block text-lg font-semibold">
                  {moment(date).format('MMMM D, YYYY')}
                </Text>
                <Text className="block mt-2 text-blue-800">
                  Weekly Cost: <span className="font-semibold">Rs. {costData?.total_weekly_cost?.toFixed(2) || '0.00'}</span>
                  <br />
                  Monthly Cost: <span className="font-semibold">Rs. {costData?.total_monthly_cost?.toFixed(2) || '0.00'}</span>
                </Text>
              </div>
            </div>
            
            <div className="flex items-center">
              {/* Workshop Details with better spacing */}
              <div className="p-6">
                <Title level={4} className="text-blue-800 mb-1">SMDDC, Workshop</Title>
                <Text className="block text-gray-600">CMTI,</Text>
                <Text className="text-gray-600">Bengaluru</Text>
              </div>
            </div>

            {/* Energy Data Table with styling */}
            <div className="p-6">
              <Title level={5} className="text-blue-800 mb-4">
                Energy Data from: {moment(date).format('MMMM D, YYYY')}
              </Title>
              {loading ? (
                <div className="flex justify-center p-8">
                  <Spin size="large" />
                </div>
              ) : (
                <>
                  <Table 
                    dataSource={shiftData || []}
                    columns={columns}
                    pagination={false}
                    size="small"
                    className="mt-4"
                    bordered
                    summary={(pageData) => {
                      const totals = pageData.reduce((acc, curr) => ({
                        total_energy: (acc.total_energy || 0) + (Number(curr.total_energy) || 0),
                        total_cost: (acc.total_cost || 0) + (Number(curr.total_cost) || 0),
                      }), {
                        total_energy: 0,
                        total_cost: 0
                      });

                      return (
                        <Table.Summary.Row style={tableStyles.summary}>
                          <Table.Summary.Cell>Total Usage:</Table.Summary.Cell>
                          <Table.Summary.Cell colSpan={3}></Table.Summary.Cell>
                          <Table.Summary.Cell>{(totals.total_energy || 0).toFixed(2)} kWh</Table.Summary.Cell>
                          <Table.Summary.Cell>â‚¹{(totals.total_cost || 0).toFixed(2)}</Table.Summary.Cell>
                        </Table.Summary.Row>
                      );
                    }}
                  />

                  {/* Total display below table */}
                  <div className="mt-4 text-right text-blue-800">
                    <Text strong>Total Usage: {shiftData?.reduce((acc, curr) => acc + (Number(curr.total_energy) || 0), 0).toFixed(2)} kWh</Text>
                    <Text strong className="ml-8">Total Cost: â‚¹{shiftData?.reduce((acc, curr) => acc + (Number(curr.total_cost) || 0), 0).toFixed(2)}</Text>
                  </div>
                </>
              )}
            </div>

            {/* Add this after your table section */}
            <div className="p-6 grid grid-cols-2 gap-16">
              {/* Weekly Graph */}
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <Title level={5} className="text-blue-800 mb-4">
                  Week At Glance from: {moment(date).subtract(6, 'days').format('MMMM D, YYYY')} to{' '}
                  {moment(date).format('MMMM D, YYYY')}
                </Title>
                <ReactECharts 
                  option={getBarChartOptions()} 
                  style={{ height: '300px' }}
                />
              </div>

              {/* Machine Distribution Doughnut Chart */}
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <Title level={5} className="text-blue-800 mb-4">
                  Machine-wise Distribution
                </Title>
                <ReactECharts 
                  option={getDoughnutChartOptions()} 
                  style={{ height: '300px' }}
                />
              </div>
            </div>

            <div className="text-right p-4 border-t">
              <Text>Page 1 of 2</Text>
            </div>
          </div>

          {/* Page 2 */}
          <div className="w-[20cm] bg-white shadow-lg rounded-lg page-container">
            <div className="flex justify-between items-start p-6 border-b">
              <img src={cmtiImage} alt="CMTI Logo" className="h-16" />
              <Text className="text-lg font-semibold">
                {moment(date).format('MMMM D, YYYY')}
              </Text>
            </div>

            {/* Energy Time Chart */}
            <div className="p-6">
              <ReactECharts 
                option={getEnergyTimeChartOptions()} 
                style={{ height: '500px' }}
              />
            </div>

            {/* Workshop Production Section */}
            <div className="p-6 border-t">
              <Title level={5} className="text-blue-800 mb-4">Workshop Production</Title>
              {productionData?.dataPoints && productionData.dataPoints.length > 0 ? (
                <>
                  <div style={{ height: '400px', width: '100%' }}>
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={getProductionTimelineOptions(productionData)}
                    />
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-[#006400] mr-2"></div>
                      <span>Production</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-[#FF8C00] mr-2"></div>
                      <span>ON</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-[#808080] mr-2"></div>
                      <span>OFF</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500">No production data available</div>
              )}
            </div>

            <div className="text-right p-2 border-t">
              <Text>Page 2 of 2</Text>
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default Report;