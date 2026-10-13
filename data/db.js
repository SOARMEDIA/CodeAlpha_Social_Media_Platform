const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function ensureFile(filename, defaultContent = []) {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), 'utf-8');
  }
  return filePath;
}

const defaultPasswordHash = bcrypt.hashSync('password123', 8);

const defaultUsers = [
  {
    id: "usr-redeemer",
    username: "redeemer_williams",
    name: "Redeemer Jerrey Kow Williams",
    email: "redeemer@codealpha.tech",
    password: defaultPasswordHash,
    bio: "Full Stack Engineer & CodeAlpha Intern | Crafting clean web apps and distributed systems.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    followers: ["usr-sarah", "usr-alex"],
    following: ["usr-sarah"],
    joinedAt: "2026-10-01T10:00:00.000Z"
  },
  {
    id: "usr-sarah",
    username: "sarah_codes",
    name: "Sarah Chen",
    email: "sarah@tech.io",
    password: defaultPasswordHash,
    bio: "Frontend Architect & Open Source enthusiast. Coffee, React & UI/UX.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    followers: ["usr-redeemer"],
    following: ["usr-redeemer", "usr-alex"],
    joinedAt: "2026-09-15T12:00:00.000Z"
  },
  {
    id: "usr-alex",
    username: "alex_dev",
    name: "Alex Rivera",
    email: "alex@dev.co",
    password: defaultPasswordHash,
    bio: "Cloud & DevOps specialist. Docker, Kubernetes, Node.js.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    followers: ["usr-sarah"],
    following: ["usr-redeemer"],
    joinedAt: "2026-09-20T08:30:00.000Z"
  }
];

const defaultPosts = [
  {
    id: "post-1",
    authorId: "usr-redeemer",
    authorName: "Redeemer Jerrey Kow Williams",
    authorUsername: "redeemer_williams",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    content: "🚀 Excited to start my Full Stack Development internship tasks at CodeAlpha! Working on building 4 end-to-end full stack web applications this month. Stay tuned!",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
    likes: ["usr-sarah", "usr-alex"],
    commentsCount: 2,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: "post-2",
    authorId: "usr-sarah",
    authorName: "Sarah Chen",
    authorUsername: "sarah_codes",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    content: "✨ Clean architecture and reusable components save countless hours down the road. Keep your frontend modular and your backend APIs predictable!",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
    likes: ["usr-redeemer"],
    commentsCount: 1,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  }
];

const defaultComments = [
  {
    id: "cmt-1",
    postId: "post-1",
    authorId: "usr-sarah",
    authorName: "Sarah Chen",
    authorUsername: "sarah_codes",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    text: "Awesome work Redeemer! Looking forward to seeing the projects deployed!",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: "cmt-2",
    postId: "post-1",
    authorId: "usr-alex",
    authorName: "Alex Rivera",
    authorUsername: "alex_dev",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    text: "Huge milestone! Let me know if you need any Docker/deployment tips.",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "cmt-3",
    postId: "post-2",
    authorId: "usr-redeemer",
    authorName: "Redeemer Jerrey Kow Williams",
    authorUsername: "redeemer_williams",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    text: "100% agreed! Clean structure makes collaboration a breeze.",
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  }
];

class SocialDatabase {
  constructor() {
    this.usersFile = ensureFile('users.json', defaultUsers);
    this.postsFile = ensureFile('posts.json', defaultPosts);
    this.commentsFile = ensureFile('comments.json', defaultComments);
  }

  read(file) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf-8') || '[]');
    } catch {
      return [];
    }
  }

  write(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  }

  // Users
  getUsers() { return this.read(this.usersFile); }
  findUserById(id) { return this.getUsers().find(u => u.id === id); }
  findUserByEmail(email) { return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()); }
  findUserByUsername(uname) { return this.getUsers().find(u => u.username.toLowerCase() === uname.toLowerCase()); }
  createUser(u) {
    const users = this.getUsers();
    users.push(u);
    this.write(this.usersFile, users);
    return u;
  }
  updateUser(id, updates) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      this.write(this.usersFile, users);
      return users[idx];
    }
    return null;
  }

  // Follow / Unfollow
  toggleFollow(currentUserId, targetUserId) {
    if (currentUserId === targetUserId) return false;
    const users = this.getUsers();
    const currentUser = users.find(u => u.id === currentUserId);
    const targetUser = users.find(u => u.id === targetUserId);
    if (!currentUser || !targetUser) return false;

    currentUser.following = currentUser.following || [];
    targetUser.followers = targetUser.followers || [];

    const isFollowing = currentUser.following.includes(targetUserId);
    if (isFollowing) {
      currentUser.following = currentUser.following.filter(id => id !== targetUserId);
      targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);
    } else {
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    this.write(this.usersFile, users);
    return !isFollowing;
  }

  // Posts
  getPosts() { return this.read(this.postsFile); }
  getPostById(id) { return this.getPosts().find(p => p.id === id); }
  createPost(post) {
    const posts = this.getPosts();
    posts.unshift(post);
    this.write(this.postsFile, posts);
    return post;
  }
  deletePost(id, userId) {
    let posts = this.getPosts();
    const post = posts.find(p => p.id === id);
    if (!post || post.authorId !== userId) return false;
    posts = posts.filter(p => p.id !== id);
    this.write(this.postsFile, posts);

    // Clean comments
    let comments = this.getComments().filter(c => c.postId !== id);
    this.write(this.commentsFile, comments);
    return true;
  }
  toggleLike(postId, userId) {
    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return null;

    post.likes = post.likes || [];
    const isLiked = post.likes.includes(userId);
    if (isLiked) {
      post.likes = post.likes.filter(id => id !== userId);
    } else {
      post.likes.push(userId);
    }
    this.write(this.postsFile, posts);
    return !isLiked;
  }

  // Comments
  getComments() { return this.read(this.commentsFile); }
  getCommentsForPost(postId) {
    return this.getComments().filter(c => c.postId === postId);
  }
  addComment(comment) {
    const comments = this.getComments();
    comments.push(comment);
    this.write(this.commentsFile, comments);

    // update count on post
    const posts = this.getPosts();
    const post = posts.find(p => p.id === comment.postId);
    if (post) {
      post.commentsCount = (post.commentsCount || 0) + 1;
      this.write(this.postsFile, posts);
    }
    return comment;
  }
}

module.exports = new SocialDatabase();

