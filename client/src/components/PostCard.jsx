import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  TrashIcon, 
  PencilIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const PostCard = ({ post, onPostUpdated, onPostDeleted }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.likes.includes(user?._id));
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  const handleLike = async () => {
    if (!user) return;

    try {
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);

      const response = await api.post(`/posts/${post._id}/like`);
      setLikeCount(response.data.likeCount);
      setLiked(response.data.isLiked);
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update
      setLiked(!liked);
      setLikeCount(prev => liked ? prev + 1 : prev - 1);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    setLoading(true);
    try {
      await api.delete(`/posts/${post._id}`);
      onPostDeleted(post._id);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setCommentLoading(true);
    try {
      const response = await api.post(`/comments/${post._id}`, {
        content: newComment.trim()
      });

      setComments(prev => [response.data.comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const isAuthor = user?._id === post.author._id;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Post Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to={`/profile/${post.author.username}`}>
              {post.author.profilePicture ? (
                <img
                  src={`http://localhost:5001${post.author.profilePicture}`}
                  alt={post.author.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {post.author.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </Link>
            <div>
              <Link 
                to={`/profile/${post.author.username}`}
                className="font-semibold text-gray-900 hover:text-blue-500"
              >
                {post.author.username}
              </Link>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{formatDate(post.createdAt)}</span>
                {!post.isPublic && (
                  <div className="flex items-center space-x-1">
                    <EyeSlashIcon className="h-4 w-4" />
                    <span>Private</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isAuthor && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete post"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <p className="text-gray-900 mb-4 whitespace-pre-wrap">{post.content}</p>

        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <div className={`grid gap-2 mb-4 ${
            post.images.length === 1 ? 'grid-cols-1' : 
            post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
          }`}>
            {post.images.map((image, index) => (
              <img
                key={index}
                src={`http://localhost:5001${image}`}
                alt={`Post image ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Post Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
            <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4 border-t pt-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 transition-colors ${
              liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            {liked ? (
              <HeartSolidIcon className="h-6 w-6" />
            ) : (
              <HeartIcon className="h-6 w-6" />
            )}
            <span>Like</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <ChatBubbleLeftIcon className="h-6 w-6" />
            <span>Comment</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 border-t pt-4">
            {/* Add Comment */}
            {user && (
              <form onSubmit={handleComment} className="mb-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength="500"
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {commentLoading ? '...' : 'Post'}
                  </button>
                </div>
              </form>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map(comment => (
                <div key={comment._id} className="flex space-x-3">
                  {comment.author.profilePicture ? (
                    <img
                      src={`http://localhost:5000${comment.author.profilePicture}`}
                      alt={comment.author.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-medium">
                        {comment.author.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Link 
                          to={`/profile/${comment.author.username}`}
                          className="font-semibold text-sm text-gray-900 hover:text-blue-500"
                        >
                          {comment.author.username}
                        </Link>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-900 text-sm">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard; 