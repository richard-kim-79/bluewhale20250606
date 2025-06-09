'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { contentAPI } from '../../services/api';

interface UserContent {
  id: string;
  title: string;
  summary: string;
  content: string;
  createdAt: string;
  type: 'text' | 'pdf';
  aiScore: number;
  hasLocation: boolean;
  location?: {
    lat: number;
    lng: number;
  };
}

export default function MyContentPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [userContent, setUserContent] = useState<UserContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only fetch content if user is authenticated
    if (isAuthenticated) {
      fetchUserContent();
    }
  }, [loading, isAuthenticated, router, page]);

  const fetchUserContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the API service to fetch user content with pagination
      const response = await contentAPI.getUserContent(undefined, { 
        page, 
        limit 
      });
      
      // Safely handle the response
      if (response && response.data) {
        if (page === 1) {
          setUserContent(response.data);
        } else {
          setUserContent(prev => [...prev, ...response.data]);
        }
        
        // Check if there might be more content to load
        setHasMore(response.data.length === limit);
      } else {
        setUserContent([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching user content:', error);
      setError('콘텐츠를 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (window.confirm('정말로 이 콘텐츠를 삭제하시겠습니까?')) {
      try {
        await contentAPI.deleteContent(contentId);
        // Remove the deleted content from the state
        setUserContent(prev => prev.filter(content => content.id !== contentId));
      } catch (error) {
        console.error('Error deleting content:', error);
        alert('콘텐츠 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Show loading spinner when initially loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-whale-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">내 콘텐츠</h1>
              <div className="mt-4 md:mt-0">
                <Link href="/create" className="btn-primary">
                  새 콘텐츠 작성
                </Link>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
                {error}
                <button 
                  onClick={() => fetchUserContent()} 
                  className="ml-2 underline"
                >
                  다시 시도
                </button>
              </div>
            )}

            <div className="space-y-6">
              {userContent.length > 0 ? (
                <>
                  {userContent.map(content => (
                    <div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <Link href={`/content/${content.id}`} className="block">
                        <div className="flex justify-between">
                          <h2 className="text-lg font-medium text-blue-whale-700 hover:text-blue-whale-900">
                            {content.title}
                          </h2>
                          <div className="text-sm text-gray-500">
                            {new Date(content.createdAt).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                        <p className="mt-2 text-gray-600 line-clamp-2">{content.summary}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-whale-100 text-blue-whale-800">
                              AI 점수: {content.aiScore.toFixed(1)}
                            </span>
                            {content.type === 'pdf' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                PDF
                              </span>
                            )}
                            {content.hasLocation && (
                              <div className="flex items-center text-gray-500">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="w-4 h-4 mr-1"
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
                                <span className="text-xs">위치 정보</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                      <div className="mt-4 flex justify-end space-x-2">
                        <Link
                          href={`/content/${content.id}/edit`}
                          className="text-sm text-gray-600 hover:text-blue-whale-600"
                        >
                          수정
                        </Link>
                        <button 
                          onClick={() => handleDeleteContent(content.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {hasMore && (
                    <div className="text-center mt-6">
                      <button
                        onClick={loadMore}
                        disabled={isLoading}
                        className="btn-secondary"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            로딩 중...
                          </span>
                        ) : (
                          '더 보기'
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    작성한 콘텐츠가 없습니다
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    새로운 콘텐츠를 작성해보세요.
                  </p>
                  <div className="mt-6">
                    <Link href="/create" className="btn-primary">
                      새 콘텐츠 작성
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
