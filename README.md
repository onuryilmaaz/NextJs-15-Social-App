# Next.js 15 Social Media App (BugBook)

A full-stack social media application built with Next.js 15, featuring real-time messaging, file uploads, and comprehensive social features.

## Features

- 🔐 Authentication (Email/Password and Google OAuth)
- 📝 Create, edit, and delete posts with media attachments
- 💬 Real-time messaging and chat
- 👥 Follow/unfollow users
- ❤️ Like and bookmark posts
- 🔔 Real-time notifications with Server-Sent Events (SSE)
- ⚡ Enhanced notification types (likes, follows, comments, mentions, shares)
- 📡 Live notification updates with connection status monitoring
- 🛡️ Content moderation with automated detection and user reporting
- 🚫 User blocking system with content filtering
- 🖼️ Image and video uploads with cropping
- 🔍 Advanced search with autocomplete, hashtags, and user suggestions
- 📊 Search filtering by type (posts, users) and sorting options
- 👤 Enhanced user profiles with tabs (Posts, Media, Likes, About)
- 👥 Followers and following lists with infinite scroll
- 📱 Responsive design with dark/light theme
- ✨ Beautiful empty states with actionable guidance

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Lucia Auth
- **File Uploads**: UploadThing
- **Real-time Chat**: Stream Chat
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod validation

## Environment Variables

Create a `.env.local` file in the root of your project:

```bash
# Database
DATABASE_URL="your_postgresql_database_url"

# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# File Upload (UploadThing v7)
UPLOADTHING_TOKEN=your_uploadthing_token
NEXT_PUBLIC_UPLOADTHING_APP_ID=your_uploadthing_app_id

# Real-time Chat (Stream)
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_SECRET=your_stream_secret

# Notification Cleanup (Optional - for cron jobs)
CRON_SECRET=your_secret_token_for_cron_jobs
```

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure OAuth consent screen if prompted
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (for development)
   - `https://yourdomain.com/api/auth/google/callback` (for production)
7. Copy the Client ID and Client Secret

### Getting UploadThing Credentials

1. Sign up at [UploadThing](https://uploadthing.com)
2. Create a new app
3. Go to "API Keys" tab and select "V7" tab
4. Copy your `UPLOADTHING_TOKEN` and `App ID`

**Note**: In UploadThing v7, `UPLOADTHING_SECRET` has been replaced with `UPLOADTHING_TOKEN`. The token is a base64 encoded JSON object containing your app information.

## Getting Started

1. **Clone the repository**
2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   - Copy the environment variables above into `.env.local`
   - Configure your database, authentication providers, and third-party services

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The app uses the following main entities:

- **Users**: User profiles with authentication
- **Posts**: User posts with content and media attachments
- **Comments**: Comments on posts
- **Likes**: Post likes
- **Bookmarks**: Saved posts
- **Follows**: User following relationships
- **Notifications**: System notifications
- **Reports**: Content and user reports for moderation
- **Blocks**: User blocking relationships
- **ContentModeration**: Automated content moderation records
- **Media**: File attachments for posts

## API Routes

**Authentication:**

- `/api/auth/google/*` - Google OAuth authentication

**Posts & Content:**

- `/api/posts/for-you` - Personalized feed
- `/api/posts/following` - Following users feed
- `/api/posts/[postId]/likes` - Like/unlike posts
- `/api/posts/[postId]/comments` - Post comments
- `/api/posts/[postId]/bookmark` - Bookmark posts
- `/api/posts/bookmarked` - User's bookmarks

**Users & Social:**

- `/api/users/[userId]/followers` - Follow/unfollow users
- `/api/users/[userId]/posts` - User's posts
- `/api/search` - Global search functionality

**Notifications & Real-time:**

- `/api/notifications` - Get notifications
- `/api/notifications/mark-as-read` - Mark as read
- `/api/notifications/unread-count` - Unread count
- `/api/notifications/stream` - Server-sent events for real-time updates
- `/api/notifications/cleanup` - Automated cleanup

**Content Moderation:**

- `/api/reports` - Submit content/user reports
- `/api/users/[userId]/block` - Block/unblock users
- `/api/users/blocked` - Get blocked users list

**Analytics & Insights:**

- `/api/analytics/user/[userId]` - User analytics data
- `/api/analytics/engagement/[userId]` - Engagement insights and timeline
- `/api/analytics/platform` - Platform-wide statistics (admin only)
- `/api/analytics/daily-stats` - Daily stats update (cron job)

**Media & Upload:**

- `/api/uploadthing/*` - File upload handling
- `/api/clear-uploads` - Cleanup unused uploads

## Deployment

This project is configured for deployment on Vercel with:

- Automatic database migrations
- Cron jobs for cleanup tasks
- Optimized build configuration

## Development Notes

- Using Next.js 15 RC with React 19 RC
- Implements proper TypeScript types throughout
- Uses server actions for form submissions
- Optimistic updates for better UX
- Infinite scrolling for feeds
- Real-time updates via Stream Chat and Server-Sent Events
- Advanced error handling with specific error types and messages
- Comprehensive error categorization (validation, auth, network, etc.)
- Beautiful empty states with actionable user guidance
- Consistent UX patterns throughout the application
- Advanced search with autocomplete suggestions and filters
- Real-time search suggestions with recent searches memory
- Intelligent search ranking with relevance and popularity sorting
- Comprehensive user profile system with tabbed navigation
- Dedicated followers/following pages with user cards
- Privacy-focused likes viewing (own profile only)
- Media-only filtering for visual content discovery
- Enhanced real-time notification system with 8 notification types
- Server-Sent Events (SSE) for instant notification delivery
- Smart notification deduplication and cleanup automation
- Animated notification indicators with real-time count updates
- Connection status monitoring and automatic reconnection
- Comprehensive content moderation system with automated detection
- User reporting system with 10 violation types (spam, harassment, hate speech, etc.)
- User blocking system with complete content filtering from feeds
- Anonymous reporting with moderation review workflow
- Safety features including escalation for severe violations
- Advanced analytics and insights dashboard with user engagement tracking
- Real-time analytics with comprehensive performance metrics
- Personal analytics dashboard with timeline charts and growth insights
- Platform-wide statistics and trends analysis
- Automated daily stats collection and cron job support
