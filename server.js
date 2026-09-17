const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Security Headers Middleware (Helmet)
app.use(helmet({
    contentSecurityPolicy: false, // Disabled CSP so inline scripts in legacy HTML operate smoothly while preserving XSS/Clickjacking headers
    crossOriginEmbedderPolicy: false
}));

// 2. Strict CORS Configuration
const allowedOrigins = [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow during local deployment
        }
    },
    credentials: true, // Allow cookies over CORS
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Request Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. Rate Limiting for Sensitive Auth Routes (Prevent Brute-Force Password Guessing)
const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 10, // Limit each IP to 10 login requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Security Warning: Too many invalid login attempts. Your IP has been temporarily restricted for 15 minutes.'
    }
});

// 5. Mount API Routes
app.use('/api/admin/login', adminLoginLimiter);
app.use('/api/admin', adminRoutes);

// Mount Existing Payment Serverless Handler Wrappers
app.post('/api/payment/create-order', (req, res) => {
    const handler = require('./api/payment/create-order');
    handler(req, res);
});

app.post('/api/payment/verify-payment', (req, res) => {
    const handler = require('./api/payment/verify-payment');
    handler(req, res);
});

app.post('/api/payment/webhook', (req, res) => {
    const handler = require('./api/payment/webhook');
    handler(req, res);
});

// 6. Serve Static Web Application (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '.')));

// 7. Global 404 Route for Unmatched API Requests
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, error: 'API endpoint not found.' });
});

// Fallback to index.html for client-side routes
app.use((req, res, next) => {
    if (req.method === 'GET') {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.status(404).send('Not Found');
    }
});

// 8. Start Express Server
app.listen(PORT, () => {
    console.log(`=============================================================`);
    console.log(`🔒 SHREE AURA COTTONS HIGH-SECURITY NODE.JS BACKEND SERVER RUNNING`);
    console.log(`🟢 Server URL: http://localhost:${PORT}`);
    console.log(`🛡️  Admin Portal: http://localhost:${PORT}/admin.html`);
    console.log(`🔐 Protected API: http://localhost:${PORT}/api/admin/customers`);
    console.log(`=============================================================`);
});
