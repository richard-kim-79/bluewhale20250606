'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('authToken');
      
      if (token && storedUser) {
        try {
          // 개발 환경에서는 로컬 스토리지의 사용자 정보를 그대로 사용
          if (process.env.NODE_ENV === 'development' && token.startsWith('test-token-')) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            // Verify token validity by fetching current user
            const userData = await authAPI.getCurrentUser();
            setUser(userData);
            setIsAuthenticated(true);
          }
        } catch (error) {
          // Token invalid or expired
          console.error('Error fetching current user:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      
      setLoading(false);
    };

    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { user, token } = response;
      
      // Store token and user data
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
      
      // 개발 환경에서 테스트 계정 로그인 허용
      if (process.env.NODE_ENV === 'development') {
        // 테스트 계정 확인 (테스트 계정: test@bluewhale.com / bluewhale123)
        if (email === 'test@bluewhale.com' && password === 'bluewhale123') {
          console.log('개발 환경에서 테스트 계정으로 로그인합니다.');
          
          // 테스트용 사용자 데이터 생성
          const testUser = {
            id: 'test-user-id-123',
            email: 'test@bluewhale.com',
            name: '테스트 사용자',
            bio: '이것은 개발 환경에서 사용하는 테스트 계정입니다.',
            avatarUrl: undefined,
            createdAt: new Date().toISOString()
          };
          
          // 테스트용 토큰 생성
          const testToken = 'test-token-' + Math.random().toString(36).substring(2);
          
          // 로컬 스토리지에 저장
          localStorage.setItem('authToken', testToken);
          localStorage.setItem('user', JSON.stringify(testUser));
          
          setUser(testUser);
          setIsAuthenticated(true);
          return;
        }
      }
      
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await authAPI.register(email, password);
      const { user, token } = response;
      
      // Store token and user data
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Registration failed:', error);
      
      // 개발 환경에서 테스트 계정 등록 허용
      if (process.env.NODE_ENV === 'development') {
        console.log('개발 환경에서 테스트 계정을 등록합니다.');
        
        // 테스트용 사용자 데이터 생성
        const testUser = {
          id: 'test-user-id-' + Math.random().toString(36).substring(2),
          email: email,
          name: email.split('@')[0],
          bio: '이것은 개발 환경에서 생성된 테스트 계정입니다.',
          avatarUrl: undefined,
          createdAt: new Date().toISOString()
        };
        
        // 테스트용 토큰 생성
        const testToken = 'test-token-' + Math.random().toString(36).substring(2);
        
        // 로컬 스토리지에 저장
        localStorage.setItem('authToken', testToken);
        localStorage.setItem('user', JSON.stringify(testUser));
        
        setUser(testUser);
        setIsAuthenticated(true);
        return;
      }
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      // 개발 환경에서는 API 호출 건너뛰기
      if (process.env.NODE_ENV !== 'development') {
        // Call logout API endpoint
        await authAPI.logout();
      } else {
        console.log('개발 환경에서 로그아웃합니다.');
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear user data from localStorage and state
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
