const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

// 사용자 검색
router.get('/search', userController.searchUsers);

// 사용자 프로필 조회
router.get('/:userId', userController.getUserProfile);

// 사용자 프로필 업데이트
router.put('/:userId', authMiddleware.verifyToken, authMiddleware.checkUserOwnership, userController.updateUserProfile);

// 사용자 팔로우
router.post('/:userId/follow', authMiddleware.verifyToken, userController.followUser);

// 사용자 언팔로우
router.delete('/:userId/follow', authMiddleware.verifyToken, userController.unfollowUser);

// 사용자의 팔로워 목록 조회
router.get('/:userId/followers', userController.getUserFollowers);

// 사용자의 팔로잉 목록 조회
router.get('/:userId/following', userController.getUserFollowing);

// 사용자가 작성한 콘텐츠 조회
router.get('/:userId/content', userController.getUserContent);

module.exports = router;
