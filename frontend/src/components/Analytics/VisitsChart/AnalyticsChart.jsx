import React, { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { format, addWeeks, addDays } from 'date-fns'; // Import date manipulation functions
import './AnalyticsChart.scss';
import Stats from '../../../assets/Icons/Stats.svg';
// removed per-chart date navigation

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
  Decimation,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  Decimation
);

const AnalyticsChart = ({endpoint, heading, color, externalViewMode, externalStartDate, externalCumulative}) => {
    const [chartData, setChartData] = useState({});
    const [totalCount, setTotalCount] = useState(0);
    const [viewMode, setViewMode] = useState(externalViewMode || 'month'); // 'month'|'week'|'day'|'all'
    const [startDate, setStartDate] = useState(externalStartDate || new Date());
    // cumulative controlled globally
    const [lastRoute, setLastRoute] = useState('day');
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

    // Per-chart date navigation removed; global controls manage range
      useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      const ctx = chart.ctx;
      const gradient = ctx.createLinearGradient(0, 0, 0, 190); // Customize start/end points of the gradient
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      // Apply gradient to the chart
      chart.data.datasets[0].backgroundColor = gradient;
      chart.update();
    }
  }, [chartData]);
  
    // Fetch data based on viewMode
    const fetchVisitData = async (mode, anchorDate) => {
      let endDate;
      let routeSuffix;
      if (mode === 'all') {
        routeSuffix = 'all';
      } else if (mode === 'month' || mode === 'week') {
        // both use -by-day
        routeSuffix = 'day';
        endDate = mode === 'month' ? addWeeks(anchorDate, 4) : addWeeks(anchorDate, 1);
      } else {
        // day view uses -by-hour
        routeSuffix = 'hour';
        endDate = addDays(anchorDate, 1);
      }

      const params = routeSuffix === 'all' ? {} : {
        startDate: format(anchorDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      };

      try {
        const response = await axios.get(`/${endpoint}-by-${routeSuffix}`, { params });
        if (response.status === 200) {
          const data = response.data;
          const labels = data.map(item => {
            if (routeSuffix === 'day') {
              const date = addDays(new Date(item.date + 'T00:00:00Z'), 1);
              return format(date, 'MMM dd');
            } else {
              if (routeSuffix === 'hour') {
                return format(new Date(item.hour), 'H:mm');
              }
              // all
              const date = addDays(new Date(item.date + 'T00:00:00Z'), 1);
              return format(date, 'MMM yyyy');
            }
          });
          const rawCounts = data.map(item => item.count);
          setTotalCount(rawCounts.reduce((a, b) => a + b, 0));
          let counts = rawCounts.slice();
          if (externalCumulative && counts.length) {
            let running = 0;
            counts = counts.map((v) => (running += v));
          }
          setChartData({
            labels,
            datasets: [
              {
                  data: counts,
                  fill: true,
                  backgroundColor: 'transparent',
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
          setLastRoute(routeSuffix);
        }
      } catch (err) {
        console.error('Error fetching visit data', err);
      }
    };
  
    // Fetch data when component mounts or dependencies change
    useEffect(() => {
      const vm = externalViewMode || viewMode;
      const sd = externalStartDate || startDate;
      setViewMode(vm);
      setStartDate(sd);
      fetchVisitData(vm, sd);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [externalViewMode, externalStartDate, externalCumulative, viewMode, startDate]);
  
    // View mode is controlled externally via DateRangeControls
  
    return (
      <div className="visit-chart">
          <div className="header">
              <div className="header-content">
                  <img src={Stats} alt="Stats" />
                  <h2>{heading}</h2>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }} />
          </div>
          <div className="row">
              <h3>{totalCount} {endpoint}</h3>
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
                          autoSkip: true,
                          maxTicksLimit: lastRoute === 'all' ? 8 : 12,
                          callback: function(value, index, ticks) {
                            const total = chartData.labels ? chartData.labels.length : 0;
                            if (lastRoute === 'all' && total > 0) {
                              const step = Math.ceil(total / 8);
                              return index % step === 0 ? this.getLabelForValue(value) : '';
                            }
                            return this.getLabelForValue(value);
                          },
                          font: {
                            size: 11,
                            family: 'Inter',
                            weight: 'normal',
                          },
                        },
                      },
                      y: {
                        grid:{
                            display: false,
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
                          autoSkip: true,
                          maxTicksLimit: 6,
                          padding: 4,
                          callback: function(value) {
                            try {
                              return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
                            } catch (e) {
                              // Fallback
                              if (value >= 1_000_000) return (value/1_000_000).toFixed(1) + 'M';
                              if (value >= 1_000) return (value/1_000).toFixed(1) + 'k';
                              return value;
                            }
                          },
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
                    decimation: {
                      enabled: true,
                      algorithm: 'lttb',
                      samples: 250,
                    },
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
                  interaction: { mode: 'index', intersect: false },
                }}
              />
            ) : <p>Loading chart...</p>}
          </div>
          {/* per-chart date range UI removed; global DateRangeControls used */}
      </div>
    );
  };
  
  

export default AnalyticsChart;
