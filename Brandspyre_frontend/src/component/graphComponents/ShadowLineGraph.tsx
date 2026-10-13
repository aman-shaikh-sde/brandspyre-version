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

const ShadowLineGraph = ({ data, className, theme = 'light' }) => {
  const defaultDataset = {
    label: 'Progress',
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 2,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBackgroundColor: '#fff',
    pointBorderColor: '#3b82f6',
    pointBorderWidth: 2,
    tension: 0.4,
    fill: true, 
  };

  const chartData = {
    labels: data.labels || [],
    datasets: data.datasets.map((dataset, index) => ({
      ...defaultDataset,
      ...dataset,
      borderColor: dataset.borderColor || getColor(index),
      backgroundColor: dataset.backgroundColor || `${getColor(index)}33`,
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
          color: theme === 'dark' ? '#e5e7eb' : '#6b7280',
          font: { size: 12, weight: '500' },
        },
      },
      title: {
        display: !!data.title,
        text: data.title,
        color: theme === 'dark' ? '#e5e7eb' : '#374151',
        font: { size: 18, weight: '600' },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${context.parsed.y}%`,
        },
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        titleColor: theme === 'dark' ? '#e5e7eb' : '#111827',
        bodyColor: theme === 'dark' ? '#e5e7eb' : '#111827',
        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 8,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
          font: { size: 11 },
        },
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
          font: { size: 11 },
          stepSize: 20,
        },
        grid: {
          color: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
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
      <div className="h-[300px] w-full">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

function getColor(index) {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
    '#6366f1', '#d946ef', '#0ea5e9', '#84cc16'
  ];
  return colors[index % colors.length];
}

export default ShadowLineGraph;
