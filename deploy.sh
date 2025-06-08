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
  fi
  
  # amplify.yml 파일이 없으면 생성
  if [ ! -f "amplify.yml" ]; then
    cat > amplify.yml << EOF
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - NEXT_PUBLIC_API_URL=$BACKEND_URL npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
EOF
  fi
  
  # .env.local 파일 생성
  cat > .env.local << EOF
NEXT_PUBLIC_API_URL=$BACKEND_URL
EOF
  
  # Amplify 프로젝트가 초기화되었는지 확인
  if [ ! -d "amplify" ]; then
    print_warning "Amplify 프로젝트가 초기화되지 않았습니다. 초기화 중..."
    echo '{"projectName":"bluewhale-frontend","version":"3.0","frontend":"javascript","javascript":{"framework":"react","config":{"SourceDir":"src","DistributionDir":".next","BuildCommand":"npm run build","StartCommand":"npm run start"}},"providers":["awscloudformation"]}' > ./amplify-config.json
    amplify init --app ./amplify-config.json
  fi
  
  # Amplify 호스팅 추가
  if ! amplify status | grep hosting &> /dev/null; then
    print_warning "Amplify 호스팅이 설정되지 않았습니다. 호스팅 추가 중..."
    echo '{"hosting":{"S3AndCloudFront":{"service":"S3AndCloudFront","providerPlugin":"awscloudformation"}}}' > ./amplify-hosting.json
    amplify add hosting --app ./amplify-hosting.json
  fi
  
  # S3 버킷 ACL 설정 확인
  S3_BUCKET="elasticbeanstalk-$REGION-$(aws sts get-caller-identity --query "Account" --output text)"
  print_warning "S3 버킷 ACL 설정 확인 중: $S3_BUCKET"
  
  # S3 버킷 소유권 설정 확인
  BUCKET_OWNERSHIP=$(aws s3api get-bucket-ownership-controls --bucket "$S3_BUCKET" 2>/dev/null || echo '{"OwnershipControls":{"Rules":[{"ObjectOwnership":"BucketOwnerEnforced"}]}}')
  OBJECT_OWNERSHIP=$(echo $BUCKET_OWNERSHIP | grep -o '"ObjectOwnership":"[^"]*"' | cut -d '"' -f 4)
  
  if [ "$OBJECT_OWNERSHIP" == "BucketOwnerEnforced" ]; then
    print_warning "S3 버킷이 ACL을 비활성화했습니다. ACL을 활성화하는 중..."
    aws s3api put-bucket-ownership-controls \
      --bucket "$S3_BUCKET" \
      --ownership-controls="Rules=[{ObjectOwnership=BucketOwnerPreferred}]"
    print_success "S3 버킷 ACL이 활성화되었습니다."
  else
    print_success "S3 버킷 ACL이 이미 활성화되어 있습니다."
  fi
  
  # 배포
  print_warning "프론트엔드 배포 중..."
  amplify publish --yes
  
  # 배포 URL 가져오기
  FRONTEND_URL=$(amplify status | grep -A 1 "Hosting" | tail -n 1 | awk '{print $3}')
  print_success "프론트엔드가 성공적으로 배포되었습니다: $FRONTEND_URL"
  
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
  echo "프론트엔드 URL: $(amplify status | grep -A 1 "Hosting" | tail -n 1 | awk '{print $3}')"
}

# 스크립트 실행
main
