const { app, BrowserWindow, shell, ipcMain, session, protocol, safeStorage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const { pathToFileURL } = require('url');
const { startApiServer } = require('./api-server');
const Store = require('electron-store');

// Load environment variables from .env file in development
if (process.env.NODE_ENV === 'development') {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

// Initialize electron-store for general preferences
const store = new Store({
    name: 'aether-preferences',
    encryptionKey: 'aether-2024', // Basic encryption for preferences
});

// Development mode flag
// Better production detection - check if app is packaged
const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

// Simple logger that respects dev mode
const log = {
    info: (...args) => isDev && console.log(...args),
    warn: (...args) => console.warn(...args), // Always show warnings
    error: (...args) => console.error(...args), // Always show errors
    debug: (...args) => isDev && console.log('[DEBUG]', ...args),
};

// Keep a global reference of the window objects
let mainWindow;
let loginWindow;
let nuxtProcess;
let apiServer;

async function getStoredAuthTokens() {
    try {
        const tokenPath = path.join(app.getPath('userData'), 'auth-tokens');

        // Check if file exists first
        try {
            await fs.access(tokenPath);
        } catch {
            return null;
        }

        const encryptedData = await fs.readFile(tokenPath);

        if (!safeStorage.isEncryptionAvailable()) {
            log.warn('[Auth Storage] Encryption not available, using base64 fallback');
            const decoded = Buffer.from(encryptedData, 'base64').toString();
            return JSON.parse(decoded);
        }

        const decrypted = safeStorage.decryptString(encryptedData);
        const tokens = JSON.parse(decrypted);
        return tokens;
    } catch (error) {
        log.error('[Auth Storage] Error reading stored tokens:', error.message);
        return null;
    }
}

async function storeAuthTokens(tokens) {
    try {
        const tokenPath = path.join(app.getPath('userData'), 'auth-tokens');
        log.info('[Auth Storage] Storing tokens with expires_at:', tokens.expires_at);
        const dataToStore = JSON.stringify(tokens);

        if (!safeStorage.isEncryptionAvailable()) {
            log.warn('[Auth Storage] Encryption not available, using base64 fallback');
            await fs.writeFile(tokenPath, Buffer.from(dataToStore).toString('base64'));
            return;
        }

        const encrypted = safeStorage.encryptString(dataToStore);
        await fs.writeFile(tokenPath, encrypted);
    } catch (error) {
        log.error('[Auth Storage] Failed to store tokens:', error);
        throw error;
    }
}

async function clearStoredAuthTokens() {
    try {
        const tokenPath = path.join(app.getPath('userData'), 'auth-tokens');
        await fs.unlink(tokenPath);
    } catch (error) {
        // File might not exist, that's okay
    }
}

const nuxtPort = process.env.NUXT_PORT || 3000;

// Enable live reload for Electron in development
if (isDev) {
    try {
        require('electron-reload')(__dirname, {
            electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
            hardResetMethod: 'exit',
        });
    } catch (_) {
        log.info('Failed to load electron-reload');
    }
}

function createLoginWindow() {
    // Create a smaller login window
    loginWindow = new BrowserWindow({
        width: 500,
        height: 600,
        resizable: false,
        maximizable: false,
        minimizable: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            enableRemoteModule: false,
            webSecurity: true,
        },
        icon: path.join(__dirname, '..', 'public', 'logomark_black.png'),
        titleBarStyle: 'default',
        title: 'Login',
        show: false,
        center: true,
    });

    // Show window when ready
    loginWindow.once('ready-to-show', () => {
        loginWindow.show();
    });

    // Load the login page
    if (isDev) {
        loginWindow.loadURL(`http://localhost:${nuxtPort}/login?electron_login_window=true`);
    } else {
        loginWindow.loadFile(path.join(__dirname, '..', '.output', 'public', 'index.html'), {
            hash: '/login?electron_login_window=true',
        });
    }

    // Handle external links from login window
    loginWindow.webContents.setWindowOpenHandler(({ url }) => {
        // Allow Auth0 URLs to open in system browser
        if (
            url.includes('auth0.com') ||
            url.includes(process.env.NUXT_PUBLIC_AUTH0_ISSUER_BASE_URL)
        ) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Handle window closed
    loginWindow.on('closed', () => {
        loginWindow = null;
        // If no main window exists and login window is closed, quit the app
        if (!mainWindow) {
            app.quit();
        }
    });
}

function createMainWindow() {
    // Create the main application window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            enableRemoteModule: false,
            webSecurity: true,
        },
        icon: path.join(__dirname, '..', 'public', 'logomark_black.png'),
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        show: false,
    });

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Load the app (but not the login page)
    if (isDev) {
        mainWindow.loadURL(`http://localhost:${nuxtPort}`);
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', '.output', 'public', 'index.html'));
    }

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // Allow Auth0 URLs to open in system browser
        if (
            url.includes('auth0.com') ||
            url.includes(process.env.NUXT_PUBLIC_AUTH0_ISSUER_BASE_URL)
        ) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        // For other external URLs
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Intercept navigation for auth callback handling in production
    if (!isDev) {
        mainWindow.webContents.on('will-navigate', (event, url) => {
            log.info('[Electron] will-navigate:', url);
            // Handle file:// URLs with hash routing
            if (url.includes('file://') && url.includes('#/a0callback')) {
                // Allow navigation to callback page
                return;
            }
        });
    }

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Start Nuxt process in development
function startNuxtDev() {
    if (!isDev) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const nuxtCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        nuxtProcess = spawn(nuxtCmd, ['run', 'dev'], {
            cwd: path.join(__dirname, '..'),
            env: { ...process.env, PORT: nuxtPort },
        });

        nuxtProcess.stdout.on('data', (data) => {
            const output = data.toString();
            log.info(`Nuxt: ${output}`);

            // Wait for Nuxt to be ready
            if (output.includes('Local:') || output.includes('Listening on')) {
                setTimeout(resolve, 2000); // Give it a bit more time to fully initialize
            }
        });

        nuxtProcess.stderr.on('data', (data) => {
            log.error(`Nuxt Error: ${data}`);
        });

        nuxtProcess.on('error', reject);
    });
}

