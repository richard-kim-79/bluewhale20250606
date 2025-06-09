import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://bluewhale-backend-env.eba-wehmnn34.ap-northeast-2.elasticbeanstalk.com';
    
    // 쿠키에서 토큰 가져오기
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    
    // 요청 헤더에 토큰 추가
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // 로컬 스토리지에서 토큰을 가져올 수 없으므로 클라이언트에서 처리해야 함
      return NextResponse.json(
        { error: 'Authentication token not found' },
        { status: 401 }
      );
    }
    
    const response = await fetch(`${apiUrl}/auth/me`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to get user data' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
