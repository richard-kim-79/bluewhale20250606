'use client';

import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

interface UserFollowed {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatar?: string;
  isFollowing: boolean;
}

interface UserFollowingProps {
  userId: string;
}

const UserFollowing = ({ userId }: UserFollowingProps) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState<UserFollowed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!userId) return;

    const fetchFollowing = async () => {
      try {
        setIsLoading(true);
        const response = await userAPI.getUserFollowing(userId);
        
        // All users in the following list are already being followed by the current user
        const followingWithStatus = (response.data || []).map((followedUser: UserFollowed) => ({
          ...followedUser,
          isFollowing: true
        }));
        
        setFollowing(followingWithStatus);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching following:', err);
        setError('팔로잉 목록을 불러오는데 실패했습니다.');
        setIsLoading(false);
      }
    };

    fetchFollowing();
  }, [userId]);

  const handleUnfollow = async (followedId: string) => {
    if (followLoading[followedId] || !user) return;
    
    setFollowLoading(prev => ({ ...prev, [followedId]: true }));
    
    try {
      await userAPI.unfollowUser(followedId);
      
      // Remove the unfollowed user from the list
      setFollowing(prev => prev.filter(followed => followed.id !== followedId));
    } catch (err) {
      console.error('Error unfollowing user:', err);
    } finally {
      setFollowLoading(prev => ({ ...prev, [followedId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-whale-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
        <p>{error}</p>
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        팔로잉하는 사용자가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {following.map((followed) => (
        <div
          key={followed.id}
          className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition"
        >
          <Link href={`/user/${followed.id}`} className="flex items-center flex-grow">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-4">
              {followed.avatar ? (
                <Image
                  src={followed.avatar}
                  alt={followed.name || followed.email}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  {(followed.name || followed.email).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium">{followed.name || followed.email}</h3>
              {followed.bio && <p className="text-sm text-gray-500 line-clamp-1">{followed.bio}</p>}
              {!followed.bio && <p className="text-sm text-gray-500">{followed.email}</p>}
            </div>
          </Link>
          
          {/* Only show unfollow button if viewing the current user's following list */}
          {user && user.id === userId && (
            <button
              onClick={() => handleUnfollow(followed.id)}
              disabled={followLoading[followed.id]}
              className="ml-2 px-3 py-1 text-sm font-medium rounded-full text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-whale-500"
            >
              {followLoading[followed.id] ? (
                <span className="inline-block w-4 h-4 border-2 border-t-transparent border-gray-700 rounded-full animate-spin"></span>
              ) : (
                '언팔로우'
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default UserFollowing;
