# CodeAlpha_Social_Media_Platform
### Full Stack Development Internship — Task 2

**Intern Name:** REDEEMER JERREY KOW WILLIAMS  
**Student ID:** CA/DF1/320453  
**Domain:** Full Stack Web Development  
**Batch:** 20th October 2026 to 20th November 2026  
**Company:** [CodeAlpha](https://www.codealpha.tech)

---

## 📌 Project Overview
**Pulse Social** is a responsive, feature-packed mini social media platform developed for Task 2 of the CodeAlpha Full Stack Development Internship.

It implements a modern community feed, interactive user profiles, an extensible like/follow social graph, post publishing with image attachments, and nested post comment discussions.

---

## 🚀 Key Features

1. **User Profiles & Identity:**
   - Dedicated profiles displaying avatar, bio, follower count, following count, and user post history.
   - User registration and login protected with `bcryptjs` password hashing and `JWT` tokens.

2. **Posts & Content Publishing:**
   - Create text posts with rich embedded media (image URLs).
   - Author-only post deletion controls.
   - Real-time timestamp rendering ("just now", "10m", "2h").

3. **Engagement & Social Graph:**
   - Instant like/unlike toggle on posts with dynamic counter updates.
   - Follow/unfollow users with bidirectional graph synchronization.
   - Interactive comment discussions on each post.
   - Suggested users discovery widget.

4. **Modern Responsive Interface:**
   - 3-column desktop layout (Navigation, Central Feed, Profile & Discovery sidebar).
   - Dark mode aesthetic built with pure modern CSS and FontAwesome icons.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), FontAwesome
- **Backend:** Node.js, Express.js REST API
- **Authentication:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **Database:** Persistent file-backed JSON database (`users.json`, `posts.json`, `comments.json`)

---

## 🏁 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/CodeAlpha_Social_Media_Platform.git
   cd CodeAlpha_Social_Media_Platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser:
   ```text
   http://localhost:3001
   ```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT | No |
| `GET` | `/api/auth/me` | Fetch active user credentials | Yes |
| `GET` | `/api/posts` | Fetch timeline feed | Optional |
| `POST` | `/api/posts` | Publish a new post | Yes |
| `DELETE` | `/api/posts/:id` | Delete an author's post | Yes |
| `POST` | `/api/posts/:id/like` | Toggle like on post | Yes |
| `GET` | `/api/posts/:id/comments`| Get all post comments | No |
| `POST` | `/api/posts/:id/comments`| Add a new comment | Yes |
| `GET` | `/api/users/:username` | Fetch user profile & posts | Optional |
| `POST` | `/api/users/:id/follow` | Follow or unfollow user | Yes |
| `GET` | `/api/users-suggestions`| Get recommended developers | Optional |

---

## 📄 License
This project is submitted as part of the CodeAlpha Internship Program. Licensed under the MIT License.

