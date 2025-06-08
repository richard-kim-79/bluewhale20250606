'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { contentAPI, userAPI } from '../../services/api';
import Link from 'next/link';
import Image from 'next/image';
import UserFollowing from '../../components/UserFollowing';

interface UserContent {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  type: 'text' | 'pdf';
  aiScore: number;
  hasLocation: boolean;
}

interface FollowingUser {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatar?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [userContent, setUserContent] = useState<UserContent[]>([]);
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'saved' | 'following'>('content');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchUserContent = async () => {
      try {
        setIsLoading(true);
        
        if (activeTab === 'content') {
          // Fetch user's own content
          const response = await contentAPI.getUserContent(undefined, { page: 1, limit: 10 });
          setUserContent(response.data);
        } else if (activeTab === 'saved') {
          // Fetch user's saved content
          const response = await contentAPI.getSavedContent({ page: 1, limit: 10 });
          setUserContent(response.data);
        } else if (activeTab === 'following') {
          // Fetch users that the current user is following
          if (user?.id) {
            const response = await userAPI.getUserFollowing(user.id, { page: 1, limit: 20 });
            setFollowingUsers(response.data || []);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error(`Error fetching ${activeTab}:`, error);
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUserContent();
    }
  }, [loading, isAuthenticated, router, activeTab, user?.id]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };
  
  const handleDeleteContent = async (contentId: string) => {
    if (window.confirm('정말로 이 콘텐츠를 삭제하시겠습니까?')) {
      try {
        await contentAPI.deleteContent(contentId);
        // Refresh the content list after deletion
        const response = await contentAPI.getUserContent();
        setUserContent(response.data);
      } catch (error) {
        console.error('Error deleting content:', error);
        alert('콘텐츠 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  if (loading || isLoading) {
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl font-bold text-gray-900">내 프로필</h1>
                <p className="text-gray-600">{user?.email}</p>
              </div>
              <div className="flex space-x-4">
                <Link href="/create" className="btn-primary">
                  새 콘텐츠 작성
                </Link>
                <Link href="/profile/edit" className="btn-secondary">
                  프로필 수정
                </Link>
                <button onClick={handleLogout} className="btn-outline">
                  로그아웃
                </button>
              </div>
            </div>

            <div className="mt-8 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`${
                    activeTab === 'content'
                      ? 'border-blue-whale-500 text-blue-whale-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  내가 작성한 콘텐츠
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`${
                    activeTab === 'saved'
                      ? 'border-blue-whale-500 text-blue-whale-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  저장한 콘텐츠
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`${
                    activeTab === 'following'
                      ? 'border-blue-whale-500 text-blue-whale-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  팔로잉
                </button>
              </nav>
            </div>

            <div className="mt-6">
              {activeTab === 'following' ? (
                <>
                  {user?.id && <UserFollowing userId={user.id} />}
                </>
              ) : activeTab === 'content' ? (
                <>
                  {userContent.length > 0 ? (
                    <div className="space-y-4">
                      {userContent.map((content) => (
                        <div
                          key={content.id}
                          className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
                        >
                          <Link href={`/content/${content.id}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900 hover:text-blue-whale-600">
                                  {content.title}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                  {new Date(content.createdAt).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </p>
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
                    </div>
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
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    저장한 콘텐츠가 없습니다
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    관심 있는 콘텐츠를 저장해보세요.
                  </p>
                  <div className="mt-6">
                    <Link href="/" className="btn-primary">
                      콘텐츠 둘러보기
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
