// ProductionTimeline.jsx
import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsXRange from 'highcharts/modules/xrange';
import moment from 'moment';

// Initialize xrange module
if (typeof Highcharts === 'object') {
  HighchartsXRange(Highcharts);
}

const ProductionTimeline = ({ productionData, date, machines }) => {
  const getProductionTimelineOptions = (productionData) => {
    if (!productionData?.dataPoints || productionData.dataPoints.length === 0) {
      return {};
    }

    // Convert the large timestamps to correct epoch timestamps
    const normalizeTimestamp = (timestamp) => {
      // Convert to proper epoch timestamp by adjusting the base
      return Number(timestamp) - 1734600000000 + new Date(date).getTime();
    };

    // Set time range from 8 AM current day to 8 AM next day
    const baseDate = moment(date).startOf('day');
    const startTime = baseDate.clone().set({ hour: 8, minute: 0, second: 0 });
    const endTime = baseDate.clone().add(1, 'day').set({ hour: 8, minute: 0, second: 0 });

    // Get machine names for the specific IDs in the order you want
    const machineIds = [5, 4, 3, 2, 1, 7, 6];
    const machineCategories = machineIds.map(id => {
      const machine = machines.find(m => Number(m.id) === Number(id));
      return machine ? machine.machine_name : `Machine ${id}`;
    });

    // Initialize timelines for each machine
    const machineTimelines = {};
    machineIds.forEach((_, index) => {
      machineTimelines[index] = [];
    });

    // Process and normalize the data points
    const processedPoints = productionData.dataPoints.map(point => ({
      ...point,
      value: [
        normalizeTimestamp(point.value[0]),
        normalizeTimestamp(point.value[1])
      ]
    }));

    // Sort and filter the data points
    const sortedPoints = processedPoints
      .filter(point => {
        const pointStart = moment(point.value[0]);
        const pointEnd = moment(point.value[1]);
        return pointStart.valueOf() >= startTime.valueOf() &&
               pointEnd.valueOf() <= endTime.valueOf();
      })
      .sort((a, b) => a.value[0] - b.value[0]);

    // Fill the timeline with status data
    sortedPoints.forEach(point => {
      const machineIndex = machineIds.indexOf(point.machine_id);
      if (machineIndex === -1) return;

      const timeline = machineTimelines[machineIndex];
      const pointStart = moment(point.value[0]);
      const pointEnd = moment(point.value[1]);

      // If this is not the first point and there's a gap, add OFF status
      if (timeline.length > 0) {
        const lastPoint = timeline[timeline.length - 1];
        if (moment(lastPoint.x2).valueOf() < pointStart.valueOf()) {
          timeline.push({
            x: moment(lastPoint.x2).valueOf(),
            x2: pointStart.valueOf(),
            y: machineIndex,
            status: 'OFF',
            color: '#808080'
          });
        }
      } else if (pointStart.valueOf() > startTime.valueOf()) {
        // Add OFF status from start time to first point
        timeline.push({
          x: startTime.valueOf(),
          x2: pointStart.valueOf(),
          y: machineIndex,
          status: 'OFF',
          color: '#808080'
        });
      }

      // Add the actual point
      timeline.push({
        x: Math.max(pointStart.valueOf(), startTime.valueOf()),
        x2: pointEnd.valueOf(),
        y: machineIndex,
        status: point.name,
        color: point.name === 'PRODUCTION' ? '#006400' : 
               point.name === 'ON' ? '#FF8C00' : '#808080'
      });
    });

    // Fill remaining gaps until end time
    Object.keys(machineTimelines).forEach(machineIndex => {
      const timeline = machineTimelines[machineIndex];
      if (timeline.length === 0) {
        timeline.push({
          x: startTime.valueOf(),
          x2: endTime.valueOf(),
          y: Number(machineIndex),
          status: 'OFF',
          color: '#808080'
        });
      } else {
        const lastPoint = timeline[timeline.length - 1];
        if (moment(lastPoint.x2).valueOf() < endTime.valueOf()) {
          timeline.push({
            x: moment(lastPoint.x2).valueOf(),
            x2: endTime.valueOf(),
            y: Number(machineIndex),
            status: 'OFF',
            color: '#808080'
          });
        }
      }
    });

    // Flatten all timelines into a single array
    const allPoints = Object.values(machineTimelines).flat();

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
          }
        },
        tickInterval: 3600 * 1000,
        gridLineWidth: 1,
        crosshair: true,
        title: {
          text: 'Time (8:00 AM - 8:00 AM)',
          style: {
            fontSize: '12px',
            fontWeight: 'bold'
          }
        }
      },
      yAxis: {
        title: {
          text: ''
        },
        categories: machineCategories,
        reversed: false,
        labels: {
          style: {
            fontSize: '11px',
            fontFamily: 'Arial',
            fontWeight: '500'
          },
          padding: 4
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
        borderRadius: 2
      }]
    };
  };

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <HighchartsReact
        highcharts={Highcharts}
        options={getProductionTimelineOptions(productionData)}
      />
    </div>
  );
};

export default ProductionTimeline;