import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://bluewhale-backend-env.eba-wehmnn34.ap-northeast-2.elasticbeanstalk.com';
    
    // 쿠키에서 토큰 가져오기
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    
    // 클라이언트 측 localStorage에서 토큰을 가져올 수 없으므로
    // 요청 헤더에서 Authorization 토큰을 추출
    const authHeader = request.headers.get('Authorization');
    const authToken = token || (authHeader ? authHeader.replace('Bearer ', '') : '');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication token not found' },
        { status: 401 }
      );
    }
    
    // FormData 추출
    const formData = await request.formData();
    console.log('FormData received:', Array.from(formData.entries()).map(([key, value]) => {
      if (value instanceof File) {
        return [key, { name: value.name, type: value.type, size: value.size }];
      }
      return [key, value];
    }));
    
    // 백엔드 API로 요청 전달
    const response = await fetch(`${apiUrl}/content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        // Content-Type은 설정하지 않음 (multipart/form-data를 위해 브라우저가 자동 설정)
      },
      body: formData,
    });
    
    const data = await response.json();
    console.log('Backend response:', data);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to create content' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Content creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