// Optimize app startup
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

// Register custom protocol for Auth0 callback
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('aether', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('aether');
}

// Handle protocol for Auth0 callback
const handleAuth0Callback = async (url) => {
    // Parse the URL to extract the auth code
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    const state = urlObj.searchParams.get('state');
    const error = urlObj.searchParams.get('error');
    const error_description = urlObj.searchParams.get('error_description');

    if (error) {
        log.error('[Electron] Auth0 error:', error, error_description);
        // Show error in login window
        if (loginWindow) {
            const errorUrl = isDev
                ? `http://localhost:${nuxtPort}/login?error=${encodeURIComponent(error_description || error)}&electron_login_window=true`
                : `file://${path.join(__dirname, '..', '.output', 'public', 'index.html')}#/login?error=${encodeURIComponent(error_description || error)}&electron_login_window=true`;
            loginWindow.loadURL(errorUrl);
            loginWindow.focus();
        }
        return;
    }

    if (code) {
        // Parse additional parameters from the callback URL
        const isLoginWindow = urlObj.searchParams.get('electron_login_window') === 'true';

        // If this is from a login window, handle it differently
        if (isLoginWindow && loginWindow) {
            // Navigate to the callback page in the login window
            let callbackUrl;
            if (isDev) {
                callbackUrl = `http://localhost:${nuxtPort}/a0callback?code=${code}${state ? `&state=${state}` : ''}&electron_login_window=true`;
            } else {
                callbackUrl = `file://${path.join(__dirname, '..', '.output', 'public', 'index.html')}#/a0callback?code=${code}${state ? `&state=${state}` : ''}&electron_login_window=true`;
            }
            loginWindow.loadURL(callbackUrl);
            loginWindow.focus();
        } else {
            // Original behavior for non-login-window flow
            // Close login window if it exists
            if (loginWindow) {
                loginWindow.close();
                loginWindow = null;
            }

            // Create main window if it doesn't exist
            if (!mainWindow) {
                createMainWindow();
                // Wait for window to be ready
                await new Promise((resolve) => {
                    mainWindow.once('ready-to-show', resolve);
                });
            }

            // Navigate to the callback page with the auth code
            let callbackUrl;
            if (isDev) {
                callbackUrl = `http://localhost:${nuxtPort}/a0callback?code=${code}${state ? `&state=${state}` : ''}`;
            } else {
                callbackUrl = `file://${path.join(__dirname, '..', '.output', 'public', 'index.html')}?auth_code=${code}${state ? `&state=${state}` : ''}`;
            }
            mainWindow.loadURL(callbackUrl);

            // Bring window to front
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    }
};

// Handle the protocol when app is already running
app.on('open-url', (event, url) => {
    event.preventDefault();
    if (url.startsWith('aether://')) {
        handleAuth0Callback(url);
    }
});

// Windows/Linux protocol handler
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window instead.
        const url = commandLine.find((arg) => arg.startsWith('aether://'));
        if (url) {
            handleAuth0Callback(url);
        }

        // Focus the main window
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
    // Register protocol for serving local files in production
    if (!isDev) {
        protocol.interceptFileProtocol('file', (request, callback) => {
            const url = request.url.substring(7); // Remove 'file://'

            // Debug logging for font files
            if (url.includes('materialdesignicons')) {
                log.info('[File Protocol] Material Design Icons request:', url);
            }

            // Handle _nuxt assets
            if (url.includes('/_nuxt/')) {
                // Remove query parameters
                const cleanUrl = url.split('?')[0];
                const assetPath = cleanUrl.substring(cleanUrl.indexOf('/_nuxt/'));
                const filePath = path.join(__dirname, '..', '.output', 'public', assetPath);
                log.info('[File Protocol] _nuxt asset resolved:', filePath);
                callback(filePath);
                return;
            }

            // Handle font files with various URL patterns (including query params)
            if (url.match(/\.(woff2?|ttf|eot|otf)(\?.*)?$/i)) {
                // Extract just the filename (remove query params)
                const filename = url.substring(url.lastIndexOf('/') + 1).split('?')[0];

                // Material Design Icons fonts are in _nuxt
                if (filename.includes('materialdesignicons')) {
                    const nuxtPath = path.join(
                        __dirname,
                        '..',
                        '.output',
                        'public',
                        '_nuxt',
                        filename
                    );
                    log.info('[File Protocol] MDI font resolved to:', nuxtPath);
                    callback(nuxtPath);
                    return;
                }

                // Golos fonts are in the root public directory
                if (filename.startsWith('GolosText-')) {
                    const fontPath = path.join(__dirname, '..', '.output', 'public', filename);
                    log.info('[File Protocol] Golos font resolved to:', fontPath);
                    callback(fontPath);
                    return;
                }

                // Default font handling - check both locations
                const nuxtPath = path.join(__dirname, '..', '.output', 'public', '_nuxt', filename);
                const rootPath = path.join(__dirname, '..', '.output', 'public', filename);

                // Check if font exists in _nuxt first, then root
                const fsSync = require('fs');
                if (fsSync.existsSync(nuxtPath)) {
                    log.info('[File Protocol] Font found in _nuxt:', nuxtPath);
                    callback(nuxtPath);
                } else if (fsSync.existsSync(rootPath)) {
                    log.info('[File Protocol] Font found in root:', rootPath);
                    callback(rootPath);
                } else {
                    log.info('[File Protocol] Font not found, using original URL:', url);
                    callback(decodeURIComponent(url));
                }
                return;
            }

            // Handle root-level assets (images, etc.)
            const rootAssets = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'];

            if (rootAssets.some((ext) => url.toLowerCase().endsWith(ext))) {
                // Extract just the filename
                const filename = url.substring(url.lastIndexOf('/') + 1);
                const filePath = path.join(__dirname, '..', '.output', 'public', filename);
                callback(filePath);
                return;
            }

            // Default file protocol handling
            callback(decodeURIComponent(url));
        });
    }
    // Set up security headers with Auth0 domains
    const auth0Domain = process.env.NUXT_PUBLIC_AUTH0_ISSUER_BASE_URL || 'https://auth.lovelace.ai';
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    `default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https: http://localhost:* ws://localhost:* ${auth0Domain} https://*.auth0.com; connect-src 'self' https: http://localhost:* ws://localhost:* ${auth0Domain} https://*.auth0.com`,
                ],
            },
        });
    });

    // Check if user is already authenticated
    let hasValidAuth = false;
    try {
        const tokens = await getStoredAuthTokens();
        if (tokens && tokens.expires_at && tokens.expires_at > Date.now()) {
            hasValidAuth = true;
            log.info('[Electron] Valid stored auth tokens found');
        } else if (tokens) {
            log.info('[Electron] Stored auth tokens are expired');
        }
    } catch (error) {
        log.info('[Electron] Error checking auth tokens:', error);
    }

    if (isDev) {
        log.info('Starting Nuxt development server...');
        await startNuxtDev();

        // Decide which window to create based on auth state
        if (hasValidAuth) {
            log.info('[Electron] User has stored auth, opening main window');
            createMainWindow();
        } else {
            log.info('[Electron] No stored auth, opening login window');
            createLoginWindow();
        }
    } else {
        // In production, create appropriate window first, then start API server
        if (hasValidAuth) {
            log.info('[Electron] User has stored auth, opening main window');
            createMainWindow();
        } else {
            log.info('[Electron] No stored auth, opening login window');
            createLoginWindow();
        }

        // Start API server after window is created to avoid blocking
        setTimeout(async () => {
            log.info('Starting API server...');
            try {
                apiServer = await startApiServer(3001);
                log.info('API server started successfully');
            } catch (error) {
                log.error('Failed to start API server:', error);
            }
        }, 100);
    }

    app.on('activate', async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            // Check auth state again when activating
            let hasAuth = false;
            try {
                const tokens = await getStoredAuthTokens();
                if (tokens && tokens.expires_at && tokens.expires_at > Date.now()) {
                    hasAuth = true;
                }
            } catch (error) {
                log.info('[Electron] No stored auth tokens found on activate');
            }

            if (hasAuth) {
                createMainWindow();
            } else {
                createLoginWindow();
            }
        }
    });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Clean up on app quit
