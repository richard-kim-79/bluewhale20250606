/**
 * 테스트 계정 확인 스크립트
 * 
 * 이 스크립트는 테스트 계정의 상태를 확인하고 필요한 경우 비밀번호를 재설정합니다.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB에 연결되었습니다'))
  .catch(err => {
    console.error('MongoDB 연결 오류:', err);
    process.exit(1);
  });

// User 모델 가져오기
const User = require('./src/models/user.model');

// 테스트 계정 확인 및 수정
async function checkAndFixTestAccount() {
  try {
    // 테스트 계정 찾기
    const testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      console.log('테스트 계정을 찾을 수 없습니다.');
      process.exit(1);
    }
    
    console.log('테스트 계정 정보:');
    console.log(`ID: ${testUser._id}`);
    console.log(`이름: ${testUser.name}`);
    console.log(`이메일: ${testUser.email}`);
    console.log(`비밀번호 해시: ${testUser.password.substring(0, 20)}...`);
    
    // 비밀번호 재설정
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    testUser.password = hashedPassword;
    await testUser.save();
    
    console.log('비밀번호가 재설정되었습니다.');
    console.log(`새 비밀번호 해시: ${testUser.password.substring(0, 20)}...`);
    
    // 비밀번호 검증 테스트
    const isValid = await bcrypt.compare('password123', testUser.password);
    console.log(`비밀번호 검증 테스트: ${isValid ? '성공' : '실패'}`);
    
    // 직접 comparePassword 메소드 테스트
    try {
      const isMethodValid = await testUser.comparePassword('password123');
      console.log(`comparePassword 메소드 테스트: ${isMethodValid ? '성공' : '실패'}`);
    } catch (error) {
      console.error('comparePassword 메소드 오류:', error);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('테스트 계정 확인 오류:', error);
    process.exit(1);
  }
}

checkAndFixTestAccount();
