import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Typography, Spin, message } from 'antd';
import moment from 'moment';
import ReactECharts from 'echarts-for-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const { Content } = Layout;
const { Title, Text } = Typography;

function ReportView() {
  const { encodedData } = useParams();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    try {
      // Decode the base64 encoded data
      const decodedData = JSON.parse(atob(encodedData));
      setReportData(decodedData);
      setLoading(false);
    } catch (error) {
      console.error('Error decoding report data:', error);
      message.error('Failed to load report data');
      setLoading(false);
    }
  }, [encodedData]);

  if (loading) {
    return (
      <Layout className="min-h-screen bg-gray-50">
        <Content className="p-8 flex justify-center items-center">
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  if (!reportData) {
    return (
      <Layout className="min-h-screen bg-gray-50">
        <Content className="p-8">
          <div className="text-center">
            <Title level={3}>Report Not Found</Title>
            <Text>The requested report could not be loaded.</Text>
          </div>
        </Content>
      </Layout>
    );
  }

  const { date, shiftData, costData, dailyEnergyData, productionData } = reportData;

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <Title level={2}>Energy Consumption Report</Title>
            <Text className="text-lg">{moment(date).format('MMMM D, YYYY')}</Text>
          </div>

          {/* Summary Section */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <Title level={4}>Total Energy Usage</Title>
              <Text className="text-2xl">
                {shiftData?.reduce((acc, curr) => acc + (Number(curr.total_energy) || 0), 0).toFixed(2)} kWh
              </Text>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <Title level={4}>Total Cost</Title>
              <Text className="text-2xl">
                ₹{shiftData?.reduce((acc, curr) => acc + (Number(curr.total_cost) || 0), 0).toFixed(2)}
              </Text>
            </div>
          </div>

          {/* Machine-wise Data */}
          <div className="mb-8">
            <Title level={3}>Machine-wise Consumption</Title>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left">Machine</th>
                    <th className="p-3 text-right">Energy (kWh)</th>
                    <th className="p-3 text-right">Cost (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {shiftData?.map((machine, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="p-3">{machine.machine_name}</td>
                      <td className="p-3 text-right">{Number(machine.total_energy).toFixed(2)}</td>
                      <td className="p-3 text-right">{Number(machine.total_cost).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekly Cost Summary */}
          <div className="mb-8">
            <Title level={3}>Cost Summary</Title>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <Text strong>Weekly Cost:</Text>
                <div className="text-xl">₹{costData?.total_weekly_cost?.toFixed(2) || '0.00'}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <Text strong>Monthly Cost:</Text>
                <div className="text-xl">₹{costData?.total_monthly_cost?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
          </div>

          {/* Production Status */}
          <div className="mb-8">
            <Title level={3}>Production Status</Title>
            <div className="grid grid-cols-3 gap-4">
              {['PRODUCTION', 'ON', 'OFF'].map(status => {
                const count = productionData?.dataPoints?.filter(point => point.name === status).length || 0;
                return (
                  <div key={status} className="p-4 border rounded-lg text-center">
                    <Text strong>{status}</Text>
                    <div className="text-xl">{count} instances</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center text-gray-500 text-sm mt-8">
            <Text>Report generated on {moment().format('MMMM D, YYYY, h:mm A')}</Text>
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default ReportView; 