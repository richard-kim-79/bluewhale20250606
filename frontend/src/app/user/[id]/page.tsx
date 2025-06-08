'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI, contentAPI } from '@/services/api';
import Link from 'next/link';
import Image from 'next/image';
import ContentCard from '@/components/ContentCard';
import UserFollowers from '@/components/UserFollowers';
import UserFollowing from '@/components/UserFollowing';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio: string;
  avatar: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

interface UserContent {
  id: string;
  title: string;
  summary: string;
  type: 'text' | 'pdf';
  createdAt: string;
  aiScore: number;
  location?: {
    lat: number;
    lng: number;
  };
}

const UserProfilePage = () => {
  const params = useParams<{ id: string }>();
  const userId = params?.id || '';
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [contents, setContents] = useState<UserContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'followers' | 'following'>('content');
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const profileData = await userAPI.getUserProfile(userId);
        setProfile(profileData);
        
        // Fetch user content
        const contentData = await contentAPI.getUserContent(userId);
        setContents(contentData.data || []);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('사용자 프로필을 불러오는데 실패했습니다.');
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  // Fetch followers and following when tab changes
  useEffect(() => {
    const fetchFollowData = async () => {
      if (!userId || activeTab === 'content') return;
      
      setIsLoading(true);
      try {
        if (activeTab === 'followers') {
          const followersData = await userAPI.getUserFollowers(userId);
          setFollowers(followersData.data || []);
        } else if (activeTab === 'following') {
          const followingData = await userAPI.getUserFollowing(userId);
          setFollowing(followingData.data || []);
        }
        setIsLoading(false);
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err);
        setError(`${activeTab === 'followers' ? '팔로워' : '팔로잉'} 목록을 불러오는데 실패했습니다.`);
        setIsLoading(false);
      }
    };

    fetchFollowData();
  }, [userId, activeTab]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!profile || !user || isFollowLoading) return;
    
    setIsFollowLoading(true);
    try {
      if (profile.isFollowing) {
        await userAPI.unfollowUser(userId);
        setProfile({
          ...profile,
          isFollowing: false,
          followersCount: profile.followersCount - 1
        });
      } else {
        await userAPI.followUser(userId);
        setProfile({
          ...profile,
          isFollowing: true,
          followersCount: profile.followersCount + 1
        });
      }
    } catch (err) {
      console.error('Error toggling follow status:', err);
      setError(profile.isFollowing ? '언팔로우에 실패했습니다.' : '팔로우에 실패했습니다.');
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Navigate to user profile
  const navigateToUserProfile = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-whale-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">오류 발생</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        <p className="font-bold">사용자를 찾을 수 없습니다</p>
        <p>요청하신 사용자 프로필을 찾을 수 없습니다.</p>
      </div>
    );
  }

  // Check if this is the current user's profile
  const isCurrentUser = user?.id === profile.id;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={profile.name || profile.email}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl">
                {(profile.name || profile.email).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold">{profile.name || profile.email}</h1>
            <p className="text-gray-600 mb-2">{profile.email}</p>
            {profile.bio && <p className="text-gray-700 mb-4">{profile.bio}</p>}
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-4">
              <div className="text-center">
                <span className="font-bold">{contents.length}</span>
                <p className="text-sm text-gray-500">콘텐츠</p>
              </div>
              <div className="text-center cursor-pointer" onClick={() => setActiveTab('followers')}>
                <span className="font-bold">{profile.followersCount}</span>
                <p className="text-sm text-gray-500">팔로워</p>
              </div>
              <div className="text-center cursor-pointer" onClick={() => setActiveTab('following')}>
                <span className="font-bold">{profile.followingCount}</span>
                <p className="text-sm text-gray-500">팔로잉</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              {isCurrentUser ? (
                <Link href="/profile/edit" className="px-4 py-2 bg-blue-whale-100 text-blue-whale-800 rounded-md hover:bg-blue-whale-200 transition">
                  프로필 수정
                </Link>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  className={`px-4 py-2 rounded-md transition ${
                    profile.isFollowing
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-blue-whale-600 text-white hover:bg-blue-whale-700'
                  }`}
                >
                  {isFollowLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                  ) : profile.isFollowing ? (
                    '언팔로우'
                  ) : (
                    '팔로우'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('content')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'content'
                ? 'border-blue-whale-600 text-blue-whale-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            콘텐츠
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'followers'
                ? 'border-blue-whale-600 text-blue-whale-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            팔로워
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'following'
                ? 'border-blue-whale-600 text-blue-whale-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            팔로잉
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div>
        {activeTab === 'content' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contents.length > 0 ? (
              contents.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-gray-500">
                콘텐츠가 없습니다.
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'followers' && (
          <UserFollowers userId={userId} />
        )}
        
        {activeTab === 'following' && (
          <UserFollowing userId={userId} />
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
