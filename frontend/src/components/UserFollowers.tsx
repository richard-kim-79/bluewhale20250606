'use client';

import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

interface UserFollower {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatar?: string;
  isFollowing?: boolean;
}

interface UserFollowersProps {
  userId: string;
}

const UserFollowers = ({ userId }: UserFollowersProps) => {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<UserFollower[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!userId) return;

    const fetchFollowers = async () => {
      try {
        setIsLoading(true);
        const response = await userAPI.getUserFollowers(userId);
        
        // For each follower, check if the current user is following them
        if (user && user.id) {
          const followersWithFollowStatus = await Promise.all(
            (response.data || []).map(async (follower: UserFollower) => {
              // Skip checking for the current user
              if (follower.id === user.id) {
                return { ...follower, isFollowing: false };
              }
              
              try {
                const profileData = await userAPI.getUserProfile(follower.id);
                return { ...follower, isFollowing: profileData.isFollowing };
              } catch (err) {
                console.error(`Error checking follow status for user ${follower.id}:`, err);
                return { ...follower, isFollowing: false };
              }
            })
          );
          setFollowers(followersWithFollowStatus);
        } else {
          setFollowers(response.data || []);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching followers:', err);
        setError('팔로워 목록을 불러오는데 실패했습니다.');
        setIsLoading(false);
      }
    };

    fetchFollowers();
  }, [userId, user]);

  const handleFollowToggle = async (followerId: string) => {
    if (followLoading[followerId] || !user) return;
    
    setFollowLoading(prev => ({ ...prev, [followerId]: true }));
    
    try {
      const followerToUpdate = followers.find(f => f.id === followerId);
      if (!followerToUpdate) return;
      
      if (followerToUpdate.isFollowing) {
        await userAPI.unfollowUser(followerId);
        setFollowers(prev => 
          prev.map(follower => 
            follower.id === followerId ? { ...follower, isFollowing: false } : follower
          )
        );
      } else {
        await userAPI.followUser(followerId);
        setFollowers(prev => 
          prev.map(follower => 
            follower.id === followerId ? { ...follower, isFollowing: true } : follower
          )
        );
      }
    } catch (err) {
      console.error('Error toggling follow status:', err);
    } finally {
      setFollowLoading(prev => ({ ...prev, [followerId]: false }));
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

  if (followers.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        팔로워가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {followers.map((follower) => (
        <div
          key={follower.id}
          className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition"
        >
          <Link href={`/user/${follower.id}`} className="flex items-center flex-grow">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-4">
              {follower.avatar ? (
                <Image
                  src={follower.avatar}
                  alt={follower.name || follower.email}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  {(follower.name || follower.email).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium">{follower.name || follower.email}</h3>
              {follower.bio && <p className="text-sm text-gray-500 line-clamp-1">{follower.bio}</p>}
              {!follower.bio && <p className="text-sm text-gray-500">{follower.email}</p>}
            </div>
          </Link>
          
          {user && follower.id !== user.id && (
            <button
              onClick={() => handleFollowToggle(follower.id)}
              disabled={followLoading[follower.id]}
              className={`ml-2 px-3 py-1 text-sm font-medium rounded-full ${
                follower.isFollowing
                  ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  : 'text-white bg-blue-whale-600 hover:bg-blue-whale-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-whale-500`}
            >
              {followLoading[follower.id] ? (
                <span className="inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
              ) : follower.isFollowing ? (
                '팔로잉'
              ) : (
                '팔로우'
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default UserFollowers;
