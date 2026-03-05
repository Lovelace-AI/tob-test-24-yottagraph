const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Platform information
    platform: process.platform,
    isElectron: true,

    // App information
    getVersion: () => ipcRenderer.invoke('app-version'),
    getPlatformInfo: () => ipcRenderer.invoke('platform-info'),

    // Window controls
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),

    // Storage API (if needed for preferences)
    store: {
        get: (key) => ipcRenderer.invoke('store-get', key),
        set: (key, value) => ipcRenderer.invoke('store-set', key, value),
        delete: (key) => ipcRenderer.invoke('store-delete', key),
    },

    // Auth0 token exchange (bypasses CORS)
    auth0TokenExchange: (code, redirectUri) =>
        ipcRenderer.invoke('auth0-token-exchange', { code, redirectUri }),

    // Clear auth cookies for logout
    clearAuthCookies: () => ipcRenderer.invoke('clear-auth-cookies'),

    // Auth token management
    auth: {
        checkStored: () => ipcRenderer.invoke('auth:check-stored'),
        getStoredTokens: () => ipcRenderer.invoke('auth:get-stored-tokens'),
        storeTokens: (tokens) => ipcRenderer.invoke('auth:store-tokens', tokens),
        logout: () => ipcRenderer.invoke('auth:logout'),
        refreshTokens: () => ipcRenderer.invoke('auth:refresh-tokens'),
    },

    // Window transition after successful login
    authLoginSuccess: () => ipcRenderer.invoke('auth:login-success'),

    // Window transition for logout
    authLogoutTransition: () => ipcRenderer.invoke('auth:logout-transition'),
});

// Also expose some Node.js globals that might be useful
contextBridge.exposeInMainWorld('nodeAPI', {
    versions: process.versions,
});
