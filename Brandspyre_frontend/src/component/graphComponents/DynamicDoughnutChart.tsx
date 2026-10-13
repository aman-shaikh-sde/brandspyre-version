import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { twMerge } from 'tailwind-merge';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const DynamicDoughnutChart = ({ data, className, theme = 'light' }) => {
  const chartData = {
    labels: data.labels || [],
    datasets: [
      {
        data: data.values || [],
        backgroundColor: data.colors || generateColors(data.labels?.length || 0),
        borderColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    cutout: '50%', // <<<<<< Makes it a doughnut with a small width
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme === 'dark' ? '#d1d5db' : 'rgb(156 163 175)',
          padding: 10,
          boxWidth: 12,
          boxHeight: 12,
          marging:20,
          
          font: {
            size: 12,
            weight: '500',
            family: 'Inter, sans-serif',
           
          },
      
        },
      },
      title: {
        display: !!data.title,
        text: data.title,
        color: theme === 'dark' ? '#f3f4f6' : ' rgb(75 85 99)',
        font: {
          size: 18,
          weight: '600',
          family: 'Inter, sans-serif',
        },
        padding: {
          top: 10,
          bottom: 30,
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        titleColor: theme === 'dark' ? '#e5e7eb' : '#111827',
        bodyColor: theme === 'dark' ? '#e5e7eb' : '#111827',
        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 8,
      },
    },
  };

  return (
    <div className={twMerge(
      'w-full max-w-md mx-auto p-6 rounded-2xl border transition-all duration-300',
      'shadow-md',
      'dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200',
      className
    )}>
      <div className="w-full h-[600px]">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

// Generate beautiful colors dynamically
function generateColors(count) {
  const baseColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
    '#6366f1', '#d946ef', '#0ea5e9', '#84cc16'
  ];
  const extendedColors = Array(count).fill(null).map((_, i) => baseColors[i % baseColors.length]);
  return extendedColors;
}

export default DynamicDoughnutChart;
