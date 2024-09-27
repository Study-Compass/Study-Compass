import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { format } from 'date-fns';
import './VisitsChart.scss';

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

  // Function to fetch visit data based on mode (day or hour)
  const fetchVisitData = async (mode) => {
    try {
      const response = await axios.get(`/visits-by-${mode}`);
      if (response.status === 200) {
        const data = response.data;
        const labels = data.map(item => {
          if (mode === 'day') {
            return format(new Date(item.date), 'MMM dd, yyyy'); // Format date nicely
          } else {
            return format(new Date(item.hour), 'MMM dd, yyyy HH:mm'); // Format hour nicely
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
              borderColor: 'rgba(75, 192, 192, 1)', // Line color
              pointBackgroundColor: 'rgba(75, 192, 192, 1)', // Point color
              pointBorderColor: '#fff', // White border for points
              tension: 0.3, // For smoother line curves
              borderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6, // Larger point when hovered
            },
          ],
        });
      }
    } catch (err) {
      console.error('Error fetching visit data', err);
    }
  };

  // Fetch data when component mounts and when viewMode changes
  useEffect(() => {
    fetchVisitData(viewMode);
  }, [viewMode]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  return (
    <div className="visit-chart">
      <h2>Visit Analytics</h2>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => handleViewModeChange('day')}
          style={{
            padding: '10px 15px',
            marginRight: '10px',
            backgroundColor: viewMode === 'day' ? '#4bc0c0' : '#ccc',
            color: viewMode === 'day' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          View by Day
        </button>
        <button
          onClick={() => handleViewModeChange('hour')}
          style={{
            padding: '10px 15px',
            backgroundColor: viewMode === 'hour' ? '#4bc0c0' : '#ccc',
            color: viewMode === 'hour' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          View by Hour
        </button>
      </div>
      {chartData.labels ? (
        <Line
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  color: '#333',
                  font: {
                    size: 14,
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
                title: {
                  display: true,
                  text: viewMode === 'day' ? 'Date' : 'Hour',
                  color: '#333',
                  font: {
                    size: 14,
                  },
                },
                ticks: {
                  color: '#666',
                },
              },
              y: {
                title: {
                  display: false,
                  color: '#333',
                  font: {
                    size: 14,
                  },
                },
                ticks: {
                  color: '#666',
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
  );
};

export default VisitsChart;