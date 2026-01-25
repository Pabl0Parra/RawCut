# CortoCrudo

CortoCrudo is a comprehensive movie and television recommendation platform developed with React Native and Expo. It integrates social features with a gamified experience, allowing users to discover content, manage personal lists, and share recommendations within a community.

## Table of Contents

<details>
<summary>Click to expand</summary>

- [Overview](#overview)
- [Key Features](#key-features)
- [Technical Architecture](#technical-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup](#database-setup)
- [Project Structure](#project-structure)
- [Gamification System](#gamification-system)
- [License](#license)

</details>

## Overview

The application serves as a centralized hub for media enthusiasts to track their viewing progress and exchange high-quality recommendations. Built with a focus on real-time interaction and data integrity, CortoCrudo utilizes the TMDb API for comprehensive media metadata and Supabase for secure backend services.

## Key Features

- Media Discovery: Search and browse popular movies and television series through integration with the TMDb API.
- Personal Management: Maintain dedicated Favorites and Watchlist collections.
- Social Recommendations: Send direct recommendations to other users with personalized messages.
- Real-time Interaction: Engage in threaded discussions on recommendations with live updates.
- Rating System: Rate received recommendations on a five-star scale.
- Gamification: Earn reward points based on the quality of recommendations provided to others.
- Professional UI: High-contrast theme optimized for readability and user engagement.

## Technical Architecture

### Frontend
- Framework: React Native with Expo SDK 54.
- Language: TypeScript (Strict Mode).
- Navigation: Expo Router (File-based routing).
- Styling: NativeWind (Tailwind CSS implementation for React Native).
- State Management: Zustand.
- Form Handling: React Hook Form with Zod validation.

### Backend
- Platform: Supabase.
- Database: PostgreSQL with Row Level Security (RLS).
- Authentication: Supabase Auth with custom profile triggers.
- Real-time: Supabase Realtime for comments and notifications.

### Data Sources
- Media Metadata: TMDb (The Movie Database) API v3.

## Getting Started

### Prerequisites
- Node.js (version 18 or higher recommended).
- npm or yarn package manager.
- Expo Go mobile application for physical device testing.
- A Supabase project.
- A TMDb API key.

### Installation
1. Clone the repository.
2. Navigate to the project directory:
   ```bash
   cd RawCut
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Environment Configuration
Create a `.env` file in the root directory based on `.env.example`. Required variables include:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous API key.
- `EXPO_PUBLIC_TMDB_API_KEY`: Your TMDb API key.
- `EXPO_PUBLIC_TMDB_IMAGE_BASE`: Base URL for TMDb images (e.g., https://image.tmdb.org/t/p/w500).

### Database Setup
To initialize the database, execute the SQL script located in `supabase/schema.sql` within the Supabase SQL Editor. This script configures:
- Database tables (profiles, user_content, recommendations, etc.).
- Robust Row Level Security (RLS) policies.
- Automated triggers for profile creation and point calculations.
- Real-time publication settings.

### Running the Application
Start the development server:
```bash
npx expo start
```
Use the Expo Go app to scan the generated QR code or use the following commands:
- Press `a` for Android Emulator.
- Press `i` for iOS Simulator.
- Press `w` for Web.

## Project Structure

- `app/`: Contains Expo Router screens and layouts.
- `src/components/`: Reusable presentation and functional components.
- `src/hooks/`: Custom React hooks for logic reuse.
- `src/lib/`: API clients and third-party service configurations.
- `src/stores/`: Zustand store definitions for global state management.
- `src/constants/`: Shared constants and theme definitions.
- `supabase/`: SQL schema and database migration files.
- `assets/`: Static assets including images and custom fonts.

## Gamification System

CortoCrudo rewards users for providing valuable recommendations to their peers. Points are awarded based on the rating received:
- 4-star rating: The sender receives +1 point.
- 5-star rating: The sender receives +2 points.

Milestone achievements are recognized at specific point thresholds (10, 25, and 50 points), which are displayed on the user's public profile.

## License

This project is licensed under the MIT License.
