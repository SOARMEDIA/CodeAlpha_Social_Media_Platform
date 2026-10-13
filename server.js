const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./data/db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'codealpha_social_jwt_secret_2026';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Auth Middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Token required' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    } catch {
      req.user = null;
    }
  }
  next();
}

// ---------------- AUTH ROUTES ----------------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, username, email, password, bio } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (db.findUserByEmail(email)) {
      return res.status(409).json({ error: 'Email is already registered' });
    }
    if (db.findUserByUsername(username)) {
      return res.status(409).json({ error: 'Username is already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultAvatars = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80"
    ];

    const newUser = {
      id: 'usr-' + Date.now(),
      name,
      username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      email,
      password: hashedPassword,
      bio: bio || 'Hello world! I am new here.',
      avatar: defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)],
      followers: [],
      following: [],
      joinedAt: new Date().toISOString()
    };

    db.createUser(newUser);

    const token = jwt.sign({ id: newUser.id, username: newUser.username, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userSafe } = newUser;
    res.status(201).json({ message: 'Welcome to Pulse!', token, user: userSafe });
  } catch {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Please enter your username/email and password' });
    }

    const user = db.findUserByEmail(login) || db.findUserByUsername(login);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userSafe } = user;
    res.json({ message: 'Login successful', token, user: userSafe });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = db.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...userSafe } = user;
  res.json({ user: userSafe });
});

// ---------------- POST ROUTES ----------------
app.get('/api/posts', optionalAuth, (req, res) => {
  const posts = db.getPosts();
  const currentUserId = req.user ? req.user.id : null;

  const decorated = posts.map(p => ({
    ...p,
    likesCount: (p.likes || []).length,
    isLiked: currentUserId ? (p.likes || []).includes(currentUserId) : false,
    isOwner: currentUserId ? p.authorId === currentUserId : false
  }));

  res.json({ count: decorated.length, posts: decorated });
});

app.post('/api/posts', authenticate, (req, res) => {
  const { content, image } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Post content cannot be empty' });
  }

  const user = db.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const newPost = {
    id: 'post-' + Date.now(),
    authorId: user.id,
    authorName: user.name,
    authorUsername: user.username,
    authorAvatar: user.avatar,
    content: content.trim(),
    image: image || null,
    likes: [],
    commentsCount: 0,
    createdAt: new Date().toISOString()
  };

  db.createPost(newPost);
  res.status(201).json({
    message: 'Post created',
    post: { ...newPost, likesCount: 0, isLiked: false, isOwner: true }
  });
});

app.delete('/api/posts/:id', authenticate, (req, res) => {
  const success = db.deletePost(req.params.id, req.user.id);
  if (!success) {
    return res.status(403).json({ error: 'Cannot delete post: unauthorized or not found' });
  }
  res.json({ message: 'Post deleted' });
});

app.post('/api/posts/:id/like', authenticate, (req, res) => {
  const isLiked = db.toggleLike(req.params.id, req.user.id);
  if (isLiked === null) return res.status(404).json({ error: 'Post not found' });
  const post = db.getPostById(req.params.id);
  res.json({ isLiked, likesCount: post.likes.length });
});

// ---------------- COMMENT ROUTES ----------------
app.get('/api/posts/:id/comments', (req, res) => {
  const comments = db.getCommentsForPost(req.params.id);
  res.json({ count: comments.length, comments });
});

app.post('/api/posts/:id/comments', authenticate, (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Comment text cannot be empty' });
  }

  const post = db.getPostById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const user = db.findUserById(req.user.id);
  const newComment = {
    id: 'cmt-' + Date.now(),
    postId: req.params.id,
    authorId: user.id,
    authorName: user.name,
    authorUsername: user.username,
    authorAvatar: user.avatar,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  db.addComment(newComment);
  res.status(201).json({ message: 'Comment added', comment: newComment });
});

// ---------------- USER & FOLLOW ROUTES ----------------
app.get('/api/users/:username', optionalAuth, (req, res) => {
  const user = db.findUserByUsername(req.params.username);
  if (!user) return res.status(404).json({ error: 'User profile not found' });

  const { password: _, ...userSafe } = user;
  const currentUserId = req.user ? req.user.id : null;
  const isFollowing = currentUserId ? (user.followers || []).includes(currentUserId) : false;

  const userPosts = db.getPosts().filter(p => p.authorId === user.id).map(p => ({
    ...p,
    likesCount: (p.likes || []).length,
    isLiked: currentUserId ? (p.likes || []).includes(currentUserId) : false,
    isOwner: currentUserId ? p.authorId === currentUserId : false
  }));

  res.json({
    user: {
      ...userSafe,
      followersCount: (user.followers || []).length,
      followingCount: (user.following || []).length,
      isFollowing,
      isSelf: currentUserId === user.id
    },
    posts: userPosts
  });
});

app.post('/api/users/:id/follow', authenticate, (req, res) => {
  const success = db.toggleFollow(req.user.id, req.params.id);
  const targetUser = db.findUserById(req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  res.json({
    isFollowing: success,
    followersCount: (targetUser.followers || []).length
  });
});

app.get('/api/users-suggestions', optionalAuth, (req, res) => {
  const currentUserId = req.user ? req.user.id : null;
  const users = db.getUsers()
    .filter(u => u.id !== currentUserId)
    .slice(0, 5)
    .map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      isFollowing: currentUserId ? (u.followers || []).includes(currentUserId) : false
    }));
  res.json({ users });
});

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 CodeAlpha Social Media Server running on http://localhost:${PORT}`);
});

