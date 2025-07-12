import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import api from '../services/api';
import PostCard from '../components/PostCard';

const PostDetail = () => {
  const { postId } = useParams();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await api.get(`/posts/${postId}`);
        setPost(response.data.post);
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handlePostUpdated = (updatedPost) => {
    setPost(updatedPost);
  };

  const handlePostDeleted = () => {
    // Redirect to home if post is deleted
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-600">Post not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PostCard
        post={post}
        onPostUpdated={handlePostUpdated}
        onPostDeleted={handlePostDeleted}
      />
    </div>
  );
};

export default PostDetail; 