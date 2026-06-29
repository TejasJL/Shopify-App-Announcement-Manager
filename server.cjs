const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ── CORS ──
const corsOptions = {
  origin: function (origin, callback) {
    const allowed = [
      process.env.SHOPIFY_APP_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'https://localhost:3000',
    ].filter(Boolean);
    if (!origin || allowed.some(url => origin.startsWith(url))) {
      callback(null, true);
    } else {
      callback(null, true); // allow all in dev
    }
  },
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));

// ── RATE LIMITING ──
const saveLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many requests. Please wait.' }
});
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { success: false, error: 'Too many requests.' }
});

// ── MONGODB ──
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

mongoose.connection.on('error', err => console.error('❌ MongoDB error:', err.message));
mongoose.connection.on('disconnected', () => console.warn('⚠️ MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('✅ MongoDB reconnected'));

// ── SCHEMA ──
const announcementSchema = new mongoose.Schema({
  text: { type: String, required: true, maxlength: 200, trim: true },
  shop: { type: String, required: true, trim: true, index: true },
  savedAt: { type: Date, default: Date.now, index: true },
  metafieldId: { type: String, default: null },
  shopifySynced: { type: Boolean, default: false }
});

const Announcement = mongoose.model('Announcement', announcementSchema);

// ── HELPER: sanitise text ──
function sanitiseText(text) {
  return text.replace(/<[^>]*>/g, '').trim();
}

// ── POST /api/announcement ──
app.post('/api/announcement', saveLimiter, async (req, res) => {
  try {
    const { text, shop, accessToken } = req.body;

    if (!text || !shop || !accessToken) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    const cleanText = sanitiseText(text);
    if (!cleanText) return res.status(400).json({ success: false, error: 'Text cannot be empty.' });
    if (cleanText.length > 200) return res.status(400).json({ success: false, error: 'Text too long.' });

    // Save to MongoDB
    const newAnnouncement = new Announcement({ text: cleanText, shop, shopifySynced: false });
    await newAnnouncement.save();
    console.log(`✅ Saved to MongoDB for ${shop}`);

    // Check existing metafield
    const checkRes = await fetch(
      `https://${shop}/admin/api/2024-01/metafields.json?namespace=my_app&key=announcement&owner_resource=shop`,
      { headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' } }
    );
    const checkData = await checkRes.json();
    const existing = checkData.metafields?.[0];

    const shopifyUrl = existing
      ? `https://${shop}/admin/api/2024-01/metafields/${existing.id}.json`
      : `https://${shop}/admin/api/2024-01/metafields.json`;
    const shopifyMethod = existing ? 'PUT' : 'POST';
    const shopifyBody = existing
      ? { metafield: { id: existing.id, value: cleanText, type: 'single_line_text_field' } }
      : { metafield: { namespace: 'my_app', key: 'announcement', value: cleanText, type: 'single_line_text_field', owner_resource: 'shop' } };

    const shopifyRes = await fetch(shopifyUrl, {
      method: shopifyMethod,
      headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(shopifyBody)
    });
    const shopifyData = await shopifyRes.json();

    if (!shopifyRes.ok) {
      console.error('❌ Shopify API error:', shopifyData);
      return res.status(207).json({
        success: false, dbSaved: true, shopifySynced: false,
        error: 'Saved to MongoDB but Shopify sync failed.',
        shopifyError: shopifyData
      });
    }

    newAnnouncement.metafieldId = shopifyData.metafield?.id?.toString();
    newAnnouncement.shopifySynced = true;
    await newAnnouncement.save();
    console.log(`✅ Shopify metafield synced (ID: ${shopifyData.metafield?.id})`);

    return res.status(201).json({
      success: true, dbSaved: true, shopifySynced: true,
      message: 'Saved to MongoDB and synced to Shopify!',
      announcement: {
        _id: newAnnouncement._id,
        text: newAnnouncement.text,
        savedAt: newAnnouncement.savedAt,
        shopifySynced: true
      }
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ── GET /api/announcements/:shop ──
// FIX: removed -__v from .select() to avoid MongoDB projection conflict
app.get('/api/announcements/:shop', readLimiter, async (req, res) => {
  try {
    const shop = req.params.shop;

    const announcements = await Announcement
      .find({ shop })
      .sort({ savedAt: -1 })
      .limit(20)
      .select('text savedAt shopifySynced metafieldId'); // ← FIXED: removed -__v

    return res.json({ success: true, count: announcements.length, announcements });
  } catch (error) {
    console.error('❌ History fetch error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch history.' });
  }
});

// ── GET /health ──
app.get('/health', (req, res) => {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  return res.json({
    status: 'ok',
    mongodb: states[mongoose.connection.readyState] || 'unknown',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found.' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
});
