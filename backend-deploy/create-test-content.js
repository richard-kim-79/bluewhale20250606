/**
 * 테스트용 콘텐츠 데이터 생성 스크립트
 * 
 * 이 스크립트는 Blue Whale Protocol API 테스트를 위한 테스트 콘텐츠를 생성합니다.
 * 실행 방법: node create-test-content.js
 */

const mongoose = require('mongoose');
const faker = require('faker');
require('dotenv').config();

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB에 연결되었습니다'))
  .catch(err => {
    console.error('MongoDB 연결 오류:', err);
    process.exit(1);
  });

// 모델 가져오기
const User = require('./src/models/user.model');
const Content = require('./src/models/content.model');

// 한국어 설정
faker.locale = 'ko';

// 태그 목록
const tags = [
  '해양생물', '환경보호', '해양오염', '해양정책', '해양과학', 
  '해양교육', '해양생태계', '해양보존', '해양연구', '해양기술',
  '고래', '돌고래', '상어', '산호초', '해파리', '거북이', '문어',
  '기후변화', '플라스틱', '지속가능성', '바다', '해양', '생물다양성'
];

// 콘텐츠 타입
const contentTypes = ['text', 'article', 'question', 'discussion', 'review', 'news'];

// 서울 주변 좌표 (위도, 경도 범위)
const seoulArea = {
  minLat: 37.4,
  maxLat: 37.7,
  minLng: 126.8,
  maxLng: 127.2
};

// 랜덤 좌표 생성
function getRandomLocation() {
  const lat = seoulArea.minLat + Math.random() * (seoulArea.maxLat - seoulArea.minLat);
  const lng = seoulArea.minLng + Math.random() * (seoulArea.maxLng - seoulArea.minLng);
  
  return {
    type: 'Point',
    coordinates: [lng, lat], // MongoDB는 [경도, 위도] 순서
    name: `${faker.address.city()} ${faker.address.streetName()}`
  };
}

// 랜덤 태그 선택 (1~5개)
function getRandomTags() {
  const shuffled = [...tags].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * 5) + 1);
}

// 랜덤 콘텐츠 타입 선택
function getRandomContentType() {
  return contentTypes[Math.floor(Math.random() * contentTypes.length)];
}

// 테스트 콘텐츠 생성
async function createTestContent() {
  try {
    // 기존 콘텐츠 수 확인
    const existingCount = await Content.countDocuments();
    console.log(`기존 콘텐츠 수: ${existingCount}`);
    
    if (existingCount > 0) {
      const proceed = process.argv.includes('--force');
      if (!proceed) {
        console.log('이미 콘텐츠가 존재합니다. 기존 콘텐츠를 유지하고 추가 생성합니다.');
        console.log('모든 콘텐츠를 삭제하고 새로 생성하려면 --force 옵션을 사용하세요.');
      } else {
        console.log('기존 콘텐츠를 모두 삭제합니다...');
        await Content.deleteMany({});
        console.log('기존 콘텐츠가 삭제되었습니다.');
      }
    }
    
    // 사용자 목록 가져오기
    const users = await User.find({});
    
    if (users.length === 0) {
      console.error('사용자가 없습니다. 먼저 테스트 계정을 생성해주세요.');
      process.exit(1);
    }
    
    console.log(`${users.length}명의 사용자를 찾았습니다.`);
    
    // 생성할 콘텐츠 수
    const contentCount = process.argv[2] ? parseInt(process.argv[2]) : 50;
    console.log(`${contentCount}개의 콘텐츠를 생성합니다...`);
    
    // 콘텐츠 생성
    const contents = [];
    
    for (let i = 0; i < contentCount; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const contentType = getRandomContentType();
      
      const content = new Content({
        title: faker.lorem.sentence().substring(0, 100),
        body: faker.lorem.paragraphs(Math.floor(Math.random() * 5) + 1),
        contentType: contentType,
        author: randomUser._id,
        location: getRandomLocation(),
        tags: getRandomTags(),
        aiScore: Math.floor(Math.random() * 100),
        views: Math.floor(Math.random() * 1000),
        createdAt: faker.date.between('2024-01-01', '2025-06-07')
      });
      
      // 특정 키워드가 포함된 콘텐츠 생성 (검색 테스트용)
      if (i < 10) {
        content.title = `Blue Whale ${content.title}`;
      }
      if (i >= 10 && i < 20) {
        content.body = `${content.body} Blue Whale Protocol 관련 내용입니다.`;
      }
      if (i >= 20 && i < 30) {
        content.tags.push('BlueWhale');
      }
      
      contents.push(content);
    }
    
    // 콘텐츠 저장
    await Content.insertMany(contents);
    
    console.log(`${contentCount}개의 콘텐츠가 생성되었습니다.`);
    
    // 생성된 콘텐츠 통계
    const contentStats = await Content.aggregate([
      {
        $group: {
          _id: "$contentType",
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n콘텐츠 타입별 통계:');
    contentStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count}개`);
    });
    
    // 검색 테스트
    console.log('\n검색 테스트:');
    const searchResults = await Content.find(
      { $text: { $search: "Blue Whale" } },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(5);
    
    console.log(`"Blue Whale" 검색 결과: ${searchResults.length}개`);
    searchResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title} (${result.contentType})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('콘텐츠 생성 오류:', error);
    process.exit(1);
  }
}

createTestContent();
