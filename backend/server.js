
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB Connection Error:", err));


// Express App Setup
const app = express();

const corsOptions = {
    origin: ['http://localhost:3000', 'https://google-drive-editor.vercel.app'],
    credentials: true,
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));  // Handle preflight requests

app.use(express.json());

// Secure Session Management
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { httpOnly: true, secure: process.env.NODE_ENV === "production" }  // Secure cookies in production
}));

app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://google-drive-editor.vercel.app/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    console.log("Logged in user email:", profile.emails[0].value); 
    return done(null, { profile, accessToken });
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Google Auth Routes
app.get('/auth/google', passport.authenticate('google', { 
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file']
  }));
  

app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/' 
}), (req, res) => {
    console.log("Logged-in User:", req.user);  
    res.redirect('https://google-drive-editor.vercel.app/editor');
});

// Get User Info
app.get('/auth/user', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json(req.user);
});

app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }

        req.session.destroy((err) => {
            if (err) return res.status(500).json({ error: 'Failed to destroy session' });

            res.clearCookie('connect.sid', { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production' });
            return res.status(200).json({ message: 'Logged out successfully' });
        });
    });
});


const FormData = require('form-data'); // Import FormData

app.post('/save-to-drive', async (req, res) => {
    console.log("User in request:", req.user);
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { accessToken } = req.user;
    const { content } = req.body;

    try {
        // Step 1: Check if "Letters" folder exists
        const folderQuery = await axios.get(
            'https://www.googleapis.com/drive/v3/files',
            {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                params: {
                    q: "name='Letters' and mimeType='application/vnd.google-apps.folder'",
                    fields: 'files(id, name)',
                }
            }
        );

        let folderId = folderQuery.data.files.length > 0 ? folderQuery.data.files[0].id : null;

        // Step 2: If "Letters" folder doesn't exist, create it
        if (!folderId) {
            const folderResponse = await axios.post(
                'https://www.googleapis.com/drive/v3/files',
                {
                    name: 'Letters',
                    mimeType: 'application/vnd.google-apps.folder'
                },
                { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
            );
            folderId = folderResponse.data.id;
        }

        // Step 3: Convert content to HTML format (Google Docs supports HTML or DOCX)
        const htmlContent = `<html><body><p>${content.replace(/\n/g, '<br>')}</p></body></html>`;

        // Step 4: Prepare a multipart request using FormData
        const formData = new FormData();

        // Add metadata
        formData.append(
            'metadata',
            JSON.stringify({
                name: `Letter_${Date.now()}`,
                mimeType: 'application/vnd.google-apps.document',
                parents: [folderId]
            }),
            { contentType: 'application/json' }
        );

        // Add file data (HTML content)
        formData.append(
            'file',
            htmlContent,
            { contentType: 'text/html' }
        );

        // Step 5: Upload file to Google Drive
        const response = await axios.post(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    ...formData.getHeaders() 
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error("Google Drive API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.message });
    }
});


const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
