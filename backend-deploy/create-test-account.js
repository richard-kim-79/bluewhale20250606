/**
 * 테스트 계정 생성 스크립트
 * 
 * 이 스크립트는 Blue Whale Protocol API 테스트를 위한 테스트 계정을 생성합니다.
 * 실행 방법: node create-test-account.js
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

// 테스트 계정 생성
async function createTestAccount() {
  try {
    // 이미 존재하는지 확인
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('테스트 계정이 이미 존재합니다');
      console.log(`사용자 ID: ${existingUser._id}`);
      process.exit(0);
    }
    
    // 비밀번호 해시화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // 새 사용자 생성
    const newUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      bio: '테스트 계정입니다',
      avatarUrl: 'https://via.placeholder.com/150',
      location: {
        type: 'Point',
        coordinates: [127.0276, 37.4979] // 서울 강남 좌표
      }
    });
    
    await newUser.save();
    console.log('테스트 계정이 생성되었습니다');
    console.log(`사용자 ID: ${newUser._id}`);
    
    // 두 번째 테스트 계정 생성 (팔로우 테스트용)
    const existingUser2 = await User.findOne({ email: 'test2@example.com' });
    
    if (!existingUser2) {
      const hashedPassword2 = await bcrypt.hash('password123', salt);
      
      const newUser2 = new User({
        name: 'Test User 2',
        email: 'test2@example.com',
        password: hashedPassword2,
        bio: '두 번째 테스트 계정입니다',
        avatarUrl: 'https://via.placeholder.com/150',
        location: {
          type: 'Point',
          coordinates: [127.0276, 37.5979] // 서울 강남 좌표 (약간 북쪽)
        }
      });
      
      await newUser2.save();
      console.log('두 번째 테스트 계정이 생성되었습니다');
      console.log(`사용자 ID: ${newUser2._id}`);
    } else {
      console.log('두 번째 테스트 계정이 이미 존재합니다');
      console.log(`사용자 ID: ${existingUser2._id}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('테스트 계정 생성 오류:', error);
    process.exit(1);
  }
}

createTestAccount();
