# **Project Overview**

Build a React Native (Expo) movie/TV recommendation app called CortoCrudo with social features and gamification. Users discover content via TMDb API, share recommendations with comments, and earn points. **All UI text in Spanish, all api responses in Spanish.**

## **Tech Stack**

### **Frontend**

- **React Native** with **Expo** (SDK 51+)
- **TypeScript** (strict mode)
- **Expo Router** (file-based navigation)
- **NativeWind** (Tailwind CSS for React Native) - `nativewind@^4.0.0`
- **TMDb REST API v3**

### **Backend**

- **Supabase** (Free Tier)
  - Auth (email/username + password)
  - Postgres database
  - Row Level Security (RLS) enabled
  - Real-time subscriptions (for recommendations/comments)

### **Key Libraries**

```json
{
  "expo-router": "~3.5.0",
  "nativewind": "^4.0.1",
  "tailwindcss": "^3.4.0",
  "@supabase/supabase-js": "^2.39.0",
  "react-hook-form": "^7.49.0",
  "zod": "^3.22.0",
  "zustand": "^4.4.0"
}
```

---

## **Core Features**

### **1. Authentication**

- **Registration**: Username (unique, 3-20 chars), email, password (min 8 chars)
- **Login**: Username OR email + password
- **Supabase Auth** with JWT tokens
- Auto-create profile in `profiles` table on signup (trigger)
- Persist session with `AsyncStorage`

**Error messages (Spanish)**:

- "Usuario ya existe"
- "Contraseña debe tener al menos 8 caracteres"
- "Credenciales inválidas"

---

### **2. Movie & TV Listings**

**UI Flow**:

1. User logs in → redirected to main content page
2. Top of screen: **Pill Tab System** to toggle between "Películas" and "Series"
3. Bottom: **Persistent Tab Bar** (always visible)

**Pill Tab Component** (NativeWind):

```tsx
<View className='flex-row bg-metal-gray p-1 rounded-full mb-4'>
  <TouchableOpacity
    className={`flex-1 py-3 rounded-full ${
      activeTab === "movies" ? "bg-blood-red" : "bg-transparent"
    }`}
    onPress={() => setActiveTab("movies")}
  >
    <Text
      className={`text-center font-bold ${
        activeTab === "movies" ? "text-metal-black" : "text-metal-silver"
      }`}
    >
      🎬 Películas
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    className={`flex-1 py-3 rounded-full ${
      activeTab === "tv" ? "bg-blood-red" : "bg-transparent"
    }`}
    onPress={() => setActiveTab("tv")}
  >
    <Text
      className={`text-center font-bold ${
        activeTab === "tv" ? "text-metal-black" : "text-metal-silver"
      }`}
    >
      📺 Series
    </Text>
  </TouchableOpacity>
</View>
```

**TMDb Integration**:

- Use `https://api.themoviedb.org/3/`
- Endpoints:
  - `/movie/popular`
  - `/tv/popular`
  - `/search/movie` (for search feature)
  - `/search/tv`

**Card Display** (using NativeWind):

```tsx
<View className='bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700'>
  <Image source={{ uri: posterUrl }} className='w-full h-64' />
  <View className='p-4'>
    <Text className='text-zinc-100 font-bold text-lg'>{title}</Text>
    <View className='flex-row items-center justify-between mt-2'>
      <Text className='text-yellow-500'>⭐ {rating}/10</Text>
      <View className='flex-row gap-3'>
        <TouchableOpacity onPress={toggleFavorite}>
          <Text className='text-2xl'>{isFavorite ? "❤️" : "🤍"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleWatchlist}>
          <Text className='text-2xl'>{inWatchlist ? "📌" : "📍"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</View>
```

---

### **3. Favorites & Watchlist System**

**Two separate lists**:

1. **Favoritos** ❤️ - Movies/shows user loved
2. **Watchlist** 📌 - Movies/shows user wants to watch

**Implementation**:

```tsx
// Toggle heart icon → add/remove from Favoritos
// Toggle pin icon → add/remove from Watchlist
```

**Storage**:

- Both stored in same `user_content` table with `list_type` column
- RLS: Users can only CRUD their own items
- Separate tabs show each list
- Empty state:
  - "No tienes favoritos aún"
  - "Tu lista está vacía"

---

### **4. Recommendations**

