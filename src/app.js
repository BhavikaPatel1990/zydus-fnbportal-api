import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import i18n from 'i18n';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import apiRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 7001;
const BASE_PATH = process.env.BASE_PATH || '/fnb-api';
const API_BASE_PATH = `${BASE_PATH}/api`;
const allowedOrigins = [process.env.FRONT_END_URL].filter(Boolean);

// Session setup
app.use(session({ secret: 'fnb-portal-api', resave: false, saveUninitialized: true }));

// i18n Configuration
i18n.configure({
    locales: ['en', 'fr'],
    directory: path.join(__dirname, 'components', 'translations'),
    defaultLocale: 'en',
    objectNotation: true,
});
app.use(i18n.init);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
// app.use(cors({
//     origin: [process.env.FRONT_END_URL, process.env.BACKEND_END_URL],
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Methods'],
// }));
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Methods'],
}));
app.use((req, res, next) => {
    const lang = req.body.lang || 'en';
    res.setLocale(lang);
    next();
});

// Serve uploads as static files
app.use(`${API_BASE_PATH}/uploads`, express.static(path.join(__dirname, '..', 'uploads')));

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────
// Home route
app.get('/', (req, res) => {
    res.send('Welcome to the Zydus FNB Portal API!');
});
app.get(BASE_PATH, (req, res) => {
    res.send('FNB API context running');
});
app.get(API_BASE_PATH, (req, res) => {
    res.send('FNB API running');
});
app.use(API_BASE_PATH, apiRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Request not found",
        method: req.method
    });
});

// Error handler
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`FNB Portal API is running on ${process.env.BASE_URL}`);
});
