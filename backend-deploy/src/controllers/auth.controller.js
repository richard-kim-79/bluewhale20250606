const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// 회원가입
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ message: '이미 등록된 이메일입니다' });
    }
    
    // 사용자 이름 생성 (이메일 앞부분)
    const name = email.split('@')[0];
    
    // 새 사용자 생성
    const user = new User({
      email,
      password,
      name
    });
    
    await user.save();
    
    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: '회원가입이 완료되었습니다',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`로그인 시도: ${email}`);
    
    // 이메일로 사용자 찾기
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`사용자 없음: ${email}`);
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }
    
    console.log(`사용자 찾음: ${user._id}`);
    
    // 비밀번호 확인
    try {
      const isPasswordValid = await user.comparePassword(password);
      
      console.log(`비밀번호 검증 결과: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다' });
      }
    } catch (pwError) {
      console.error('비밀번호 검증 오류:', pwError);
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }
    
    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'bluewhale-secret-key', // 기본값 제공
      { expiresIn: '7d' }
    );
    
    console.log(`로그인 성공: ${user._id}`);
    
    res.status(200).json({
      message: '로그인 성공',
      user: user.toJSON(), // 명시적으로 toJSON 호출
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 로그아웃
exports.logout = async (req, res) => {
  // JWT는 클라이언트 측에서 제거하므로 서버에서는 특별한 작업이 필요 없음
  // 필요한 경우 토큰 블랙리스트 구현 가능
  res.status(200).json({ message: '로그아웃 성공' });
};

// 현재 사용자 정보 조회
exports.getCurrentUser = async (req, res) => {
  try {
    // req.user는 auth.middleware.js에서 설정됨
    res.status(200).json(req.user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};
