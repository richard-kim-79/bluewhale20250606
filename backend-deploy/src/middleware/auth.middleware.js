const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Content = require('../models/content.model');
const Comment = require('../models/comment.model');

// JWT 토큰 검증 미들웨어
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 토큰에서 사용자 ID 추출
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    // 요청 객체에 사용자 정보 추가
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '인증 토큰이 만료되었습니다' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '유효하지 않은 토큰입니다' });
    }
    
    console.error('Token verification error:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 사용자 소유권 확인 미들웨어
exports.checkUserOwnership = (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // 요청한 사용자와 토큰의 사용자가 일치하는지 확인
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: '이 작업을 수행할 권한이 없습니다' });
    }
    
    next();
  } catch (error) {
    console.error('User ownership check error:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 콘텐츠 소유권 확인 미들웨어
exports.checkContentOwnership = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    
    const content = await Content.findById(contentId);
    
    if (!content) {
      return res.status(404).json({ message: '콘텐츠를 찾을 수 없습니다' });
    }
    
    // 콘텐츠 작성자와 요청 사용자가 일치하는지 확인
    if (content.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '이 작업을 수행할 권한이 없습니다' });
    }
    
    req.content = content;
    next();
  } catch (error) {
    console.error('Content ownership check error:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 댓글 소유권 확인 미들웨어
exports.checkCommentOwnership = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다' });
    }
    
    // 댓글 작성자와 요청 사용자가 일치하는지 확인
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '이 작업을 수행할 권한이 없습니다' });
    }
    
    req.comment = comment;
    next();
  } catch (error) {
    console.error('Comment ownership check error:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};
