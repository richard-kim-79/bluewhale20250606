import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../contexts/AuthContext';
import BottomNavigation from '../components/BottomNavigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '블루웨일 프로토콜',
  description: '지역 기반의 실시간 지식과 AI가 검증한 글로벌 인사이트를 연결하는 탈중앙화 프로토콜',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${inter.className} pb-16`}>
        <AuthProvider>
          {children}
          <BottomNavigation />
        </AuthProvider>
      </body>
    </html>
  );
}
