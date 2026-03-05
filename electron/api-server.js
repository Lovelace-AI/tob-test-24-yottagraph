const express = require('express');
const cors = require('cors');
const path = require('path');

// Development mode flag
const isDev = process.env.NODE_ENV === 'development';

// Simple logger
const log = {
    info: (...args) => isDev && log.info('[API Server]', ...args),
    warn: (...args) => log.warn('[API Server]', ...args),
    error: (...args) => log.error('[API Server]', ...args),
    debug: (...args) => isDev && log.info('[API Server DEBUG]', ...args),
};

// Firebase Admin setup - inline to avoid import issues
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase
const useProdFirebase = Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GOOGLE_APPLICATION_CREDENTIALS !== ''
);

const firebaseApp = useProdFirebase
    ? initializeApp({
          credential: applicationDefault(),
          databaseURL: 'https://elemental-prefs.firebaseio.com',
          projectId: 'lovelace-elemental',
      })
    : initializeApp({
          projectId: 'localprefs',
      });

// Get Firestore instance
const fireDb =
    process.env.FIRESTORE_DATABASE && useProdFirebase
        ? getFirestore(process.env.FIRESTORE_DATABASE)
        : getFirestore();

// Configure Firestore for local emulator if not using production
if (!useProdFirebase) {
    const host = process.env.FIRESTORE_EMULATOR_HOST || '192.168.128.200:8080';
    if (host) {
        fireDb.settings({
            host: host,
            ssl: false,
        });
    }
}

// Create Express app
const app = express();

// Middleware
app.use(
    cors({
        origin: true,
        credentials: true,
    })
);
app.use(express.json());

// Simple auth check - in Electron we trust the local user
// In a real app, you'd want to validate the user properly
function getUserIdFromRequest(req) {
    // For now, we'll use a default user ID or extract from a header
    // In production, this should be properly authenticated
    return req.headers['x-user-id'] || 'electron-user';
}

// API Routes

// Write endpoint
app.post('/api/firestore/write', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        log.info('[API] Write request for user:', userId);

        const { docPath, fieldName, value } = req.body;
        const docRef = fireDb.doc(docPath);

        let dataUpdate = {};
        dataUpdate[fieldName] = value;

        await docRef.set(dataUpdate, { merge: true });
        res.json({ success: true });
    } catch (error) {
        log.error('[API] Firestore write error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Read endpoint
app.get('/api/firestore/read', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        log.info('[API] Read request for user:', userId);

        const { docPath, fieldName } = req.query;
        const docRef = fireDb.doc(decodeURIComponent(docPath));
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.json(undefined);
        }

        const data = doc.data();
        if (fieldName) {
            return res.json(data[fieldName]);
        }
        return res.json(data);
    } catch (error) {
        log.error('[API] Firestore read error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Copy document endpoint
app.post('/api/firestore/copy', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { from, to } = req.body;
        const fromDoc = await fireDb.doc(from).get();

        if (fromDoc.exists) {
            await fireDb.doc(to).set(fromDoc.data());
        }

        res.json({ success: true });
    } catch (error) {
        log.error('[API] Firestore copy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Copy collection endpoint
app.post('/api/firestore/copyCollection', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { from, to } = req.body;
        const fromCollection = await fireDb.collection(from).get();

        const batch = fireDb.batch();
        fromCollection.forEach((doc) => {
            const toDocRef = fireDb.collection(to).doc(doc.id);
            batch.set(toDocRef, doc.data());
        });

        await batch.commit();
        res.json({ success: true });
    } catch (error) {
        log.error('[API] Firestore copy collection error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete document endpoint
app.post('/api/firestore/delete', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { path } = req.body;
        await fireDb.doc(path).delete();
        res.json({ success: true });
    } catch (error) {
        log.error('[API] Firestore delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete collection endpoint
app.post('/api/firestore/deleteCollection', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { path } = req.body;
        const collection = await fireDb.collection(path).get();

        const batch = fireDb.batch();
        collection.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        res.json({ success: true });
    } catch (error) {
        log.error('[API] Firestore delete collection error:', error);
        res.status(500).json({ error: error.message });
    }
});

// List collections endpoint
app.get('/api/firestore/collections', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { docPath } = req.query;
        const docRef = fireDb.doc(decodeURIComponent(docPath));
        const collections = await docRef.listCollections();

        const collectionIds = collections.map((col) => col.id);
        res.json(collectionIds);
    } catch (error) {
        log.error('[API] Firestore list collections error:', error);
        res.status(500).json({ error: error.message });
    }
});

// List documents endpoint
app.get('/api/firestore/documents', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { collectionPath } = req.query;
        const collection = await fireDb.collection(decodeURIComponent(collectionPath)).get();

        const docIds = collection.docs.map((doc) => doc.id);
        res.json(docIds);
    } catch (error) {
        log.error('[API] Firestore list documents error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Avatar proxy endpoint
app.get('/api/avatar/:url', async (req, res) => {
    try {
        const avatarUrl = decodeURIComponent(req.params.url);
        const response = await fetch(avatarUrl);

        if (!response.ok) {
            return res.status(response.status).send('Failed to fetch avatar');
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        res.send(Buffer.from(buffer));
    } catch (error) {
        log.error('[API] Avatar proxy error:', error);
        res.status(500).send('Failed to fetch avatar');
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        firebase: useProdFirebase ? 'production' : 'emulator',
        emulatorHost: !useProdFirebase
            ? process.env.FIRESTORE_EMULATOR_HOST || '192.168.128.200:8080'
            : null,
    });
});

// Start server function
function startApiServer(port = 3001) {
    return new Promise((resolve, reject) => {
        const server = app
            .listen(port, 'localhost', () => {
                log.info(`[API Server] Running on http://localhost:${port}`);
                log.info(
                    `[API Server] Firebase mode: ${useProdFirebase ? 'production' : 'emulator'}`
                );
                if (!useProdFirebase) {
                    log.info(
                        `[API Server] Firestore emulator: ${process.env.FIRESTORE_EMULATOR_HOST || '192.168.128.200:8080'}`
                    );
                }
                resolve(server);
            })
            .on('error', reject);
    });
}

module.exports = { startApiServer };
