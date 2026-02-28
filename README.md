# CortoCrudo

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Pabl0Parra_RawCut&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Pabl0Parra_RawCut)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=Pabl0Parra_RawCut&metric=bugs)](https://sonarcloud.io/summary/new_code?id=Pabl0Parra_RawCut)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=Pabl0Parra_RawCut&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=Pabl0Parra_RawCut)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=Pabl0Parra_RawCut&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=Pabl0Parra_RawCut)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-54.0.33-000020?logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)
![TMDb](https://img.shields.io/badge/TMDb-API%20v3-01B4E4?logo=themoviedatabase&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-4.4.0-orange)
![NativeWind](https://img.shields.io/badge/NativeWind-Tailwind%20CSS-38BDF8?logo=tailwindcss&logoColor=white)
![Jest](https://img.shields.io/badge/tested%20with-Jest%2029-C21325?logo=jest&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

CortoCrudo is a comprehensive movie and television recommendation platform developed with React Native and Expo. It integrates social features, allowing users to discover content, manage personal lists, and share recommendations within a community.

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

## License

This project is licensed under the MIT License.
