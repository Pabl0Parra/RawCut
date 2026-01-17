# CortoCrudo - Movie/TV Recommendation App

A React Native (Expo) movie and TV recommendation app with social features and gamification. Built with TypeScript, NativeWind, and Supabase.

## Features

- 🎬 Browse popular movies and TV shows (via TMDb API)
- 🔍 Search for content
- ❤️ Save favorites
- 📌 Create a watchlist
- 💌 Send recommendations to friends
- 💬 Comment on recommendations (real-time)
- ⭐ Rate recommendations (1-5 stars)
- 🏆 Earn points for good recommendations
- 🍺 Unlock beer badges at milestones

## Tech Stack

- **Frontend**: React Native (Expo SDK 54+), TypeScript
- **Styling**: NativeWind (TailwindCSS for React Native)
- **Navigation**: Expo Router (file-based)
- **State Management**: Zustand
- **Forms**: react-hook-form + Zod
- **Backend**: Supabase (Auth, Postgres, Real-time)
- **API**: TMDb API v3

## Getting Started

### Prerequisites

- Node.js 18+ (recommended 20+)
- npm or yarn
- Expo Go app (for mobile testing)
- Supabase account
- TMDb API key

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd CortoCrudo
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and fill in your credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   EXPO_PUBLIC_TMDB_API_KEY=your-tmdb-api-key
   EXPO_PUBLIC_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p/w500
   ```

3. **Set up Supabase database**:
   Run the SQL schema in your Supabase SQL Editor:
   ```bash
   # Copy contents of supabase/schema.sql and run in Supabase Dashboard
   ```

4. **Start the development server**:
   ```bash
   npx expo start
   ```

5. **Run on device**:
   - Scan QR code with Expo Go (Android)
   - Scan QR code with Camera app (iOS)
   - Press `w` for web

## Project Structure

```
CortoCrudo/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigator screens
│   │   ├── index.tsx      # Home (Movies/TV)
│   │   ├── favorites.tsx  # Favorites list
│   │   ├── watchlist.tsx  # Watchlist
│   │   ├── recommendations.tsx
│   │   └── profile.tsx
│   ├── movie/[id].tsx     # Movie detail
│   ├── tv/[id].tsx        # TV show detail
│   ├── login.tsx
│   └── register.tsx
├── src/
│   ├── components/        # Reusable components
│   ├── lib/              # API clients (Supabase, TMDb)
│   ├── stores/           # Zustand stores
│   └── schemas/          # Zod validation schemas
├── supabase/
│   └── schema.sql        # Database schema
└── assets/               # Images and fonts
```

## Points System

- 4-star rating: Sender gets **+1 point**
- 5-star rating: Sender gets **+2 points**

### Beer Badges 🍺
- 10 points: 🍺
- 25 points: 🍺🍺
- 50 points: 🍺🍺🍺

## UI Language

All UI text is in **Spanish** as per requirements.

## Contributing

This is a personal project. Feel free to fork and modify!

## License

MIT
# CortoCrudo