**Flow**:

1. User selects movie/show → taps "Recomendar"
2. Search/select recipient user
3. Add optional message (max 200 chars)
4. Submit → creates recommendation row

**Notification**:

- Recipient sees badge/indicator on "Recomendaciones" tab
- List shows: poster, sender name, message, rating CTA

**Database Row**:

```sql
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id),
  receiver_id UUID REFERENCES auth.users(id),
  tmdb_id INT NOT NULL,
  media_type VARCHAR(10), -- 'movie' or 'tv'
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **5. Comments on Recommendations** 🆕

**Feature**:

- Both sender and receiver can comment on a recommendation
- Comments are threaded under each recommendation
- Real-time updates using Supabase subscriptions

**UI**:

```tsx
<View className='bg-metal-gray rounded-lg p-4 mb-4'>
  {/* Recommendation card */}
  <View className='border-t border-metal-silver mt-4 pt-4'>
    <Text className='text-metal-silver text-sm mb-2'>Comentarios</Text>
    {comments.map((comment) => (
      <View key={comment.id} className='flex-row mb-3'>
        <Text className='text-zinc-100 font-bold mr-2'>
          {comment.username}:
        </Text>
        <Text className='text-zinc-300 flex-1'>{comment.text}</Text>
      </View>
    ))}
    <TextInput
      className='bg-metal-black border border-metal-silver text-zinc-100 px-3 py-2 rounded-sm'
      placeholder='Añadir comentario...'
      placeholderTextColor='#71717a'
      value={newComment}
      onChangeText={setNewComment}
    />
    <TouchableOpacity
      className='bg-blood-red px-4 py-2 rounded-sm mt-2'
      onPress={submitComment}
    >
      <Text className='text-metal-black font-bold text-center'>Enviar</Text>
    </TouchableOpacity>
  </View>
</View>
```

**Database**:

```sql
CREATE TABLE recommendation_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  text TEXT NOT NULL CHECK (LENGTH(text) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Only sender/receiver can comment
CREATE POLICY "Comment on recommendations" ON recommendation_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recommendations r
      WHERE r.id = recommendation_id
        AND auth.uid() IN (r.sender_id, r.receiver_id)
    )
  );

CREATE POLICY "View comments" ON recommendation_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recommendations r
      WHERE r.id = recommendation_id
        AND auth.uid() IN (r.sender_id, r.receiver_id)
    )
  );
```

---

### **6. Rating System**

**Rules**:

- Only receiver can rate
- 1-5 stars (use star icons)
- Can only rate once per recommendation
- UI shows current rating (read-only for sender)

**Points Logic** (trigger/function):

```sql
-- On rating insert:
IF rating >= 4 THEN
  UPDATE profiles SET points = points + 1 WHERE user_id = sender_id;
END IF;
IF rating = 5 THEN
  UPDATE profiles SET points = points + 1 WHERE user_id = sender_id; -- +2 total
END IF;
```

---

### **7. Gamification**

**Profile Display**:

```tsx
<View className='items-center p-6 bg-zinc-900'>
  <Text className='text-zinc-100 text-2xl font-bold'>{username}</Text>
  <Text className='text-yellow-500 text-xl mt-2'>🏆 {points} puntos</Text>
  {points >= 10 && (
    <Text className='text-orange-500 mt-4 text-lg'>
      Este usuario merece una cerveza 🍺
    </Text>
  )}
</View>
```

**Milestones**:

- 10 points → 🍺 badge
- 25 points → 🍺🍺
- 50 points → 🍺🍺🍺

---

## **Database Schema**

```sql
-- Profiles (auto-created on signup)
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(20) UNIQUE NOT NULL,
  avatar_url TEXT,
  points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Content (Favorites + Watchlist combined) 🆕
CREATE TABLE user_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id INT NOT NULL,
  media_type VARCHAR(10) NOT NULL, -- 'movie' | 'tv'
  list_type VARCHAR(20) NOT NULL, -- 'favorite' | 'watchlist'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tmdb_id, media_type, list_type)
);

-- Recommendations
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id),
  receiver_id UUID REFERENCES auth.users(id),
  tmdb_id INT NOT NULL,
  media_type VARCHAR(10) NOT NULL,
  message TEXT CHECK (LENGTH(message) <= 200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (sender_id != receiver_id)
);

