const Content = require('../models/content.model');
const Comment = require('../models/comment.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

// 모든 콘텐츠 조회 (페이지네이션 포함)
exports.getAllContent = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const content = await Content.find()
      .populate('author', '-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Content.countDocuments();
    
    res.status(200).json({
      data: content,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all content error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 글로벌 인기 콘텐츠 조회
exports.getGlobalTopContent = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // 좋아요 수, 조회수, 댓글 수 등을 기준으로 인기 콘텐츠 정렬
    const content = await Content.aggregate([
      {
        $addFields: {
          likesCount: { $size: '$likes' },
          commentsCount: { $size: '$comments' },
          score: { 
            $add: [
              { $multiply: [{ $size: '$likes' }, 3] }, // 좋아요는 가중치 3
              { $multiply: [{ $size: '$comments' }, 2] }, // 댓글은 가중치 2
              '$views' // 조회수는 가중치 1
            ]
          }
        }
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);
    
    // 작성자 정보 채우기
    await Content.populate(content, { path: 'author', select: '-password' });
    
    const total = await Content.countDocuments();
    
    res.status(200).json({
      data: content,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get global top content error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 위치 기반 콘텐츠 조회
exports.getLocalContent = async (req, res) => {
  try {
    const { longitude, latitude, radius = 10, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    if (!longitude || !latitude) {
      return res.status(400).json({ message: '위치 정보가 필요합니다' });
    }
    
    // 위치 기반 검색 (반경 내 콘텐츠)
    const content = await Content.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius) * 1000 // 반경 (km -> m)
        }
      }
    })
      .populate('author', '-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Content.countDocuments({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius) * 1000
        }
      }
    });
    
    res.status(200).json({
      data: content,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get local content error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 개인화된 콘텐츠 조회
exports.getPersonalizedContent = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;
    
    // 사용자가 팔로우하는 작성자의 콘텐츠 가져오기
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    // 사용자의 위치 정보
    const userLocation = user.location;
    
    // 1. 팔로우 중인 작성자의 콘텐츠
    // 2. 사용자 위치 근처의 콘텐츠
    // 3. 사용자가 좋아요한 콘텐츠와 유사한 콘텐츠
    // 이 세 가지를 조합하여 개인화된 콘텐츠 제공
    
    let personalizedContent = [];
    
    // 팔로우 중인 작성자의 콘텐츠
    if (user.following.length > 0) {
      const followingContent = await Content.find({ author: { $in: user.following } })
        .populate('author', '-password')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) * 2); // 더 많이 가져와서 나중에 필터링
      
      personalizedContent = personalizedContent.concat(followingContent);
    }
    
    // 사용자 위치 근처의 콘텐츠 (위치 정보가 있는 경우)
    if (userLocation && userLocation.coordinates[0] !== 0 && userLocation.coordinates[1] !== 0) {
      const localContent = await Content.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: userLocation.coordinates
            },
            $maxDistance: 10000 // 10km 반경
          }
        },
        author: { $ne: userId } // 자신의 콘텐츠 제외
      })
        .populate('author', '-password')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
      
      personalizedContent = personalizedContent.concat(localContent);
    }
    
    // 중복 제거 및 정렬
    const uniqueContentMap = new Map();
    personalizedContent.forEach(content => {
      uniqueContentMap.set(content._id.toString(), content);
    });
    
    const uniqueContent = Array.from(uniqueContentMap.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // 페이지네이션 적용
    const paginatedContent = uniqueContent.slice(skip, skip + parseInt(limit));
    
    res.status(200).json({
      data: paginatedContent,
      pagination: {
        total: uniqueContent.length,
        page: parseInt(page),
        pages: Math.ceil(uniqueContent.length / limit)
      }
    });
  } catch (error) {
    console.error('Get personalized content error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 콘텐츠 검색
exports.searchContent = async (req, res) => {
  try {
    console.log('Search API called with query params:', req.query);
    console.log('Request URL:', req.originalUrl);
    
    const { 
      query, 
      page = 1, 
      limit = 10,
      tags,
      contentType,
      sort = 'relevance',
      lat,
      lon, // lng 대신 lon으로 파라미터 이름 통일
      lng, // lon 외에도 lng 파라미터도 지원
      radius = 10 // 기본 반경 10km
    } = req.query;
    const skip = (page - 1) * limit;
    
    console.log(`Query: ${query}, Page: ${page}, Limit: ${limit}, Tags: ${tags}, ContentType: ${contentType}, Sort: ${sort}`);
    console.log(`Location params - Lat: ${lat}, Lon: ${lon}, Lng: ${lng}, Radius: ${radius}km`);
    
    if (!query) {
      return res.status(400).json({ message: '검색어가 필요합니다' });
    }
    
    // MongoDB 집계 파이프라인 구성
    let pipeline = [];
    
    // 1. 텍스트 검색 스테이지
    pipeline.push({
      $match: { $text: { $search: query } }
    });
    
    // 2. 텍스트 검색 점수 추가
    pipeline.push({
      $addFields: {
        score: { $meta: "textScore" }
      }
    });
    
    // 3. 태그 필터링
    if (tags) {
      try {
        const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        if (tagArray.length > 0) {
          pipeline.push({
            $match: { tags: { $in: tagArray } }
          });
          console.log('Tag filter applied:', tagArray);
        }
      } catch (err) {
        console.error('Tag filtering error:', err);
      }
    }
    
    // 4. 콘텐츠 타입 필터링
    if (contentType) {
      try {
        const contentTypeArray = contentType.split(',').map(type => type.trim()).filter(type => type.length > 0);
        if (contentTypeArray.length > 0) {
          pipeline.push({
            $match: { contentType: { $in: contentTypeArray } }
          });
          console.log('Content type filter applied:', contentTypeArray);
        }
      } catch (err) {
        console.error('Content type filtering error:', err);
      }
    }
    
    // 5. 위치 기반 필터링
    if (lat && (lon || lng)) {
      try {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon || lng); // lon 또는 lng 사용
        const radiusValue = parseInt(radius) || 10;
        
        console.log(`Processing location filter - Parsed values: Lat: ${latitude}, Lon: ${longitude}, Radius: ${radiusValue}km`);
        
        if (!isNaN(latitude) && !isNaN(longitude)) {
          // $near 대신 $geoWithin과 $centerSphere 사용
          // $centerSphere는 [경도, 위도, 반경(라디안)] 형식을 사용
          // 1 라디안 = 약 6371km (지구 반경)
          const radiusInRadians = radiusValue / 6371; // km를 라디안으로 변환
          
          pipeline.push({
            $match: {
              location: {
                $geoWithin: {
                  $centerSphere: [
                    [longitude, latitude],
                    radiusInRadians
                  ]
                }
              }
            }
          });
          console.log(`Location filter applied using $geoWithin: [${longitude}, ${latitude}], radius: ${radiusValue}km (${radiusInRadians} radians)`);
        } else {
          console.log('Invalid location coordinates, skipping location filter');
        }
      } catch (err) {
        console.error('Location filtering error:', err);
      }
    }
    
    // 6. likes 배열 길이 계산 필드 추가
    pipeline.push({
      $addFields: {
        likesCount: { $size: "$likes" }
      }
    });
    
    // 7. 정렬 옵션 설정
    let sortStage = {};
    switch (sort) {
      case 'date':
        sortStage = { $sort: { createdAt: -1 } };
        break;
      case 'aiScore':
        sortStage = { $sort: { aiScore: -1, createdAt: -1 } };
        break;
      case 'views':
        sortStage = { $sort: { views: -1, createdAt: -1 } };
        break;
      case 'likes':
        sortStage = { $sort: { likesCount: -1, createdAt: -1 } };
        break;
      case 'relevance':
      default:
        sortStage = { $sort: { score: -1, createdAt: -1 } };
        break;
    }
    pipeline.push(sortStage);
    
    // 8. 검색 결과 수 계산을 위한 파이프라인 복사
    const countPipeline = [...pipeline];
    
    // 9. 페이지네이션 적용
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });
    
    console.log('Aggregation pipeline:', JSON.stringify(pipeline));
    
    // 10. 집계 파이프라인 실행
    const content = await Content.aggregate(pipeline);
    
    // 11. 작성자 정보 채우기
    await Content.populate(content, { path: 'author', select: '-password' });
    
    // 12. 전체 결과 수 계산
    const countResult = await Content.aggregate([...countPipeline, { $count: 'total' }]);
    const total = countResult.length > 0 ? countResult[0].total : 0;
      
    return res.status(200).json({
      data: content,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search content error:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 콘텐츠 생성
exports.createContent = async (req, res) => {
  try {
    const { title, contentType } = req.body;
    const userId = req.user._id;
    
    // 새 콘텐츠 객체 생성
    const contentData = {
      title,
      contentType,
      author: userId
    };
    
    // 콘텐츠 타입에 따라 본문 처리
    if (contentType === 'text') {
      contentData.body = req.body.textContent;
    } else if (contentType === 'pdf' && req.file) {
      // 파일 처리 로직이 필요함 (multer 미들웨어 사용 필요)
      contentData.fileUrl = req.file.path; // 파일 저장 경로
      contentData.fileName = req.file.originalname;
    }
    
    // 위치 정보 처리
    if (req.body.latitude && req.body.longitude) {
      contentData.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
    }
    
    // 태그 처리 (있는 경우)
    if (req.body.tags) {
      try {
        contentData.tags = JSON.parse(req.body.tags);
      } catch (e) {
        // 태그 파싱 실패 시 무시
        console.log('Tags parsing failed:', e);
      }
    }
    
    console.log('Creating content with data:', contentData);
    
    // 새 콘텐츠 생성
    const newContent = new Content(contentData);
    
    await newContent.save();
    
    // 작성자 정보 채우기
    await newContent.populate('author', '-password');
    
    res.status(201).json({
      message: '콘텐츠가 생성되었습니다',
      content: newContent
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 특정 콘텐츠 조회
exports.getContentById = async (req, res) => {
  try {
    const { contentId } = req.params;
    
    const content = await Content.findById(contentId)
      .populate('author', '-password')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: '-password'
        }
      });
    
    if (!content) {
      return res.status(404).json({ message: '콘텐츠를 찾을 수 없습니다' });
    }
    
    // 조회수 증가
    content.views += 1;
    await content.save();
    
    res.status(200).json(content);
  } catch (error) {
    console.error('Get content by ID error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 콘텐츠 수정
exports.updateContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { title, body, contentType, location, tags } = req.body;
    
    // 업데이트할 필드 설정
    const updateFields = {};
    
    if (title) updateFields.title = title;
    if (body) updateFields.body = body;
    if (contentType) updateFields.contentType = contentType;
    if (location) updateFields.location = location;
    if (tags) updateFields.tags = tags;
    
    const updatedContent = await Content.findByIdAndUpdate(
      contentId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('author', '-password');
    
    if (!updatedContent) {
      return res.status(404).json({ message: '콘텐츠를 찾을 수 없습니다' });
    }
    
    res.status(200).json({
      message: '콘텐츠가 업데이트되었습니다',
      content: updatedContent
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 콘텐츠 삭제
exports.deleteContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    
    const deletedContent = await Content.findByIdAndDelete(contentId);
    
    if (!deletedContent) {
      return res.status(404).json({ message: '콘텐츠를 찾을 수 없습니다' });
    }
    
    // 관련 댓글 삭제
    await Comment.deleteMany({ contentId });
    
    // 관련 알림 삭제
    await Notification.deleteMany({ contentId });
    
    res.status(200).json({ message: '콘텐츠가 삭제되었습니다' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 콘텐츠 좋아요
exports.likeContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user._id;
    
    const content = await Content.findById(contentId);
    
    if (!content) {
      return res.status(404).json({ message: '콘텐츠를 찾을 수 없습니다' });
    }
    
    // 이미 좋아요를 눌렀는지 확인
    if (content.likes.includes(userId)) {
      return res.status(400).json({ message: '이미 좋아요를 누른 콘텐츠입니다' });
    }
    
    // 좋아요 추가
    content.likes.push(userId);
    await content.save();
    
    // 알림 생성 (자신의 콘텐츠가 아닌 경우에만)
    if (content.author.toString() !== userId.toString()) {
      const notification = new Notification({
        recipient: content.author,
        sender: userId,
        type: 'like',
        contentId,
        message: `${req.user.name}님이 회원님의 콘텐츠를 좋아합니다`
      });
      
      await notification.save();
    }
    
    res.status(200).json({ message: '콘텐츠에 좋아요를 눌렀습니다' });
  } catch (error) {
    console.error('Like content error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 콘텐츠 좋아요 취소
exports.unlikeContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user._id;
    
    const content = await Content.findById(contentId);
    
    if (!content) {
      return res.status(404).json({ message: '콘텐츠를 찾을 수 없습니다' });
    }
    
    // 좋아요를 누른 적이 있는지 확인
    if (!content.likes.includes(userId)) {
      return res.status(400).json({ message: '좋아요를 누르지 않은 콘텐츠입니다' });
    }
    
    // 좋아요 제거
    content.likes = content.likes.filter(id => id.toString() !== userId.toString());
    await content.save();
    
    res.status(200).json({ message: '콘텐츠 좋아요를 취소했습니다' });
  } catch (error) {
    console.error('Unlike content error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 콘텐츠에 댓글 작성
exports.addComment = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { content: commentText } = req.body;
    const userId = req.user._id;
    
    const content = await Content.findById(contentId);
    
    if (!content) {
      return res.status(404).json({ message: '콘텐츠를 찾을 수 없습니다' });
    }
    
    // 새 댓글 생성
    const newComment = new Comment({
      content: commentText,
      author: userId,
      contentId
    });
    
    await newComment.save();
    
    // 콘텐츠에 댓글 추가
    content.comments.push(newComment._id);
    await content.save();
    
    // 작성자 정보 채우기
    await newComment.populate('author', '-password');
    
    // 알림 생성 (자신의 콘텐츠가 아닌 경우에만)
    if (content.author.toString() !== userId.toString()) {
      const notification = new Notification({
        recipient: content.author,
        sender: userId,
        type: 'comment',
        contentId,
        commentId: newComment._id,
        message: `${req.user.name}님이 회원님의 콘텐츠에 댓글을 남겼습니다`
      });
      
      await notification.save();
    }
    
    res.status(201).json({
      message: '댓글이 작성되었습니다',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 콘텐츠의 댓글 조회
exports.getComments = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const content = await Content.findById(contentId);
    
    if (!content) {
      return res.status(404).json({ message: '콘텐츠를 찾을 수 없습니다' });
    }
    
    const comments = await Comment.find({ contentId })
      .populate('author', '-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Comment.countDocuments({ contentId });
    
    res.status(200).json({
      comments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 댓글 수정
exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content: commentText } = req.body;
    
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { $set: { content: commentText } },
      { new: true, runValidators: true }
    ).populate('author', '-password');
    
    if (!updatedComment) {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다' });
    }
    
    res.status(200).json({
      message: '댓글이 업데이트되었습니다',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 댓글 삭제
exports.deleteComment = async (req, res) => {
  try {
    const { contentId, commentId } = req.params;
    
    const deletedComment = await Comment.findByIdAndDelete(commentId);
    
    if (!deletedComment) {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다' });
    }
    
    // 콘텐츠에서 댓글 제거
    await Content.findByIdAndUpdate(contentId, {
      $pull: { comments: commentId }
    });
    
    // 관련 알림 삭제
    await Notification.deleteMany({ commentId });
    
    res.status(200).json({ message: '댓글이 삭제되었습니다' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 콘텐츠 저장 (북마크)
exports.saveContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user._id;
    
    // 콘텐츠 존재 확인
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: '콘텐츠를 찾을 수 없습니다' });
    }
    
    // 이미 저장된 콘텐츠인지 확인
    const user = await User.findById(userId);
    if (user.savedContents && user.savedContents.includes(contentId)) {
      return res.status(400).json({ message: '이미 저장된 콘텐츠입니다' });
    }
    
    // 사용자의 저장된 콘텐츠 목록에 추가
    await User.findByIdAndUpdate(userId, {
      $addToSet: { savedContents: contentId }
    });
    
    res.status(200).json({ message: '콘텐츠가 저장되었습니다' });
  } catch (error) {
    console.error('Save content error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 콘텐츠 저장 취소 (북마크 제거)
exports.unsaveContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user._id;
    
    // 사용자의 저장된 콘텐츠 목록에서 제거
    await User.findByIdAndUpdate(userId, {
      $pull: { savedContents: contentId }
    });
    
    res.status(200).json({ message: '콘텐츠 저장이 취소되었습니다' });
  } catch (error) {
    console.error('Unsave content error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 저장된 콘텐츠 조회
exports.getSavedContent = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;
    
    // 사용자 정보와 저장된 콘텐츠 목록 가져오기
    const user = await User.findById(userId).populate({
      path: 'savedContents',
      options: {
        skip,
        limit: parseInt(limit),
        sort: { createdAt: -1 }
      },
      populate: { path: 'author', select: '-password' }
    });
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    // 전체 저장된 콘텐츠 수 계산
    const total = await User.findById(userId).then(user => user.savedContents ? user.savedContents.length : 0);
    
    res.status(200).json({
      content: user.savedContents || [],
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get saved content error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};
