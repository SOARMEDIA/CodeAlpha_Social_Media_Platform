// CodeAlpha Full Stack Internship - Task 2: Social Media Platform
// Student: Redeemer Jerrey Kow Williams (CA/DF1/320453)

class PulseApp {
  constructor() {
    this.token = localStorage.getItem('pulse_token') || null;
    this.currentUser = JSON.parse(localStorage.getItem('pulse_user') || 'null');
    this.activePostForComments = null;
    this.attachedImageUrl = null;
    this.currentView = 'feed'; // 'feed' or 'profile'

    this.init();
  }

  async init() {
    this.renderAuthBox();
    await this.loadFeed();
    this.loadSuggestions();
    this.renderProfileCard();
  }

  renderAuthBox() {
    const box = document.getElementById('authBox');
    const avatar = document.getElementById('composerAvatar');

    if (this.currentUser) {
      if (avatar) avatar.src = this.currentUser.avatar;
      box.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <img src="${this.currentUser.avatar}" class="avatar-sm">
          <div style="flex: 1; overflow: hidden;">
            <div style="font-weight: 700; font-size: 0.92rem; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${this.currentUser.name}</div>
            <div style="color: var(--text-dim); font-size: 0.8rem;">@${this.currentUser.username}</div>
          </div>
        </div>
        <button class="btn btn-outline btn-block btn-sm" onclick="socialApp.logout()">
          <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
        </button>
      `;
    } else {
      if (avatar) avatar.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";
      box.innerHTML = `
        <div style="margin-bottom: 10px; font-size: 0.88rem; color: var(--text-muted);">
          Sign in to share posts, like, and follow creators.
        </div>
        <button class="btn btn-primary btn-block btn-sm" onclick="socialApp.openAuthModal('login')">
          <i class="fa-regular fa-user"></i> Sign In
        </button>
      `;
    }
  }

  async loadFeed() {
    this.currentView = 'feed';
    document.getElementById('timelineTitle').textContent = 'Home Feed';
    const stream = document.getElementById('postsStream');
    stream.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading posts...</p></div>';

    try {
      const headers = {};
      if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
      const res = await fetch('/api/posts', { headers });
      const data = await res.json();
      this.renderPosts(data.posts || []);
    } catch {
      stream.innerHTML = '<p style="color: #ef4444; padding: 20px;">Failed to load posts stream.</p>';
    }
  }

  renderPosts(posts) {
    const stream = document.getElementById('postsStream');
    if (posts.length === 0) {
      stream.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <i class="fa-regular fa-compass" style="font-size: 2.5rem; margin-bottom: 10px;"></i>
          <p>No posts in your feed yet. Be the first to share something!</p>
        </div>
      `;
      return;
    }

    stream.innerHTML = posts.map(p => `
      <article class="post-card" id="card-${p.id}">
        <div class="post-header">
          <img src="${p.authorAvatar}" class="avatar-sm" alt="${p.authorName}" onclick="socialApp.viewUserProfile('${p.authorUsername}')" style="cursor: pointer;">
          <div class="post-author-info">
            <span class="author-name" onclick="socialApp.viewUserProfile('${p.authorUsername}')">${p.authorName}</span>
            <div class="author-handle">@${p.authorUsername} · <span class="post-time">${this.formatTime(p.createdAt)}</span></div>
          </div>
          ${p.isOwner ? `
            <button class="btn-delete-post action-btn" onclick="socialApp.deletePost('${p.id}')" title="Delete post">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          ` : ''}
        </div>

        <div class="post-body">${this.escapeHTML(p.content)}</div>

        ${p.image ? `
          <div class="post-media">
            <img src="${p.image}" alt="Post media" loading="lazy">
          </div>
        ` : ''}

        <div class="post-actions">
          <button class="action-btn ${p.isLiked ? 'liked' : ''}" onclick="socialApp.toggleLike('${p.id}')">
            <i class="${p.isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
            <span>${p.likesCount || 0}</span>
          </button>

          <button class="action-btn" onclick="socialApp.openCommentsModal('${p.id}')">
            <i class="fa-regular fa-comment"></i>
            <span>${p.commentsCount || 0}</span>
          </button>
        </div>
      </article>
    `).join('');
  }

  async createPost() {
    if (!this.token) {
      this.openAuthModal('login');
      this.showToast('Please sign in to publish a post.');
      return;
    }

    const contentInput = document.getElementById('postContent');
    const content = contentInput.value.trim();
    if (!content) {
      this.showToast('Please write something first!');
      return;
    }

    const btn = document.getElementById('btnPublish');
    btn.disabled = true;

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          content,
          image: this.attachedImageUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post');

      contentInput.value = '';
      this.clearImagePreview();
      this.showToast('Your post is live!', 'success');
      await this.loadFeed();
      this.renderProfileCard();
    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  }

