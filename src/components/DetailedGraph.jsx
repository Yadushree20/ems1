import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Card, Spin, Alert, Space } from 'antd';
import { BarChartOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import Navbar from './Navbar';
import DetailedLineGraph from './DetailedLineGraph';
import { API_ENDPOINTS } from './apiEndpoints';

const { Content } = Layout;
const { TabPane } = Tabs;

const DetailedGraph = () => {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('4'); // Default machine ID
  const [timeRange, setTimeRange] = useState('24h'); // Default time range
  const [graphData, setGraphData] = useState({
    current: [],
    power: [],
    energy: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get time range in milliseconds
  const getTimeRange = (range) => {
    const end = new Date();
    const start = new Date();
    switch (range) {
      case '1h':
        start.setHours(end.getHours() - 1);
        break;
      case '24h':
        start.setHours(end.getHours() - 24);
        break;
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      default:
        start.setHours(end.getHours() - 24);
    }
    return { start, end };
  };

  // Fetch data for all parameters
  const fetchAllParameters = async (machineId, start, end) => {
    setLoading(true);
    setError(null);
    
    try {
      const parameters = ['current', 'power', 'energy'];
      const promises = parameters.map(param => 
        fetch(`${API_ENDPOINTS.GRAPH_DATA}?start_date=${Math.floor(start.valueOf() / 1000)}&end_date=${Math.floor(end.valueOf() / 1000)}&machine_name=${machineId}&parameter_name=${param}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
          })
      );

      const results = await Promise.all(promises);
      
      const newGraphData = {};
      parameters.forEach((param, index) => {
        newGraphData[param] = results[index].data.map(item => {
          // Extract time part from the ISO timestamp (HH:MM:SS)
          const timePart = item.timestamp.split('T')[1].split('.')[0];
          
          return {
            timestamp: timePart, // This will be in 24-hour format (HH:MM:SS)
            value: parseFloat(item[param])
          };
        });
      });

      setGraphData(newGraphData);
    } catch (error) {
      setError('Failed to fetch data. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.MACHINES);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Ensure data is an array
        const machinesArray = Array.isArray(data) ? data : [];
        setMachines(machinesArray);
        
        if (machinesArray.length > 0) {
          const defaultMachine = machinesArray[0].id.toString();
          setSelectedMachine(defaultMachine);
          const { start, end } = getTimeRange('24h');
          await fetchAllParameters(defaultMachine, start, end);
        }
      } catch (error) {
        console.error('Error fetching machines:', error);
        setError('Failed to fetch machines');
        setMachines([]); // Reset to empty array on error
      }
    };

    fetchInitialData();
  }, []);

  // Time range buttons
  const TimeRangeSelector = () => (
    <Space className="mb-4">
      <button
        onClick={() => {
          setTimeRange('1h');
          const { start, end } = getTimeRange('1h');
          fetchAllParameters(selectedMachine, start, end);
        }}
        className={`px-4 py-2 rounded-lg font-semibold ${timeRange === '1h' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
      >
        Last Hour
      </button>
      <button
        onClick={() => {
          setTimeRange('24h');
          const { start, end } = getTimeRange('24h');
          fetchAllParameters(selectedMachine, start, end);
        }}
        className={`px-4 py-2 rounded-lg font-semibold ${timeRange === '24h' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
      >
        Last 24 Hours
      </button>
      <button
        onClick={() => {
          setTimeRange('7d');
          const { start, end } = getTimeRange('7d');
          fetchAllParameters(selectedMachine, start, end);
        }}
        className={`px-4 py-2 rounded-lg font-semibold ${timeRange === '7d' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
      >
        Last 7 Days
      </button>
    </Space>
  );

  return (
    <Layout className="min-h-screen">
      <Navbar />
      <Content className="p-6 bg-gray-50">
        <Card 
          title={
            <div className="flex items-center space-x-2">
              <BarChartOutlined className="text-green-600 text-xl" />
              <span className="text-xl font-semibold">Machine Parameters Analysis</span>
            </div>
          }
          extra={
            <Space>
              <select
                value={selectedMachine}
                onChange={(e) => {
                  setSelectedMachine(e.target.value);
                  const { start, end } = getTimeRange(timeRange);
                  fetchAllParameters(e.target.value, start, end);
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
              >
                {Array.isArray(machines) && machines.length > 0 ? (
                  machines.map(machine => (
                    <option key={machine.id} value={machine.id}>
                      {machine.machine_name}
                    </option>
                  ))
                ) : (
                  <option value="">No machines available</option>
                )}
              </select>
              <button
                onClick={() => {
                  const { start, end } = getTimeRange(timeRange);
                  fetchAllParameters(selectedMachine, start, end);
                }}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                title="Refresh Data"
              >
                <ReloadOutlined />
              </button>
            </Space>
          }
          className="shadow-lg"
        >
          <TimeRangeSelector />

          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              className="mb-4"
            />
          )}

          {loading ? (
            <div className="flex justify-center items-center h-[400px]">
              <Spin size="large" />
            </div>
          ) : (
            <Tabs defaultActiveKey="current" className="mt-4 [&_.ant-tabs-tab-btn]:font-bold">
              <TabPane 
                tab={<span className="font-semibold">Current</span>} 
                key="current"
              >
                <DetailedLineGraph data={graphData.current} parameter="current" />
              </TabPane>
              <TabPane 
                tab={<span className="font-semibold">Power</span>} 
                key="power"
              >
                <DetailedLineGraph data={graphData.power} parameter="power" />
              </TabPane>
              <TabPane 
                tab={<span className="font-semibold">Energy</span>} 
                key="energy"
              >
                <DetailedLineGraph data={graphData.energy} parameter="energy" />
              </TabPane>
            </Tabs>
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default DetailedGraph;