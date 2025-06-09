import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
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
    }
    
    const response = await fetch(`${apiUrl}/content/${id}`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to fetch content' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Content fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
