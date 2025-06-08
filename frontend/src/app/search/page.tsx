'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { contentAPI, userAPI } from '../../services/api';
import Header from '../../components/Header';
import Image from 'next/image';
import Link from 'next/link';
import UserRecommendations from '../../components/UserRecommendations';
import { useAuth } from '../../contexts/AuthContext';

interface ContentSearchResult {
  id: string;
  title: string;
  summary: string;
  author: {
    id: string;
    email: string;
  };
  createdAt: string;
  type: 'text' | 'pdf';
  aiScore: number;
  hasLocation: boolean;
  location?: {
    lat: number;
    lng: number;
    name?: string;
  };
}

interface UserSearchResult {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatar?: string;
  isFollowing?: boolean;
}

type SortOption = 'relevance' | 'date' | 'aiScore';
type LocationFilter = 'all' | 'nearby' | 'custom';

export default function SearchPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [contentResults, setContentResults] = useState<ContentSearchResult[]>([]);
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'users'>('content');
  
  // 정렬 및 필터링 상태
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [customLocation, setCustomLocation] = useState<{lat: number; lng: number; radius: number} | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(5); // km 단위
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  
  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
    
    // 사용자 위치 정보 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('위치 정보를 가져오는데 실패했습니다:', error);
        }
      );
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setCurrentPage(1); // 검색 시 페이지 초기화
    
    try {
      // Save to recent searches
      const updatedSearches = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
      
      // Search based on active tab
      if (activeTab === 'content') {
        // 위치 기반 필터링 설정
        let locationParams = {};
        if (locationFilter === 'nearby' && userLocation) {
          locationParams = {
            location: {
              lat: userLocation.lat,
              lng: userLocation.lng,
              radius: searchRadius
            }
          };
        } else if (locationFilter === 'custom' && customLocation) {
          locationParams = {
            location: {
              lat: customLocation.lat,
              lng: customLocation.lng,
              radius: customLocation.radius
            }
          };
        }
        
        // Call the API to search content with filters
        const contentResponse = await contentAPI.searchContent(searchQuery, {
          page: currentPage,
          limit: itemsPerPage,
          sort: sortBy,
          ...locationParams
        });
        
        setContentResults(contentResponse?.data || []);
        setTotalPages(contentResponse?.pagination?.totalPages || 1);
        setUserResults([]);
      } else {
        // Call the API to search users
        const userResponse = await userAPI.searchUsers(searchQuery, {
          page: currentPage,
          limit: itemsPerPage
        });
        
        setUserResults(userResponse?.data || []);
        setTotalPages(userResponse?.pagination?.totalPages || 1);
        setContentResults([]);
      }
      
      setIsSearching(false);
    } catch (error) {
      console.error(`Error searching ${activeTab}:`, error);
      // Reset results to empty arrays on error
      if (activeTab === 'content') {
        setContentResults([]);
      } else {
        setUserResults([]);
      }
      setIsSearching(false);
    }
  };

  const handleResultClick = (contentId: string) => {
    router.push(`/content/${contentId}`);
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    // Trigger search with the selected recent search
    const event = { preventDefault: () => {} } as React.FormEvent;
    setTimeout(() => handleSearch(event), 0);
  };
  
  const handleFollowUser = async (userId: string) => {
    try {
      await userAPI.followUser(userId);
      // Update the user in the results to show they are now followed
      setUserResults(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, isFollowing: true } : user
        )
      );
    } catch (error) {
      console.error('Error following user:', error);
      alert('사용자 팔로우 중 오류가 발생했습니다.');
    }
  };
  
  const handleUnfollowUser = async (userId: string) => {
    try {
      await userAPI.unfollowUser(userId);
      // Update the user in the results to show they are now unfollowed
      setUserResults(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, isFollowing: false } : user
        )
      );
    } catch (error) {
      console.error('Error unfollowing user:', error);
      alert('사용자 언팔로우 중 오류가 발생했습니다.');
    }
  };
  
  // 페이지 이동 함수
  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    
    setIsSearching(true);
    setCurrentPage(newPage);
    
    try {
      if (activeTab === 'content') {
        // 위치 기반 필터링 설정
        let locationParams = {};
        if (locationFilter === 'nearby' && userLocation) {
          locationParams = {
            location: {
              lat: userLocation.lat,
              lng: userLocation.lng,
              radius: searchRadius
            }
          };
        } else if (locationFilter === 'custom' && customLocation) {
          locationParams = {
            location: {
              lat: customLocation.lat,
              lng: customLocation.lng,
              radius: customLocation.radius
            }
          };
        }
        
        const contentResponse = await contentAPI.searchContent(searchQuery, {
          page: newPage,
          limit: itemsPerPage,
          sort: sortBy,
          ...locationParams
        });
        
        setContentResults(contentResponse?.data || []);
      } else {
        const userResponse = await userAPI.searchUsers(searchQuery, {
          page: newPage,
          limit: itemsPerPage
        });
        
        setUserResults(userResponse?.data || []);
      }
    } catch (error) {
      console.error(`Error changing page:`, error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // 정렬 방식 변경 함수
  const handleSortChange = (newSortOption: SortOption) => {
    setSortBy(newSortOption);
    // 정렬 변경 후 재검색
    const event = { preventDefault: () => {} } as React.FormEvent;
    setTimeout(() => handleSearch(event), 0);
  };
  
  // 위치 필터 변경 함수
  const handleLocationFilterChange = (newFilter: LocationFilter) => {
    setLocationFilter(newFilter);
    // 필터 변경 후 재검색
    const event = { preventDefault: () => {} } as React.FormEvent;
    setTimeout(() => handleSearch(event), 0);
  };
  
  // 커스텀 위치 설정 함수
  const handleCustomLocationSet = (lat: number, lng: number, radius: number) => {
    setCustomLocation({ lat, lng, radius });
    setLocationFilter('custom');
    // 위치 설정 후 재검색
    const event = { preventDefault: () => {} } as React.FormEvent;
    setTimeout(() => handleSearch(event), 0);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-3/4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">검색</h1>
            <div className="mb-6 border-b border-gray-200">
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'content' ? 'bg-blue-whale-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                >
                  콘텐츠
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'users' ? 'bg-blue-whale-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                >
                  사용자
                </button>
              </div>
            </div>
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="키워드, 주제, 위치 등을 검색하세요"
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-whale-500"
                />
                <button
                  type="submit"
                  className="bg-blue-whale-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-whale-700 focus:outline-none focus:ring-2 focus:ring-blue-whale-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </button>
              </div>
            </form>
            {/* 필터/정렬 옵션 */}
            {activeTab === 'content' && searchQuery.trim() && contentResults.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2">정렬:</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSortChange('relevance')}
                        className={`px-3 py-1 text-xs font-medium rounded-full ${sortBy === 'relevance' ? 'bg-blue-whale-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                      >
                        관련성
                      </button>
                      <button
                        onClick={() => handleSortChange('date')}
                        className={`px-3 py-1 text-xs font-medium rounded-full ${sortBy === 'date' ? 'bg-blue-whale-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                      >
                        최신순
                      </button>
                      <button
                        onClick={() => handleSortChange('aiScore')}
                        className={`px-3 py-1 text-xs font-medium rounded-full ${sortBy === 'aiScore' ? 'bg-blue-whale-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                      >
                        AI 점수
                      </button>
                    </div>
                  </div>
                  {/* 위치 필터 등 추가 옵션 필요시 여기에 */}
                </div>
              </div>
            )}
            {/* 결과/로딩/빈 상태 */}
            <div>
              {isSearching ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-whale-600"></div>
                </div>
              ) : activeTab === 'content' && contentResults?.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">콘텐츠 검색 결과</h2>
                  {contentResults.map((result) => (
                    <div
                      key={result.id}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
                      onClick={() => handleResultClick(result.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 hover:text-blue-whale-600">{result.title}</h3>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <span>{result.author.email}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(result.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{result.summary}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div
                            className={`${
                              result.type === 'pdf'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            } px-2 py-1 rounded-full text-xs font-medium`}
                          >
                            {result.type === 'pdf' ? 'PDF' : 'TEXT'}
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
                                d="M12 6v6l4 2"
                              />
                            </svg>
                            <span className="text-xs text-blue-600">
                              {result.aiScore}
                            </span>
                          </div>
                        </div>
                      </div>
                      {result.hasLocation && result.location && (
                        <div className="mt-2 text-xs text-gray-500">
                          위치: {result.location.name || `${result.location.lat}, ${result.location.lng}`}
                        </div>
                      )}
                    </div>
                  ))}
                  {/* 콘텐츠 페이지네이션 */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                      <nav className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                        >
                          이전
                        </button>
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                          ) {
                            return (
                              <button
                                key={i}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-1 rounded-md ${pageNum === currentPage ? 'bg-blue-whale-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                              >
                                {pageNum}
                              </button>
                            );
                          } else if (
                            (pageNum === currentPage - 3 && currentPage > 3) ||
                            (pageNum === currentPage + 3 && currentPage < totalPages - 2)
                          ) {
                            return <span key={i} className="px-2">...</span>;
                          }
                          return null;
                        })}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                        >
                          다음
                        </button>
                      </nav>
                    </div>
                  )}
                </div>
              ) : activeTab === 'users' && userResults?.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">사용자 검색 결과</h2>
                  {userResults.map((user) => (
                    <div
                      key={user.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                    >
                      <Link href={`/user/${user.id}`} className="flex items-center flex-grow">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-4">
                          {user.avatar ? (
                            <Image
                              src={user.avatar}
                              alt={user.name || user.email}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              {(user.name || user.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{user.name || user.email}</h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          {user.bio && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </Link>
                      <div>
                        {user.isFollowing ? (
                          <button
                            onClick={() => handleUnfollowUser(user.id)}
                            className="ml-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-whale-500"
                          >
                            팔로잉
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFollowUser(user.id)}
                            className="ml-4 px-4 py-2 bg-blue-whale-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-whale-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-whale-500"
                          >
                            팔로우
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* 사용자 페이지네이션 */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                      <nav className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                        >
                          이전
                        </button>
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                          ) {
                            return (
                              <button
                                key={i}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-1 rounded-md ${pageNum === currentPage ? 'bg-blue-whale-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                              >
                                {pageNum}
                              </button>
                            );
                          } else if (
                            (pageNum === currentPage - 3 && currentPage > 3) ||
                            (pageNum === currentPage + 3 && currentPage < totalPages - 2)
                          ) {
                            return <span key={i} className="px-2">...</span>;
                          }
                          return null;
                        })}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                        >
                          다음
                        </button>
                      </nav>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-12 h-12 mx-auto text-gray-400 mb-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">검색어를 입력하세요</h3>
                  <p className="text-gray-600">
                    {activeTab === 'content'
                      ? '키워드, 주제, 위치 등으로 콘텐츠를 검색할 수 있습니다.'
                      : '이메일, 이름 등으로 사용자를 검색할 수 있습니다.'}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="lg:w-1/4">
            {isAuthenticated && activeTab === 'users' && (
              <UserRecommendations limit={5} title="팔로우 추천" />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
