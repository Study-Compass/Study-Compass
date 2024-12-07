import React, { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { format, subWeeks, addWeeks, subDays, addDays, startOfWeek, endOfWeek } from 'date-fns'; // Import date manipulation functions
import './AnalyticsChart.scss';
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

const AnalyticsChart = ({endpoint, heading, color}) => {
    const [chartData, setChartData] = useState({});
    const [viewMode, setViewMode] = useState('day'); // 'day', 'hour', or 'all'
    const [startDate, setStartDate] = useState(new Date()); // Track current start date
    const chartRef = useRef(null);
  
    function hexToRgb(hex) {
      // Remove the hash symbol if it's there
      hex = hex.replace(/^#/, '');
    
      // If the hex code is in shorthand form (3 digits), convert to 6 digits
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }
    
      // Parse the hex string into RGB components
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
    
      return { r, g, b };
    }

    let { r, g, b } = hexToRgb(color);

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
      useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      const ctx = chart.ctx;
      const gradient = ctx.createLinearGradient(0, 0, 0, 250); // Customize start/end points of the gradient
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      // Apply gradient to the chart
      chart.data.datasets[0].backgroundColor = gradient;
      chart.update();
    }
  }, [chartData]);
  
    // Fetch visit data based on mode (day, hour, all)
    const fetchVisitData = async (mode, startDate) => {
      let endDate;
      if (mode === 'day') {
        endDate = addWeeks(startDate, 1);
      } else if (mode === 'hour') {
        endDate = addDays(startDate, 1);
      }
  
      const params = mode === 'all' ? {} : {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      };
  
      try {
        const response = await axios.get(`/${endpoint}-by-${mode}`, { params });
        if (response.status === 200) {
          const data = response.data;
          const labels = data.map(item => {
            if (mode === 'day') {
              const date = addDays(new Date(item.date + 'T00:00:00Z'), 1);
              return format(date, 'MMM dd');
            } else if (mode === 'hour') {
              return format(new Date(item.hour), 'H:mm');
            } else {
              return format(new Date(item.date), 'MMM dd yyyy');
            }
          });
          const counts = data.map(item => item.count);
          setChartData({
            labels,
            datasets: [
              {
                  data: counts,
                  fill: true,
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  borderColor: `rgba(${r}, ${g}, ${b}, 0.8)`,
                  pointBackgroundColor: `rgba(${r}, ${g}, ${b}, 1)`,
                  pointBorderColor: '#fff',
                  tension: 0.3,
                  borderWidth: 4,
                  pointRadius: 0,
                  pointHoverRadius: 6,
                  hitRadius: 20,
              },
            ],
          });
        }
      } catch (err) {
        console.error('Error fetching visit data', err);
      }
    };
  
    // Fetch data when component mounts or viewMode/startDate changes
    useEffect(() => {
      fetchVisitData(viewMode, startDate);
    }, [viewMode, startDate]);
  
    const handleViewModeChange = (mode) => {
      const newMode = mode === 0 ? 'day' : mode === 1 ? 'hour' : 'all';
      setViewMode(newMode);
      if (newMode !== 'all') {
        setStartDate(new Date()); // Reset start date when changing view mode
      }
    };
  
    return (
      <div className="visit-chart">
          <div className="header">
              <div className="header-content">
                  <img src={Stats} alt="Stats" />
                  <h2>{heading}</h2>
              </div>
              <Switch options={["week", "day", "all"]} onChange={handleViewModeChange} selectedPass={0} setSelectedPass={console.log}/>
          </div>
          <div className="row">
              <h3>{chartData.datasets ? chartData.datasets[0].data.reduce((a, b) => a + b, 0) : 0} {endpoint}</h3>
          </div>
          <div className="chart-container">
            {chartData.labels ? (
              <Line
                ref={chartRef}
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
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
                  }, // Your scale options here
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
                  }, // Your plugin options here
                }}
              />
            ) : <p>Loading chart...</p>}
          </div>
          {viewMode !== 'all' && (
            <div className="dates">
              <button onClick={handlePrev} className="left-button"><img src={RightArrow} alt="" /></button>
              <h3>
                {viewMode === 'day'
                  ? `${format(startOfWeek(startDate, { weekStartsOn: 0 }), 'MMM dd')} - ${format(endOfWeek(startDate, { weekStartsOn: 0 }), 'MMM dd')}`
                  : `${format(startDate, 'MMM dd')}`}
              </h3>
              <button onClick={handleNext}><img src={RightArrow} alt="" /></button>
            </div>
          )}
      </div>
    );
  };
  
  

export default AnalyticsChart;