  async deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (!res.ok) throw new Error('Could not delete post');
      this.showToast('Post removed.');
      const card = document.getElementById(`card-${postId}`);
      if (card) card.remove();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async toggleLike(postId) {
    if (!this.token) {
      this.openAuthModal('login');
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const card = document.getElementById(`card-${postId}`);
        if (card) {
          const btn = card.querySelector('.action-btn');
          btn.classList.toggle('liked', data.isLiked);
          btn.querySelector('i').className = data.isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
          btn.querySelector('span').textContent = data.likesCount;
        }
      }
    } catch {}
  }

  // Comments
  async openCommentsModal(postId) {
    this.activePostForComments = postId;
    const modal = document.getElementById('commentsModal');
    modal.classList.add('active');

    try {
      const [postRes, cmtRes] = await Promise.all([
        fetch('/api/posts', { headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {} }),
        fetch(`/api/posts/${postId}/comments`)
      ]);
      const postsData = await postRes.json();
      const post = (postsData.posts || []).find(p => p.id === postId);

      if (post) {
        document.getElementById('modalPostPreview').innerHTML = `
          <div style="display: flex; gap: 10px; margin-bottom: 8px;">
            <img src="${post.authorAvatar}" class="avatar-sm">
            <div>
              <strong>${post.authorName}</strong> <span style="color: var(--text-dim); font-size: 0.85rem;">@${post.authorUsername}</span>
              <p style="margin-top: 4px; font-size: 0.95rem;">${this.escapeHTML(post.content)}</p>
            </div>
          </div>
        `;
      }

      const cmtData = await cmtRes.json();
      const comments = cmtData.comments || [];
      document.getElementById('modalCommentsCount').textContent = comments.length;

      const list = document.getElementById('modalCommentsList');
      if (comments.length === 0) {
        list.innerHTML = '<p style="color: var(--text-dim); text-align: center; padding: 20px;">No replies yet. Start the conversation!</p>';
      } else {
        list.innerHTML = comments.map(c => `
          <div class="comment-item">
            <img src="${c.authorAvatar}" class="avatar-sm">
            <div>
              <div style="font-weight: 600; font-size: 0.88rem;">${c.authorName} <span style="color: var(--text-dim); font-size: 0.78rem;">@${c.authorUsername}</span></div>
              <p style="font-size: 0.9rem; margin-top: 2px;">${this.escapeHTML(c.text)}</p>
            </div>
          </div>
        `).join('');
      }
    } catch {}
  }

  closeCommentsModal() {
    document.getElementById('commentsModal').classList.remove('active');
    this.activePostForComments = null;
  }

  async submitComment(e) {
    e.preventDefault();
    if (!this.token) {
      this.openAuthModal('login');
      return;
    }
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    if (!text || !this.activePostForComments) return;

    try {
      const res = await fetch(`/api/posts/${this.activePostForComments}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        input.value = '';
        this.openCommentsModal(this.activePostForComments);
        this.loadFeed();
      }
    } catch {}
  }

  // User Profile
  async viewUserProfile(username) {
    try {
      const headers = this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
      const res = await fetch(`/api/users/${username}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      document.getElementById('timelineTitle').textContent = `@${data.user.username}'s Profile`;
      const stream = document.getElementById('postsStream');

      const profileHeader = `
        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 24px; margin-bottom: 20px;">
          <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 16px;">
            <img src="${data.user.avatar}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);">
            <div style="flex: 1;">
              <h2 style="font-size: 1.3rem;">${data.user.name}</h2>
              <div style="color: var(--text-dim); font-size: 0.9rem;">@${data.user.username}</div>
              <p style="margin-top: 8px; font-size: 0.95rem;">${data.user.bio}</p>
            </div>
            ${!data.user.isSelf ? `
              <button class="btn ${data.user.isFollowing ? 'btn-outline' : 'btn-primary'}" onclick="socialApp.toggleFollow('${data.user.id}', '${data.user.username}')">
                ${data.user.isFollowing ? 'Following' : 'Follow'}
              </button>
            ` : ''}
          </div>
          <div style="display: flex; gap: 24px; font-size: 0.9rem; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 12px;">
            <div><strong style="color: #fff;">${data.user.followersCount}</strong> Followers</div>
            <div><strong style="color: #fff;">${data.user.followingCount}</strong> Following</div>
            <div><strong style="color: #fff;">${data.posts.length}</strong> Posts</div>
          </div>
        </div>
      `;

      stream.innerHTML = profileHeader;
      this.renderPosts(data.posts);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async toggleFollow(targetUserId, username) {
    if (!this.token) {
      this.openAuthModal('login');
      return;
    }
    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        this.showToast(data.isFollowing ? `Now following @${username}` : `Unfollowed @${username}`);
        this.loadSuggestions();
        if (document.getElementById('timelineTitle').textContent.includes(username)) {
          this.viewUserProfile(username);
        }
      }
    } catch {}
  }

  openMyProfile() {
    if (!this.currentUser) {
      this.openAuthModal('login');
    } else {
      this.viewUserProfile(this.currentUser.username);
    }
  }

  async loadSuggestions() {
    try {
      const headers = this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
      const res = await fetch('/api/users-suggestions', { headers });
      const data = await res.json();
      const list = document.getElementById('suggestedUsersList');

      list.innerHTML = (data.users || []).map(u => `
        <div class="suggested-item">
          <img src="${u.avatar}" class="avatar-sm" onclick="socialApp.viewUserProfile('${u.username}')" style="cursor: pointer;">
          <div class="suggested-info">
            <div style="font-weight: 600; cursor: pointer;" onclick="socialApp.viewUserProfile('${u.username}')">${u.name}</div>
            <div style="color: var(--text-dim); font-size: 0.8rem;">@${u.username}</div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="socialApp.toggleFollow('${u.id}', '${u.username}')">
            ${u.isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      `).join('');
    } catch {}
  }

  renderProfileCard() {
    const card = document.getElementById('myProfileWidget');
    if (!this.currentUser) {
      card.innerHTML = `
        <div style="padding: 10px; color: var(--text-muted); font-size: 0.9rem;">
          <i class="fa-solid fa-user-plus" style="font-size: 1.8rem; color: var(--primary); margin-bottom: 8px;"></i>
          <h4>Join the Community</h4>
          <p style="margin: 6px 0 12px; font-size: 0.82rem;">Create your profile and connect with developers worldwide.</p>
          <button class="btn btn-primary btn-sm btn-block" onclick="socialApp.openAuthModal('register')">Get Started</button>
        </div>
      `;
      return;
    }

    card.innerHTML = `
      <img src="${this.currentUser.avatar}" class="avatar-lg" alt="${this.currentUser.name}">
      <h3 style="font-size: 1.05rem; margin-bottom: 2px;">${this.currentUser.name}</h3>
      <div style="color: var(--text-dim); font-size: 0.85rem; margin-bottom: 8px;">@${this.currentUser.username}</div>
      <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">${this.currentUser.bio || ''}</p>
      
      <div class="profile-stats">
        <div class="stat-box">
          <span class="stat-val">${(this.currentUser.followers || []).length}</span>
          <span class="stat-lbl">Followers</span>
        </div>
        <div class="stat-box">
          <span class="stat-val">${(this.currentUser.following || []).length}</span>
          <span class="stat-lbl">Following</span>
        </div>
      </div>
      <button class="btn btn-outline btn-sm btn-block" onclick="socialApp.openMyProfile()">View My Posts</button>
    `;
  }

  // Image Modal
  promptImageModal() {
    document.getElementById('imageModal').classList.add('active');
  }
  closeImageModal() {
    document.getElementById('imageModal').classList.remove('active');
  }
  attachImageUrl() {
    const url = document.getElementById('imageUrlInput').value.trim();
    if (url) {
      this.attachedImageUrl = url;
      document.getElementById('imagePreview').src = url;
      document.getElementById('imagePreviewContainer').style.display = 'block';
      this.closeImageModal();
    }
  }
  clearImagePreview() {
    this.attachedImageUrl = null;
    document.getElementById('imagePreviewContainer').style.display = 'none';
    document.getElementById('imagePreview').src = '';
  }

  // Auth Handling
  openAuthModal(tab = 'login') {
    this.switchAuthTab(tab);
    document.getElementById('authModal').classList.add('active');
  }
  closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
  }
  switchAuthTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('tabLogin').classList.toggle('active', isLogin);
    document.getElementById('tabRegister').classList.toggle('active', !isLogin);
    document.getElementById('formLogin').style.display = isLogin ? 'block' : 'none';
    document.getElementById('formRegister').style.display = !isLogin ? 'block' : 'none';
  }

  async handleLogin(e) {
    e.preventDefault();
    const login = document.getElementById('loginId').value;
    const password = document.getElementById('loginPass').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('pulse_token', data.token);
      localStorage.setItem('pulse_user', JSON.stringify(data.user));

      this.closeAuthModal();
      this.renderAuthBox();
      this.renderProfileCard();
      this.loadFeed();
      this.showToast(`Welcome back, ${data.user.name}!`);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPass').value;
    const bio = document.getElementById('regBio').value;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password, bio })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('pulse_token', data.token);
      localStorage.setItem('pulse_user', JSON.stringify(data.user));

      this.closeAuthModal();
      this.renderAuthBox();
      this.renderProfileCard();
      this.loadFeed();
      this.showToast(`Welcome to Pulse, ${data.user.name}!`);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('pulse_token');
    localStorage.removeItem('pulse_user');
    this.renderAuthBox();
    this.renderProfileCard();
    this.loadFeed();
    this.showToast('Logged out successfully.');
  }

  focusComposer() {
    document.getElementById('postContent').focus();
  }

  formatTime(iso) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return new Date(iso).toLocaleDateString();
  }

  escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
  }

  showToast(msg) {
    const box = document.getElementById('toastBox');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    box.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }
}

const socialApp = new PulseApp();

