'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { contentAPI } from '../../../services/api';
import MapView from '../../../components/MapView';
import UserRecommendations from '../../../components/UserRecommendations';

interface ContentDetail {
  id: string;
  title: string;
  content: string;
  summary: string;
  author: {
    id: string;
    email: string;
  };
  createdAt: string;
  location: {
    lat: number;
    lng: number;
  } | null;
  type: 'text' | 'pdf';
  pdfUrl?: string;
  aiScore: number;
}

export default function ContentDetailPage() {
  const params = useParams();
  const contentId = params?.id as string;
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      if (!contentId) return;
      
      setIsLoading(true);
      try {
        // Get content details from API
        const response = await contentAPI.getContentById(contentId);
        setContent(response.data);
        setIsSaved(response.data.isSaved || false);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching content:', err);
        setError(err.response?.data?.message || '콘텐츠를 불러오는데 실패했습니다.');
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [contentId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-whale-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded max-w-md w-full">
          <p className="font-bold">오류 발생</p>
          <p>{error}</p>
        </div>
        <Link href="/" className="mt-4 text-blue-whale-600 hover:text-blue-whale-500">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded max-w-md w-full">
          <p className="font-bold">콘텐츠를 찾을 수 없습니다</p>
          <p>요청하신 콘텐츠가 존재하지 않거나 삭제되었을 수 있습니다.</p>
        </div>
        <Link href="/" className="mt-4 text-blue-whale-600 hover:text-blue-whale-500">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(content.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-whale-600 hover:text-blue-whale-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            홈으로 돌아가기
          </Link>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-3/4">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{content.title}</h1>
              <div className={`
                ${content.type === 'pdf' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                px-3 py-1 rounded-full text-sm font-medium
              `}>
                {content.type === 'pdf' ? 'PDF' : 'TEXT'}
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <span className="mr-3">{content.author.email}</span>
              <span className="mr-3">•</span>
              <span>{formattedDate}</span>
              {content.location && (
                <>
                  <span className="mr-3">•</span>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span>위치 정보 있음</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
              <span className="text-blue-600 font-medium">AI 참조 점수: {content.aiScore}</span>
            </div>
            
            {content.type === 'pdf' ? (
              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">요약</h3>
                  <p className="text-gray-600">{content.summary}</p>
                </div>
                <div className="mt-4">
                  <a
                    href={content.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    PDF 파일 보기
                  </a>
                </div>
              </div>
            ) : (
              <div className="prose max-w-none mb-6">
                <div className="whitespace-pre-wrap">{content.content}</div>
              </div>
            )}
            
            {content.location && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">위치 정보</h3>
                <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                  <MapView location={content.location} />
                </div>
              </div>
            )}
          </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <Link href="/" className="btn-secondary">
                홈으로
              </Link>
              {isAuthenticated && (
                <div className="flex space-x-4">
              <button 
                className="btn-secondary flex items-center"
                onClick={() => {
                  // Share functionality would be implemented here
                  // For now, just copy the URL to clipboard
                  navigator.clipboard.writeText(window.location.href);
                  alert('URL이 클립보드에 복사되었습니다.');
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                공유하기
              </button>
              <button 
                className={`btn-secondary flex items-center ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={async () => {
                  if (isSaving || !content) return;
                  
                  setIsSaving(true);
                  try {
                    if (isSaved) {
                      await contentAPI.unsaveContent(content.id);
                      setIsSaved(false);
                    } else {
                      await contentAPI.saveContent(content.id);
                      setIsSaved(true);
                    }
                  } catch (err) {
                    console.error('Error saving/unsaving content:', err);
                    alert('콘텐츠 저장에 실패했습니다.');
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
              >
                <svg xmlns="http://www.w3.org/2000/svg" 
                  fill={isSaved ? "currentColor" : "none"} 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 mr-1"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
                {isSaved ? '저장됨' : '저장하기'}
              </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:w-1/4">
            {isAuthenticated && content?.author && (
              <>
                <UserRecommendations 
                  limit={5} 
                  title="팔로우 추천" 
                  excludeUserId={content.author.id} 
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
