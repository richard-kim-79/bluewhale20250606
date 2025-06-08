const Notification = require('../models/notification.model');

// 사용자의 모든 알림 조회
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'name avatarUrl')
      .populate('contentId', 'title')
      .populate('commentId', 'content')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments({ recipient: userId });

    res.status(200).json({
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 읽지 않은 알림 개수 조회
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({ recipient: userId, read: false });
    res.status(200).json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 모든 알림을 읽음 상태로 표시
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany({ recipient: userId, read: false }, { $set: { read: true } });
    res.status(200).json({ message: '모든 알림을 읽음 처리했습니다' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 특정 알림을 읽음 상태로 표시
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: '알림을 찾을 수 없습니다' });
    }
    res.status(200).json({ message: '알림을 읽음 처리했습니다', notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};
