
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { twMerge } from 'tailwind-merge';

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

const DynamicLineGraph = ({ data, className, theme = 'light' }) => {
  // Enhanced default dataset structure
  const defaultDataset = {
    label: 'Dataset',
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 2,
    pointRadius: 3,
    pointHoverRadius: 5,
    pointBackgroundColor: '#ffffff',
    pointBorderColor: function(context) {
      return getColor(context.datasetIndex);
    },
    pointBorderWidth: 2,
    tension: 0.4, // Increased for smoother curves
    fill: false,
    cubicInterpolationMode: 'monotone', // For better curve rendering
  };
  const chartData = {
    labels: data.labels || [],
    datasets: data.datasets.map((dataset, index) => ({
      ...defaultDataset,
      ...dataset,
      borderColor: dataset.borderColor || getColor(index),
      backgroundColor: dataset.backgroundColor || `${getColor(index)}33`, // More transparent
      tension: dataset.tension ?? defaultDataset.tension, // Allow override
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme === 'dark' ? '#e5e7eb' : 'rgb(156 163 175)',
          font: {
            size: 10,
            weight: '500',
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: !!data.title,
        text: data.title,
        color: theme === 'dark' ? 'rgb(156 163 175)' : 'rgb(156 163 175)',
        font: {
          size: 18,
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
        padding: 5,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: theme === 'dark' ? 'rgba(229, 231, 235, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
          font: {
            size: 11,
          },
          padding: 10,
        },
      },
    },
    elements: {
      line: {
        borderJoinStyle: 'round',
        capBezierPoints: true,
      },
    },
  };

  return (
    <div className={twMerge(
      'p-5 rounded-xl shadow-lg transition-all duration-300',
      'dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200',
      'border',
      className
    )}>
      <div className="h-[250px] w-full">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

// Enhanced color palette with better visual distinction
function getColor(index) {
  const colors = [
    '#3b82f6', // blue-500
    '#ef4444', // red-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
    '#f97316', // orange-500
    '#6366f1', // indigo-500
    '#d946ef', // fuchsia-500
    '#0ea5e9', // sky-500
    '#84cc16', // lime-500
  ];
  return colors[index % colors.length];
}

export default DynamicLineGraph;
