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
} from 'chart.js';
import { twMerge } from 'tailwind-merge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LineGraph = ({ data, className, theme = 'light' }) => {
  // Default dataset structure
  const defaultDataset = {
    label: 'Dataset',
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
    tension: 0.1,
    fill: false,
  };

  // Prepare chart data
  const chartData = {
    labels: data.labels || [],
    datasets: data.datasets.map((dataset, index) => ({
      ...defaultDataset,
      ...dataset,
      borderColor: dataset.borderColor || getColor(index),
      backgroundColor: dataset.backgroundColor || `${getColor(index)}80`,
    })),
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme === 'dark' ? '#e5e7eb' : 'rgb(156 163 175)',
        },
      },
      title: {
        display: !!data.title,
        text: data.title,
        color: theme === 'dark' ? '#e5e7eb' : 'rgb(156 163 175)',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: theme === 'dark' ? 'rgba(229, 231, 235, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: theme === 'dark' ? '#e5e7eb' : 'rgb(156 163 175)',
        },
      },
      y: {
        grid: {
          color: theme === 'dark' ? 'rgba(229, 231, 235, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: theme === 'dark' ? '#e5e7eb' : 'rgb(156 163 175)',
        },
      },
    },
  };

  return (
    <div className={twMerge('p-4 rounded-lg shadow-lg dark:bg-gray-800 bg-white', className)}>
      <Line data={chartData} options={options} />
    </div>
  );
};

function getColor(index) {
  const colors = [
    '#a93226', // blue-500
    '#ef4444', // red-500
    '#717d7e ', // emerald-500
    '#aeb6bf ', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
  ];
  return colors[index % colors.length];
}

export default LineGraph;