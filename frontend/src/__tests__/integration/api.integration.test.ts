import axios from 'axios';

describe('BlueWhale API Integration', () => {
  const API_BASE = 'http://localhost:3001';
  let token: string;
  let userId: string;
  let contentId: string;

  it('회원가입 및 로그인', async () => {
    const email = `test${Date.now()}@bluewhale.com`;
    const password = 'bluewhale123';

    // 회원가입
    const regRes = await axios.post(`${API_BASE}/auth/register`, { email, password });
    expect(regRes.data.user.email).toBe(email);

    // 로그인
    const loginRes = await axios.post(`${API_BASE}/auth/login`, { email, password });
    expect(loginRes.data.token).toBeDefined();
    token = loginRes.data.token;
    userId = loginRes.data.user._id;
  });

  it('내 정보 조회', async () => {
    const meRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(meRes.data.email).toBeDefined();
  });

  it('콘텐츠 생성 및 글로벌 피드 조회', async () => {
    // 콘텐츠 생성
    const createRes = await axios.post(`${API_BASE}/content`, {
      title: '테스트 글',
      body: '이것은 테스트 본문입니다.',
      contentType: 'article'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(createRes.data.content.title).toBe('테스트 글');
    contentId = createRes.data.content._id;

    // 글로벌 피드 조회
    const globalRes = await axios.get(`${API_BASE}/content/global-top`);
    expect(globalRes.data.content.length).toBeGreaterThan(0);
  });

  it('팔로우/언팔로우', async () => {
    // 다른 사용자 생성
    const email2 = `test${Date.now()}2@bluewhale.com`;
    const password2 = 'bluewhale123';
    const reg2 = await axios.post(`${API_BASE}/auth/register`, { email: email2, password: password2 });
    const userId2 = reg2.data.user._id;

    // 팔로우
    const followRes = await axios.post(`${API_BASE}/users/${userId2}/follow`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(followRes.data.message).toContain('팔로우');

    // 언팔로우
    const unfollowRes = await axios.delete(`${API_BASE}/users/${userId2}/follow`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(unfollowRes.data.message).toContain('취소');
  });

  it('알림 목록 및 읽음 처리', async () => {
    const notifRes = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(Array.isArray(notifRes.data.notifications)).toBe(true);

    // (알림이 있으면) 읽음 처리
    if (notifRes.data.notifications.length > 0) {
      const notifId = notifRes.data.notifications[0]._id;
      const markRes = await axios.put(`${API_BASE}/notifications/${notifId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(markRes.data.notification.read).toBe(true);
    }
  });
});
