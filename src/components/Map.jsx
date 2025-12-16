// src/Map.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { ArrowLeftOutlined, ToolOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import Navbar from './Navbar';

const { Header, Content } = Layout;
const { Title } = Typography;

function Map() {
  const chartRef = useRef(null); // Reference for the chart container
  const chartInstance = useRef(null); // Store the chart instance
  const navigate = useNavigate();
  const [energyData, setEnergyData] = useState(0); // Add state for energy data

  // Add new useEffect for data fetching
  useEffect(() => {
    const fetchEnergyData = async () => {
      try {
        const response = await fetch('http://172.18.7.91:9900/energy_summary/');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setEnergyData(data.total_energy);
      } catch (error) {
        console.error('Error fetching energy data:', error);
      }
    };

    // Initial fetch
    fetchEnergyData();

    // Set up polling interval (e.g., every 5 seconds)
    const interval = setInterval(fetchEnergyData, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Initialize the chart once on component mount
  useEffect(() => {
    if (chartRef.current && !chartInstance.current) {
      const chartDom = chartRef.current;
      chartInstance.current = echarts.init(chartDom);
      
      // Initial chart setup
      const option = {
        tooltip: {
          formatter: '{a} <br/>{b} : {c}kWh',
        },
        series: [
          {
            name: 'Energy Usage',
            type: 'gauge',
            progress: {
              show: true,
            },
            detail: {
              valueAnimation: true,
              formatter: '{value}kWh',
              fontSize: 20,
            },
            data: [
              {
                value: 0, // Start from 0
                name: 'Total Energy',
              },
            ],
            min: 0,
            max: 100, // Default max, will be updated
          },
        ],
      };
      
      chartInstance.current.setOption(option);
      
      // Handle window resize
      const handleResize = () => chartInstance.current?.resize();
      window.addEventListener('resize', handleResize);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        chartInstance.current?.dispose();
        chartInstance.current = null;
      };
    }
  }, []);
  
  // Update chart data when energyData changes
  useEffect(() => {
    if (chartInstance.current) {
      const newMax = energyData > 50 ? energyData + 10 : 50;
      
      chartInstance.current.setOption({
        series: [
          {
            data: [{ value: energyData, name: 'Total Energy' }],
            max: newMax,
          },
        ],
      });
    }
  }, [energyData]);

  return (
    <Layout className="min-h-screen bg-gray-100">
      <Navbar/>
     

      <Content
        style={{
          padding: '50px',
          display: 'flex',
          flexDirection: 'column',  // Changed to column to stack title and content
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Title level={2} style={{ marginBottom: '20px' }}>Map and Energy</Title>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '80%',
            height: '500px',
            backgroundColor: '#fff',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            padding: '20px',
          }}
        >
          {/* Google Maps iframe on the left */}
          <div
            style={{
              width: '50%',
              height: '100%',
              padding: '20px',
            }}
          >
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d762.2954751546745!2d77.53543155300461!3d13.032600665699475!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae142984e5cddb%3A0x9ecd3a5ee583fb59!2sCentral%20Manufacturing%20Technology%20Institute!5e1!3m2!1sen!2sin!4v1710131206211!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="eager"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Chart container on the right */}
          <div
            ref={chartRef}
            style={{
              width: '45%',
              height: '100%',
              backgroundColor: '#fff',
            }}
          />
        </div>
      </Content>
    </Layout>
  );
}

export default Map;
