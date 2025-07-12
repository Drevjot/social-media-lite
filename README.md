# Social Media Lite

A modern social media application built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring user profiles, posts with images, likes, comments, and real-time notifications.

## Features

### 🔐 Authentication
- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes

### 👤 User Profiles
- Customizable user profiles with bio and profile pictures
- Follow/unfollow functionality
- User search and discovery
- Profile picture uploads

### 📝 Posts
- Create text and image posts
- Multiple image uploads (up to 5 images per post)
- Public and private posts
- Like and unlike posts
- Delete posts

### 💬 Comments
- Add comments to posts
- Nested comments (replies)
- Like comments
- Delete comments

### 🔔 Real-time Notifications
- Real-time notifications using Socket.io
- Notifications for likes, comments, and follows
- Mark notifications as read
- Delete notifications

### 🎨 Modern UI
- Responsive design with Tailwind CSS
- Beautiful and intuitive interface
- Loading states and animations
- Mobile-friendly

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **multer** - File uploads
- **Socket.io** - Real-time communication

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication
- **Tailwind CSS** - Styling
- **Heroicons** - Icons

## Project Structure

```
social-media-lite/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
└── server/                 # Node.js backend
    ├── models/             # MongoDB models
    ├── routes/             # API routes
    ├── middleware/         # Custom middleware
    └── uploads/            # File uploads
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-media-lite
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the server directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/social-media-lite
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   CLIENT_URL=http://localhost:5173
   ```

5. **Start MongoDB**
   
   Make sure MongoDB is running on your system or use MongoDB Atlas.

6. **Run the development servers**

   **Backend:**
   ```bash
   cd server
   npm run dev
   ```

   **Frontend:**
   ```bash
   cd client
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to `http://localhost:5173` to see the application.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile/:username` - Get user profile
- `GET /api/users/:userId` - Get user by ID
- `POST /api/users/follow/:userId` - Follow/unfollow user
- `GET /api/users/:userId/followers` - Get user followers
- `GET /api/users/:userId/following` - Get user following
- `GET /api/users/search/:query` - Search users
- `GET /api/users/suggested` - Get suggested users

### Posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/feed` - Get user feed
- `GET /api/posts/public` - Get public posts
- `GET /api/posts/:postId` - Get single post
- `PUT /api/posts/:postId` - Update post
- `DELETE /api/posts/:postId` - Delete post
- `POST /api/posts/:postId/like` - Like/unlike post
- `GET /api/posts/user/:userId` - Get user posts

### Comments
- `POST /api/comments/:postId` - Add comment
- `GET /api/comments/post/:postId` - Get post comments
- `GET /api/comments/:commentId` - Get single comment
- `PUT /api/comments/:commentId` - Update comment
- `DELETE /api/comments/:commentId` - Delete comment
- `POST /api/comments/:commentId/like` - Like/unlike comment
- `GET /api/comments/:commentId/replies` - Get comment replies

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:notificationId/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:notificationId` - Delete notification
- `GET /api/notifications/unread-count` - Get unread count
- `DELETE /api/notifications/delete-all` - Delete all notifications

## Features in Detail

### File Uploads
- Image uploads using multer
- Support for multiple image formats (JPEG, PNG, GIF, WebP)
- File size limit: 5MB per image
- Maximum 5 images per post

### Real-time Features
- Real-time notifications using Socket.io
- Instant updates for likes, comments, and follows
- User online/offline status

### Security Features
- Password hashing with bcrypt
- JWT token authentication
- Protected API routes
- Input validation and sanitization

### Database Design
- Relational data with MongoDB
- Optimized queries with indexes
- Efficient data population

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with the MERN stack
- Icons from Heroicons
- Styling with Tailwind CSS
- Real-time features with Socket.io 