app.on('before-quit', () => {
    if (nuxtProcess) {
        nuxtProcess.kill();
    }
    if (apiServer) {
        apiServer.close();
    }
});

// Handle certificate errors (for development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (isDev) {
        // Ignore certificate errors in development
        event.preventDefault();
        callback(true);
    } else {
        // Use default behavior in production
        callback(false);
    }
});

// IPC handlers for communication with renderer
ipcMain.handle('app-version', () => {
    return app.getVersion();
});

ipcMain.handle('platform-info', () => {
    return {
        platform: process.platform,
        arch: process.arch,
        version: process.versions,
    };
});

// Auth0 token exchange handler (bypasses CORS)
ipcMain.handle('auth0-token-exchange', async (event, { code, redirectUri }) => {
    try {
        const clientId = process.env.NUXT_PUBLIC_AUTH0_CLIENT_ID;
        const clientSecret = process.env.NUXT_PUBLIC_AUTH0_CLIENT_SECRET;
        const issuerBaseUrl = process.env.NUXT_PUBLIC_AUTH0_ISSUER_BASE_URL;

        const response = await fetch(`${issuerBaseUrl}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                redirect_uri: redirectUri,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
        }

        const tokenData = await response.json();

        // Store the tokens securely
        if (tokenData.access_token) {
            await storeAuthTokens({
                access_token: tokenData.access_token,
                id_token: tokenData.id_token,
                refresh_token: tokenData.refresh_token,
                expires_at: Date.now() + tokenData.expires_in * 1000,
                token_type: tokenData.token_type,
                scope: tokenData.scope,
            });
        }

        return tokenData;
    } catch (error) {
        log.error('[Electron Main] Token exchange error:', error);
        throw error;
    }
});

// Note: Auth0 logout is now handled by opening the logout URL in the browser
// This ensures the browser's Auth0 session cookies are properly cleared

// Storage handlers
const userDataPath = app.getPath('userData');
const storageFile = path.join(userDataPath, 'storage.json');

async function readStorage() {
    try {
        const data = await fs.readFile(storageFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // File doesn't exist or is corrupted, return empty object
        return {};
    }
}

async function writeStorage(data) {
    try {
        await fs.writeFile(storageFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        log.error('Failed to write storage:', error);
    }
}

ipcMain.handle('store-get', async (event, key) => {
    const storage = await readStorage();
    return storage[key];
});

ipcMain.handle('store-set', async (event, key, value) => {
    const storage = await readStorage();
    storage[key] = value;
    await writeStorage(storage);
});

ipcMain.handle('store-delete', async (event, key) => {
    const storage = await readStorage();
    delete storage[key];
    await writeStorage(storage);
});

// Window control handlers
ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
});

// Clear all cookies for logout
ipcMain.handle('clear-auth-cookies', async () => {
    try {
        // Get all cookies
        const allCookies = await session.defaultSession.cookies.get({});

        // Clear specific auth cookie first
        const authCookieName = process.env.NUXT_PUBLIC_AUTH0_COOKIE_NAME || 'llai-cookie';

        // Try multiple approaches to clear cookies
        for (const cookie of allCookies) {
            if (
                cookie.name === authCookieName ||
                cookie.name.includes('auth') ||
                cookie.name.includes('llai')
            ) {
                // Try different URL formats
                const urls = [
                    `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
                    `http://localhost:3000${cookie.path}`,
                    `http://localhost:3001${cookie.path}`,
                    `file://${cookie.path}`,
                ];

                for (const url of urls) {
                    try {
                        await session.defaultSession.cookies.remove(url, cookie.name);
                        log.info(`[Electron Main] Removed cookie ${cookie.name} using URL: ${url}`);
                    } catch (e) {
                        // Silent fail, try next URL
                    }
                }
            }
        }

        // Clear all storage data
        await session.defaultSession.clearStorageData({
            storages: [
                'cookies',
                'localstorage',
                'sessionstorage',
                'cachestorage',
                'websql',
                'indexdb',
                'serviceworkers',
            ],
        });

        // Force clear cache
        await session.defaultSession.clearCache();

        // Also clear stored auth tokens
        await clearStoredAuthTokens();

        return true;
    } catch (error) {
        log.error('[Electron Main] Error clearing cookies:', error);
        return false;
    }
});

