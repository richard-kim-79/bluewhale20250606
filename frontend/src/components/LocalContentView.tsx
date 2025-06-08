'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { contentAPI, userAPI } from '../services/api';
import LocalMapView from './LocalMapView';
import { useAuth } from '../contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

interface ContentItem {
  id: string;
  title: string;
  summary: string;
  author: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    isFollowing?: boolean;
  };
  createdAt: string;
  location: {
    lat: number;
    lng: number;
  };
  distance: number; // in kilometers
  type: 'text' | 'pdf';
  aiScore: number;
}

const LocalContentView = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            console.error('Error getting location:', error);
            setError('위치 정보를 가져오는데 실패했습니다. 위치 권한을 확인해주세요.');
            // Default to Seoul if location access is denied
            setUserLocation({
              lat: 37.5665,
              lng: 126.9780,
            });
          }
        );
      } else {
        setError('이 브라우저는 위치 정보를 지원하지 않습니다.');
        // Default to Seoul if geolocation is not supported
        setUserLocation({
          lat: 37.5665,
          lng: 126.9780,
        });
      }
    };

    getUserLocation();
  }, []);

  useEffect(() => {
    const fetchLocalContents = async () => {
      if (!userLocation) return;
      
      setIsLoading(true);
      try {
        // Call the API to get local content based on user location
        const response = await contentAPI.getLocalContent({
          page: 1,
          limit: 10,
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius: 10 // 10km radius
        });
        
        setContents(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching local contents:', err);
        setError('주변 콘텐츠를 불러오는데 실패했습니다.');
        setIsLoading(false);
      }
    };

    fetchLocalContents();
  }, [userLocation]);

  const handleContentSelect = (contentId: string) => {
    router.push(`/content/${contentId}`);
  };
  
  const handleFollowToggle = async (authorId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (followLoading[authorId] || !isAuthenticated) return;
    
    setFollowLoading(prev => ({ ...prev, [authorId]: true }));
    
    try {
      const contentToUpdate = contents.find(content => content.author.id === authorId);
      if (!contentToUpdate) return;
      
      if (contentToUpdate.author.isFollowing) {
        await userAPI.unfollowUser(authorId);
        setContents(prev => 
          prev.map(content => 
            content.author.id === authorId 
              ? { ...content, author: { ...content.author, isFollowing: false } } 
              : content
          )
        );
      } else {
        await userAPI.followUser(authorId);
        setContents(prev => 
          prev.map(content => 
            content.author.id === authorId 
              ? { ...content, author: { ...content.author, isFollowing: true } } 
              : content
          )
        );
      }
    } catch (err) {
      console.error('Error toggling follow status:', err);
    } finally {
      setFollowLoading(prev => ({ ...prev, [authorId]: false }));
    }
  };

  if (isLoading) {
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

  const mapContents = contents.map(content => ({
    id: content.id,
    title: content.title,
    location: content.location,
    type: content.type,
    aiScore: content.aiScore,
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">내 주변 콘텐츠</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              viewMode === 'map'
                ? 'bg-blue-whale-100 text-blue-whale-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            지도 보기
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              viewMode === 'list'
                ? 'bg-blue-whale-100 text-blue-whale-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            목록 보기
          </button>
        </div>
      </div>

      {contents.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold">주변에 콘텐츠가 없습니다</p>
          <p>현재 위치 주변 10km 내에 등록된 콘텐츠가 없습니다.</p>
        </div>
      ) : (
        <>
          {viewMode === 'map' ? (
            <div className="h-96">
              <LocalMapView contents={mapContents} onContentSelect={handleContentSelect} />
            </div>
          ) : (
            <div className="space-y-4">
              {contents
                .sort((a, b) => a.distance - b.distance)
                .map((content) => (
                  <div
                    key={content.id}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
                    onClick={() => handleContentSelect(content.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 hover:text-blue-whale-600">
                          {content.title}
                        </h3>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Link 
                            href={`/user/${content.author.id}`} 
                            className="flex items-center hover:text-blue-whale-600"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <div className="relative w-5 h-5 rounded-full overflow-hidden bg-gray-200 mr-1">
                              {content.author.avatar ? (
                                <Image
                                  src={content.author.avatar}
                                  alt={content.author.name || content.author.email}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                  {(content.author.name || content.author.email).charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span>{content.author.name || content.author.email}</span>
                          </Link>
                          <span className="mx-2">•</span>
                          <span>
                            {new Date(content.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                          {isAuthenticated && (
                            <>
                              <span className="mx-2">•</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFollowToggle(content.author.id, e);
                                }}
                                disabled={followLoading[content.author.id]}
                                className={`text-xs font-medium ${content.author.isFollowing ? 'text-gray-500 hover:text-gray-700' : 'text-blue-whale-600 hover:text-blue-whale-800'}`}
                              >
                                {followLoading[content.author.id] ? (
                                  <span className="inline-block w-3 h-3 border-t-2 border-blue-whale-600 rounded-full animate-spin"></span>
                                ) : content.author.isFollowing ? (
                                  '팔로잉'
                                ) : (
                                  '팔로우'
                                )}
                              </button>
                            </>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {content.summary}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div
                          className={`${
                            content.type === 'pdf'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          } px-2 py-1 rounded-full text-xs font-medium`}
                        >
                          {content.type === 'pdf' ? 'PDF' : 'TEXT'}
                        </div>
                        <div className="mt-2 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 mr-1 text-blue-600"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                            />
                          </svg>
                          <span className="text-xs text-blue-600">
                            {content.aiScore}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 mr-1 text-gray-500"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                            />
                          </svg>
                          <span className="text-xs text-gray-500">
                            {content.distance.toFixed(1)}km 거리
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LocalContentView;
