# Next.js 15 Social Media App (BugBook)

A full-stack social media application built with Next.js 15, featuring real-time messaging, file uploads, and comprehensive social features.

## Features

- 🔐 Authentication (Email/Password and Google OAuth)
- 📝 Create, edit, and delete posts with media attachments
- 💬 Real-time messaging and chat
- 👥 Follow/unfollow users
- ❤️ Like and bookmark posts
- 🔔 Real-time notifications
- 🖼️ Image and video uploads with cropping
- 🔍 Search functionality with hashtag support
- 📱 Responsive design with dark/light theme

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
```

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
- **Media**: File attachments for posts

## API Routes

- `/api/posts/*` - Post management
- `/api/users/*` - User management
- `/api/notifications/*` - Notifications
- `/api/messages/*` - Chat messages
- `/api/uploadthing/*` - File uploads
- `/api/clear-uploads` - Cleanup unused uploads (cron job)

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
- Real-time updates via Stream Chat
