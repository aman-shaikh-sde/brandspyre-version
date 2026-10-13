import { FaCheckCircle, FaClock, FaExclamationCircle } from 'react-icons/fa';

type ProgressItem = {
  type: string;
  value: number;
  color: string; 
  icon: React.ReactNode;
  label: string;
  title:string
};

type PaymentProgressCardProps = {
  items: ProgressItem[];
  className?: string;
  title?:string;
};

const PaymentProgressCard = ({
  items,
  title='',
  className = '',
}: PaymentProgressCardProps) => {
  const totalAmount = items.reduce((sum, item) => sum + item.value, 0);

  const getPercentage = (value: number) => {
    return totalAmount > 0 ? Math.round((value / totalAmount) * 100) : 0;
  };

  return (
    <div className={`rounded-lg shadow-md p-6 transition-colors duration-300 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 dark:text-gray-400 text-gray-500">
       {title}
      </h3>

      {items.map((item) => (
        <div key={item.type} className="mb-4 last:mb-2">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center ">
              {item.icon}
              <span className="text-sm font-medium dark:text-gray-400 text-gray-700">
                {item.label}
              </span>
            </div>
            <span className="text-xs font-medium dark:text-dark-300 text-gray-500">
              {getPercentage(item.value)}%
            </span>
          </div>
          <div className="w-full rounded-full h-2.5 dark:bg-dark-600 bg-gray-200 dark:bg-gray-600">
            <div
              className={`${item.color} h-2.5 rounded-full transition-all duration-500`}
              style={{ width: `${getPercentage(item.value)}%` }}
            ></div>
          </div>
        </div>
      ))}

      {/* Total Amount */}
      {/* <div className="mt-6 pt-4 dark:border-dark-600 border-gray-200 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium dark:text-dark-300 text-gray-500">Total Amount</span>
          <span className="text-sm font-bold dark:text-dark-100 text-gray-800">
            ${totalAmount.toFixed(2)}
          </span>
        </div>
      </div> */}
    </div>
  );
};

export default PaymentProgressCard;