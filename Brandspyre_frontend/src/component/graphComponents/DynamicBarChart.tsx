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

// const DynamicBarChart = ({ data, className, theme = 'light' }) => {
//   const defaultDataset = {
//     label: 'Dataset',
//     backgroundColor: 'rgba(59, 130, 246, 0.7)',
//     borderColor: 'rgba(59, 130, 246, 1)',
//     borderWidth: 1,
//   };

//   const chartData = {
//     labels: data.labels || [],
//     datasets: data.datasets.map((dataset, index) => ({
//       ...defaultDataset,
//       ...dataset,
//       backgroundColor: dataset.backgroundColor || `${getColor(index)}AA`,
//       borderColor: dataset.borderColor || getColor(index),
//     })),
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
//             size: 10,
//             weight: '500',
//           },
//         },
//       },
//       title: {
//         display: !!data.title,
//         text: data.title,
//         color: theme === 'dark' ? '#e5e7eb' : 'rgb(156 163 175)',
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
//         grid: {
//           color: theme === 'dark' ? 'rgba(229, 231, 235, 0.1)' : 'rgba(0,0,0,0.05)',
//         },
//         ticks: {
//           color: theme === 'dark' ? '#9ca3af' : '#6b7280',
//         },
//       },
//     },
//   };

//   return (
//     <div className={twMerge(
//       'p-5 rounded-xl shadow-lg transition-all duration-300',
//       'dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200',
//       'border',
//       className
//     )}>
//       <div className="h-[300px] w-full">
//         <Bar data={chartData} options={options} />
//       </div>
//     </div>
//   );
// };

// function getColor(index) {
//   const colors = [
//     '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
//     '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
//     '#6366f1', '#d946ef', '#0ea5e9', '#84cc16',
//   ];
//   return colors[index % colors.length];
// }

// export default DynamicBarChart;
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

const DynamicBarChart = ({ data, className, theme = 'light' }) => {
  const defaultDataset = {
    label: 'Dataset',
    backgroundColor: 'rgba(59, 130, 246, 0.7)',
    borderColor: 'rgba(59, 130, 246, 1)',
    borderWidth: 1,
    borderRadius: 6, // rounded bars
    barPercentage: 0.9, // controls individual bar width
    categoryPercentage: 0.6, // controls spacing between bars
  };

  const chartData = {
    labels: data.labels || [],
    datasets: data.datasets.map((dataset, index) => ({
      ...defaultDataset,
      ...dataset,
      backgroundColor: dataset.backgroundColor || `${getColor(index)}BB`,
      borderColor: dataset.borderColor || getColor(index),
    })),
  };

  const options = {
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
        },
      },
      title: {
        display: !!data.title,
        text: data.title,
        color: theme === 'dark' ? '#f9fafb' : 'rgb(156 163 175)',
        font: {
          size: 18,
          weight: '600',
        },
        padding: {
          top: 1,
          bottom: 2,
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        titleColor: theme === 'dark' ? '#e5e7eb' : '#111827',
        bodyColor: theme === 'dark' ? '#e5e7eb' : '#111827',
        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 5,
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        },
      },
      y: {
        grid: {
          color: theme === 'dark' ? 'rgba(229, 231, 235, 0.1)' : 'rgba(0,0,0,0.05)',
        },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        },
      },
    },
  };

  return (
    <div className={twMerge(
      'p-5 rounded-xl shadow-md transition-all duration-300',
      'dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200',
      className
    )}>
      <div className="h-[200px] w-full">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

function getColor(index) {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
    '#6366f1', '#d946ef', '#0ea5e9', '#84cc16',
  ];
  return colors[index % colors.length];
}

export default DynamicBarChart;
