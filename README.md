# Spider-Verse: N-Queens Challenge

A competitive browser game built for a college ACM event, based on the classic N-Queens DSA problem. The game features an original, premium multiverse/comic aesthetic inspired by the Spider-Verse but avoiding all copyrighted characters.

## 🚀 Tech Stack

- **Frontend:** Next.js 15 (React), Tailwind CSS, Framer Motion
- **Backend:** Next.js Route Handlers (API)
- **Database:** MongoDB Atlas
- **Deployment:** Vercel

## 📂 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── leaderboard/[level]/route.ts # Fetch leaderboard data
│   │   └── scores/route.ts              # Submit level completion score
│   ├── game/[level]/
│   │   ├── completion/page.tsx          # End screen for a level
│   │   └── page.tsx                     # Main game board & logic
│   ├── leaderboard/page.tsx             # Global leaderboard UI
│   ├── levels/page.tsx                  # Level selection screen
│   ├── name/page.tsx                    # Player identity screen
│   ├── globals.css                      # Custom multiverse UI styles
│   ├── layout.tsx                       # Root layout & overlays
│   └── page.tsx                         # Landing page
├── components/
│   └── SpiderQueen.tsx                  # Original animated SVG game piece
└── lib/
    ├── mongodb.ts                       # Cached MongoDB connection pool
    └── utils.ts                         # Utility functions
```

## 🛠️ How to run locally

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Setup Environment Variables:**
   Copy the example environment file and fill in your MongoDB credentials:
   ```bash
   cp .env.example .env.local
   ```
   Add your `MONGODB_URI` inside `.env.local`.

3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Required Environment Variables

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DB_NAME=spiderverse_nqueens
EVENT_PASSWORD=SPIDER2026
```
*Make sure never to expose these variables to the frontend.*

## 🍃 MongoDB Setup

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Go to **Database Access** and create a user (save the password).
3. Go to **Network Access** and whitelist your IP (or `0.0.0.0/0` for Vercel deployment).
4. Get your connection string from the **Connect** button and update `.env.local`.
5. The application will automatically create the `attempts` collection on the first insert.

## 🏆 How the Leaderboard Works

- The game features a strictly linear progression: 4 Queens ➔ 5 Queens ➔ 6 Queens.
- Scores are updated in the database after every level, accumulating a `totalScore` and `totalTime`.
- The final leaderboard only shows players who have completed all 3 levels (status: 'completed').

## 🛡️ How Anti-Cheating Works (One Play Attempt Per Device)

1. **Device Identification:** The game relies on a combination of HTTP-Only secure cookies and `localStorage` to generate a persistent `deviceId`.
2. **Server-Side Validation:** The MongoDB `attempts` collection binds the game state to this `deviceId`.
3. **Username Independence:** Usernames are not strictly unique. Two different devices can use the same username, but one device cannot start a second attempt (even with a different username).
4. **Resumption:** If a user accidentally refreshes their browser mid-game, the server detects their `deviceId` is `in_progress` and resumes them at their current level (4, 5, or 6).
5. **Completion Lockout:** Once 6 Queens is completed, the attempt is marked `completed`. If that device tries to log in again, the server rejects it and shows the leaderboard.

**Testing Mode:**
To test the game multiple times on your own computer, open an **Incognito / Private window** for each test. This generates a fresh device ID for testing the full flow.

## 🚀 How to deploy to Vercel

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and click **Add New... > Project**.
3. Import your GitHub repository.
4. In the **Environment Variables** section, add:
   - `MONGODB_URI` = your MongoDB connection string
   - `DB_NAME` = `spiderverse_nqueens`
5. Click **Deploy**. Vercel will automatically detect the Next.js framework and build the project.
