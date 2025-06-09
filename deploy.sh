#!/bin/bash

# Blue Whale Protocol 배포 자동화 스크립트
# 작성자: Richard Kim
# 날짜: 2025-06-07

set -e  # 오류 발생 시 스크립트 중단

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 설정 변수
PROJECT_ROOT="$(pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
EB_ENV_NAME="bluewhale-backend-env"
AMPLIFY_ENV_NAME="dev"
REGION="ap-northeast-2"
# .env 파일에서 환경 변수 로드
if [ -f "$BACKEND_DIR/.env" ]; then
  MONGODB_URI=$(grep MONGODB_URI "$BACKEND_DIR/.env" | cut -d '=' -f2)
  JWT_SECRET=$(grep JWT_SECRET "$BACKEND_DIR/.env" | cut -d '=' -f2)
else
  MONGODB_URI="mongodb://localhost:27017/bluewhale"
  JWT_SECRET="bluewhale_secret_key_change_in_production"
fi

# 함수 정의
print_header() {
  echo -e "\n${BLUE}===========================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}===========================================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
  exit 1
}

print_warning() {
  echo -e "${YELLOW}! $1${NC}"
}

check_command() {
  if ! command -v $1 &> /dev/null; then
    print_error "$1 명령어를 찾을 수 없습니다. 설치 후 다시 시도하세요."
  fi
}

# 필요한 명령어 확인
print_header "필요한 도구 확인 중..."
check_command aws
check_command eb
check_command amplify
check_command node
check_command npm
print_success "모든 필요한 도구가 설치되어 있습니다."

# AWS 자격 증명 확인
print_header "AWS 자격 증명 확인 중..."
if ! aws sts get-caller-identity &> /dev/null; then
  print_error "AWS 자격 증명이 설정되지 않았습니다. 'aws configure'를 실행하여 설정하세요."
fi
print_success "AWS 자격 증명이 설정되어 있습니다."

# 백엔드 배포
deploy_backend() {
  print_header "백엔드 배포 시작..."
  cd "$BACKEND_DIR"
  
  # .elasticbeanstalk 디렉토리가 없으면 초기화
  if [ ! -d ".elasticbeanstalk" ]; then
    print_warning ".elasticbeanstalk 디렉토리가 없습니다. Elastic Beanstalk 초기화 중..."
    
    # Git 저장소가 아니면 초기화
    if [ ! -d ".git" ]; then
      git init
      git add .
      git config --global user.email "richard_bluewhale@example.com"
      git config --global user.name "Richard Kim"
      git commit -m "Initial commit for Elastic Beanstalk deployment"
    fi
    
    # eb init 명령어를 위한 설정 파일 생성
    mkdir -p .elasticbeanstalk
    cat > .elasticbeanstalk/config.yml << EOF
branch-defaults:
  default:
    environment: $EB_ENV_NAME
    group_suffix: null
global:
  application_name: bluewhale-backend
  branch: null
  default_ec2_keyname: null
  default_platform: Node.js 18
  default_region: $REGION
  include_git_submodules: true
  instance_profile: null
  platform_name: null
  platform_version: null
  profile: null
  repository: null
  sc: git
  workspace_type: Application
EOF
  fi

  # .ebextensions 디렉토리가 없으면 생성
  if [ ! -d ".ebextensions" ]; then
    mkdir -p .ebextensions
    cat > .ebextensions/01-environment.config << EOF
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8080
EOF
  fi

  # 환경이 존재하는지 확인
  if eb status "$EB_ENV_NAME" &> /dev/null; then
    print_warning "환경 '$EB_ENV_NAME'이(가) 이미 존재합니다. 업데이트합니다..."
    eb deploy "$EB_ENV_NAME"
  else
    print_warning "환경 '$EB_ENV_NAME'이(가) 존재하지 않습니다. 새로 생성합니다..."
    eb create "$EB_ENV_NAME" --region "$REGION" --timeout 20
  fi

  # 환경 변수 설정
  print_warning "환경 변수를 설정합니다..."
  eb setenv NODE_ENV=production MONGODB_URI="$MONGODB_URI" JWT_SECRET="$JWT_SECRET"

  # 배포 URL 가져오기
  BACKEND_URL=$(eb status "$EB_ENV_NAME" | grep CNAME | awk '{print $2}')
  if [ -z "$BACKEND_URL" ]; then
    print_error "백엔드 URL을 가져올 수 없습니다."
  fi
  BACKEND_URL="http://$BACKEND_URL"
  print_success "백엔드가 성공적으로 배포되었습니다: $BACKEND_URL"
  
  # 프론트엔드에서 사용할 수 있도록 백엔드 URL 저장
  echo "$BACKEND_URL" > "$PROJECT_ROOT/.backend_url"
  
  cd "$PROJECT_ROOT"
}

