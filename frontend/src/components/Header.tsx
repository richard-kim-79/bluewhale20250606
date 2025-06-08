'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-whale-700">
                BlueWhale
              </Link>
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link href="/search" className="text-gray-600 hover:text-blue-whale-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-whale-500"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-whale-600 flex items-center justify-center text-white">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  
                  {isMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        내 프로필
                      </Link>
                      <Link href="/my-content" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        내 콘텐츠
                      </Link>
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-gray-600 hover:text-blue-whale-700">
                  로그인
                </Link>
                <Link href="/register" className="btn-primary">
                  회원가입
                </Link>
              </div>
            )}
          </div>
          
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-whale-500"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        {isAuthenticated ? (
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/profile" className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">
              내 프로필
            </Link>
            <Link href="/my-content" className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">
              내 콘텐츠
            </Link>
            <Link href="/search" className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">
              검색
            </Link>
            <button
              onClick={logout}
              className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/login" className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">
              로그인
            </Link>
            <Link href="/register" className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">
              회원가입
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