-- Recommendation Comments 🆕
CREATE TABLE recommendation_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  text TEXT NOT NULL CHECK (LENGTH(text) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recommendation_id)
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, users update own
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own" ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- User Content: Users CRUD own 🆕
CREATE POLICY "Users manage content" ON user_content
  USING (auth.uid() = user_id);

-- Recommendations: Sender/receiver can read, sender creates
CREATE POLICY "View own recommendations" ON recommendations FOR SELECT
  USING (auth.uid() IN (sender_id, receiver_id));
CREATE POLICY "Create recommendations" ON recommendations FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Comments: Sender/receiver can comment and view 🆕
CREATE POLICY "Comment on recommendations" ON recommendation_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recommendations r
      WHERE r.id = recommendation_id
        AND auth.uid() IN (r.sender_id, r.receiver_id)
    )
  );
CREATE POLICY "View comments" ON recommendation_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recommendations r
      WHERE r.id = recommendation_id
        AND auth.uid() IN (r.sender_id, r.receiver_id)
    )
  );

-- Ratings: Receiver creates, both can read
CREATE POLICY "Rate recommendations" ON ratings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recommendations
      WHERE id = recommendation_id AND receiver_id = auth.uid()
    )
  );
CREATE POLICY "View ratings" ON ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recommendations r
      WHERE r.id = recommendation_id
        AND auth.uid() IN (r.sender_id, r.receiver_id)
    )
  );
```

---

## **Navigation Structure (Expo Router)** 🆕

```
app/
├── _layout.tsx           # Root layout (auth check)
├── login.tsx            # Login page (first screen if not authenticated)
├── register.tsx         # Registration page
├── (tabs)/
│   ├── _layout.tsx       # Bottom Tab navigator (always visible)
│   ├── index.tsx         # Home (Movies/TV with pill tabs)
│   ├── favorites.tsx     # Favorites list
│   ├── watchlist.tsx     # Watchlist 🆕
│   ├── recommendations.tsx
│   └── profile.tsx
├── movie/[id].tsx        # Movie details
└── tv/[id].tsx          # TV show details
```

**Bottom Tab Bar (Spanish)** - Always visible after login:

```tsx
// app/(tabs)/_layout.tsx
<Tabs
  screenOptions={{
    tabBarStyle: {
      backgroundColor: "#1a1a1a",
      borderTopColor: "#71717a",
    },
    tabBarActiveTintColor: "#dc2626",
    tabBarInactiveTintColor: "#71717a",
  }}
>
  <Tabs.Screen
    name='index'
    options={{
      title: "Inicio",
      tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
    }}
  />
  <Tabs.Screen
    name='favorites'
    options={{
      title: "Favoritos",
      tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>❤️</Text>,
    }}
  />
  <Tabs.Screen
    name='watchlist'
    options={{
      title: "Watchlist",
      tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📌</Text>,
    }}
  />
  <Tabs.Screen
    name='recommendations'
    options={{
      title: "Recomendaciones",
      tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💌</Text>,
    }}
  />
  <Tabs.Screen
    name='profile'
    options={{
      title: "Perfil",
      tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
    }}
  />
</Tabs>
```

**Home Screen Layout** (index.tsx):

```tsx
export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<"movies" | "tv">("movies");

  return (
    <View className='flex-1 bg-metal-black'>
      {/* Pill Tab System */}
      <View className='px-4 pt-4'>
        <View className='flex-row bg-metal-gray p-1 rounded-full mb-4'>
          <TouchableOpacity
            className={`flex-1 py-3 rounded-full ${
              activeTab === "movies" ? "bg-blood-red" : "bg-transparent"
            }`}
            onPress={() => setActiveTab("movies")}
          >
            <Text
              className={`text-center font-bold ${
                activeTab === "movies"
                  ? "text-metal-black"
                  : "text-metal-silver"
              }`}
            >
              🎬 Películas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 py-3 rounded-full ${
              activeTab === "tv" ? "bg-blood-red" : "bg-transparent"
            }`}
            onPress={() => setActiveTab("tv")}
          >
            <Text
              className={`text-center font-bold ${
                activeTab === "tv" ? "text-metal-black" : "text-metal-silver"
              }`}
            >
              📺 Series
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content List */}
      <FlatList
        data={activeTab === "movies" ? movies : tvShows}
        renderItem={({ item }) => <MovieCard item={item} />}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}
```

---

## **UI Design System (Heavy Metal Noir)**

### Typography roles & fonts

- Body text: Inter

- Section titles: Bebas Neue

- Special flair (logo / points / beer): Metal Mania

### **NativeWind Theme**

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        "metal-black": "#0a0a0a",
        "metal-gray": "#1a1a1a",
        "metal-silver": "#71717a",
        "metal-gold": "#fbbf24",
        "blood-red": "#dc2626",
      },
      fontFamily: {
        // check the above requirements
      },
    },
  },
};
```

### Icons library

Must use react-native-vector-icons

### **Component Patterns**

```tsx
// Primary Button
<TouchableOpacity className="bg-blood-red px-6 py-3 rounded-sm active:opacity-80">
  <Text className="text-metal-black font-bold text-center uppercase">
    Enviar
  </Text>
