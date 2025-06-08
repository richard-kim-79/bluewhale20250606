# Blue Whale Protocol

"지역 기반의 실시간 지식과 AI가 검증한 글로벌 인사이트를 연결하는 탈중앙화 프로토콜"

## 프로젝트 개요

Blue Whale Protocol은 위치 기반 정보와 AI 검증 시스템을 결합한 지식 공유 플랫폼입니다. 사용자들은 텍스트와 PDF 문서를 업로드하고, 이 콘텐츠는 위치 정보와 AI 참조 가치에 기반하여 다른 사용자들에게 노출됩니다.

## MVP 핵심 기능

- 회원가입 및 인증 (이메일/비밀번호)
- 콘텐츠 생성 (텍스트 작성 및 PDF 업로드)
- 위치 기반 콘텐츠 태깅
- 위치 기반 및 AI 참조 점수 기반의 피드 알고리즘
- 콘텐츠 영구 링크 및 공개 조회
- AI 기반 콘텐츠 처리 파이프라인 (요약, 벡터 임베딩)
- 의미 기반 검색 API

## 기술 스택

### 프론트엔드
- React (Next.js)

### 백엔드 (Serverless)
- AWS API Gateway
- AWS Lambda (Node.js)
- Amazon DynamoDB
- Amazon S3
- Amazon OpenSearch (벡터 검색)

### AI / MLOps
- Hugging Face Inference Endpoints
  - 요약 모델: sshleifer/distilbart-cnn-12-6
  - 임베딩 모델: sentence-transformers/all-MiniLM-L6-v2

### CI/CD
- GitHub Actions

## 개발 환경 설정

프로젝트 설정 및 로컬 개발 환경 구성에 관한 지침은 [SETUP.md](./SETUP.md)를 참조하세요.

## 프로젝트 구조

```
bluewhale/
├── frontend/            # Next.js 프론트엔드 애플리케이션
├── backend/             # AWS Lambda 함수 및 서버리스 구성
│   ├── auth/            # 인증 관련 Lambda 함수
│   ├── content/         # 콘텐츠 처리 Lambda 함수
│   ├── search/          # 검색 API Lambda 함수
│   └── ai-pipeline/     # AI 처리 파이프라인 Lambda 함수
└── infrastructure/      # IaC (Infrastructure as Code) 파일
```

## 배포

배포 프로세스 및 환경 설정에 관한 지침은 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참조하세요.
