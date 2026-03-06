// 입력 검증 미들웨어

// 회원가입 검증
exports.validateRegister = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호는 필수입니다' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: '올바른 이메일 형식이 아닙니다' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: '비밀번호는 최소 8자 이상이어야 합니다' });
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ message: '비밀번호는 영문자와 숫자를 포함해야 합니다' });
  }

  next();
};

// 로그인 검증
exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호는 필수입니다' });
  }

  next();
};

// 콘텐츠 생성 검증
exports.validateCreateContent = (req, res, next) => {
  const { title, contentType } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: '제목은 필수입니다' });
  }

  if (title.length > 200) {
    return res.status(400).json({ message: '제목은 200자를 초과할 수 없습니다' });
  }

  const validTypes = ['text', 'pdf', 'article', 'question', 'discussion', 'review', 'news'];
  if (contentType && !validTypes.includes(contentType)) {
    return res.status(400).json({ message: '유효하지 않은 콘텐츠 타입입니다' });
  }

  next();
};

// 댓글 작성 검증
exports.validateComment = (req, res, next) => {
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: '댓글 내용은 필수입니다' });
  }

  if (content.length > 1000) {
    return res.status(400).json({ message: '댓글은 1000자를 초과할 수 없습니다' });
  }

  next();
};

// MongoDB ObjectId 검증
exports.validateObjectId = (paramName) => (req, res, next) => {
  const id = req.params[paramName];
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({ message: '유효하지 않은 ID 형식입니다' });
  }
  next();
};

// 페이지네이션 파라미터 정리
exports.sanitizePagination = (req, res, next) => {
  if (req.query.page) {
    req.query.page = Math.max(1, parseInt(req.query.page) || 1);
  }
  if (req.query.limit) {
    req.query.limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  }
  next();
};
