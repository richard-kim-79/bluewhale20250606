'use client';

import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

interface RecommendedUser {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatar?: string;
  isFollowing: boolean;
}

interface UserRecommendationsProps {
  limit?: number;
  title?: string;
  excludeUserId?: string;
}

const UserRecommendations = ({ 
  limit = 3, 
  title = "팔로우 추천", 
  excludeUserId 
}: UserRecommendationsProps) => {
  const { isAuthenticated, user } = useAuth();
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchRecommendedUsers = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, this would call a specific endpoint for recommended users
        // For now, we'll simulate by searching for users
        const response = await userAPI.searchUsers('', { limit: limit + 5 }); // Get extra users in case we need to filter
        
        // Filter out the current user and any excluded user
        let filteredUsers = response.data || [];
        if (user?.id) {
          filteredUsers = filteredUsers.filter((u: RecommendedUser) => u.id !== user.id);
        }
        if (excludeUserId) {
          filteredUsers = filteredUsers.filter((u: RecommendedUser) => u.id !== excludeUserId);
        }
        
        // Limit to the requested number
        filteredUsers = filteredUsers.slice(0, limit);
        
        setRecommendedUsers(filteredUsers);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching recommended users:', err);
        setError('추천 사용자를 불러오는데 실패했습니다.');
        setIsLoading(false);
      }
    };

    fetchRecommendedUsers();
  }, [isAuthenticated, user?.id, limit, excludeUserId]);

  const handleFollowToggle = async (userId: string) => {
    if (followLoading[userId]) return;
    
    setFollowLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const userToUpdate = recommendedUsers.find(u => u.id === userId);
      if (!userToUpdate) return;
      
      if (userToUpdate.isFollowing) {
        await userAPI.unfollowUser(userId);
        setRecommendedUsers(prev => 
          prev.map(user => 
            user.id === userId ? { ...user, isFollowing: false } : user
          )
        );
      } else {
        await userAPI.followUser(userId);
        setRecommendedUsers(prev => 
          prev.map(user => 
            user.id === userId ? { ...user, isFollowing: true } : user
          )
        );
      }
    } catch (err) {
      console.error('Error toggling follow status:', err);
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (!isAuthenticated) return null;
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-medium mb-4">{title}</h2>
        <div className="animate-pulse space-y-3">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-medium mb-4">{title}</h2>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (recommendedUsers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-lg font-medium mb-4">{title}</h2>
      <div className="space-y-4">
        {recommendedUsers.map((recommendedUser) => (
          <div key={recommendedUser.id} className="flex items-center justify-between">
            <Link href={`/user/${recommendedUser.id}`} className="flex items-center flex-grow">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 mr-3">
                {recommendedUser.avatar ? (
                  <Image
                    src={recommendedUser.avatar}
                    alt={recommendedUser.name || recommendedUser.email}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    {(recommendedUser.name || recommendedUser.email).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-sm">{recommendedUser.name || recommendedUser.email}</h3>
                {recommendedUser.bio ? (
                  <p className="text-xs text-gray-500 truncate max-w-[150px]">{recommendedUser.bio}</p>
                ) : (
                  <p className="text-xs text-gray-500 truncate max-w-[150px]">{recommendedUser.email}</p>
                )}
              </div>
            </Link>
            <button
              onClick={() => handleFollowToggle(recommendedUser.id)}
              disabled={followLoading[recommendedUser.id]}
              className={`ml-2 px-3 py-1 text-xs font-medium rounded-full ${
                recommendedUser.isFollowing
                  ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  : 'text-white bg-blue-whale-600 hover:bg-blue-whale-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-whale-500`}
            >
              {followLoading[recommendedUser.id] ? (
                <span className="inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
              ) : recommendedUser.isFollowing ? (
                '팔로잉'
              ) : (
                '팔로우'
              )}
            </button>
          </div>
        ))}
        <div className="pt-2 text-center">
          <Link href="/search?tab=users" className="text-sm text-blue-whale-600 hover:text-blue-whale-800">
            더 많은 사용자 찾기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserRecommendations;
