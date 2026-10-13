// import React from 'react';
// import { Bar } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from 'chart.js';
// import { twMerge } from 'tailwind-merge';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const KPIBarChart = ({ kpiData, className, theme = 'light' }) => {
//   // Transform your kpiData into chart.js format
//   const chartData = {
//     labels: kpiData.map(item => item.name),
//     datasets: [
//       {
//         label: 'Q1 Performance',
//         data: kpiData.map(item => item.Q1),
//         backgroundColor: ' rgb(107 114 128)',
//         borderColor: ' rgb(107 114 128)',
//         borderWidth: 1,
//         borderRadius: 6,
//         barPercentage: 0.5,
//         categoryPercentage: 0.6,
//       },
//       {
//         label: 'Q2 Performance',
//         data: kpiData.map(item => item.Q2),
//         backgroundColor: 'rgb(185 28 28)',
//         borderColor: 'rgb(185 28 28)',
//         borderWidth: 1,
//         borderRadius: 6,
//         barPercentage: 0.5,
//         categoryPercentage: 0.6,
//       }
//     ]
//   };

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         position: 'top',
//         labels: {
//           color: theme === 'dark' ? '#e5e7eb' : '#6b7280',
//           font: {
//             size: 12,
//             weight: '500',
//           },
//         },
//       },
//       title: {
//         display: true,
//         text: 'Team KPI Performance (Q1 vs Q2)',
//         color: theme === 'dark' ? '#f9fafb' : ' rgb(75 85 99)',
//         font: {
//           size: 18,
//           weight: '600',
//         },
//         padding: {
//           top: 10,
//           bottom: 20,
//         },
//       },
//       tooltip: {
//         backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
//         titleColor: theme === 'dark' ? '#e5e7eb' : '#111827',
//         bodyColor: theme === 'dark' ? '#e5e7eb' : '#111827',
//         borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
//         borderWidth: 1,
//         padding: 10,
//         callbacks: {
//           label: function(context) {
//             return `${context.dataset.label}: ${context.raw}%`;
//           }
//         }
//       },
//     },
//     scales: {
//       x: {
//         grid: {
//           display: false,
//         },
//         ticks: {
//           color: theme === 'dark' ? '#9ca3af' : '#6b7280',
//         },
//       },
//       y: {
//         min: 0,
//         max: 100,
//         grid: {
//           color: theme === 'dark' ? 'rgba(229, 231, 235, 0.1)' : 'rgba(0,0,0,0.05)',
//         },
//         ticks: {
//           color: theme === 'dark' ? '#9ca3af' : '#6b7280',
//           callback: function(value) {
//             return value + '%';
//           }
//         },
//       },
//     },
//   };

//   return (
//     <div className={twMerge(
//       'p-5 rounded-xl shadow-md transition-all duration-300',
//       'dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200',
//       className
//     )}>
//       <div className="h-[300px] w-full">
//         <Bar data={chartData} options={options} />
//       </div>
//     </div>
//   );
// };

// export default KPIBarChart;

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { twMerge } from 'tailwind-merge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const KPIBarChart = ({ 
  data = {}, 
  className, 
  theme = 'light',
  title = 'Bar Chart',
  indexAxis = 'x',
  stacked = false,
  showPercentage = false,
  borderRadius = 6,
  barPercentage = 0.5,
  categoryPercentage = 0.8
}) => {
  // Default colors that work well for both light and dark themes
  const defaultColors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#14B8A6', // teal-500
    '#F97316', // orange-500
    '#6366F1', // indigo-500
    '#D946EF'  // fuchsia-500
  ];

  // Prepare chart data with fallbacks
  const chartData = {
    labels: data?.labels || [],
    datasets: data?.datasets?.map((dataset, i) => ({
      ...dataset,
      label: dataset.label || `Dataset ${i + 1}`,
      data: dataset.data || [],
      backgroundColor: dataset.backgroundColor || defaultColors[i % defaultColors.length],
      borderColor: dataset.borderColor || defaultColors[i % defaultColors.length],
      borderWidth: dataset.borderWidth || 1,
      borderRadius: dataset.borderRadius || borderRadius,
      barPercentage: dataset.barPercentage || barPercentage,
      categoryPercentage: dataset.categoryPercentage || categoryPercentage,
    })) || []
  };

  // Don't render if no data
  if (chartData.labels.length === 0 || chartData.datasets.length === 0) {
    return (
      <div className={twMerge(
        'p-4 rounded-lg shadow-sm transition-all duration-300 flex items-center justify-center',
        'dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200',
        className
      )}>
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const options = {
    indexAxis: indexAxis,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme === 'dark' ? '#e5e7eb' : '#6b7280',
          font: {
            size: 12,
            weight: '500',
          },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20
        },
      },
      title: {
        display: !!title,
        text: title,
        color: theme === 'dark' ? '#f9fafb' : 'rgb(75 85 99)',
        font: {
          size: 16,
          weight: '600',
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        titleColor: theme === 'dark' ? '#e5e7eb' : '#111827',
        bodyColor: theme === 'dark' ? '#e5e7eb' : '#111827',
        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (showPercentage) {
              label += context.raw + '%';
            } else {
              label += context.raw;
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        stacked: stacked,
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        },
      },
      y: {
        stacked: stacked,
        grid: {
          color: theme === 'dark' ? 'rgba(229, 231, 235, 0.1)' : 'rgba(0,0,0,0.05)',
          drawBorder: false,
        },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
          callback: function(value) {
            if (showPercentage) {
              return value + '%';
            }
            return value;
          }
        },
        beginAtZero: true
      },
    },
  };

  return (
    <div className={twMerge(
      'p-4 rounded-lg shadow-sm transition-all duration-300',
      'dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200',
      className
    )}>
      <div className="h-[300px] w-full">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default KPIBarChart;