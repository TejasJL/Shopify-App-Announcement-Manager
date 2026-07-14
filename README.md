# 📢 Shopify Announcement App

A full-stack MERN application that lets Shopify store owners manage storefront announcement banners directly from the Shopify Admin dashboard.

---

## 🎯 What It Does

You type an announcement in the Admin dashboard → it saves to MongoDB with a timestamp → syncs to a Shopify Shop Metafield → appears as a live banner on every page of the storefront via a Theme App Extension.

---
<img width="636" height="690" alt="image" src="https://github.com/user-attachments/assets/732bfa7b-5237-4ec8-a0af-6b3ff1c1f0c3" />

## 🏗️ Architecture

```
Admin Dashboard (React + Polaris)
        ↓
Express Backend (Node.js)
        ↓              ↓
  MongoDB Atlas    Shopify Admin API
  (audit log)      (metafield sync)
        ↓
Theme App Extension (Liquid)
        ↓
Storefront Banner (every page)
```

---

## ✅ Implemented Features

### Admin Dashboard
- Announcement text input with 200-character limit and live progress bar
- Real-time storefront preview mockup as you type
- Save & sync button that saves to MongoDB and syncs to Shopify in one click
- Announcement history table showing all past records with timestamps
- Stat cards showing total saved, last saved time, and metafield status
- Success and error banners with individual dismiss controls
- Fully mobile-responsive layout using Shopify Polaris

### Backend (Node.js + Express)
- `POST /api/announcement` — saves text to MongoDB and syncs to Shopify metafield
- `GET /api/announcements/:shop` — returns paginated announcement history
- `GET /health` — health check showing MongoDB connection status
- Smart upsert: updates existing metafield if it exists, creates new one if not
- Input sanitisation to strip HTML tags before saving
- Rate limiting: 20 saves/minute, 60 reads/minute per IP
- MongoDB reconnect handling for dropped connections

### Database (MongoDB Atlas)
- Every announcement stored with: text, shop domain, timestamp, metafield ID, sync status
- Indexed on shop and savedAt for fast queries
- Last 20 records returned for history display

### Theme App Extension
- App Embed Block that floats on every storefront page
- Reads live from `shop.metafields.my_app.announcement`
- Customisable background colour, text colour, and font size via Theme Editor
- Optional close (×) button that respects session — dismissed banner stays dismissed
- Mobile responsive with smaller font on narrow screens
- Slide-in animation on page load

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Shopify Polaris, React Router v7 |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Shopify | Admin API (REST), Theme App Extension (Liquid) |
| Hosting | Render (backend), Shopify CLI (extension) |

---

## ⚙️ How to Run Locally

### Prerequisites
- Node.js v20+
- MongoDB Atlas account (free M0 tier)
- Shopify Partner account
- Shopify CLI installed: `npm install -g @shopify/cli`

### 1. Clone the repository
```bash
git clone https://github.com/TejasJL/Shopify-App-Announcement-Manager
cd announcement-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file in the root
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://localhost:3000
SCOPES=write_metaobjects,read_metaobjects
SHOPIFY_STORE=your-store.myshopify.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/shopify-app
BACKEND_URL=http://localhost:3001
PORT=3001
```

### 4. Start the backend
```bash
node server.cjs
```
You should see:
```
✅ MongoDB connected
🚀 Server running on port 3001
```

### 5. Start the Shopify app (new terminal)
```bash
npm run dev
```
When ready, press **P** to open the app preview in your browser.

### 6. Install on your dev store
The browser will prompt you to install the app. Click **Install**. Your dashboard appears.

---

## 🗄️ Environment Variables

| Variable | Description |
|----------|-------------|
| `SHOPIFY_API_KEY` | From Shopify Partner Dashboard → Apps → API credentials |
| `SHOPIFY_API_SECRET` | From Shopify Partner Dashboard → Apps → API credentials |
| `SHOPIFY_APP_URL` | Your deployed app URL (Render) or localhost:3000 locally |
| `SCOPES` | `write_metaobjects,read_metaobjects` |
| `SHOPIFY_STORE` | Your dev store URL e.g. `my-store.myshopify.com` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `BACKEND_URL` | Your Express backend URL |
| `PORT` | Express server port (default 3001) |

---

## 📡 API Reference

### Save announcement
```
POST /api/announcement
Content-Type: application/json

{
  "text": "Sale 50% Off — Today Only!",
  "shop": "your-store.myshopify.com",
  "accessToken": "shopify_access_token"
}
```
**Response:**
```json
{
  "success": true,
  "dbSaved": true,
  "shopifySynced": true,
  "announcement": {
    "_id": "...",
    "text": "Sale 50% Off — Today Only!",
    "savedAt": "2026-06-30T10:00:00.000Z",
    "shopifySynced": true
  }
}
```

### Get history
```
GET /api/announcements/:shop
```

### Health check
```
GET /health
```

---

## 🎨 Theme App Extension

After installing the app, enable the banner on your store:

1. Go to **Online Store → Themes → Customize**
2. Click **App embeds** (puzzle piece icon, bottom left)
3. Toggle **Announcement Banner** ON
4. Customize colour and font size
5. Click **Save**

The banner reads from:
```liquid
{{ shop.metafields.my_app.announcement }}
```

---

## 📁 Project Structure

```
announcement-app/
├── app/
│   ├── routes/
│   │   └── app._index.jsx     ← Main dashboard page
│   ├── root.jsx               ← App root with Polaris AppProvider
│   └── shopify.server.js      ← Shopify auth setup
├── extensions/
│   └── announcement-banner/
│       └── blocks/
│           └── announcement.liquid  ← Storefront banner
├── server.cjs                 ← Express backend
├── shopify.app.toml           ← Shopify CLI config
├── .env                       ← Environment variables (not committed)
└── package.json
```

---


## 👤 Author

**Tejas Lahurikar**