// Auth token management handlers
ipcMain.handle('auth:check-stored', async () => {
    try {
        const tokens = await getStoredAuthTokens();
        if (!tokens) {
            return { hasStoredAuth: false };
        }

        // Check if tokens are expired
        if (tokens.expires_at && tokens.expires_at < Date.now()) {
            log.info('[Auth Storage] Stored tokens are expired');

            // Try to refresh if we have a refresh token
            if (tokens.refresh_token) {
                try {
                    const refreshed = await refreshAuthTokens(tokens.refresh_token);
                    return { hasStoredAuth: true, tokens: refreshed };
                } catch (error) {
                    await clearStoredAuthTokens();
                    return { hasStoredAuth: false };
                }
            } else {
                await clearStoredAuthTokens();
                return { hasStoredAuth: false };
            }
        }

        return { hasStoredAuth: true, tokens };
    } catch (error) {
        log.error('[Auth Storage] Error checking stored auth:', error);
        return { hasStoredAuth: false };
    }
});

ipcMain.handle('auth:get-stored-tokens', async () => {
    return await getStoredAuthTokens();
});

ipcMain.handle('auth:store-tokens', async (event, tokens) => {
    try {
        await storeAuthTokens(tokens);
        return { success: true };
    } catch (error) {
        log.error('[Auth Storage] Failed to store tokens:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('auth:logout', async () => {
    try {
        await clearStoredAuthTokens();
        // Also clear cookies
        await session.defaultSession.clearStorageData({
            storages: ['cookies', 'localstorage', 'sessionstorage'],
        });
        return { success: true };
    } catch (error) {
        log.error('[Auth Storage] Error during logout:', error);
        return { success: false, error: error.message };
    }
});

// Token refresh helper
async function refreshAuthTokens(refreshToken) {
    const clientId = process.env.NUXT_PUBLIC_AUTH0_CLIENT_ID;
    const clientSecret = process.env.NUXT_PUBLIC_AUTH0_CLIENT_SECRET;
    const issuerBaseUrl = process.env.NUXT_PUBLIC_AUTH0_ISSUER_BASE_URL;

    const response = await fetch(`${issuerBaseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    const tokenData = await response.json();

    // Store the refreshed tokens
    const newTokens = {
        access_token: tokenData.access_token,
        id_token: tokenData.id_token,
        refresh_token: tokenData.refresh_token || refreshToken, // Keep old refresh token if not provided
        expires_at: Date.now() + tokenData.expires_in * 1000,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
    };

    await storeAuthTokens(newTokens);
    return newTokens;
}

ipcMain.handle('auth:refresh-tokens', async () => {
    try {
        const tokens = await getStoredAuthTokens();
        if (!tokens || !tokens.refresh_token) {
            throw new Error('No refresh token available');
        }

        const refreshed = await refreshAuthTokens(tokens.refresh_token);
        return { success: true, tokens: refreshed };
    } catch (error) {
        log.error('[Auth Storage] Failed to refresh tokens:', error);
        return { success: false, error: error.message };
    }
});

// Handle authentication success - transition from login to main window
ipcMain.handle('auth:login-success', async () => {
    log.info('[Electron] Login success, transitioning to main window');

    // Close login window
    if (loginWindow) {
        loginWindow.close();
        loginWindow = null;
    }

    // Create and show main window
    if (!mainWindow) {
        createMainWindow();
    } else {
        mainWindow.show();
        mainWindow.focus();
    }

    return { success: true };
});

// Handle logout - transition from main window to login window
ipcMain.handle('auth:logout-transition', async () => {
    log.info('[Electron] Logout, transitioning to login window');

    // Close main window
    if (mainWindow) {
        mainWindow.close();
        mainWindow = null;
    }

    // Create and show login window
    if (!loginWindow) {
        createLoginWindow();
    } else {
        loginWindow.show();
        loginWindow.focus();
    }

    return { success: true };
});
