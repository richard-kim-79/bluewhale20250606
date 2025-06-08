'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { contentAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

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
  type: 'text' | 'pdf';
  aiScore: number;
  hasLocation: boolean;
}

const GlobalTopContent = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchGlobalTopContents = async () => {
      setIsLoading(true);
      try {
        const response = await contentAPI.getGlobalTopContent({
          page: 1,
          limit: 10
        });
        
        // Ensure we always set an array, even if the API response is unexpected
        setContents(response?.data || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching global top content:', error);
        setError('글로벌 Top 콘텐츠를 불러오는데 실패했습니다.');
        setContents([]); // Ensure contents is always an array
        setIsLoading(false);
      }
    };

    fetchGlobalTopContents();
  }, []);

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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">글로벌 Top 콘텐츠</h2>
      
      {contents.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold">콘텐츠가 없습니다</p>
          <p>현재 글로벌 Top 콘텐츠가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contents.map((content) => (
            <div
              key={content.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
              onClick={() => handleContentClick(content.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    {content.author.avatar ? (
                      <Image
                        src={content.author.avatar}
                        alt={content.author.name || content.author.email}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-whale-100 flex items-center justify-center text-blue-whale-800 font-medium text-sm">
                        {(content.author.name?.[0] || content.author.email[0]).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <Link 
                      href={`/user/${content.author.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-medium text-gray-900 hover:underline"
                    >
                      {content.author.name || content.author.email}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(content.createdAt), { addSuffix: true, locale: ko })}
                    </p>
                    {isAuthenticated && user?.id !== content.author.id && (
                      <button
                        onClick={(e) => handleFollowToggle(content.author.id, e)}
                        disabled={followLoading[content.author.id]}
                        className={`text-xs font-medium mt-1 ${content.author.isFollowing 
                          ? 'text-gray-500 hover:text-gray-700' 
                          : 'text-blue-whale-600 hover:text-blue-whale-800'}`}
                      >
                        {followLoading[content.author.id] ? (
                          <span className="inline-block w-3 h-3 border-t-2 border-blue-whale-600 rounded-full animate-spin"></span>
                        ) : content.author.isFollowing ? (
                          '팔로잉'
                        ) : (
                          '팔로우'
                        )}
                      </button>
                    )}
                  </div>
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
              <div className="ml-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{content.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                  {content.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlobalTopContent;
