/**
 * Blue Whale Protocol API 테스트 스크립트
 * 
 * 이 스크립트는 주요 API 엔드포인트의 응답 시간, 에러 처리, 페이지네이션 등을 테스트합니다.
 * 실행 방법: node api-test.js
 */

const axios = require('axios');
// chalk v5부터는 ESM 전용이므로 CommonJS에서 사용하기 위한 설정
const chalk = require('chalk');

// chalk가 작동하지 않을 경우를 대비한 폴백 함수
const colorize = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

// API 기본 URL 설정
const API_URL = process.env.API_URL || 'http://localhost:3001';
let authToken = '';

// 테스트 결과 저장
const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// 유틸리티 함수
const log = {
  info: (msg) => console.log(colorize.blue(`[INFO] ${msg}`)),
  success: (msg) => console.log(colorize.green(`[SUCCESS] ${msg}`)),
  error: (msg) => console.log(colorize.red(`[ERROR] ${msg}`)),
  warning: (msg) => console.log(colorize.yellow(`[WARNING] ${msg}`)),
  result: (msg) => console.log(colorize.cyan(`[RESULT] ${msg}`))
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

// 테스트 실행 함수
async function runTest(name, testFn) {
  log.info(`테스트 시작: ${name}`);
  testResults.total++;
  
  try {
    const result = await testFn();
    if (result.success) {
      testResults.passed++;
      log.success(`테스트 성공: ${name} (${result.responseTime}ms)`);
      if (result.message) {
        log.result(result.message);
      }
    } else {
      testResults.failed++;
      log.error(`테스트 실패: ${name} (${result.responseTime}ms)`);
      log.error(`실패 이유: ${result.message}`);
    }
  } catch (error) {
    testResults.failed++;
    log.error(`테스트 오류: ${name}`);
    log.error(`오류 내용: ${error.message}`);
  }
  
  console.log('-----------------------------------');
}

// 테스트 케이스 정의
const tests = {
  // 1. 인증 테스트
  async testLogin() {
    // 테스트 계정으로 로그인
    const loginResponse = await callAPI('post', '/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.success) {
      return {
        success: false,
        responseTime: loginResponse.responseTime,
        message: `로그인 실패: ${JSON.stringify(loginResponse.error)}`
      };
    }
    
    // 토큰 저장
    if (loginResponse.data && loginResponse.data.token) {
      authToken = loginResponse.data.token;
    } else {
      return {
        success: false,
        responseTime: loginResponse.responseTime,
        message: '토큰이 응답에 포함되지 않음'
      };
    }
    
    return {
      success: true,
      responseTime: loginResponse.responseTime,
      message: `로그인 성공, 토큰 획득: ${authToken.substring(0, 15)}...`
    };
  },
  
  // 2. 콘텐츠 검색 테스트
  async testContentSearch() {
    // 페이지네이션 파라미터 테스트
    const searchResponse = await callAPI('get', '/content/search', null, null, {
      query: 'test',
      page: 1,
      limit: 10
    });
    
    if (!searchResponse.success) {
      return {
        success: false,
        responseTime: searchResponse.responseTime,
        message: `콘텐츠 검색 실패: ${JSON.stringify(searchResponse.error)}`
      };
    }
    
    // 페이지네이션 메타데이터 검증
    const pagination = searchResponse.data.pagination;
    if (!pagination || !pagination.hasOwnProperty('total') || 
        !pagination.hasOwnProperty('page') || !pagination.hasOwnProperty('pages')) {
      return {
        success: false,
        responseTime: searchResponse.responseTime,
        message: '페이지네이션 메타데이터 누락'
      };
    }
    
    return {
      success: true,
      responseTime: searchResponse.responseTime,
      message: `콘텐츠 검색 성공: ${searchResponse.data.content ? searchResponse.data.content.length : 0}개 결과, 총 ${pagination.total}개, ${pagination.pages}페이지`
    };
  },
  
  // 3. 사용자 검색 테스트
  async testUserSearch() {
    const searchResponse = await callAPI('get', '/users/search', null, null, {
      query: 'test',
      page: 1,
      limit: 10
    });
    
    if (!searchResponse.success) {
      return {
        success: false,
        responseTime: searchResponse.responseTime,
        message: `사용자 검색 실패: ${JSON.stringify(searchResponse.error)}`
      };
    }
    
    // 페이지네이션 메타데이터 검증
    const pagination = searchResponse.data.pagination;
    if (!pagination || !pagination.hasOwnProperty('total') || 
        !pagination.hasOwnProperty('page') || !pagination.hasOwnProperty('pages')) {
      return {
        success: false,
        responseTime: searchResponse.responseTime,
        message: '페이지네이션 메타데이터 누락'
      };
    }
    
    return {
      success: true,
      responseTime: searchResponse.responseTime,
      message: `사용자 검색 성공: ${searchResponse.data.users ? searchResponse.data.users.length : 0}개 결과, 총 ${pagination.total}개, ${pagination.pages}페이지`
    };
  },
  
  // 4. 인증 토큰 검증 테스트
  async testTokenValidation() {
    // 유효하지 않은 토큰으로 요청
    const invalidTokenResponse = await callAPI('get', '/auth/me', null, 'invalid_token');
    
    if (invalidTokenResponse.success) {
      return {
        success: false,
        responseTime: invalidTokenResponse.responseTime,
        message: '유효하지 않은 토큰이 허용됨'
      };
    }
    
    // 올바른 상태 코드 확인 (401 예상)
    if (invalidTokenResponse.status !== 401) {
      return {
        success: false,
        responseTime: invalidTokenResponse.responseTime,
        message: `잘못된 상태 코드: ${invalidTokenResponse.status}, 예상: 401`
      };
    }
    
    return {
      success: true,
      responseTime: invalidTokenResponse.responseTime,
      message: '토큰 검증 정상 작동'
    };
  },
  
  // 5. 에러 처리 테스트 - 잘못된 검색 파라미터
  async testErrorHandling() {
    // 검색어 없이 검색 요청
    const errorResponse = await callAPI('get', '/content/search', null, null, {
      page: 1,
      limit: 10
    });
    
    // 적절한 에러 응답 확인 (400 예상)
    if (errorResponse.status !== 400) {
      return {
        success: false,
        responseTime: errorResponse.responseTime,
        message: `잘못된 상태 코드: ${errorResponse.status}, 예상: 400`
      };
    }
    
    return {
      success: true,
      responseTime: errorResponse.responseTime,
      message: '에러 처리 정상 작동'
    };
  },
  
  // 6. 페이지네이션 일관성 테스트
  async testPaginationConsistency() {
    // 첫 페이지 요청
    const page1Response = await callAPI('get', '/content', null, null, {
      page: 1,
      limit: 5
    });
    
    if (!page1Response.success) {
      return {
        success: false,
        responseTime: page1Response.responseTime,
        message: `첫 페이지 요청 실패: ${JSON.stringify(page1Response.error)}`
      };
    }
    
    // 두 번째 페이지 요청
    const page2Response = await callAPI('get', '/content', null, null, {
      page: 2,
      limit: 5
    });
    
    if (!page2Response.success) {
      return {
        success: false,
        responseTime: page2Response.responseTime,
        message: `두 번째 페이지 요청 실패: ${JSON.stringify(page2Response.error)}`
      };
    }
    
    // 페이지네이션 일관성 확인
    const page1Items = page1Response.data.content;
    const page2Items = page2Response.data.content;
    
    // 중복 항목 확인
    if (page1Items && page2Items) {
      const page1Ids = page1Items.map(item => item._id);
      const page2Ids = page2Items.map(item => item._id);
      
      const duplicates = page1Ids.filter(id => page2Ids.includes(id));
      
      if (duplicates.length > 0) {
        return {
          success: false,
          responseTime: page2Response.responseTime,
          message: `페이지 간 중복 항목 발견: ${duplicates.length}개`
        };
      }
    }
    
    return {
      success: true,
      responseTime: page1Response.responseTime + page2Response.responseTime,
      message: '페이지네이션 일관성 확인 완료'
    };
  },
  
  // 7. 응답 시간 테스트
  async testResponseTime() {
    const startTime = Date.now();
    
    // 여러 API 요청 실행
    const endpoints = [
      { method: 'get', url: '/content', params: { page: 1, limit: 10 } },
      { method: 'get', url: '/users/search', params: { query: 'test', page: 1, limit: 10 } },
      { method: 'get', url: '/content/search', params: { query: 'test', page: 1, limit: 10 } }
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      const response = await callAPI(endpoint.method, endpoint.url, null, null, endpoint.params);
      results.push({
        url: endpoint.url,
        responseTime: response.responseTime,
        success: response.success
      });
    }
    
    // 응답 시간 분석
    const totalTime = Date.now() - startTime;
    const avgTime = results.reduce((sum, item) => sum + item.responseTime, 0) / results.length;
    const maxTime = Math.max(...results.map(item => item.responseTime));
    
    // 응답 시간이 너무 긴 경우 경고
    const slowThreshold = 500; // 500ms
    const slowEndpoints = results.filter(item => item.responseTime > slowThreshold);
    
    if (slowEndpoints.length > 0) {
      return {
        success: true, // 느리더라도 실패로 처리하지 않음
        responseTime: totalTime,
        message: `응답 시간 분석: 평균 ${avgTime.toFixed(2)}ms, 최대 ${maxTime}ms\n경고: ${slowEndpoints.length}개 엔드포인트가 ${slowThreshold}ms보다 느림\n${slowEndpoints.map(e => `${e.url}: ${e.responseTime}ms`).join('\n')}`
      };
    }
    
    return {
      success: true,
      responseTime: totalTime,
      message: `응답 시간 분석: 평균 ${avgTime.toFixed(2)}ms, 최대 ${maxTime}ms`
    };
  }
};

// 메인 함수
async function main() {
  log.info('Blue Whale Protocol API 테스트 시작');
  log.info(`API URL: ${API_URL}`);
  console.log('===================================');
  
  // 테스트 실행
  await runTest('로그인 및 토큰 획득', tests.testLogin);
  await runTest('콘텐츠 검색 및 페이지네이션', tests.testContentSearch);
  await runTest('사용자 검색 및 페이지네이션', tests.testUserSearch);
  await runTest('인증 토큰 검증', tests.testTokenValidation);
  await runTest('에러 처리', tests.testErrorHandling);
  await runTest('페이지네이션 일관성', tests.testPaginationConsistency);
  await runTest('API 응답 시간', tests.testResponseTime);
  
  // 결과 요약
  console.log('===================================');
  log.info('테스트 결과 요약');
  log.result(`총 테스트: ${testResults.total}`);
  log.success(`성공: ${testResults.passed}`);
  log.error(`실패: ${testResults.failed}`);
  log.result(`성공률: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
}

// 스크립트 실행
main().catch(error => {
  log.error('테스트 실행 중 오류 발생');
  log.error(error.message);
});
