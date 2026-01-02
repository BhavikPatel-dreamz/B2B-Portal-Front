import React, { useState } from 'react';
import AddtoCart from 'app/Icons/AddtoCart';
import Credit from 'app/Icons/Credit';
import NotificationIcon from 'app/Icons/NotificationIcon';
import SettingsIcon from 'app/Icons/SettingsIcon';
import Checkmarks from 'app/Icons/Checkmarks';
import RegisterIcon from 'app/Icons/RegisterIcon';
import UserDummyIcon from 'app/Icons/UserDummyIcon';
import DeleteIcon from 'app/Icons/DeleteIcon';

// Define notification type
interface NotificationItem {
  id: number;
  type: 'order' | 'credit' | 'registration' | string;
  title: string;
  description: string;
  timestamp: string;
  isNew: boolean;
  isRead: boolean;
}

// Define settings type
interface NotificationSettings {
  orderApprovals: boolean;
  creditAlerts: boolean;
  newRegistrations: boolean;
  trendingOrders: boolean;
  emailNotifications: boolean;
}

const NotificationListing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      type: 'order',
      title: 'New Order Approval Required',
      description: 'Order #ORD-1234 from Tech Solutions Inc requires approval',
      timestamp: '1/15/2024, 10:30:00 AM',
      isNew: true,
      isRead: false,
    },
    {
      id: 2,
      type: 'credit',
      title: 'Credit Limit Alert',
      description: 'Global Retail Co has used 92% of their credit limit',
      timestamp: '1/15/2024, 9:15:00 AM',
      isNew: true,
      isRead: false,
    },
    {
      id: 3,
      type: 'registration',
      title: 'New Registration Request',
      description: 'Metro Distribution has submitted a B2B registration request',
      timestamp: '1/15/2024, 9:00:00 AM',
      isNew: false,
      isRead: true,
    },
    {
      id: 4,
      type: 'order',
      title: 'Frequent Order Alert',
      description: 'Tech Solutions Inc has placed 5 orders this week',
      timestamp: '1/14/2024, 4:45:00 PM',
      isNew: false,
      isRead: true,
    },
    {
      id: 5,
      type: 'credit',
      title: 'Credit Request',
      description: 'Global Retail Co has requested a credit limit increase',
      timestamp: '1/14/2024, 3:20:00 PM',
      isNew: false,
      isRead: true,
    },
  ]);

  const [settings, setSettings] = useState<NotificationSettings>({
    orderApprovals: true,
    creditAlerts: true,
    newRegistrations: true,
    trendingOrders: false,
    emailNotifications: true,
  });

  const getIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'order':
        return <AddtoCart color="#5866FF" />;
      case 'credit':
        return <Credit color="#5866FF" />;
      case 'registration':
        return <UserDummyIcon />;
      default:
        return <NotificationIcon className="w-5 h-5 text-blue-600" />;
    }
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, isRead: true, isNew: false } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, isNew: false })));
  };

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const todayCount = 3;
  const weekCount = 12;
  const pendingCount = 2;

  return (
    <div>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Notifications</h1>
            <p className="text-[#6B7280] text-sm">
              Stay updated with important alerts and updates
            </p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-[#DDE4FF]">
              <SettingsIcon color="#5866FF" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-[#DDE4FF]">
              <NotificationIcon color="#5866FF" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Activity Feed */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-[#E1E7EF] p-[17.5px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[23.1px] font-bold text-[#0F1729]">Activity Feed</h2>
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 text-sm text-[#0F1729] border border-[#E1E7EF] rounded-md py-2 px-[13px]"
                >
                  <Checkmarks />
                  Mark All as Read
                </button>
              </div>

              <div className="flex gap-4 bg-[#F1F5F9] w-fit p-1 align-middle rounded-lg mb-3">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`text-sm font-medium p-2 transition-colors ${activeTab === 'all'
                    ? 'text-[#0F1729] bg-white p-2 rounded-lg'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab('unread')}
                  className={`text-sm font-medium p-2 transition-colors ${activeTab === 'unread'
                    ? 'text-[#0F1729] bg-white p-2 rounded-lg'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-100 space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex justify-between p-4 hover:bg-gray-50 transition-colors border border-[#2463EB33] rounded-lg`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      {getIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-[15.6px] font-bold text-[#0F1729]">
                              {notification.title}
                            </h3>

                          </div>
                          <p className="text-[13.2px] text-[#65758B] mb-1">
                            {notification.description}
                          </p>
                          <p className="text-[11.4px] font-normal text-[#65758B]">
                            {notification.timestamp}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Mark as read"
                            />
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-5'>
                    {notification.isNew && (
                      <span className="px-[11px] py-[3px] bg-[#5866FF] text-white text-xs font-medium rounded-[9999px]">
                        New
                      </span>
                    )}
                    {
                      notification.isNew && (
                        <Checkmarks />
                      )
                    }
                    <DeleteIcon />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Notification Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-[23.1px] font-bold text-[#0F1729] mb-1">
                Notification Settings
              </h2>
              <p className="text-[12.9px] font-normal text-[#65758B] mb-4">
                Manage your notification preferences
              </p>

              <div className="space-y-3">
                {[
                  { key: 'orderApprovals', label: 'Order Approvals' },
                  { key: 'creditAlerts', label: 'Credit Alerts' },
                  { key: 'newRegistrations', label: 'New Registrations' },
                  { key: 'trendingOrders', label: 'Trending Orders' },
                  { key: 'emailNotifications', label: 'Email Notifications' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-[13.2px] font-normal text-[#0F1729]">{label}</span>
                    <button
                      onClick={() =>
                        toggleSetting(key as keyof NotificationSettings)
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[key as keyof NotificationSettings]
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[key as keyof NotificationSettings]
                          ? 'translate-x-6'
                          : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-[23.3px] font-bold text-[#0F1729] mb-4">
                Quick Stats
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12.9px] font-normal text-[#65758B]">Today</span>
                  <span className="text-[15.3px] font-bold text-[#0F1729]">
                    {todayCount} notifications
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12.9px] font-normal text-[#65758B]">This Week</span>
                  <span className="text-[15.3px] font-bold text-[#0F1729]">
                    {weekCount} notifications
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12.9px] font-normal text-[#65758B]">High Priority</span>
                  <span className="text-[15.3px] font-bold text-[#EF4343]">
                    {pendingCount} pending
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationListing;
