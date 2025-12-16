// src/Components/Production.jsx
import React, { useState, useRef, useEffect } from 'react';
import Navbar from './Navbar';
import { Card, Select, DatePicker, Button, Typography, Layout, message, Spin } from 'antd';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ReloadOutlined } from '@ant-design/icons';
import { API_ENDPOINTS } from './apiEndpoints'; // Import the API endpoints
import moment from 'moment';

// Import required Highcharts modules
import HC_xrange from 'highcharts/modules/xrange';

// Initialize module
HC_xrange(Highcharts);

const { Title } = Typography;
const { Content } = Layout;

const Production = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [startDate, setStartDate] = useState(moment());
  const [machines, setMachines] = useState([]);
  const [productionData, setProductionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.MACHINES);
        if (!response.ok) {
          throw new Error('Failed to fetch machines');
        }
        const data = await response.json();
        setMachines(data);
        
        // Only set the default machine if we have data
        if (data && data.length > 0) {
          const defaultMachine = data.find(m => m.machine_name === 'MAZAK H-400');
          setSelectedMachine(defaultMachine ? defaultMachine.machine_name : data[0].machine_name);
        }
      } catch (error) {
        message.error('Error fetching machine data');
        console.error('Error:', error);
      }
    };

    fetchMachines();
  }, []);

  useEffect(() => {
    if (selectedMachine && startDate && machines.length > 0) {
      handleSubmit();
    }
  }, [machines, selectedMachine, startDate]);

  const handleMachineChange = (value) => {
    setSelectedMachine(value);
    const machine = machines.find(m => m.machine_name === value);
    console.log('Selected Machine:', value);
    console.log('Machine Details:', machine);
  };

  const handleDateChange = (date) => {
    setStartDate(date);
    if (date) {
      console.log('Display Date Format:', date.format('DD-MM-YYYY'));
      console.log('API Date Format:', date.format('YYYY-MM-DD'));
    }
  };

  const getMachineId = (machineName) => {
    const trimmedMachineName = machineName.trim();
    const machine = machines.find(machine => machine.machine_name.trim() === trimmedMachineName);
    return machine ? machine.machine_id : null;
  };

  const transformData = (rawData) => {
    if (!rawData?.dataPoints) return null;
    return rawData;
  };

  const getChartOptions = (data, selectedMachine) => {
    // Darker shades for better visibility
    const stateColors = {
      'OFF': '#4A4A4A',     // Darker Grey
      'ON': '#DAA520',      // Darker Yellow (Goldenrod)
      'PRODUCTION': '#228B22' // Darker Green (Forest Green)
    };

    // Set default start and end times for the selected date in GMT
    const startTime = moment.utc(data.dataPoints[0].value[0]).startOf('day').add(8, 'hours');
    const endTime = moment.utc(startTime).add(10, 'hours'); // 8 AM to 6 PM

    console.log('GMT Start time:', startTime.format('YYYY-MM-DD HH:mm:ss'));
    console.log('GMT End time:', endTime.format('YYYY-MM-DD HH:mm:ss'));

    // Transform data for Highcharts
    const transformedData = [];
    let currentTime = startTime.valueOf();

    // Add initial OFF state if needed
    if (data.dataPoints[0] && moment.utc(data.dataPoints[0].value[0]).valueOf() > currentTime) {
      transformedData.push({
        x: currentTime,
        x2: moment.utc(data.dataPoints[0].value[0]).valueOf(),
        y: 0,
        name: 'OFF',
        color: stateColors['OFF'],
        status: 'OFF'
      });
    }

    // Add actual data points
    data.dataPoints.forEach((point, index) => {
      const startPoint = moment.utc(point.value[0]).valueOf();
      const endPoint = moment.utc(point.value[1]).valueOf();

      // Fill gap with OFF state if there's a gap
      if (currentTime < startPoint) {
        transformedData.push({
          x: currentTime,
          x2: startPoint,
          y: 0,
          name: 'OFF',
          color: stateColors['OFF'],
          status: 'OFF'
        });
      }

      // Add the actual status
      transformedData.push({
        x: startPoint,
        x2: endPoint,
        y: 0,
        name: point.name,
        color: stateColors[point.name],
        status: point.name
      });

      currentTime = endPoint;
    });

    // Fill remaining time with OFF state if needed, but only up to current time
    const maxTime = Math.min(endTime.valueOf(), currentTime);
    if (currentTime < maxTime) {
      transformedData.push({
        x: currentTime,
        x2: maxTime,
        y: 0,
        name: 'OFF',
        color: stateColors['OFF'],
        status: 'OFF'
      });
    }

    console.log('Transformed Data:', transformedData); // Debug log

    return {
      chart: {
        type: 'xrange',
        height: 300,
        zoomType: 'x',
        backgroundColor: '#ffffff',
        spacing: [40, 20, 40, 20],
        style: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial'
        }
      },
      title: {
        text: 'Machine Production Timeline',
        style: { 
          fontSize: '20px', 
          fontWeight: 'bold',
          color: '#2c6e49'
        },
        margin: 30
      },
      xAxis: {
        type: 'datetime',
        labels: {
          format: '{value:%H:%M}',
          formatter: function() {
            return moment.utc(this.value)
              .format('HH:mm');
          },
          style: { 
            fontSize: '14px',
            fontWeight: '500'
          }
        },
        min: startTime.valueOf(),
        max: endTime.valueOf(),
        tickInterval: 1800 * 1000,
        gridLineWidth: 1,
        gridLineColor: '#E5E5E5',
        lineColor: '#E5E5E5',
        tickColor: '#E5E5E5',
        crosshair: {
          color: '#2c6e49',
          dashStyle: 'Dash'
        }
      },
      yAxis: {
        title: { text: '' },
        categories: [selectedMachine],
        reversed: true,
        labels: {
          style: { 
            fontSize: '16px',
            fontWeight: '500',
            color: '#2c6e49'
          }
        },
        gridLineColor: '#E5E5E5'
      },
      tooltip: {
        useHTML: true,
        formatter: function() {
          const startTime = moment.utc(this.x);
          const endTime = moment.utc(this.x2);
          const duration = moment.duration(endTime.diff(startTime));
          const hours = Math.floor(duration.asHours());
          const minutes = Math.floor(duration.asMinutes()) % 60;
          
          return `
            <div style="padding: 12px; background-color: rgba(255, 255, 255, 0.98); 
                        border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.1)">
              <div style="font-weight: bold; font-size: 15px; margin-bottom: 8px; 
                          color: ${this.color}">
                ${this.point.name}
              </div>

              <div style="font-size: 13px; color: #666;">
                <div style="margin: 4px 0">Start: ${startTime.format('HH:mm:ss')} (GMT)</div>
                <div style="margin: 4px 0">End: ${endTime.format('HH:mm:ss')} (GMT)</div>
                <div style="margin: 4px 0">Duration: ${hours}h ${minutes}m</div>
              </div>
            </div>
          `;
        }
      },
      plotOptions: {
        xrange: {
          borderRadius: 5,
          pointPadding: 0.2,
          groupPadding: 0,
          borderWidth: 0,
          pointWidth: 100,
          dataLabels: {
            enabled: false
          }
        }
      },
      legend: {
        enabled: false
      },
      series: [{
        name: 'Machine Status',
        data: transformedData,
        states: {
          hover: {
            brightness: 0.1,
            transition: {
              duration: 150
            }
          }
        }
      }],
      credits: {
        enabled: false
      }
    };
  };

  const handleSubmit = async () => {
    if (!selectedMachine || !startDate) {
      message.warning('Please select both machine and date');
      return;
    }

    try {
      // Get machine ID from the machines array
      const machine = machines.find(m => m.machine_name === selectedMachine);
      if (!machine) {
        message.error('Machine not found');
        return;
      }

      const machineId = machine.id;
      const formattedDate = startDate.format('YYYY-MM-DD');

      console.log('Selected Machine:', machine);
      console.log('Machine ID:', machineId);
      console.log('Formatted Date:', formattedDate);

      if (!machineId) {
        message.error('Invalid machine ID');
        return;
      }

      // Construct the URL using the API endpoint
      const url = `${API_ENDPOINTS.PROD_GRAPH}?date=${formattedDate}&machine_id=${machineId}`;
      console.log('Fetching data from:', url);

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Server Error:', errorData);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received Data:', data);

      const transformedData = transformData(data);
      if (transformedData) {
        setProductionData(transformedData);
      } else {
        message.info('No production data available for the selected date');
      }
    } catch (error) {
      message.error(`Error fetching production data: ${error.message}`);
      console.error('Error:', error);
    }
  };

  return (
    <Layout className="min-h-screen">
      <Navbar />
      <Content
       
      >
        <Card
          
        >
          {/* Title Section */}
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <Title
              level={2}
              style={{
                color: '#2c6e49',
                fontSize: '28px'
              }}
            >
              Machine Production Status
            </Title>
            
          </div>

          {/* Controls Section */}
          <Card
            style={{
              marginBottom: '24px',
              borderRadius: '16px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e9ecef'
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '24px',
                flexWrap: 'wrap',
                alignItems: 'flex-end'
              }}
            >
              <div style={{ flex: '1 1 250px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#2c6e49',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}
                >
                  Select Machine
                </label>
                <Select
                  placeholder="Choose a machine"
                  style={{ width: '100%' }}
                  onChange={handleMachineChange}
                  value={selectedMachine}
                  size="large"
                  dropdownStyle={{ borderRadius: '8px' }}
                >
                  {machines.map(machine => (
                    <Select.Option 
                      key={machine.id}
                      value={machine.machine_name}
                    >
                      {machine.machine_name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div style={{ flex: '1 1 250px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#2c6e49',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}
                >
                  Select Date
                </label>
                <DatePicker
                  style={{ width: '100%' }}
                  onChange={handleDateChange}
                  size="large"
                  format="DD-MM-YYYY"
                  defaultValue={moment()}
                  placeholder="Select date"
                />
              </div>

              <div style={{ flex: '0 0 auto' }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSubmit}
                  style={{
                    backgroundColor: '#2c6e49',
                    height: '44px',
                    fontSize: '15px',
                    fontWeight: '500',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0 32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  icon={<ReloadOutlined />}
                >
                  Load Data
                </Button>
              </div>
            </div>
          </Card>

          {/* Chart Section */}
          <Card
            style={{
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1px solid #e9ecef',
              minHeight: '400px',
              width: '100%'
            }}
          >
            {productionData ? (
              <div style={{ height: '350px', width: '100%' }}>
                <div
                  style={{
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    {/* Machine and Date Info */}
                    <div>
                      <Typography.Text
                        strong
                        style={{
                          fontSize: '16px',
                          color: '#2c6e49'
                        }}
                      >
                        Machine: {selectedMachine}
                      </Typography.Text>
                      <Typography.Text
                        style={{
                          marginLeft: '16px',
                          color: '#666'
                        }}
                      >
                        Date: {startDate?.format('DD MMM, YYYY')}
                      </Typography.Text>
                    </div>

                    {/* Status Legend */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      {[
                        { status: 'OFF', color: '#4A4A4A' },
                        { status: 'ON', color: '#DAA520' },
                        { status: 'PRODUCTION', color: '#228B22' }
                      ].map(({ status, color }) => (
                        <div
                          key={status}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '3px',
                              backgroundColor: color
                            }}
                          />
                          <Typography.Text
                            style={{
                              fontSize: '14px',
                              color: '#666'
                            }}
                          >
                            {status}
                          </Typography.Text>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <HighchartsReact
                  highcharts={Highcharts}
                  options={getChartOptions(productionData, selectedMachine)}
                  ref={chartRef}
                />
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '400px'
                }}
              >
                <Spin size="large" tip="Loading production data..." />
              </div>
            )}
          </Card>
        </Card>
      </Content>
    </Layout>
  );
};

export default Production;