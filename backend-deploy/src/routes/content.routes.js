const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const contentController = require('../controllers/content.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validateCreateContent, validateComment, validateObjectId, sanitizePagination } = require('../middleware/validate.middleware');

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // PDF 파일만 허용
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('지원하지 않는 파일 형식입니다. PDF만 업로드 가능합니다.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB 제한
});

// 모든 콘텐츠 조회 (페이지네이션 포함)
router.get('/', sanitizePagination, contentController.getAllContent);

// 글로벌 인기 콘텐츠 조회
router.get('/global-top', sanitizePagination, contentController.getGlobalTopContent);

// 위치 기반 콘텐츠 조회
router.get('/local', sanitizePagination, contentController.getLocalContent);

// 개인화된 콘텐츠 조회
router.get('/personalized', authMiddleware.verifyToken, sanitizePagination, contentController.getPersonalizedContent);

// 콘텐츠 검색
router.get('/search', sanitizePagination, contentController.searchContent);

// 콘텐츠 생성
router.post('/', authMiddleware.verifyToken, upload.single('file'), validateCreateContent, contentController.createContent);

// 특정 콘텐츠 조회
router.get('/:contentId', validateObjectId('contentId'), contentController.getContentById);

// 콘텐츠 수정
router.put('/:contentId', authMiddleware.verifyToken, validateObjectId('contentId'), authMiddleware.checkContentOwnership, contentController.updateContent);

// 콘텐츠 삭제
router.delete('/:contentId', authMiddleware.verifyToken, validateObjectId('contentId'), authMiddleware.checkContentOwnership, contentController.deleteContent);

// 콘텐츠 좋아요
router.post('/:contentId/like', authMiddleware.verifyToken, validateObjectId('contentId'), contentController.likeContent);

// 콘텐츠 좋아요 취소
router.delete('/:contentId/like', authMiddleware.verifyToken, validateObjectId('contentId'), contentController.unlikeContent);

// 콘텐츠 저장 (북마크)
router.post('/:contentId/save', authMiddleware.verifyToken, validateObjectId('contentId'), contentController.saveContent);

// 콘텐츠 저장 취소 (북마크 제거)
router.delete('/:contentId/save', authMiddleware.verifyToken, validateObjectId('contentId'), contentController.unsaveContent);

// 저장된 콘텐츠 조회
router.get('/saved', authMiddleware.verifyToken, sanitizePagination, contentController.getSavedContent);

// 콘텐츠에 댓글 작성
router.post('/:contentId/comments', authMiddleware.verifyToken, validateObjectId('contentId'), validateComment, contentController.addComment);

// 콘텐츠의 댓글 조회
router.get('/:contentId/comments', validateObjectId('contentId'), sanitizePagination, contentController.getComments);

// 댓글 수정
router.put('/:contentId/comments/:commentId', authMiddleware.verifyToken, validateObjectId('contentId'), validateObjectId('commentId'), authMiddleware.checkCommentOwnership, contentController.updateComment);

// 댓글 삭제
router.delete('/:contentId/comments/:commentId', authMiddleware.verifyToken, validateObjectId('contentId'), validateObjectId('commentId'), authMiddleware.checkCommentOwnership, contentController.deleteComment);

module.exports = router;
