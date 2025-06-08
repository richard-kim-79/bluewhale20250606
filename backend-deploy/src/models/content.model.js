const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  body: {
    type: String,
    required: function() { return this.contentType !== 'pdf'; }
  },
  contentType: {
    type: String,
    enum: ['text', 'pdf', 'article', 'question', 'discussion', 'review', 'news'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    },
    name: {
      type: String,
      trim: true
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  aiScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
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
contentSchema.index({ author: 1, createdAt: -1 });
contentSchema.index({ location: '2dsphere' });
contentSchema.index({ tags: 1 });
contentSchema.index({ title: 'text', body: 'text' });

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;
