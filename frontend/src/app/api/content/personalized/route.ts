import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://bluewhale-backend-env.eba-wehmnn34.ap-northeast-2.elasticbeanstalk.com';
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    const authHeader = request.headers.get('Authorization');
    const authToken = token || (authHeader ? authHeader.replace('Bearer ', '') : '');

    if (!authToken) {
      return NextResponse.json({ error: 'Authentication token not found' }, { status: 401 });
    }

    // 쿼리 파라미터 전달
    const url = new URL(`${apiUrl}/content/personalized`);
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      // credentials: 'include' // 필요시
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying personalized content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
