#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'node_modules', '@yottagraph-ai', 'elemental-api');
const targetDir = path.join(__dirname, '..', 'query', 'api', 'specs');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

if (!fs.existsSync(sourceDir)) {
    console.warn('Warning: @yottagraph-ai/elemental-api not found in node_modules');
    console.warn('Please run npm install to install dependencies');
    process.exit(0);
}

// The published package includes generated/ with the merged spec
const filesToCopy = [
    { source: 'generated/elemental-api-spec.json', target: 'elemental-api-spec.json' },
    { source: 'README.md', target: 'README.md' },
];

filesToCopy.forEach(({ source, target }) => {
    const sourcePath = path.join(sourceDir, source);
    const targetPath = path.join(targetDir, target);

    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied ${target} to query/api/specs/`);
    } else {
        console.warn(`Warning: ${source} not found in @yottagraph-ai/elemental-api`);
    }
});

console.log('API spec files copied successfully!');
