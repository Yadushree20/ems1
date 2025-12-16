import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Spin, message } from 'antd';
import moment from 'moment';
import { API_ENDPOINTS } from './apiEndpoints';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function DownloadReport() {
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date');

  useEffect(() => {
    const fetchAndGenerateReport = async () => {
      try {
        // Fetch the report data using the same endpoints as Report.jsx
        const shiftUrl = `${API_ENDPOINTS.SHIFT_LIVE_HISTORY}?date=${moment(date).format('YYYY-MM-DD')}`;
        const shiftResponse = await fetch(shiftUrl);
        const shiftData = await shiftResponse.json();

        // Fetch other necessary data...
        // (You'll need to fetch all the data that your report needs)

        // Generate PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Add content to PDF
        pdf.setFontSize(16);
        pdf.text('Workshop Report', 105, 20, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text(`Date: ${moment(date).format('MMMM D, YYYY')}`, 20, 30);

        // Add your report content here...
        // You might want to create a similar layout to your Report component

        // Save the PDF
        pdf.save(`Workshop_Report_${moment(date).format('YYYY-MM-DD')}.pdf`);

        // Close the window after download (optional)
        setTimeout(() => {
          window.close();
        }, 1000);

      } catch (error) {
        console.error('Error generating report:', error);
        message.error('Failed to generate report');
      }
    };

    if (date) {
      fetchAndGenerateReport();
    }
  }, [date]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <Spin size="large" />
        <p className="mt-4 text-gray-600">Generating your report...</p>
        <p className="text-sm text-gray-400">This may take a few moments</p>
      </div>
    </div>
  );
}

export default DownloadReport;