</TouchableOpacity>

// Card Container
<View className="bg-metal-gray border border-metal-silver rounded-lg p-4">
  {/* content */}
</View>

// Input Field
<TextInput
  className="bg-metal-black border border-metal-silver text-zinc-100 px-4 py-3 rounded-sm"
  placeholderTextColor="#71717a"
/>

// Pill Tab (Segmented Control)
<View className="flex-row bg-metal-gray p-1 rounded-full">
  <TouchableOpacity className="flex-1 py-3 rounded-full bg-blood-red">
    <Text className="text-center font-bold text-metal-black">Active</Text>
  </TouchableOpacity>
  <TouchableOpacity className="flex-1 py-3 rounded-full">
    <Text className="text-center font-bold text-metal-silver">Inactive</Text>
  </TouchableOpacity>
</View>
```

---

## **Environment Variables**

```env
# .env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_key
EXPO_PUBLIC_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p/w500
```

---

## **Error Handling**

**Global Error Boundaries**:

- Network errors: "No hay conexión a internet"
- API errors: "Error al cargar películas"
- Auth errors: "Sesión expirada. Inicia sesión nuevamente"

**Form Validation** (with Zod):

```ts
const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

const commentSchema = z.object({
  text: z
    .string()
    .min(1, "El comentario no puede estar vacío")
    .max(500, "Máximo 500 caracteres"),
});
```

---

## **Testing Requirements**

1. **Unit Tests** (Jest):

   - Points calculation logic
   - Form validation schemas
   - Comment validation

2. **Integration Tests**:

   - Auth flow (register → login → logout)
   - Recommendations flow (send → receive → rate → comment)
   - Watchlist/Favorites toggle

3. **Manual Testing Checklist**:
   - [ ] User can register and login
   - [ ] Movies/TV shows load from TMDb
   - [ ] Pill tabs switch content correctly
   - [ ] Bottom tab bar always visible
   - [ ] Favorites persist after app restart
   - [ ] Watchlist items saved separately
   - [ ] Recommendations send/receive correctly
   - [ ] Comments appear in real-time
   - [ ] Points update on rating
   - [ ] Beer emoji appears at 10 points

---

## **Performance Considerations**

- **Image Caching**: Use `expo-image` for TMDb posters
- **Pagination**: Implement infinite scroll for movie lists
- **Debounce**: Search inputs (300ms delay)
- **Memoization**: Use `React.memo` for movie cards
- **Real-time**: Supabase subscriptions for comments (cleanup on unmount)

---

## **Security Checklist**

- [x] RLS enabled on all tables
- [x] No API keys in client code (use env vars)
- [x] Validate all user inputs (client + server)
- [x] Sanitize messages/comments (prevent XSS)
- [x] Rate limiting on Supabase (via policies)
- [x] Comment length limits (500 chars)

---

## **Non-Goals (V1)**

- ❌ Push notifications (for beta)
- ❌ Real payments/beer purchases
- ❌ Public social feed
- ❌ Delete/edit comments (add in V2)
- ❌ Nested comment threads (single level only)

---

## **Deliverables**

1. Working Expo app (TypeScript)
2. Supabase database setup (SQL migrations)
3. README with setup instructions
4. Environment variables template
5. Basic test coverage (>70%)

**Success Criteria**: User can login, browse movies/TV via pill tabs, add to favorites/watchlist, send recommendation with message, receive it, comment on it, rate it, and see points update.
