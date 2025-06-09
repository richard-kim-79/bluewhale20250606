'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import FeedTabs from '../components/FeedTabs';
import PersonalizedContent from '../components/PersonalizedContent';
import LocalContentView from '../components/LocalContentView';
import GlobalTopContent from '../components/GlobalTopContent';
import FollowingContent from '../components/FollowingContent';
import SuggestedUsers from '../components/SuggestedUsers';



export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('for-you');

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {!isAuthenticated && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border-t-4 border-blue-whale-600">
              <div className="mb-8">
                <p className="text-2xl font-semibold text-blue-whale-800 mb-4">
                  당신의 글과 문서로 가장 잘 어울리는 사람들과 연결합니다.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/login" className="btn-primary px-8 py-3 text-lg">
                  로그인
                </Link>
                <Link href="/register" className="btn-secondary px-8 py-3 text-lg">
                  회원가입
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
            
            <div className="mt-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-whale-600"></div>
                </div>
              ) : (
                <div>
                  {activeTab === 'for-you' && (
                    <div className="md:flex md:space-x-6">
                      <div className="md:w-3/4">
                        <PersonalizedContent />
                      </div>
                      <div className="md:w-1/4 mt-6 md:mt-0">
                        <SuggestedUsers />
                      </div>
                    </div>
                  )}
                  {activeTab === 'local' && (
                    <div className="md:flex md:space-x-6">
                      <div className="md:w-3/4">
                        <LocalContentView />
                      </div>
                      <div className="md:w-1/4 mt-6 md:mt-0">
                        <SuggestedUsers />
                      </div>
                    </div>
                  )}
                  {activeTab === 'global' && (
                    <div className="md:flex md:space-x-6">
                      <div className="md:w-3/4">
                        <GlobalTopContent />
                      </div>
                      <div className="md:w-1/4 mt-6 md:mt-0">
                        <SuggestedUsers />
                      </div>
                    </div>
                  )}
                  {activeTab === 'following' && (
                    <div className="md:flex md:space-x-6">
                      <div className="md:w-3/4">
                        <FollowingContent />
                      </div>
                      <div className="md:w-1/4 mt-6 md:mt-0">
                        <SuggestedUsers />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="fixed bottom-6 right-6">
              <Link href="/create" className="btn-primary flex items-center justify-center h-14 w-14 rounded-full shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
