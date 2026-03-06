const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validateRegister, validateLogin } = require('../middleware/validate.middleware');

// 회원가입
router.post('/register', validateRegister, authController.register);

// 로그인
router.post('/login', validateLogin, authController.login);

// 로그아웃
router.post('/logout', authMiddleware.verifyToken, authController.logout);

// 현재 사용자 정보 조회
router.get('/me', authMiddleware.verifyToken, authController.getCurrentUser);

module.exports = router;
