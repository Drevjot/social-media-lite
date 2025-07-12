const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, optionalAuth } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');
const router = express.Router();

// Create a new post
router.post('/', auth, uploadMultiple, async (req, res) => {
  try {
    const { content, isPublic = true } = req.body;
    const currentUser = req.user;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    // Handle uploaded images
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const post = new Post({
      author: currentUser._id,
      content: content.trim(),
      images,
      isPublic: isPublic === 'true'
    });

    await post.save();

    // Populate author info for response
    await post.populate('author', 'username profilePicture');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all posts (feed)
router.get('/feed', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get posts from followed users and current user
    const posts = await Post.find({
      $or: [
        { author: { $in: [...currentUser.following, currentUser._id] } },
        { isPublic: true }
      ]
    })
    .populate('author', 'username profilePicture')
    .populate('comments', 'content author createdAt')
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'username profilePicture'
      }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Post.countDocuments({
      $or: [
        { author: { $in: [...currentUser.following, currentUser._id] } },
        { isPublic: true }
      ]
    });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all public posts (for non-authenticated users)
router.get('/public', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ isPublic: true })
      .populate('author', 'username profilePicture')
      .populate('comments', 'content author createdAt')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ isPublic: true });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    });
  } catch (error) {
    console.error('Get public posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single post
router.get('/:postId', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('author', 'username profilePicture bio')
      .populate('comments', 'content author createdAt')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user can view private post
    if (!post.isPublic && (!req.user || post.author._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update post
router.put('/:postId', auth, async (req, res) => {
  try {
    const { content, isPublic } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (content !== undefined) {
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Post content is required' });
      }
      post.content = content.trim();
    }

    if (isPublic !== undefined) {
      post.isPublic = isPublic === 'true';
    }

    await post.save();
    await post.populate('author', 'username profilePicture');

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Post.findByIdAndDelete(req.params.postId);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike post
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const currentUser = req.user;
    const isLiked = post.likes.includes(currentUser._id);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== currentUser._id.toString());
    } else {
      // Like
      post.likes.push(currentUser._id);

      // Create notification for post author
      if (post.author.toString() !== currentUser._id.toString()) {
        const notification = new Notification({
          recipient: post.author,
          sender: currentUser._id,
          type: 'like',
          post: post._id,
          message: `${currentUser.username} liked your post`
        });
        await notification.save();

        // Send real-time notification
        const io = req.app.get('io');
        io.to(post.author.toString()).emit('notification', notification);
      }
    }

    await post.save();

    res.json({
      message: isLiked ? 'Post unliked' : 'Post liked',
      isLiked: !isLiked,
      likeCount: post.likes.length
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's posts
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { author: userId };
    
    // If not authenticated or viewing someone else's posts, only show public posts
    if (!req.user || req.user._id.toString() !== userId) {
      query.isPublic = true;
    }

    const posts = await Post.find(query)
      .populate('author', 'username profilePicture')
      .populate('comments', 'content author createdAt')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 