'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const BottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };
  
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await notificationAPI.getUnreadCount();
        setUnreadCount(response.data.count);
      } catch (error) {
        console.error('Error fetching unread notification count:', error);
      }
    };

    // Fetch initial count
    fetchUnreadCount();

    // Set up polling for new notifications every minute
    const intervalId = setInterval(fetchUnreadCount, 60000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 flex justify-around items-center z-10">
      <button
        onClick={() => router.push('/')}
        className={`flex flex-col items-center justify-center p-2 ${
          isActive('/') ? 'text-blue-whale-600' : 'text-gray-500'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
        <span className="text-xs mt-1">홈</span>
      </button>

      <button
        onClick={() => router.push('/search')}
        className={`flex flex-col items-center justify-center p-2 ${
          isActive('/search') ? 'text-blue-whale-600' : 'text-gray-500'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <span className="text-xs mt-1">검색</span>
      </button>

      <button
        onClick={() => router.push('/create')}
        className="flex flex-col items-center justify-center bg-blue-whale-600 text-white rounded-full w-14 h-14 -mt-5"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </button>

      <button
        onClick={() => router.push('/notifications')}
        className={`flex flex-col items-center justify-center p-2 ${
          isActive('/notifications') ? 'text-blue-whale-600' : 'text-gray-500'
        }`}
      >
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-red-600 text-xs text-white text-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span className="text-xs mt-1">알림</span>
      </button>

      <button
        onClick={() => router.push('/profile')}
        className={`flex flex-col items-center justify-center p-2 ${
          isActive('/profile') ? 'text-blue-whale-600' : 'text-gray-500'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
        <span className="text-xs mt-1">프로필</span>
      </button>
    </div>
  );
};

export default BottomNavigation;
