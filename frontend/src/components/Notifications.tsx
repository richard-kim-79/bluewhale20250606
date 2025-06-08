'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notificationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  type: 'content_nearby' | 'new_follower' | 'content_mention' | 'system';
  message: string;
  createdAt: string;
  read: boolean;
  relatedContentId?: string;
  relatedUserId?: string;
}

const Notifications = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        // Get notifications from API
        const response = await notificationAPI.getNotifications({ limit: 10 });
        setNotifications(response.data);
        
        // Get unread count
        const unreadResponse = await notificationAPI.getUnreadCount();
        setUnreadCount(unreadResponse.data.count);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setError('알림을 불러오는데 실패했습니다.');
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark notification as read
      await notificationAPI.markAsRead(notification.id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Navigate based on notification type
      if (notification.relatedContentId) {
        router.push(`/content/${notification.relatedContentId}`);
      } else if (notification.relatedUserId) {
        router.push(`/user/${notification.relatedUserId}`);
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-whale-600 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-md w-full max-h-[80vh] flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-whale-50">
        <h3 className="text-lg font-medium text-gray-900">알림</h3>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-whale-600 hover:text-blue-whale-800"
          >
            모두 읽음 표시
          </button>
        )}
      </div>
      
      <div className="overflow-y-auto flex-grow">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>새로운 알림이 없습니다.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li 
                key={notification.id} 
                className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-whale-50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {notification.type === 'content_nearby' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    {notification.type === 'new_follower' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    {notification.type === 'content_mention' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    )}
                    {notification.type === 'system' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="flex-shrink-0 ml-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-whale-600"></span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;
