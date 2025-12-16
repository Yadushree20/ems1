// src/Components/Productivity.jsx
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, DatePicker, Button, Card, Space, Empty } from 'antd';
import { ArrowLeftOutlined, ToolOutlined, BarChartOutlined, FileTextOutlined, AppstoreAddOutlined, ReloadOutlined } from '@ant-design/icons';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import highchartsMore from 'highcharts/highcharts-more';
import solidGauge from 'highcharts/modules/solid-gauge';
import { useNavigate } from 'react-router-dom';
import { 
  API_ENDPOINTS, 
  getShiftLiveDataURL, 
  getShiftLiveHistoryURL,
  getMachinesURL,
  getProductionGraphURL,
  getLiveRecentURL,
  getReportURL,
  getProductionDataURL,
  fetchMachinesData
} from './apiEndpoints';
import moment from 'moment';
import { message } from 'antd';
import Navbar from './Navbar';

// Initialize Highcharts modules
highchartsMore(Highcharts);
solidGauge(Highcharts);

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function Productivity() {
  const navigate = useNavigate();
  const [machinesData, setMachinesData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [gaugeData, setGaugeData] = useState([]);
  const [productionData, setProductionData] = useState([]);
  const [liveRecentData, setLiveRecentData] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [machines, setMachines] = useState([]);
  // Function to fetch machines with proper error handling
  const fetchMachines = async () => {
    try {
      const response = await fetch(getMachinesURL());
      const data = await response.json();
      console.log('Raw machines response:', data);

      if (Array.isArray(data)) {
        setMachines(data);
        console.log('Setting machines array:', data);
      } else {
        console.error('Unexpected data format:', data);
        setMachines([]);
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
      setMachines([]);
    }
  };

  // Enhanced fetchLiveData function
  const fetchLiveData = async () => {
    try {
      const response = await fetch(getShiftLiveDataURL());
      if (!response.ok) throw new Error('Failed to fetch live data');
      
      const data = await response.json();
      console.log('Live data received:', data);

      if (Array.isArray(data) && data.length > 0) {
        // Map the live data with machine names
        const enrichedData = data.map(liveData => {
          const matchedMachine = machines.find(m => Number(m.id) === Number(liveData.id));
          return {
            ...liveData,
            machine_name: matchedMachine?.machine_name || `Machine ${liveData.id}`,
            machine_id: Number(liveData.id)
          };
        });

        console.log('Enriched gauge data:', enrichedData);
        setGaugeData(enrichedData);
        message.success('Live data updated');
      }
    } catch (error) {
      console.error('Error in fetchLiveData:', error);
      message.error('Failed to fetch live data');
    }
  };

  // Enhanced handleDateChange function
  const handleDateChange = async (date) => {
    try {
      if (!date) {
        fetchLiveData();
        setSelectedDate(null);
        return;
      }

      const formattedDate = date.format('YYYY-MM-DD');
      setSelectedDate(formattedDate);
      
      const response = await fetch(getShiftLiveHistoryURL(formattedDate));
      if (!response.ok) throw new Error('Failed to fetch historical data');
      
      const data = await response.json();
      console.log('Historical data received:', data);

      if (Array.isArray(data) && data.length > 0) {
        // Use the machine_name directly from the historical data
        const enrichedData = data.map(histData => ({
          ...histData,
          id: Number(histData.id),
          // Use the machine_name that comes from the API
          machine_name: histData.machine_name || `Machine ${histData.id}`
        }));

        console.log('Enriched historical data:', enrichedData);
        setGaugeData(enrichedData);
        message.success(`Loaded data for ${moment(formattedDate).format('MMMM D, YYYY')}`);
      } else {
        message.info('No data available for selected date');
        setGaugeData([]);
      }
    } catch (error) {
      console.error('Error in handleDateChange:', error);
      message.error('Failed to fetch historical data');
    }
  };

  // Function to fetch production graph data
  const fetchProductionGraphData = async (machineId, date) => {
    try {
      const response = await fetch(getProductionGraphURL(machineId, date));
      const data = await response.json();
      console.log('Fetched production graph data:', data);
      // Handle the production graph data as needed
    } catch (error) {
      console.error('Error fetching production graph data:', error);
    }
  };

  // Function to fetch live recent data
  const fetchLiveRecentData = async (machineId) => {
    try {
      const response = await fetch(getLiveRecentURL(machineId));
      const data = await response.json();
      console.log('Fetched live recent data:', data);
      setLiveRecentData(data);
    } catch (error) {
      console.error('Error fetching live recent data:', error);
    }
  };

  // Function to fetch report data
  const fetchReportData = async (machineId, date) => {
    try {
      const response = await fetch(getReportURL(machineId, date));
      const data = await response.json();
      console.log('Fetched report data:', data);
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  };

  // Function to fetch production data
  const fetchProductionData = async (machineId, date) => {
    try {
      const response = await fetch(getProductionDataURL(machineId, date));
      const data = await response.json();
      console.log('Fetched production data:', data);
      setProductionData(data);
    } catch (error) {
      console.error('Error fetching production data:', error);
    }
  };

  // Function to handle report button click
  const handleReportClick = () => {
    navigate('/energymonitoring/report', { state: { date: selectedDate } });
  };

  // Initial data fetch
  useEffect(() => {
    fetchMachines();
  }, []); // Only run once on mount

  // Separate useEffect for live data
  useEffect(() => {
    if (machines && machines.length > 0) {
      fetchLiveData();
      const interval = setInterval(fetchLiveData, 60000);
      return () => clearInterval(interval);
    }
  }, [machines]); // Only run when machines changes

  // Highcharts gauge options
  const getGaugeOptions = (machine) => ({
    chart: {
      type: 'solidgauge',
      height: '200px',
      backgroundColor: 'transparent',
      style: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue"'
      }
    },
    title: {
      text: machine.machine_name || `Machine ${machine.id}`,
      style: { fontSize: '16px', fontWeight: '600' }
    },
    pane: {
      center: ['50%', '50%'],
      size: '100%',
      startAngle: -90,
      endAngle: 90,
      background: [{
        backgroundColor: '#EEE',
        innerRadius: '60%',
        outerRadius: '100%',
        shape: 'arc',
        borderWidth: 0
      }]
    },
    tooltip: {
      enabled: true,
      formatter: function() {
        return `<b>${machine.machine_name || `Machine ${machine.id}`}</b><br/>
                Energy: ${this.y} kWh<br/>
                Total: ${machine?.total_energy || 0} kWh`;
      }
    },
    yAxis: {
      min: 0,
      max: Math.max(machine?.first_shift || 0, 100),
      stops: [
        [0.1, '#34D399'], // Light green
        [0.5, '#FBBF24'], // Amber
        [0.9, '#EF4444']  // Red
      ],
      lineWidth: 0,
      tickWidth: 0,
      minorTickInterval: null,
      tickAmount: 2,
      labels: {
        y: 16,
        style: {
          fontSize: '12px'
        }
      }
    },
    plotOptions: {
      solidgauge: {
        dataLabels: {
          y: -25,
          borderWidth: 0,
          useHTML: true
        }
      }
    },
    credits: {
      enabled: false
    },
    series: [{
      name: 'Energy',
      data: [machine?.first_shift || 0],
      dataLabels: {
        format: '<div style="text-align:center"><span style="font-size:20px;color:black">{y:.1f}</span><br/>' +
               '<span style="font-size:12px;color:silver">kWh</span></div>'
      }
    }]
  });

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Navbar/>
      {/* <Header className="bg-emerald-700 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <Title level={3} className="text-white m-0">
            Dashboard
          </Title>
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={['2']}
          className="bg-emerald-700 border-none"
          items={[
            {
              key: '1',
              icon: <ToolOutlined />,
              label: 'Machines',
              className: 'text-white',
              onClick: () => navigate('/machine'),
            },
            {
              key: '2',
              icon: <BarChartOutlined />,
              label: 'Productivity',
              className: 'text-white',
              onClick: () => navigate('/productivity'),
            },
            {
              key: '3',
              icon: <ArrowLeftOutlined />,
              label: 'Back',
              className: 'text-white ml-auto',
              onClick: () => navigate('/'),
            },
          ]}
        />
      </Header> */}

      <Content className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Header Card */}
          <Card 
            className="mb-6 shadow-lg rounded-xl border-0 backdrop-blur-sm bg-white/90"
            bodyStyle={{ padding: '24px' }}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <BarChartOutlined className="text-2xl text-emerald-600" />
                </div>
                <div>
                  <Title level={4} className="!m-0">
                    Machine Energy Dashboard
                  </Title>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Text type="secondary">
                      {selectedDate ? 
                        `Historical Data for ${moment(selectedDate).format('MMMM D, YYYY')}` : 
                        'Live Data (Auto-updating)'}
                    </Text>
                  </div>
                </div>
              </div>

              <Space size="middle" className="flex-wrap">
                <DatePicker 
                  onChange={handleDateChange}
                  value={selectedDate ? moment(selectedDate) : null}
                  className="w-44"
                  placeholder="Select date"
                  allowClear
                  format="YYYY-MM-DD"
                />
                {selectedDate && (
                  <Button
                    type="primary"
                    onClick={handleReportClick}
                    icon={<FileTextOutlined />}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    View Report
                  </Button>
                )}
                <Button
                  type="primary"
                  onClick={() => {
                    setSelectedDate(null);
                    fetchLiveData();
                  }}
                  icon={<ReloadOutlined spin={!selectedDate} />}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {selectedDate ? 'Switch to Live' : 'Refresh Live'}
                </Button>
              </Space>
            </div>
          </Card>

          {/* Gauge Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {gaugeData.length > 0 ? (
              gaugeData.map((machine, index) => (
                <Card 
                  key={machine.id || index}
                  className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0 backdrop-blur-sm bg-white/90 transform hover:-translate-y-1"
                  bodyStyle={{ padding: '24px' }}
                >
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={getGaugeOptions(machine)}
                  />
                  <div className="text-center mt-4">
                    <Text strong className="text-lg block mb-3 text-gray-800">
                      {machine.machine_name || `Machine ${machine.id}`}
                    </Text>
                    <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center px-3">
                        <Text type="secondary" className="text-sm">Energy:</Text>
                        <Text strong className="text-emerald-600">
                          {machine.first_shift?.toFixed(2) || 0} kWh
                        </Text>
                      </div>
                      <div className="flex justify-between items-center px-3">
                        <Text type="secondary" className="text-sm">Cost:</Text>
                        <Text strong className="text-emerald-600">
                          ₹{machine.total_cost?.toFixed(2) || 0}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex justify-center items-center h-64 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg">
                <Empty 
                  description={
                    <div className="text-center space-y-4">
                      <Text className="text-gray-500 text-lg block">
                        {selectedDate ? 'No data available for selected date' : 'No live data available'}
                      </Text>
                      <Button 
                        type="primary"
                        onClick={fetchLiveData}
                        icon={<ReloadOutlined />}
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-md"
                      >
                        Refresh Data
                      </Button>
                    </div>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default Productivity;