import { Bell, Check, X, Clock, AlertCircle, FileText, Calendar, Gift, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Notification icons mapping
const notificationIcons: Record<string, React.ReactNode> = {
  '🟢': <DollarSign className="text-green-500" size={18} />,
  '📄': <FileText className="text-blue-500" size={18} />,
  '🟠': <Calendar className="text-yellow-500" size={18} />,
  '🔴': <AlertCircle className="text-red-500" size={18} />,
  '🎉': <Gift className="text-purple-500" size={18} />,
  'default': <Bell className="text-gray-500" size={18} />
};

interface NotificationItemProps {
  id?: string | number;
  date?: string;
  status?: string;
  message?: string;
  isNew?: boolean;
  onDismiss?: () => void;
  onMarkAsRead?: () => void;
}

const NotificationItem = ({ 
  id,
  date, 
  status = 'default', 
  message, 
  isNew = false, 
  onDismiss, 
  onMarkAsRead 
}: NotificationItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.2 }}
      className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative ${
        isNew ? "bg-blue-50 dark:bg-blue-900/20" : ""
      }`}
    >
      {isNew && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {notificationIcons[status] || notificationIcons.default}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {date}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={onMarkAsRead}
                className="text-gray-400 hover:text-green-500 transition-colors"
                aria-label="Mark as read"
              >
                <Check size={16} />
              </button>
              <button 
                onClick={onDismiss}
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <p className="text-sm mt-1 dark:text-gray-200">{message}</p>
        </div>
      </div>
    </motion.div>
  );
};

interface NotificationItemData {
  id: string | number;
  date: string;
  status: string;
  message: string;
  isNew?: boolean;
  read?: boolean;
}

const NotificationPanel = ({ 
  initialNotifications = [] as NotificationItemData[], 
  enableLiveUpdates = false,
  onDismiss,
  onMarkAsRead,
  onMarkAllAsRead
}: {
  initialNotifications?: NotificationItemData[];
  enableLiveUpdates?: boolean;
  onDismiss?: (id: any) => void;
  onMarkAsRead?: (id: any) => void;
  onMarkAllAsRead?: () => void;
}) => {
  const [notifications, setNotifications] = useState<NotificationItemData[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(
    initialNotifications.filter(n => !n.read).length
  );
  const [activeTab, setActiveTab] = useState('all');

  // Simulate live updates if enabled
  useEffect(() => {
    if (!enableLiveUpdates) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const newNotification = {
        id: Date.now(),
        date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status: Math.random() > 0.5 ? '🟢' : '🔴',
        message: `System update completed at ${timeString}`,
        isNew: true,
        read: false
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [enableLiveUpdates]);

  const handleDismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => prev - 1);
    if (onDismiss) onDismiss(id);
  };

  const handleMarkAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === id ? { ...n, read: true, isNew: false } : n
      )
    );
    setUnreadCount(prev => prev - 1);
    if (onMarkAsRead) onMarkAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true, isNew: false }))
    );
    setUnreadCount(0);
    if (onMarkAllAsRead) onMarkAllAsRead();
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700 max-h-[550px]">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Bell className="text-gray-600 dark:text-gray-300" size={20} />
          <h3 className="font-semibold text-gray-600 text-lg dark:text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleMarkAllAsRead}
            className="text-sm text-red-500 hover:text-red-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            Mark all as read
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'all'
              ? 'text-red-700 border-b-2 border-red-700'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'unread'
              ? 'text-red-700 border-b-2 border-red-700'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Unread
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                id={notification.id}
                date={notification.date}
                status={notification.status}
                message={notification.message}
                isNew={notification.isNew}
                onDismiss={() => handleDismiss(notification.id)}
                onMarkAsRead={() => handleMarkAsRead(notification.id)}
              />
            ))
          ) : (
            <div className="p-6 text-center">
              <Clock className="mx-auto text-gray-400 mb-2" size={24} />
              <p className="text-gray-500 dark:text-gray-400">
                No {activeTab === 'unread' ? 'unread' : ''} notifications
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-3 text-center border-t border-gray-200 dark:border-gray-700">
        <button className="text-sm text-red-700 hover:text-red-800 dark:text-red-800 dark:hover:text-red-900 transition-colors">
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationPanel;