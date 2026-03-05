/**
 * Development helper script for Electron
 * This script ensures Nuxt is running before starting Electron
 */

const { spawn } = require('child_process');
const path = require('path');

// Platform-specific command handling
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('Starting Nuxt development server...');

// Start Nuxt dev server
const nuxtProcess = spawn(npmCmd, ['run', 'dev'], {
    cwd: __dirname,
    stdio: 'pipe',
    env: { ...process.env, PORT: process.env.NUXT_PORT || 3000 },
});

let electronStarted = false;

nuxtProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`Nuxt: ${output}`);

    // Wait for Nuxt to be ready
    if (!electronStarted && (output.includes('Local:') || output.includes('Listening on'))) {
        electronStarted = true;
        console.log('Nuxt is ready, starting Electron...');

        // Give Nuxt a bit more time to fully initialize
        setTimeout(() => {
            const electronProcess = spawn(npmCmd, ['run', 'electron:dev'], {
                cwd: __dirname,
                stdio: 'inherit',
            });

            electronProcess.on('close', (code) => {
                console.log(`Electron exited with code ${code}`);
                nuxtProcess.kill();
                process.exit(code);
            });
        }, 2000);
    }
});

nuxtProcess.stderr.on('data', (data) => {
    console.error(`Nuxt Error: ${data}`);
});

nuxtProcess.on('close', (code) => {
    console.log(`Nuxt exited with code ${code}`);
    if (!electronStarted) {
        process.exit(code);
    }
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Terminating processes...');
    nuxtProcess.kill();
    process.exit();
});
