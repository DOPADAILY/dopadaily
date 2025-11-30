# Dopadaily

A therapeutic productivity web application for focus and mental wellness. Build healthy habits, track your progress, and join a supportive community.

![Dopadaily](https://img.shields.io/badge/Next.js-16.0.3-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Powered-3ECF8E?style=flat-square&logo=supabase)

## 🎯 Features

### Core Functionality
- **🎯 Focus Timer** - Pomodoro-style timer with customizable focus/break durations
- **📊 Dashboard** - Track daily progress, streaks, and achievements
- **📝 Notes** - Organize thoughts with categories, colors, and pinning
- **🎵 Ambient Sounds** - Curated audio library for enhanced focus
- **💬 Community Forum** - Connect with others, share strategies and wins
- **🏆 Achievements** - Unlock milestones and track progress
- **⏰ Reminders** - Personal and global wellness reminders
- **⚙️ Settings** - Customize your focus preferences

### Admin Features
- **👥 User Management** - Ban/unban users, promote admins
- **🎖️ Milestone Management** - Create and manage achievements
- **📝 Content Moderation** - Manage forum posts and daily tips
- **🎵 Sound Library** - Upload and manage ambient sounds
- **📊 Analytics** - View detailed statistics and activity logs

## 🚀 Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **TailwindCSS v4** - Styling
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **Lucide React** - Icons

### Backend
- **Supabase** - Database, Authentication, Storage
- **PostgreSQL** - Database engine
- **Row Level Security (RLS)** - Data protection

### Fonts
- **Montserrat** - Headings
- **DM Sans** - Body text

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account and project

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DOPADAILY/dopadaily.git
   cd dopadaily
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Set up the database**
   - Import `schema.sql` into your Supabase project
   - Configure Row Level Security policies (included in schema)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint

# Assets
npm run generate-assets  # Regenerate logos, favicons, and OG images
```

## 📁 Project Structure

```
dopadaily/
├── app/                    # Next.js App Router pages
│   ├── achievements/       # Achievements page
│   ├── admin/             # Admin panel (6 pages)
│   ├── dashboard/         # User dashboard
│   ├── focus/             # Focus timer page
│   ├── forum/             # Community forum
│   ├── notes/             # Notes management
│   ├── reminders/         # Reminders page
│   ├── settings/           # User settings
│   ├── sounds/            # Ambient sounds library
│   └── ...                # Auth pages (login, signup, etc.)
├── components/            # Reusable React components
├── hooks/                # Custom React hooks
│   └── queries/          # TanStack Query hooks
├── stores/               # Zustand state stores
├── utils/                # Utility functions
├── providers/            # React context providers
├── public/               # Static assets
├── scripts/              # Build scripts
└── supabase/             # Database configuration
```

## 🗄️ Database Schema

The application uses 12 main tables:

- `profiles` - User profiles and preferences
- `focus_sessions` - Focus session records
- `notes` - User notes
- `forum_posts` - Community posts
- `forum_comments` - Post comments
- `post_reactions` - Post likes
- `milestones` - Achievement definitions
- `user_achievements` - Unlocked achievements
- `reminders` - User and global reminders
- `ambient_sounds` - Audio library
- `daily_tips` - Wellness tips
- `admin_audit_log` - Admin action logs

All tables have Row Level Security (RLS) enabled for data protection.

## 🎨 Design System

### Color Palette
- **Primary:** `#b89c86` (Warm taupe)
- **Secondary:** `#9c8776`
- **Accent:** `#cbb7c9` (Soft mauve)
- **Surface:** `#e9ddcf` (Cream)
- **On Surface:** `#2b231e` (Dark brown)

See `DESIGN_STYLE_GUIDE.md` for complete design specifications.

## 🔐 Authentication

- Email/password authentication via Supabase Auth
- Password reset functionality
- Session management
- Role-based access (user, admin)
- Ban system with expiration support

## 📱 Mobile Responsive

The application is fully responsive with:
- Mobile-first design approach
- Collapsible sidebar on mobile
- Touch-friendly interactions
- Adaptive layouts for all screen sizes

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

The project includes `vercel.json` for optimal configuration.

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## 📄 Documentation

- **[PROJECT_REPORT.md](./PROJECT_REPORT.md)** - Comprehensive project documentation
- **[DESIGN_STYLE_GUIDE.md](./DESIGN_STYLE_GUIDE.md)** - Complete design system
- **[EMAIL_NOTIFICATIONS_SETUP.md](./EMAIL_NOTIFICATIONS_SETUP.md)** - Email configuration guide
- **[SUPABASE_STORAGE_SETUP.md](./SUPABASE_STORAGE_SETUP.md)** - Storage setup instructions

## 🧪 Testing

The application includes:
- TypeScript for type safety
- ESLint for code quality
- Error boundaries for graceful error handling
- Loading states and skeletons
- Empty states for better UX

## 🤝 Contributing

This is a private project. For questions or issues, please contact the development team.

## 📝 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Powered by [Supabase](https://supabase.com)
- Icons by [Lucide](https://lucide.dev)
- Fonts by [Google Fonts](https://fonts.google.com)

---

**Dopadaily** - Your peaceful path to better focus and mental wellness

*For detailed project information, see [PROJECT_REPORT.md](./PROJECT_REPORT.md)*
