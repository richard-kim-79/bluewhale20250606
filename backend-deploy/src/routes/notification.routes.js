const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');

// 사용자의 모든 알림 조회
router.get('/', authMiddleware.verifyToken, notificationController.getNotifications);

// 읽지 않은 알림 개수 조회
router.get('/unread-count', authMiddleware.verifyToken, notificationController.getUnreadCount);

// 모든 알림을 읽음 상태로 표시
router.put('/read-all', authMiddleware.verifyToken, notificationController.markAllAsRead);

// 특정 알림을 읽음 상태로 표시
router.put('/:notificationId/read', authMiddleware.verifyToken, notificationController.markAsRead);

module.exports = router;
