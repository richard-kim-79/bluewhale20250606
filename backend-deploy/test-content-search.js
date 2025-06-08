/**
 * 콘텐츠 검색 및 페이지네이션 테스트 스크립트
 * 
 * 이 스크립트는 Blue Whale Protocol API의 콘텐츠 검색 및 페이지네이션 기능을 테스트합니다.
 * 실행 방법: node test-content-search.js
 */

const axios = require('axios');
require('dotenv').config();

// API 기본 URL 설정
const API_URL = process.env.API_URL || 'http://localhost:3001';
let authToken = '';

// 콘솔 색상 설정
const colorize = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`
};

// 로그 함수
const log = {
  info: (msg) => console.log(colorize.blue(`[INFO] ${msg}`)),
  success: (msg) => console.log(colorize.green(`[SUCCESS] ${msg}`)),
  error: (msg) => console.log(colorize.red(`[ERROR] ${msg}`)),
  warning: (msg) => console.log(colorize.yellow(`[WARNING] ${msg}`)),
  result: (msg) => console.log(colorize.cyan(`[RESULT] ${msg}`)),
  data: (msg) => console.log(colorize.magenta(`[DATA] ${msg}`))
};

// API 호출 함수
async function callAPI(method, endpoint, data = null, token = null, params = null) {
  const startTime = Date.now();
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await axios({
      method,
      url: `${API_URL}${endpoint}`,
      data,
      headers,
      params
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      success: true,
      data: response.data,
      status: response.status,
      responseTime
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      success: false,
      error: error.response ? error.response.data : error.message,
      status: error.response ? error.response.status : 500,
      responseTime
    };
  }
}

// 로그인 함수
async function login() {
  log.info('테스트 계정으로 로그인 시도...');
  
  const loginResponse = await callAPI('post', '/auth/login', {
    email: 'test@example.com',
    password: 'password123'
  });
  
  if (!loginResponse.success) {
    log.error(`로그인 실패: ${JSON.stringify(loginResponse.error)}`);
    return false;
  }
  
  authToken = loginResponse.data.token;
  log.success(`로그인 성공, 토큰 획득: ${authToken.substring(0, 15)}...`);
  return true;
}

// 검색 결과 출력 함수
function printSearchResults(results, query, page, responseTime) {
  // API 응답 구조에 맞게 데이터 추출
  const contents = results.content || results.contents || [];
  const pagination = results.pagination || { total: 0, page: 1, pages: 1 };
  
  log.result(`검색어 "${query}" 결과 (페이지 ${page}/${pagination.pages || 1}, ${responseTime}ms):`);
  log.result(`총 ${pagination.total}개 중 ${contents.length}개 표시`);
  
  contents.forEach((content, index) => {
    const truncatedBody = content.body && content.body.length > 50 
      ? content.body.substring(0, 50) + '...' 
      : (content.body || 'No content');
    
    log.data(`${index + 1}. ${content.title} (${content.contentType})`);
    log.data(`   작성자: ${content.author?.name || 'Unknown'}, 태그: ${content.tags?.join(', ') || 'No tags'}`);
    log.data(`   내용: ${truncatedBody}`);
    log.data(`   좋아요: ${content.likes?.length || 0}, 조회수: ${content.views || 0}`);
    console.log(''); // 줄바꿈
  });
}

// 기본 검색 테스트
async function testBasicSearch() {
  log.info('기본 검색 테스트 시작...');
  
  const query = 'Blue Whale';
  const searchResponse = await callAPI('get', '/content/search', null, authToken, {
    query,
    page: 1,
    limit: 10
  });
  
  if (!searchResponse.success) {
    log.error(`검색 실패: ${JSON.stringify(searchResponse.error)}`);
    return false;
  }
  
  printSearchResults(searchResponse.data, query, 1, searchResponse.responseTime);
  return true;
}

// 페이지네이션 테스트
async function testPagination() {
  log.info('페이지네이션 테스트 시작...');
  
  // 모든 콘텐츠 가져오기 (페이지당 5개씩)
  const pages = [1, 2, 3];
  const limit = 5;
  const results = [];
  const query = 'a'; // 기본 검색어 사용 (모든 콘텐츠에 포함될 가능성이 높은 문자)
  
  for (const page of pages) {
    const response = await callAPI('get', '/content/search', null, authToken, {
      query,
      page,
      limit
    });
    
    if (!response.success) {
      log.error(`페이지 ${page} 가져오기 실패: ${JSON.stringify(response.error)}`);
      continue;
    }
    
    results.push({
      page,
      contents: response.data.content || [],
      pagination: response.data.pagination,
      responseTime: response.responseTime
    });
    
    log.success(`페이지 ${page} 가져오기 성공 (${response.responseTime}ms)`);
  }
  
  // 페이지네이션 검증
  let allContentIds = new Set();
  let hasDuplicates = false;
  
  results.forEach(result => {
    const { contents, page } = result;
    
    contents.forEach(content => {
      if (allContentIds.has(content._id)) {
        log.error(`중복 콘텐츠 발견: ${content._id} (페이지 ${page})`);
        hasDuplicates = true;
      } else {
        allContentIds.add(content._id);
      }
    });
    
    printSearchResults(result, '전체 콘텐츠', page, result.responseTime);
  });
  
  if (!hasDuplicates) {
    log.success('페이지네이션 검증 성공: 중복 콘텐츠 없음');
  }
  
  return !hasDuplicates;
}

// 태그 검색 테스트
async function testTagSearch() {
  log.info('태그 검색 테스트 시작...');
  
  const tag = '해양생물'; // 해양생물 태그
  const searchResponse = await callAPI('get', '/content/search', null, authToken, {
    query: 'a', // 기본 검색어 추가
    tags: tag,
    page: 1,
    limit: 10
  });
  
  if (!searchResponse.success) {
    log.error(`태그 검색 실패: ${JSON.stringify(searchResponse.error)}`);
    return false;
  }
  
  // API 응답 구조에 맞게 데이터 추출
  const contents = searchResponse.data.content || [];
  const pagination = searchResponse.data.pagination || { total: 0, page: 1, pages: 1 };
  
  log.result(`태그 "${tag}" 검색 결과:`);
  log.result(`총 ${pagination.total}개 중 ${contents.length}개 표시`);
  
  contents.forEach((content, index) => {
    log.data(`${index + 1}. ${content.title} (태그: ${content.tags?.join(', ') || 'No tags'})`);
  });
  
  return true;
}

// 콘텐츠 타입별 검색 테스트
async function testContentTypeSearch() {
  log.info('콘텐츠 타입별 검색 테스트 시작...');
  
  const contentTypes = ['article', 'question', 'discussion'];
  const results = [];
  
  for (const type of contentTypes) {
    const response = await callAPI('get', '/content/search', null, authToken, {
      query: 'a', // 기본 검색어 추가
      contentType: type,
      page: 1,
      limit: 5
    });
    
    if (!response.success) {
      log.error(`콘텐츠 타입 "${type}" 검색 실패: ${JSON.stringify(response.error)}`);
      continue;
    }
    
    // API 응답 구조에 맞게 데이터 추출
    const contents = response.data.content || [];
    const pagination = response.data.pagination || { total: 0, page: 1, pages: 1 };
    
    results.push({
      type,
      count: pagination.total,
      sample: contents.slice(0, 3)
    });
    
    log.success(`콘텐츠 타입 "${type}" 검색 성공: ${pagination.total}개 결과`);
  }
  
  log.result('콘텐츠 타입별 검색 결과:');
  results.forEach(result => {
    log.data(`${result.type}: 총 ${result.count}개`);
    result.sample.forEach((content, index) => {
      log.data(`  ${index + 1}. ${content.title}`);
    });
    console.log(''); // 줄바꿈
  });
  
  return true;
}

// 위치 기반 검색 테스트
async function testLocationSearch() {
  log.info('위치 기반 검색 테스트 시작...');
  
  // 서울 중심부 좌표
  const lng = 126.9779;
  const lat = 37.5665;
  const maxDistance = 10000; // 10km
  
  const searchResponse = await callAPI('get', '/content/search', null, authToken, {
    query: 'a', // 기본 검색어 추가
    lng,
    lat,
    maxDistance,
    page: 1,
    limit: 10
  });
  
  if (!searchResponse.success) {
    log.error(`위치 기반 검색 실패: ${JSON.stringify(searchResponse.error)}`);
    return false;
  }
  
  // API 응답 구조에 맞게 데이터 추출
  const contents = searchResponse.data.content || [];
  const pagination = searchResponse.data.pagination || { total: 0, page: 1, pages: 1 };
  
  log.result(`서울 중심부 반경 10km 내 콘텐츠 검색 결과:`);
  log.result(`총 ${pagination.total}개 중 ${contents.length}개 표시`);
  
  contents.forEach((content, index) => {
    const location = content.location || { coordinates: [0, 0], name: '알 수 없음' };
    log.data(`${index + 1}. ${content.title}`);
    log.data(`   위치: ${location.name || '이름 없음'} [${location.coordinates?.[1] || 0}, ${location.coordinates?.[0] || 0}]`);
  });
  
  return true;
}

// 메인 테스트 함수
async function runTests() {
  log.info('콘텐츠 검색 및 페이지네이션 테스트 시작');
  log.info(`API URL: ${API_URL}`);
  console.log('===================================');
  
  // 로그인
  if (!(await login())) {
    log.error('로그인 실패로 테스트를 중단합니다.');
    return;
  }
  
  console.log('-----------------------------------');
  
  // 테스트 실행
  const tests = [
    { name: '기본 검색', fn: testBasicSearch },
    { name: '페이지네이션', fn: testPagination },
    { name: '태그 검색', fn: testTagSearch },
    { name: '콘텐츠 타입별 검색', fn: testContentTypeSearch },
    { name: '위치 기반 검색', fn: testLocationSearch }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log('-----------------------------------');
    log.info(`${test.name} 테스트 시작...`);
    
    const startTime = Date.now();
    const success = await test.fn();
    const endTime = Date.now();
    
    results.push({
      name: test.name,
      success,
      time: endTime - startTime
    });
    
    if (success) {
      log.success(`${test.name} 테스트 성공 (${endTime - startTime}ms)`);
    } else {
      log.error(`${test.name} 테스트 실패 (${endTime - startTime}ms)`);
    }
  }
  
  // 결과 요약
  console.log('===================================');
  log.info('테스트 결과 요약');
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  
  results.forEach(result => {
    const status = result.success ? colorize.green('✓') : colorize.red('✗');
    console.log(`${status} ${result.name} (${result.time}ms)`);
  });
  
  const successRate = (passedTests / totalTests) * 100;
  log.result(`총 테스트: ${totalTests}`);
  log.success(`성공: ${passedTests}`);
  log.error(`실패: ${totalTests - passedTests}`);
  log.result(`성공률: ${successRate.toFixed(2)}%`);
}

// 테스트 실행
runTests();
