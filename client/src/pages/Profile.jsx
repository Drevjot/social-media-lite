import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/profile/${username}`);
        setUser(response.data.user);
        setPosts(response.data.posts);
        setFollowersCount(response.data.user.followers.length);
        setFollowingCount(response.data.user.following.length);
        
        // Check if current user is following this user
        if (currentUser) {
          setFollowing(response.data.user.followers.includes(currentUser._id));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, currentUser]);

  const handleFollow = async () => {
    if (!currentUser) return;

    try {
      const response = await api.post(`/users/follow/${user._id}`);
      setFollowing(response.data.isFollowing);
      setFollowersCount(prev => response.data.isFollowing ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-600">User not found</h2>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === user._id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start space-x-6">
          {user.profilePicture ? (
            <img
                              src={`http://localhost:5001${user.profilePicture}`}
              alt={user.username}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-bold text-2xl">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
                <p className="text-gray-600">{user.email}</p>
              </div>

              {!isOwnProfile && currentUser && (
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    following
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>

            {user.bio && (
              <p className="text-gray-700 mb-4">{user.bio}</p>
            )}

            <div className="flex space-x-6 text-sm">
              <div>
                <span className="font-semibold">{posts.length}</span>
                <span className="text-gray-600 ml-1">posts</span>
              </div>
              <div>
                <span className="font-semibold">{followersCount}</span>
                <span className="text-gray-600 ml-1">followers</span>
              </div>
              <div>
                <span className="font-semibold">{followingCount}</span>
                <span className="text-gray-600 ml-1">following</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post (only for own profile) */}
      {isOwnProfile && (
        <div className="mb-6">
          <CreatePost onPostCreated={handlePostCreated} />
        </div>
      )}

      {/* Posts */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {isOwnProfile ? 'No posts yet' : 'No posts'}
            </h3>
            <p className="text-gray-500">
              {isOwnProfile 
                ? 'Create your first post to get started!' 
                : 'This user hasn\'t posted anything yet.'
              }
            </p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Profile; 