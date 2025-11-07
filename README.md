# ECO Club - Environmental Classroom Management System

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/salvatores-projects-eba8e4e0/v0-classroom-champion-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/2uFuWuCTIai)

## Overview

ECO Club is a comprehensive environmental classroom management system that helps schools track and improve their eco-friendly practices. The system includes:

- **Admin Dashboard** - Manage users, classrooms, and checklist items
- **Supervisor Interface** - Conduct classroom evaluations
- **Leaderboard** - Track and display classroom performance
- **User Management** - Create and manage supervisor accounts

## 🚀 Quick Setup for V0

### 1. Environment Variables

When opening this project in V0, set these environment variables in the **Vars** section:

\`\`\`bash
# Run this to see the exact values:
node scripts/setup_v0_env.js
\`\`\`

### 2. Database Setup

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `scripts/final_complete_setup.sql`
4. Click "Run" to execute

### 3. Test the Setup

\`\`\`bash
node scripts/test_final_setup.js
\`\`\`

## 🔑 Login Credentials

- **Admin**: `admin@school.com` / `AdminPassword123!`
- **Create supervisors** through the admin dashboard

## 📁 Project Structure

- `scripts/` - Database setup and testing scripts
- `app/` - Next.js application pages
- `components/` - React components
- `lib/` - Utility functions and configurations

## 🛠️ Development

### Local Development

\`\`\`bash
npm run dev
\`\`\`

### Database Management

- **Setup**: `scripts/final_complete_setup.sql`
- **Test**: `scripts/test_final_setup.js`
- **Environment**: `scripts/setup_v0_env.js`

## 📚 Documentation

- **V0 Setup**: `V0_SETUP.md`
- **Database**: `scripts/README.md`

## Deployment

Your project is live at:

**[https://vercel.com/salvatores-projects-eba8e4e0/v0-classroom-champion-app](https://vercel.com/salvatores-projects-eba8e4e0/v0-classroom-champion-app)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/2uFuWuCTIai](https://v0.app/chat/projects/2uFuWuCTIai)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
