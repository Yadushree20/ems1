import React, { useState, useEffect } from 'react';
import { Layout, Card, Typography, Row, Col, Select, Empty, message, Spin } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { API_ENDPOINTS, getLiveDataURL, getMachinesURL, getReportAverageEnergyURL } from './apiEndpoints';
import moment from 'moment';

const { Title } = Typography;
const { Content } = Layout;
const { Option } = Select;

const RealTimeGraph = () => {
  const [currentData, setCurrentData] = useState([]);
  const [currentTimestamps, setCurrentTimestamps] = useState([]);
  const [energyData, setEnergyData] = useState([]);
  const [energyTimestamps, setEnergyTimestamps] = useState([]);
  const [machineName, setMachineName] = useState('MAZAK H-400');
  const [machines, setMachines] = useState([]);
  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [reportData, setReportData] = useState({ averageEnergy: 0, totalTime: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize with MAZAK H-400
  useEffect(() => {
    const initializeData = async () => {
      try {
        const response = await fetch(getMachinesURL());
        const data = await response.json();
        setMachines(data);

        // Find MAZAK H-400 machine
        const mazakMachine = data.find(m => 
          m.machine_name.trim().toUpperCase() === 'MAZAK H-400'
        );

        if (mazakMachine) {
          console.log('Found MAZAK H-400:', mazakMachine);
          setSelectedMachineId(mazakMachine.id);
          setMachineName(mazakMachine.machine_name);
          await fetchDataForMachine(mazakMachine.id);
        } else {
          console.log('MAZAK H-400 not found in machines list:', data);
          message.warning('MAZAK H-400 not found in machine list');
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        message.error('Error loading initial data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const fetchDataForMachine = async (machineId) => {
    try {
      // Fetch current data
      const currentUrl = getLiveDataURL(machineId);
      const currentResponse = await fetch(currentUrl);
      const currentData = await currentResponse.json();

      if (currentData && typeof currentData === 'object') {
        setCurrentData([currentData.current]);
        setCurrentTimestamps([new Date(currentData.timestamp).toLocaleString()]);
        setEnergyData([currentData.energy]);
        setEnergyTimestamps([new Date(currentData.timestamp).toLocaleString()]);
      }

      // Fetch report data
      const reportUrl = getReportAverageEnergyURL(machineId, moment());
      const reportResponse = await fetch(reportUrl);
      const reportData = await reportResponse.json();

      if (reportData && reportData.average_energy !== undefined) {
        setReportData({
          averageEnergy: reportData.average_energy,
          totalTime: reportData.total_time || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching machine data:', error);
      message.error('Error loading machine data');
    }
  };

  // Handle machine change
  const handleMachineChange = async (value) => {
    const selectedMachine = machines.find(machine => machine.id === value);
    if (selectedMachine) {
      setSelectedMachineId(value);
      setMachineName(selectedMachine.machine_name);
      // Reset data
      setCurrentData([]);
      setCurrentTimestamps([]);
      setEnergyData([]);
      setEnergyTimestamps([]);
      setReportData({ averageEnergy: 0, totalTime: 0 });
      // Fetch new data
      await fetchDataForMachine(value);
    }
  };

  // Real-time updates
  useEffect(() => {
    let interval;
    if (selectedMachineId) {
      const fetchUpdates = async () => {
        try {
          const url = getLiveDataURL(selectedMachineId);
          const response = await fetch(url);
          const data = await response.json();

          if (data && typeof data === 'object') {
            setCurrentData(prevData => [...prevData, data.current].slice(-10));
            setCurrentTimestamps(prevTimestamps => 
              [...prevTimestamps, new Date(data.timestamp).toLocaleString()].slice(-10)
            );
            setEnergyData([data.energy]);
            setEnergyTimestamps([new Date(data.timestamp).toLocaleString()]);
          }
        } catch (error) {
          console.error('Error fetching updates:', error);
        }
      };

      fetchUpdates();
      interval = setInterval(fetchUpdates, 5000);
    }
    return () => clearInterval(interval);
  }, [selectedMachineId]);

  // Your existing chart options remain the same
  const getCurrentOption = () => ({
    title: {
      text: 'Current Analysis',
      left: 'center',
      textStyle: {
        color: '#2c6e49',
      },
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: currentTimestamps,
      name: 'Time',
      nameTextStyle: {
        fontWeight: 'bold',
        fontSize: 12
      },
      axisLabel: {
        rotate: 45,
        fontWeight: 'bold',
        formatter: (value) => {
          return value;
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Current (A)',
      min: 0,
      nameTextStyle: {
        fontWeight: 'bold',
        fontSize: 12
      },
      axisLabel: {
        fontWeight: 'bold',
        formatter: '{value} A',
      },
    },
    series: [{
      name: 'Current',
      type: 'line',
      data: currentData,
      smooth: true,
      itemStyle: {
        color: '#2c6e49',
      },
      areaStyle: {
        color: 'rgba(44, 110, 73, 0.2)',
      },
    }],
  });

  const getEnergyOption = () => ({
    title: {
      text: 'Energy Analysis',
      left: 'center',
      textStyle: {
        color: '#2c6e49',
      },
    },
    tooltip: {
      trigger: 'item',
    },
    xAxis: {
      type: 'category',
      data: ['Energy'],
      name: '',
      nameTextStyle: {
        fontWeight: 'bold',
        fontSize: 12
      },
      axisLabel: {
        fontWeight: 'bold'
      },
    },
    yAxis: {
      type: 'value',
      name: 'Energy (kWh)',
      nameTextStyle: {
        fontWeight: 'bold',
        fontSize: 12
      },
      axisLabel: {
        fontWeight: 'bold',
        formatter: '{value}'
      },
    },
    series: [{
      name: 'Energy',
      type: 'bar',
      data: energyData,
      itemStyle: {
        color: '#1f77b4'
      }
    }]
  });

  const getReportOption = () => ({
    title: {
      text: 'Machine Report',
      left: 'center',
      textStyle: {
        color: '#2c6e49',
      },
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['Total Time', 'Average Energy'],
      top: '10%',
      textStyle: {
        fontWeight: 'bold'
      }
    },
    xAxis: {
      type: 'category',
      data: ['Average Energy'],
      name: '',
      nameTextStyle: {
        fontWeight: 'bold',
        fontSize: 12
      },
      axisLabel: {
        fontWeight: 'bold'
      },
    },
    yAxis: {
      type: 'value',
      name: 'Value',
      nameTextStyle: {
        fontWeight: 'bold',
        fontSize: 12
      },
      axisLabel: {
        fontWeight: 'bold'
      },
    },
    series: [
      {
        name: 'Total Time',
        type: 'bar',
        data: [reportData.totalTime],
        itemStyle: {
          color: '#ff7f0e'
        }
      },
      {
        name: 'Average Energy',
        type: 'bar',
        data: [reportData.averageEnergy],
        itemStyle: {
          color: '#1f77b4'
        }
      }
    ]
  });

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Navbar />
      <Content style={{ padding: '24px' }}>
        <Card
          style={{
            maxWidth: '1900px',
            margin: '0 auto',
            borderRadius: '20px',
            border: 'none',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05)',
            background: '#ffffff',
            padding: '24px'
          }}
        >
          {/* Title and Machine Selection Section */}
          <div 
            style={{ 
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px'
            }}
          >
            <div>
              <Title level={2} style={{ color: '#2c6e49', marginBottom: '8px' }}>
                Real-Time Machine Monitoring
              </Title>
              <Typography.Text style={{ color: '#666', fontSize: '16px' }}>
                Monitor current, energy consumption and performance metrics
              </Typography.Text>
            </div>
            
            <Select
              value={selectedMachineId}
              style={{ width: 250 }}
              onChange={handleMachineChange}
              placeholder="Select Machine"
              size="large"
              dropdownStyle={{ borderRadius: '8px' }}
            >
              {machines.map(machine => (
                <Option key={machine.id} value={machine.id}>
                  {machine.machine_name}
                </Option>
              ))}
            </Select>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
              <Spin size="large" tip="Loading MAZAK H-400 data..." />
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {/* Current Analysis Card */}
              <Col xs={24}>
                <Card
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Current Analysis</span>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {[
                          { status: 'OFF', color: '#4A4A4A' },
                          { status: 'ON', color: '#DAA520' },
                          { status: 'PRODUCTION', color: '#228B22' }
                        ].map(({ status, color }) => (
                          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color }} />
                            <Typography.Text style={{ fontSize: '14px', color: '#666' }}>{status}</Typography.Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  }
                  style={{
                    borderRadius: '16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
                  }}
                  headStyle={{
                    background: '#2c6e49',
                    color: 'white',
                    borderTopLeftRadius: '16px',
                    borderTopRightRadius: '16px',
                    padding: '16px 24px'
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <div style={{ height: '300px' }}>
                    {currentData.length > 0 && currentTimestamps.length > 0 ? (
                      <ReactECharts option={getCurrentOption()} style={{ height: '100%' }} />
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Empty description="No current data available" />
                      </div>
                    )}
                  </div>
                </Card>
              </Col>

           {/* Energy Card */}
<Col xs={24} lg={12}>
  <Card
    title="Machine Energy"  // Changed from "Machine Report" to "Machine Energy"
    style={{
      borderRadius: '16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      height: '85%'
    }}
    headStyle={{
      background: '#2c6e49',
      color: 'white',
      borderTopLeftRadius: '16px',
      borderTopRightRadius: '16px',
      padding: '16px 24px'
    }}
    bodyStyle={{ padding: '24px' }}
  >
    <div style={{ height: '300px' }}>
      {energyData.length > 0 ? (
        <ReactECharts option={getEnergyOption()} style={{ height: '100%' }} />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Empty description="No energy data available" />
        </div>
      )}
    </div>
  </Card>
</Col>

              {/* Report Card */}
              <Col xs={24} lg={12}>
                <Card
                  title="Machine Report"
                  style={{
                    borderRadius: '16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    height: '85%'
                  }}
                  headStyle={{
                    background: '#2c6e49',
                    color: 'white',
                    borderTopLeftRadius: '16px',
                    borderTopRightRadius: '16px',
                    padding: '16px 24px'
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <div style={{ height: '300px' }}>
                    <ReactECharts option={getReportOption()} style={{ height: '100%' }} />
                  </div>
                </Card>
              </Col>
            </Row>
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default RealTimeGraph;