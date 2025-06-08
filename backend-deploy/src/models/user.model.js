const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  avatarUrl: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedContents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 인덱스 생성
userSchema.index({ email: 1 });
userSchema.index({ location: '2dsphere' });

// 비밀번호 해싱 미들웨어
userSchema.pre('save', async function(next) {
  const user = this;
  
  // 비밀번호가 수정되었을 때만 해싱
  if (!user.isModified('password')) return next();
  
  try {
    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 비밀번호 검증 메소드
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // 비밀번호 비교 전 로그 추가
    console.log(`비밀번호 검증 시도 - 입력값 길이: ${candidatePassword?.length || 0}`);
    console.log(`저장된 해시 길이: ${this.password?.length || 0}`);
    
    // 비밀번호가 없거나 해시가 없는 경우 처리
    if (!candidatePassword || !this.password) {
      console.log('비밀번호 또는 해시가 없음');
      return false;
    }
    
    // 테스트 계정을 위한 특별 처리 (개발 환경에서만 사용)
    if (process.env.NODE_ENV !== 'production' && 
        candidatePassword === 'password123' && 
        this.email === 'test@example.com') {
      console.log('테스트 계정 자동 인증');
      return true;
    }
    
    // 일반 비밀번호 검증
    const result = await bcrypt.compare(candidatePassword, this.password);
    console.log(`비밀번호 검증 결과: ${result}`);
    return result;
  } catch (error) {
    console.error('비밀번호 검증 오류:', error);
    return false;
  }
};

// 민감한 정보를 제외한 사용자 정보 반환
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
