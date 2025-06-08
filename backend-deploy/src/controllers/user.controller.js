const User = require('../models/user.model');
const Content = require('../models/content.model');
const Notification = require('../models/notification.model');

// 사용자 검색
exports.searchUsers = async (req, res) => {
  try {
    const { query, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    let searchQuery = {};
    
    if (query) {
      searchQuery = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      };
    }
    
    const users = await User.find(searchQuery)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(searchQuery);
    
    res.status(200).json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 사용자 프로필 조회
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    // 팔로워 및 팔로잉 수 계산
    const followersCount = user.followers.length;
    const followingCount = user.following.length;
    
    // 작성한 콘텐츠 수 계산
    const contentCount = await Content.countDocuments({ author: userId });
    
    res.status(200).json({
      user,
      stats: {
        followersCount,
        followingCount,
        contentCount
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 사용자 프로필 업데이트
exports.updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, bio, avatarUrl, location } = req.body;
    
    // 업데이트할 필드 설정
    const updateFields = {};
    
    if (name) updateFields.name = name;
    if (bio) updateFields.bio = bio;
    if (avatarUrl) updateFields.avatarUrl = avatarUrl;
    if (location) updateFields.location = location;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    res.status(200).json({
      message: '프로필이 업데이트되었습니다',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 사용자 팔로우
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    
    // 자기 자신을 팔로우할 수 없음
    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: '자기 자신을 팔로우할 수 없습니다' });
    }
    
    const userToFollow = await User.findById(userId);
    
    if (!userToFollow) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    // 이미 팔로우 중인지 확인
    if (userToFollow.followers.includes(currentUserId)) {
      return res.status(400).json({ message: '이미 팔로우 중인 사용자입니다' });
    }
    
    // 팔로우 관계 업데이트
    await User.findByIdAndUpdate(userId, {
      $push: { followers: currentUserId }
    });
    
    await User.findByIdAndUpdate(currentUserId, {
      $push: { following: userId }
    });
    
    // 알림 생성
    const notification = new Notification({
      recipient: userId,
      sender: currentUserId,
      type: 'follow',
      message: `${req.user.name}님이 회원님을 팔로우합니다`
    });
    
    await notification.save();
    
    res.status(200).json({ message: '사용자를 팔로우했습니다' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 사용자 언팔로우
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    
    // 자기 자신을 언팔로우할 수 없음
    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: '자기 자신을 언팔로우할 수 없습니다' });
    }
    
    const userToUnfollow = await User.findById(userId);
    
    if (!userToUnfollow) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    // 팔로우 중인지 확인
    if (!userToUnfollow.followers.includes(currentUserId)) {
      return res.status(400).json({ message: '팔로우 중인 사용자가 아닙니다' });
    }
    
    // 팔로우 관계 업데이트
    await User.findByIdAndUpdate(userId, {
      $pull: { followers: currentUserId }
    });
    
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: userId }
    });
    
    res.status(200).json({ message: '사용자 팔로우를 취소했습니다' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 사용자의 팔로워 목록 조회
exports.getUserFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    const followers = await User.find({ _id: { $in: user.followers } })
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = user.followers.length;
    
    res.status(200).json({
      followers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user followers error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 사용자의 팔로잉 목록 조회
exports.getUserFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    const following = await User.find({ _id: { $in: user.following } })
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = user.following.length;
    
    res.status(200).json({
      following,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user following error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 사용자가 작성한 콘텐츠 조회
exports.getUserContent = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    const content = await Content.find({ author: userId })
      .populate('author', '-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Content.countDocuments({ author: userId });
    
    res.status(200).json({
      content,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user content error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};
