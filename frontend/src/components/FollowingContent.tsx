'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { contentAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Author {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  isFollowing?: boolean;
}

interface ContentItem {
  id: string;
  title: string;
  summary: string;
  author: Author;
  createdAt: string;
  type: 'text' | 'pdf';
  aiScore: number;
  hasLocation: boolean;
}

const FollowingContent = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchFollowingContent = async () => {
      if (!isAuthenticated) {
        setError('팔로우한 작성자의 콘텐츠를 보려면 로그인이 필요합니다.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // 1. 사용자가 팔로우하는 작성자 목록 가져오기
        const followingResponse = await userAPI.getUserFollowing(user!.id, {
          page: 1,
          limit: 50 // 충분한 수의 팔로잉 작성자를 가져옵니다
        });
        
        const followingUsers = followingResponse.data;
        
        if (followingUsers.length === 0) {
          setContents([]);
          setIsLoading(false);
          return;
        }
        
        // 2. 각 작성자의 최근 콘텐츠 가져오기
        const contentPromises = followingUsers.map(async (followingUser: Author) => {
          try {
            const contentResponse = await contentAPI.getUserContent(followingUser.id, {
              page: 1,
              limit: 5 // 각 작성자당 최근 콘텐츠 5개만 가져옵니다
            });
            
            // 작성자 정보를 콘텐츠에 추가
            return contentResponse.data.map((content: ContentItem) => ({
              ...content,
              author: {
                ...content.author,
                isFollowing: true // 이미 팔로우 중인 작성자의 콘텐츠이므로 true로 설정
              }
            }));
          } catch (error) {
            console.error(`Error fetching content for user ${followingUser.id}:`, error);
            return [];
          }
        });
        
        // 3. 모든 콘텐츠 결합 및 날짜순 정렬
        const allContents = await Promise.all(contentPromises);
        const flattenedContents = allContents
          .flat()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setContents(flattenedContents);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching following content:', error);
        setError('팔로우한 작성자의 콘텐츠를 불러오는데 실패했습니다.');
        setIsLoading(false);
      }
    };

    fetchFollowingContent();
  }, [isAuthenticated, user]);

  const handleContentClick = (contentId: string) => {
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
        
        // 언팔로우한 작성자의 콘텐츠를 목록에서 제거
        setTimeout(() => {
          setContents(prev => prev.filter(content => content.author.id !== authorId));
        }, 500);
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

  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        <p className="font-bold">로그인이 필요합니다</p>
        <p>팔로우한 작성자의 콘텐츠를 보려면 로그인해주세요.</p>
        <button 
          onClick={() => router.push('/login')}
          className="mt-2 bg-blue-whale-600 text-white px-4 py-2 rounded hover:bg-blue-whale-700 transition-colors"
        >
          로그인하기
        </button>
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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">팔로잉 콘텐츠</h2>
      
      {contents.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold">콘텐츠가 없습니다</p>
          <p>팔로우한 작성자의 콘텐츠가 없습니다. 관심 있는 작성자를 팔로우해보세요!</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-2 bg-blue-whale-600 text-white px-4 py-2 rounded hover:bg-blue-whale-700 transition-colors"
          >
            작성자 찾기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {contents.map((content) => (
            <div
              key={content.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
              onClick={() => handleContentClick(content.id)}
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
                      onClick={(e) => e.stopPropagation()}
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
                      {formatDistanceToNow(new Date(content.createdAt), { 
                        addSuffix: true,
                        locale: ko
                      })}
                    </span>
                    <span className="mx-2">•</span>
                    <button
                      onClick={(e) => handleFollowToggle(content.author.id, e)}
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
                  {content.hasLocation && (
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
                        위치 정보
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowingContent;