# 프론트엔드 배포
deploy_frontend() {
  print_header "프론트엔드 배포 시작..."
  cd "$FRONTEND_DIR"
  
  # 백엔드 URL 가져오기
  BACKEND_URL=$(cat "$PROJECT_ROOT/.backend_url")
  if [ -z "$BACKEND_URL" ]; then
    print_error "백엔드 URL을 찾을 수 없습니다. 백엔드 배포를 먼저 실행하세요."
    return 1
  fi
  
  # .env.local 파일 생성
  cat > .env.local << EOF
NEXT_PUBLIC_API_URL=$BACKEND_URL
EOF
  print_success ".env.local 파일이 생성되었습니다."
  
  # 루트 디렉토리에 있는 amplify 폴더 삭제 (중첩 Amplify 프로젝트 문제 방지)
  if [ -d "$PROJECT_ROOT/amplify" ]; then
    print_warning "루트 디렉토리에 amplify 폴더가 있습니다. 삭제 중..."
    rm -rf "$PROJECT_ROOT/amplify"
    print_success "루트 amplify 폴더가 삭제되었습니다."
  fi
  
  # Next.js 앱 빌드
  print_warning "Next.js 앱 빌드 중..."
  npm run build --no-lint
  
  if [ $? -ne 0 ]; then
    print_error "Next.js 앱 빌드에 실패했습니다."
    return 1
  fi
  
  print_success "Next.js 앱 빌드가 완료되었습니다."
  
  # 빌드 결과물 압축
  print_warning "빌드 결과물 압축 중..."
  cd "$FRONTEND_DIR"
  ZIP_FILE="$PROJECT_ROOT/frontend-build.zip"
  
  # 기존 zip 파일 삭제
  if [ -f "$ZIP_FILE" ]; then
    rm "$ZIP_FILE"
  fi
  
  # .next 폴더 압축
  zip -r "$ZIP_FILE" .next
  
  if [ $? -ne 0 ]; then
    print_error "빌드 결과물 압축에 실패했습니다."
    return 1
  fi
  
  print_success "빌드 결과물이 압축되었습니다: $ZIP_FILE"
  
  # AWS CLI를 사용하여 Amplify 앱 배포
  print_warning "AWS CLI를 사용하여 Amplify 앱 배포 중..."
  
  # 새로운 Amplify 앱 생성 (기존 앱에 문제가 있는 경우)
  AMPLIFY_APP_NAME="bluewhale-frontend-$(date +%Y%m%d%H%M%S)"
  AMPLIFY_APP_RESPONSE=$(aws amplify create-app \
    --name "$AMPLIFY_APP_NAME" \
    --platform WEB \
    --region "$REGION")
  
  AMPLIFY_APP_ID=$(echo "$AMPLIFY_APP_RESPONSE" | grep -o '"appId": "[^"]*"' | cut -d '"' -f4)
  
  if [ -z "$AMPLIFY_APP_ID" ]; then
    print_error "Amplify 앱 생성에 실패했습니다."
    return 1
  fi
  
  print_success "새로운 Amplify 앱이 생성되었습니다. 앱 ID: $AMPLIFY_APP_ID"
  
  # 브랜치 생성
  aws amplify create-branch \
    --app-id "$AMPLIFY_APP_ID" \
    --branch-name "main" \
    --framework "NEXTJS" \
    --stage "PRODUCTION" \
    --region "$REGION"
  
  print_success "'main' 브랜치가 생성되었습니다."
  
  # 환경 변수 설정
  aws amplify update-app \
    --app-id "$AMPLIFY_APP_ID" \
    --environment-variables "NEXT_PUBLIC_API_URL=$BACKEND_URL" \
    --region "$REGION"
  
  print_success "환경 변수가 설정되었습니다."
  
  # Next.js SSR을 위한 빌드 스펙 설정
  aws amplify update-app \
    --app-id "$AMPLIFY_APP_ID" \
    --build-spec "version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
  customHeaders:
    - pattern: '**/*'
      headers:
        - key: 'Cache-Control'
          value: 'public, max-age=0, must-revalidate'" \
    --region "$REGION"
  
  print_success "빌드 스펙이 설정되었습니다."
  
  # Next.js SSR을 위한 향상된 라우팅 규칙 설정
  aws amplify update-app \
    --app-id "$AMPLIFY_APP_ID" \
    --custom-rules "[{\"source\":\"/_next/static/<*>\",\"target\":\"/_next/static/<*>\",\"status\":\"200\"},{\"source\":\"/_next/data/<*>\",\"target\":\"/_next/data/<*>\",\"status\":\"200\"},{\"source\":\"/api/<*>\",\"target\":\"/api/<*>\",\"status\":\"200\"},{\"source\":\"/<*>\",\"target\":\"/index.html\",\"status\":\"200\"}]" \
    --region "$REGION"
  
  print_success "라우팅 규칙이 설정되었습니다."
  
  # 수동 배포를 위한 안내
  print_warning "AWS Amplify 콘솔에서 다음 단계를 수행하세요:"
  echo "1. AWS Amplify 콘솔에 접속: https://ap-northeast-2.console.aws.amazon.com/amplify/home?region=ap-northeast-2#/$AMPLIFY_APP_ID"
  echo "2. 'Hosting environments' 탭으로 이동"
  echo "3. 'main' 브랜치 선택"
  echo "4. 'Deploy without Git provider' 선택"
  echo "5. 'Choose files' 버튼을 클릭하고 '$ZIP_FILE' 파일 업로드"
  echo "6. 'Save and deploy' 버튼 클릭"
  
  # 배포 URL 저장
  FRONTEND_URL="https://main.$(aws amplify get-app --app-id "$AMPLIFY_APP_ID" --region "$REGION" --query "app.defaultDomain" --output text)"
  echo "$FRONTEND_URL" > "$PROJECT_ROOT/.frontend_url"
  print_success "배포가 완료되면 다음 URL로 접속할 수 있습니다: $FRONTEND_URL"
  
  cd "$PROJECT_ROOT"
}

# 메인 실행 함수
main() {
  print_header "Blue Whale Protocol 배포 자동화 시작"
  
  # 백엔드 배포
  deploy_backend
  
  # 프론트엔드 배포
  deploy_frontend
  
  print_header "배포가 완료되었습니다!"
  echo "백엔드 URL: $(cat "$PROJECT_ROOT/.backend_url")"
  
  if [ -f "$PROJECT_ROOT/.frontend_url" ]; then
    echo "프론트엔드 URL: $(cat "$PROJECT_ROOT/.frontend_url")"
  else
    echo "프론트엔드 URL: 배포 정보를 찾을 수 없습니다."
  fi
}

# 스크립트 실행
main
