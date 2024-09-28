import React, { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { format, subWeeks, addWeeks, subDays, addDays, startOfWeek, endOfWeek } from 'date-fns'; // Import date manipulation functions
import './VisitsChart.scss';
import Stats from '../../../assets/Icons/Stats.svg';
import Switch from '../../Switch/Switch';
import RightArrow from '../../../assets/Icons/RightArrow.svg';

// Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, // For filling under the line
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const VisitsChart = () => {
  const [chartData, setChartData] = useState({});
  const [viewMode, setViewMode] = useState('day'); // 'day' or 'hour'
  const [startDate, setStartDate] = useState(new Date()); // Track current start date
  const chartRef = useRef(null);

  // Function to move time range backward
  const handlePrev = () => {
    if (viewMode === 'day') {
      setStartDate((prev) => subWeeks(prev, 1)); // Go back 1 week
    } else if (viewMode === 'hour') {
      setStartDate((prev) => subDays(prev, 1)); // Go back 1 day
    }
  };

  // Function to move time range forward
  const handleNext = () => {
    if (viewMode === 'day') {
      setStartDate((prev) => addWeeks(prev, 1)); // Go forward 1 week
    } else if (viewMode === 'hour') {
      setStartDate((prev) => addDays(prev, 1)); // Go forward 1 day
    }
  };

  // Create gradient on canvas after rendering
  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      const ctx = chart.ctx;
      const gradient = ctx.createLinearGradient(0, 0, 0, 250); // Customize start/end points of the gradient
      gradient.addColorStop(0, 'rgba(69, 161, 252, 0.8)');
      gradient.addColorStop(1, 'rgba(69, 161, 252, 0)');

      // Apply gradient to the chart
      chart.data.datasets[0].backgroundColor = gradient;
      chart.update();
    }
  }, [chartData]);

  // Function to fetch visit data based on mode (day or hour)
  const fetchVisitData = async (mode, startDate) => {
    const endDate = mode === 'day' ? addWeeks(startDate, 1) : addDays(startDate, 1); // Set the end date depending on the mode
    try {
      const response = await axios.get(`/visits-by-${mode}`, {
        params: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
        },
      });
      if (response.status === 200) {
        const data = response.data;
        //add a day to each date
        console.log(data);
        const labels = data.map(item => {
          if (mode === 'day') {
            const date = addDays(new Date(item.date + 'T00:00:00Z'),1); // Adds UTC timezone to avoid shifting
            return format(date, 'MMM dd'); // Format date nicely
          } else {
            return format(new Date(item.hour), 'H:mm'); // Format hour nicely
          }
        });
        const counts = data.map(item => item.count);
        setChartData({
          labels,
          datasets: [
            {
                data: counts,
                fill: true, // Enable fill under the line
                backgroundColor: 'rgba(75, 192, 192, 0.2)', // Light color under the line
                borderColor: 'rgba(69, 161, 252, 0.8)', // Line color
                pointBackgroundColor: 'rgba(69, 161, 252, 1)', // Point color
                pointBorderColor: '#fff', // White border for points
                tension: 0.3, // For smoother line curves
                borderWidth: 4,
                pointRadius: 0, // Hide points by default
                pointHoverRadius: 6, // Show points on hover
                hitRadius: 20,
                
            },
          ],
        });
      }
    } catch (err) {
      console.error('Error fetching visit data', err);
    }
  };

  // Fetch data when component mounts, when viewMode or startDate changes
  useEffect(() => {
    fetchVisitData(viewMode, startDate);
  }, [viewMode, startDate]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode === 0 ? 'day' : 'hour');
    setStartDate(new Date()); // Reset start date when changing view mode
  };

  return (
    <div className="visit-chart">
        <div className="header">
            <div className="header-content">
                <img src={Stats} alt="Stats" />
                <h2>Unique Visits</h2>
            </div>
            <Switch options={["week","day"]} onChange={handleViewModeChange}/>
        </div>
      <div className="row">
            <h3>
                {/* total visits daily or weekly */}
                {chartData.datasets ? chartData.datasets[0].data.reduce((a, b) => a + b, 0) : 0} visits
            </h3>
        </div>
      <div className="chart-container">

      {chartData.labels ? (
        <Line
          ref={chartRef}
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
                position: 'top',
                labels: {
                  color: '#333',
                  font: {
                    size: 14,
                  },
                },
              },
              tooltip: {
                enabled: true, // Ensure the tooltip is enabled
                backgroundColor: 'white', // Background color of the tooltip
                titleColor: '#414141', // Color of the tooltip title
                bodyColor: '#414141', // Color of the tooltip body text
                borderColor: 'white', // Border color around the tooltip
                borderWidth: 2, // Border width
                padding: 10, // Padding inside the tooltip
                cornerRadius: 5, // Rounds the corners of the tooltip
                caretSize: 0,
                displayColors: false, // Disables the color box next to each label in the tooltip
                titleFont: {
                  family: 'Inter', // Font family for the title
                  size: 16, // Font size for the title
                  weight: 'bold', // Font weight for the title
                },
                bodyFont: {
                  family: 'Inter', // Font family for the body text
                  size: 14, // Font size for the body text
                },
                callbacks: {
                  label: function (context) {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    label += context.raw !== null ? context.raw : '';
                    return label;
                  },
                },
              },
              title: {
                display: false,
                text: `Visits by ${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}`,
                color: '#333',
                font: {
                  size: 18,
                },
              },
            },
            scales: {
              x: {
                grid:{
                    drawBorder: false,
                    display: true,
                    color: '#ffffff',
                },
                border:{
                    display: false,
                },
                title: {
                  display: false,
                  text: viewMode === 'day' ? 'Date' : 'Hour',
                  color: '#333',
                  font: {
                    size: 11,
                    family: 'Inter',
                    weight: 'normal',
                  },
                },
                ticks: {
                  color: '#666',
                  font: {
                    size: 11,
                    family: 'Inter',
                    weight: 'normal',
                  },
                },
              },
              y: {
                grid:{
                    display: true,
                    drawBorder: false,
                },
                border:{
                    display: false,
                },
                title: {
                  display: false,
                  color: '#333',
                  font: {
                    size: 14,
                  },
                },
                ticks: {
                  color: '#666',
                  font: {
                    size: 11,
                    family: 'Inter',
                    weight: 'normal',
                
                  },
                },
                beginAtZero: true,
              },
            },
          }}
        />
      ) : (
        <p>Loading chart...</p>
      )}
      </div>
      <div className="dates">
        <button onClick={handlePrev} className="left-button">
          <img src={RightArrow} alt="" />
        </button>
        <h3>
        {viewMode === 'day'
        ? `${format(startOfWeek(startDate, { weekStartsOn: 0 }), 'MMM dd')} - ${format(endOfWeek(startDate, { weekStartsOn: 0 }), 'MMM dd')}`
        : `${format(startDate, 'MMM dd')}`}
      </h3>
        <button onClick={handleNext}>
          <img src={RightArrow} alt="" />
        </button>
      </div>
    </div>
  );
};

export default VisitsChart;
