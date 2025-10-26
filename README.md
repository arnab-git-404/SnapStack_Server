# 📸 SnapStack Server

A robust and scalable Node.js backend server for managing photo galleries with user authentication, Redis caching, and GitHub-based image storage.

## ✨ Features

- 🔐 **JWT Authentication** - Secure user authentication with access and refresh tokens
- 🍪 **Cookie-based Sessions** - HTTPOnly cookies for enhanced security
- 📧 **Email Integration** - Password reset functionality with Nodemailer
- 🖼️ **GitHub Storage** - Images stored in GitHub repositories
- ⚡ **Redis Caching** - Fast data retrieval with Upstash Redis
- 🗄️ **MongoDB Database** - Flexible document storage for metadata
- 🛡️ **Security Features** - Helmet, CORS, rate limiting, and input validation
- 📁 **Category-based Organization** - Photos organized by custom categories
- 👨‍💼 **Role-based Access Control** - Admin and user roles

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Cache:** Redis (Upstash)
- **Storage:** GitHub API
- **Authentication:** JWT (jsonwebtoken)
- **Email:** Nodemailer
- **Validation:** express-validator
- **Security:** Helmet, bcryptjs, express-rate-limit

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- Upstash Redis account
- GitHub account with personal access token
- SMTP email service (Gmail recommended)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/arnab-git-404/photo_gallery_server.git
cd photo_gallery_server
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Copy `.env.example` to `.env` and fill in your values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=photo-gallery-app
JWT_AUDIENCE=photo-gallery-users

# Security
BCRYPT_SALT_ROUNDS=10
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MINUTES=15

# GitHub Configuration (for image storage)
GITHUB_USERNAME=your-github-username
GITHUB_REPO=your-repo-name
GITHUB_BRANCH=main
GITHUB_TOKEN=ghp_your_personal_access_token

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@photogallery.com
EMAIL_FROM_NAME=Photo Gallery

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:8080

# Redis Configuration (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

4. **Start the server**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## 📚 API Documentation

### 🔑 Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Logout
```http
POST /api/auth/logout
```

#### Refresh Token
```http
POST /api/auth/validate
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password/:token
Content-Type: application/json

{
  "password": "newSecurePassword123"
}
```

### 👤 User Endpoints

#### Get Current User
```http
GET /api/users/me
Authorization: Cookie (accessToken)
```

#### Get All Users (Admin Only)
```http
GET /api/users/admin
Authorization: Cookie (accessToken)
```

#### Upload Photo
```http
POST /api/users/upload-photo
Authorization: Cookie (accessToken)
Content-Type: multipart/form-data

{
  "photo": [file],
  "title": "Beautiful Sunset",
  "category": "arnab",
  "year": 2024,
  "location": "California",
  "description": "A stunning sunset view"
}
```

#### Get Photos by Category
```http
GET /api/users/photos/:category
Authorization: Cookie (accessToken)
```

#### Clear Redis Cache
```http
GET /api/users/clear-cache
Authorization: Cookie (accessToken)
```

### 🏥 Health Check
```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 12345.67
}
```

## 📁 Project Structure

```
photo_gallery_server/
├── api/                          # API routes (if using separate API folder)
├── src/
│   ├── app.js                    # Express app configuration
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── redis.js              # Redis connection (Upstash)
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   └── userController.js     # User and photo operations
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification & role checks
│   │   ├── errorHandler.js       # Global error handler
│   │   └── validateRequest.js    # Input validation
│   ├── models/
│   │   ├── Photo.js              # Photo schema
│   │   └── User.js               # User schema
│   ├── routes/
│   │   ├── authRoutes.js         # Auth endpoints
│   │   └── userRoutes.js         # User endpoints
│   └── utils/
│       ├── cache.js              # Redis cache utilities
│       ├── generateToken.js      # JWT token generation
│       └── sendEmail.js          # Email sending utility
├── .env                          # Environment variables
├── .env.example                  # Example environment file
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies
├── server.js                     # Entry point
└── vercel.json                   # Vercel deployment config
```

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['user', 'admin']),
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  timestamps: true
}
```

### Photo Model
```javascript
{
  title: String (required, max: 200),
  category: String (enum: ['arnab', 'deblina', 'together']),
  year: Number (required, 2000-2100),
  location: String (max: 100),
  description: String (max: 500),
  imageUrl: String (required),
  uploadedBy: ObjectId (ref: 'User'),
  timestamps: true
}
```

## 🔒 Security Features

- ✅ **Password Hashing** - bcryptjs with configurable salt rounds
- ✅ **JWT Tokens** - Access and refresh token system
- ✅ **HTTPOnly Cookies** - Prevents XSS attacks
- ✅ **Helmet** - Sets security HTTP headers
- ✅ **CORS** - Configurable origin whitelist
- ✅ **Rate Limiting** - Prevents brute force attacks
- ✅ **Input Validation** - express-validator for request validation
- ✅ **SQL Injection Protection** - Mongoose parameterized queries

## ⚡ Caching Strategy

The application uses Redis (Upstash) for caching:

- **Photos by Category**: 1 hour TTL
- **All Users**: 30 minutes TTL
- **User Profile**: 15 minutes TTL

Cache is automatically invalidated when:
- New photos are uploaded
- User data is modified
- Manual cache clear is triggered

## 🚀 Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard

Configuration is already set in `vercel.json`

### Manual Deployment

1. Build and run:
```bash
npm start
```

2. Configure reverse proxy (nginx recommended)

3. Set up SSL certificate (Let's Encrypt)

4. Configure environment variables on your server

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📝 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 5000 |
| `NODE_ENV` | Environment mode | No | development |
| `MONGO_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | No | JWT_SECRET |
| `GITHUB_TOKEN` | GitHub personal access token | Yes | - |
| `UPSTASH_REDIS_REST_URL` | Redis REST URL | Yes | - |
| `EMAIL_USER` | SMTP email address | Yes | - |
| `EMAIL_PASS` | SMTP password/app password | Yes | - |
| `FRONTEND_URL` | Frontend application URL | Yes | - |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Arnab**

- GitHub: [@arnab-git-404](https://github.com/arnab-git-404)
- Repository: [photo_gallery_server](https://github.com/arnab-git-404/photo_gallery_server)

## 🐛 Issues

Found a bug? [Open an issue](https://github.com/arnab-git-404/photo_gallery_server/issues)

## 📞 Support

For support, email mukherjeearnab988@gmail.com or open an issue on GitHub.

---

Made with ❤️ by Arnab
