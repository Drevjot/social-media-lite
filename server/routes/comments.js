const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Add comment to post
router.post('/:postId', auth, async (req, res) => {
  try {
    const { content, parentCommentId } = req.body;
    const { postId } = req.params;
    const currentUser = req.user;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if parent comment exists (for replies)
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    const comment = new Comment({
      author: currentUser._id,
      post: postId,
      content: content.trim(),
      parentComment: parentCommentId || null
    });

    await comment.save();

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    // If this is a reply, add to parent comment's replies
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: comment._id }
      });
    }

    // Populate author info
    await comment.populate('author', 'username profilePicture');

    // Create notification for post author (if not commenting on own post)
    if (post.author.toString() !== currentUser._id.toString()) {
      const notification = new Notification({
        recipient: post.author,
        sender: currentUser._id,
        type: 'comment',
        post: post._id,
        comment: comment._id,
        message: `${currentUser.username} commented on your post`
      });
      await notification.save();

      // Send real-time notification
      const io = req.app.get('io');
      io.to(post.author.toString()).emit('notification', notification);
    }

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for a post
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get top-level comments (not replies)
    const comments = await Comment.find({
      post: postId,
      parentComment: null
    })
    .populate('author', 'username profilePicture')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'username profilePicture'
      }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Comment.countDocuments({
      post: postId,
      parentComment: null
    });

    res.json({
      comments,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single comment
router.get('/:commentId', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
      .populate('author', 'username profilePicture')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json({ comment });
  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update comment
router.put('/:commentId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    comment.content = content.trim();
    await comment.save();

    await comment.populate('author', 'username profilePicture');

    res.json({
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment
router.delete('/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment or the post
    const post = await Post.findById(comment.post);
    if (comment.author.toString() !== req.user._id.toString() && 
        post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Remove comment from post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id }
    });

    // Remove from parent comment's replies if it's a reply
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $pull: { replies: comment._id }
      });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(comment._id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike comment
router.post('/:commentId/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const currentUser = req.user;
    const isLiked = comment.likes.includes(currentUser._id);

    if (isLiked) {
      // Unlike
      comment.likes = comment.likes.filter(id => id.toString() !== currentUser._id.toString());
    } else {
      // Like
      comment.likes.push(currentUser._id);

      // Create notification for comment author
      if (comment.author.toString() !== currentUser._id.toString()) {
        const notification = new Notification({
          recipient: comment.author,
          sender: currentUser._id,
          type: 'like',
          comment: comment._id,
          message: `${currentUser.username} liked your comment`
        });
        await notification.save();

        // Send real-time notification
        const io = req.app.get('io');
        io.to(comment.author.toString()).emit('notification', notification);
      }
    }

    await comment.save();

    res.json({
      message: isLiked ? 'Comment unliked' : 'Comment liked',
      isLiked: !isLiked,
      likeCount: comment.likes.length
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get replies to a comment
router.get('/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const replies = await Comment.find({ parentComment: commentId })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ parentComment: commentId });

    res.json({
      replies,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 