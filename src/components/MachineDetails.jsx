import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Spin, Card, Row, Col, Button, DatePicker, Space, message, Badge } from 'antd';
import moment from 'moment';
import { 
  LineChartOutlined, 
  DashboardOutlined, 
  ReloadOutlined,
  CalendarOutlined,
  ArrowLeftOutlined 
} from '@ant-design/icons';
import Navbar from './Navbar';
import CustomGaugeChart from './GaugeChart';
import StepLineChart from './StepLineChart';
import { API_ENDPOINTS, getProductionGraphURL, getGraphDataURL } from './apiEndpoints';

const { Title, Paragraph, Text } = Typography;

function MachineDetails() {
  const { machineId } = useParams();
  const [machineDetails, setMachineDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [machineName, setMachineName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const [productionData, setProductionData] = useState([]);

  const fetchMachineData = async () => {
    setRefreshing(true);
    try {
      const [nameResponse, detailsResponse] = await Promise.all([
        fetch(API_ENDPOINTS.MACHINES),
        fetch(`${API_ENDPOINTS.LIVE_RECENT}/${machineId}`)
      ]);
      
      if (!nameResponse.ok || !detailsResponse.ok) {
        throw new Error('Failed to fetch machine data');
      }

      const machines = await nameResponse.json();
      const machine = machines.find(m => m.id === parseInt(machineId));
      setMachineName(machine ? machine.machine_name : `Machine ${machineId}`);
      
      const data = await detailsResponse.json();
      setMachineDetails(data);
      // message.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const fetchProductionData = async (date) => {
    try {
      // Use the direct endpoint for Mazak H-400
      const requestUrl = `http://172.18.7.91:9900/prod_graph/get_production_data?machine_id=${machineId}&date=${moment(date).format('YYYY-MM-DD')}`;
      console.log('Fetching production data from URL:', requestUrl);
      
      const response = await fetch(requestUrl);
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`HTTP error! status: ${response.status}, response:`, errorText);
        setProductionData({ dataPoints: [] });
        return;
      }
      
      const data = await response.json();
      console.log('Raw API Response:', JSON.stringify(data, null, 2));
      
      let formattedData = { dataPoints: [] };
      
      // Handle the specific format we're getting from the API
      if (data.dataPoints && Array.isArray(data.dataPoints)) {
        console.log('Processing dataPoints array');
        
        formattedData.dataPoints = data.dataPoints
          .map(item => {
            try {
              // Ensure we have valid timestamps and status
              if (!item.name || !Array.isArray(item.value) || item.value.length < 2) {
                console.warn('Skipping invalid data point:', item);
                return null;
              }
              
              const startTime = Number(item.value[0]);
              const endTime = Number(item.value[1]);
              
              // Skip if timestamps are invalid
              if (isNaN(startTime) || isNaN(endTime)) {
                console.warn('Invalid timestamps in data point:', item);
                return null;
              }
              
              // Ensure end time is after start time
              const validEndTime = endTime > startTime ? endTime : startTime + 1000; // Add 1 second if end equals start
              
              return {
                name: String(item.name).toUpperCase(),
                value: [startTime, validEndTime]
              };
            } catch (error) {
              console.warn('Error processing data point:', error, item);
              return null;
            }
          })
          .filter(Boolean); // Remove any null entries
        
        console.log('Processed data points:', formattedData.dataPoints);
      } else {
        console.warn('Unexpected data format, expected dataPoints array');
      }
      
      // Ensure we have valid data points to display
      const hasValidData = formattedData.dataPoints && 
                         formattedData.dataPoints.length > 0 &&
                         formattedData.dataPoints.some(p => p.value[0] !== p.value[1]);
      
      if (!hasValidData) {
        console.log('No valid production data found, showing empty state');
        setProductionData({ dataPoints: [] });
        return;
      }
      
      console.log('Setting production data:', JSON.stringify(formattedData, null, 2));
      setProductionData(formattedData);
      
    } catch (error) {
      console.warn('Error fetching production data:', error);
      setProductionData({ dataPoints: [] });
    }
  };

  useEffect(() => {
    console.log('Selected Machine ID:', machineId);
    
    // Initial fetch
    fetchMachineData();
    fetchProductionData(moment().format('YYYY-MM-DD'));

    // Set up interval for both data fetches
    const interval = setInterval(() => {
      fetchMachineData();
      fetchProductionData(moment().format('YYYY-MM-DD'));
    }, 3000);
    
    // Cleanup
    return () => clearInterval(interval);
  }, [machineId]);

  const handleDateChange = (date) => {
    if (date) {
      const formattedDate = date.format('YYYY-MM-DD');
      setSelectedDate(date.toDate());
      fetchProductionData(formattedDate);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="text-center p-8 shadow-lg">
          <Spin size="large" />
          <Paragraph className="mt-4 text-gray-600">Loading machine details...</Paragraph>
        </Card>
      </div>
    );
  }

  if (!machineDetails) {
    return (
      <div className="p-6">
        <Card className="text-center shadow-lg">
          <DashboardOutlined className="text-4xl text-gray-400 mb-4" />
          <Paragraph className="text-lg">No details found for this machine.</Paragraph>
          <Button type="primary" onClick={() => navigate(-1)}>
            <ArrowLeftOutlined /> Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6">
        <Card 
          className="mb-2 -mt-6 shadow-md hover:shadow-lg transition-shadow duration-300"
          bodyStyle={{ padding: '3px' }}
        >
          <div className="flex justify-between items-center">
            <Title level={2} className="!m-0 flex items-center gap-3">
              <DashboardOutlined className="text-2xl text-green-600" />
              {machineName}
            </Title>
            <Space>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate(-1)}         
              >
                Back
              </Button>
              <Button 
                type="primary"
                icon={<ReloadOutlined spin={refreshing} />}
                onClick={fetchMachineData}
                loading={refreshing}
                className="bg-green-600 hover:bg-green-700"
              >
                Refresh
              </Button>
            </Space>
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <GaugeBox 
              title="Current" 
              value={machineDetails.current} 
              unit="A" 
              color="#2563eb"
            />
          </Col>
          <Col xs={24} md={8}>
            <GaugeBox 
              title="Power" 
              value={machineDetails.power} 
              unit="kW" 
              color="#16a34a"
            />
          </Col>
          <Col xs={24} md={8}>
            <GaugeBox 
              title="Energy" 
              value={machineDetails.energy} 
              unit="kWh" 
              color="#9333ea"
            />
          </Col>
        </Row>

        <Card 
          className="mt-6 shadow-lg rounded-xl border-0 overflow-hidden"
          headStyle={{ 
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb'
          }}
        >
          <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="bg-green-50 p-3 rounded-xl shadow-sm">
                <LineChartOutlined className="text-2xl text-green-600" />
              </div>
              <div>
                <Title level={4} className="!m-0 !text-gray-800">
                  Production Status
                </Title>
                <Text type="secondary" className="text-sm">
                  {moment(selectedDate).format('MMMM D, YYYY')}
                </Text>
              </div>
            </div>
            <Space size="middle">
              <Button
                icon={<ReloadOutlined spin={refreshing} />}
                onClick={() => fetchProductionData(moment(selectedDate).format('YYYY-MM-DD'))}
                className="border-green-600 text-green-600 hover:bg-green-50 flex items-center"
              >
                <span>Refresh</span>
              </Button>
              {/* <DatePicker 
                onChange={handleDateChange}
                defaultValue={moment()}
                className="w-44"
                placeholder="Select date"
                format="YYYY-MM-DD"
              /> */}
            </Space>
          </div>
          
          {productionData && productionData.dataPoints && productionData.dataPoints.length > 0 ? (
            <div className="bg-white p-2 rounded-lg">
              <div className="flex justify-end space-x-6 mb-2">
                <Badge color="#64748B" text={<span className="text-gray-600 text-sm">OFF</span>} />
                <Badge color="#F59E0B" text={<span className="text-gray-600 text-sm">ON</span>} />
                <Badge color="#10B981" text={<span className="text-gray-600 text-sm">PRODUCTION</span>} />
              </div>
              <StepLineChart 
                dataPoints={productionData} 
                machineName={machineName}
                selectedDate={selectedDate}
              />
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <LineChartOutlined className="text-6xl text-gray-300 mb-4" />
              <Title level={4} className="!text-gray-500 !m-0 mb-2">
                No Production Data
              </Title>
              <Paragraph className="text-gray-400 max-w-md mx-auto">
                No production data available for {moment(selectedDate).format('MMMM D, YYYY')}.
              </Paragraph>
              <Button 
                type="primary"
                onClick={() => fetchProductionData(moment().format('YYYY-MM-DD'))}
                className="mt-6 bg-green-600 hover:bg-green-700 h-10 px-6"
                size="large"
              >
                Load Today's Data
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

const GaugeBox = ({ title, value, unit, color }) => (
  <Card 
    className="h-full shadow-md hover:shadow-lg transition-shadow duration-300"
    hoverable
    bodyStyle={{ padding: '12px' }}
  >
    <div className="text-center">
      <Title level={4} className="!m-0 mb-2" style={{ color }}>
        {title}
      </Title>
      <CustomGaugeChart 
        title={title} 
        value={value || 0} 
        unit={unit}
        color={color}
      />
      <Paragraph className="mt-2 text-gray-600">
        {title}: {value || 0} {unit}
      </Paragraph>
    </div>
  </Card>
);

export default MachineDetails;
