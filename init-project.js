#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Parse command line arguments
const rawArgs = process.argv.slice(2);
const args = {
    _: [],
    'non-interactive': rawArgs.includes('--non-interactive'),
    help: rawArgs.includes('--help') || rawArgs.includes('-h'),
    'skip-install': rawArgs.includes('--skip-install'),
    local: rawArgs.includes('--local'),
};

// Parse key-value pairs
for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg.startsWith('--') && i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith('--')) {
        const key = arg.slice(2);
        args[key] = rawArgs[i + 1];
        i++; // Skip the value
    } else if (
        arg.startsWith('-') &&
        arg.length === 2 &&
        i + 1 < rawArgs.length &&
        !rawArgs[i + 1].startsWith('-')
    ) {
        const key = arg.slice(1);
        args[key] = rawArgs[i + 1];
        i++; // Skip the value
    }
}

// Map short flags to long names
if (args.n) args.name = args.n;
if (args.i) args.id = args.i;
if (args.s) args.server = args.s;

// Extract an indented block for a top-level YAML section, stopping at the next
// top-level key (a line starting with a non-space, non-# character followed by `:`).
function yamlSection(yaml, sectionName) {
    const sectionRe = new RegExp(`^${sectionName}:\\s*$`, 'm');
    const sectionStart = yaml.search(sectionRe);
    if (sectionStart === -1) return '';
    const afterHeader = yaml.indexOf('\n', sectionStart);
    if (afterHeader === -1) return '';
    const rest = yaml.slice(afterHeader + 1);
    const nextSection = rest.search(/^\S.*:/m);
    return nextSection === -1 ? rest : rest.slice(0, nextSection);
}

function yamlSectionUrl(yaml, sectionName) {
    const block = yamlSection(yaml, sectionName);
    const match = block.match(/url:\s*["']?(https?:\/\/[^\s"']+)/);
    return match ? match[1] : '';
}

function yamlSectionValue(yaml, sectionName, key) {
    const block = yamlSection(yaml, sectionName);
    const match = block.match(new RegExp(`${key}:\\s*["']?([^\\s"'#]+)`));
    return match ? match[1] : '';
}

// Create readline interface
let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Helper function to ask questions with default values
function ask(question, defaultValue = '') {
    return new Promise((resolve) => {
        const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
        rl.question(prompt, (answer) => {
            resolve(answer || defaultValue);
        });
    });
}

// Helper function to ask yes/no questions
function askYesNo(question, defaultYes = true) {
    return new Promise((resolve) => {
        const defaultText = defaultYes ? '[Y/n]' : '[y/N]';
        rl.question(`${question} ${defaultText}: `, (answer) => {
            const response = answer.toLowerCase() || (defaultYes ? 'y' : 'n');
            resolve(response === 'y' || response === 'yes');
        });
    });
}

// Helper function to replace template placeholders
function replaceTemplatePlaceholders(content, replacements) {
    let result = content;
    for (const [placeholder, value] of Object.entries(replacements)) {
        const regex = new RegExp(`{{${placeholder}}}`, 'g');
        result = result.replace(regex, value);
    }
    return result;
}

// Helper function to get Git info
function getGitInfo() {
    try {
        // Get remote origin URL
        const remoteUrl = execSync('git config --get remote.origin.url', {
            encoding: 'utf-8',
        }).trim();

        // Extract owner and repo name from URL
        const match = remoteUrl.match(/github\.com[/:]([\w-]+)\/([\w.-]+?)(\.git)?$/);
        if (match) {
            return {
                owner: match[1],
                repo: match[2],
                isFromTemplate: true,
            };
        }
    } catch (error) {
        // Not a git repo or no remote
    }
    return null;
}

// Helper function to check if this is a fresh template
function isFreshTemplate() {
    try {
        // Check if we have exactly 1 commit (the initial template commit)
        const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
        return commitCount === '1';
    } catch (e) {
        return false;
    }
}

// Helper function to generate unique app ID from name
function generateAppId(projectName) {
    // Convert to lowercase, replace spaces and special chars with hyphens
    let appId = projectName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    // Add a timestamp suffix to ensure uniqueness
    const timestamp = Date.now().toString(36).substring(0, 4);
    return `${appId}-${timestamp}`;
}

// Main init function
async function init() {
    console.log('\n🌎 Aether 2.0 Project Initializer');
    console.log('===========================\n');

    // Auto-detect GitHub info
    const gitInfo = getGitInfo();
    const isFresh = isFreshTemplate();

    if (gitInfo && isFresh) {
        console.log('🎯 Detected fresh GitHub repository created from template!');
        console.log(`   Repository: ${gitInfo.owner}/${gitInfo.repo}\n`);
    }

    console.log('Welcome! This wizard will help you set up your new Aether application.\n');
    console.log("Aether is a modular UI framework - you'll build your app by creating features!\n");

    // Step 1: Project Info
    console.log('📝 Step 1: Project Information\n');

    // Use repo name as default if available
    const defaultProjectName = gitInfo?.repo || 'my-awesome-app';
    const projectName = await ask('Project name', defaultProjectName);
    const cleanProjectName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    // Generate a unique app ID
    const suggestedAppId = generateAppId(projectName);
    console.log('\n🔑 App ID is used for preferences isolation between Aether apps.');
    console.log('   It must be unique across all your Aether applications.');
    const appId = await ask('App ID (must be unique)', suggestedAppId);
    const cleanAppId = appId.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const title = cleanProjectName
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const appTitle = await ask('App display name', title);
    const description = await ask('Project description', 'A modular application built with Aether');

    // Step 2: Server Configuration
    console.log('\n🌐 Step 2: Query Server Configuration\n');
    console.log(
        'The Query Server provides the API for your application (entities, reports, sentiment, etc.).\n'
    );

    const productionQueryServer = 'https://query.news.prod.g.lovelace.ai';
    const localServer = 'http://localhost:50053';

    // Ask about query server
    console.log('🔌 Query Server - API for entities, reports, sentiment, etc.');
    const needsQueryServer = await askYesNo('Will your app connect to the query server?', true);
    let queryServerAddress = '';

    if (needsQueryServer) {
        const serverChoice = await ask('Query server - (1) Production, (2) Local', '1');
        if (serverChoice === '1') {
            queryServerAddress = productionQueryServer;
        } else if (serverChoice === '2') {
            queryServerAddress = localServer;
        } else {
            queryServerAddress = await ask('Custom query server address', productionQueryServer);
        }
    }

    // Step 3: Features Selection
    console.log('\n✨ Step 3: Initial Features\n');
    console.log('Aether includes example features to help you get started.');
    console.log('You can remove them later or use them as templates.\n');

    const includeExamples = await askYesNo('Include example features?', true);

    // Step 4: Authentication
    console.log('\n🔐 Step 4: Authentication Setup\n');
    const needsAuth = await askYesNo('Will your app require user authentication?', false);

    let auth0Config = {
        domain: '',
        clientId: '',
        clientSecret: '',
        audience: '',
    };

    if (needsAuth) {
        console.log('\nAether uses Auth0 for authentication.');
        console.log("You'll need to set up an Auth0 application.\n");

        const hasAuth0 = await askYesNo('Do you have Auth0 credentials ready?', false);
        if (hasAuth0) {
            auth0Config.clientId = await ask('Auth0 client ID');
            auth0Config.clientSecret = await ask('Auth0 client secret');
            auth0Config.audience = await ask('Auth0 API audience (optional)', '');
        } else {
            console.log('\n💡 No problem! You can add Auth0 credentials later to your .env file.');
        }
    }

    // Step 5: Cesium Configuration
    console.log('\n🗺️  Step 5: Map Configuration\n');
    console.log('Cesium provides 3D globe visualization for geospatial features.');
    console.log('For localhost development, no token is needed.\n');

    let cesiumToken = '';
    const needsCesium = await askYesNo('Will you use 3D maps in your app?', true);

    // Step 6: Deployment Target
    console.log('\n🚀 Step 6: Deployment Configuration\n');
    console.log(
        'Aether apps can be deployed as a web app (via Vercel) or as a desktop app (via Electron).'
    );
    console.log('This controls routing mode and base URL behavior.\n');

    const deployToVercel = await askYesNo('Will you deploy this app to Vercel?', true);
    const deployTarget = deployToVercel ? 'vercel' : 'electron';

    if (deployToVercel) {
        console.log('\n   ✅ Configured for Vercel deployment.');
        console.log(
            '   After setup, run the /vercel_setup command in Cursor to connect to Vercel.\n'
        );
    } else {
        console.log('\n   ✅ Configured for Electron (desktop) deployment.\n');
    }

    // Step 7: Update files
    console.log('\n🔧 Step 7: Configuring your project...\n');

    // Update package.json
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

    packageJson.name = cleanProjectName;
    packageJson.productName = appTitle;
    packageJson.description = description;

    // Add init script if not present
    if (!packageJson.scripts.init) {
        packageJson.scripts.init = 'node init-project.js';
    }

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json');

    // Update nuxt.config.ts
    const nuxtConfigPath = path.join(process.cwd(), 'nuxt.config.ts');
    let nuxtConfig = fs.readFileSync(nuxtConfigPath, 'utf-8');

    // Update the title if it exists in head configuration
    if (nuxtConfig.includes('title:')) {
        nuxtConfig = nuxtConfig.replace(/title:\s*["'].*?["']/, `title: "${appTitle}"`);
    }

    fs.writeFileSync(nuxtConfigPath, nuxtConfig);
    console.log('✅ Updated nuxt.config.ts');

    // Create/Update README.md
    const readmePath = path.join(process.cwd(), 'README.md');
    const readmeContent = `# ${appTitle}

${description}

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
\`\`\`

## 🏗️ Project Structure

This is an Aether application built with a modular architecture. Features are self-contained modules in the \`features/\` directory.

### Current Features

${
    includeExamples
        ? `- **Event Sender/Receiver** - Example of inter-module communication
- **Module Debug** - Debugging panel for the module system
- **Cesium Globe** - 3D map visualization example
- **Entity Lookup** - Example of using the Query Server API`
        : '- No features yet - create your first one!'
}

### Creating New Features

\`\`\`bash
# Create a new feature structure
mkdir -p features/my-feature/{pages,components,composables}
\`\`\`

See the [Creating Modules Guide](docs/guides/creating-modules.md) for details.

## 🔧 Configuration

### Environment Variables

Create a \`.env\` file with:

\`\`\`bash
# App Configuration
NUXT_PUBLIC_APP_ID=${cleanAppId}
NUXT_PUBLIC_APP_NAME="${appTitle}"

# Query Server Configuration
# Leave empty if not using the query server
NUXT_PUBLIC_QUERY_SERVER_ADDRESS=${queryServerAddress}

${
    needsCesium
        ? `# Cesium Configuration
NUXT_PUBLIC_CESIUM_ACCESS_TOKEN=${cesiumToken || 'your-token-here'}
`
        : ''
}
${
    needsAuth
        ? `# When using Auth0, NUXT_PUBLIC_USER_NAME must be empty
NUXT_PUBLIC_USER_NAME=

# Auth0 Configuration
NUXT_PUBLIC_AUTH0_CLIENT_ID=${auth0Config.clientId || 'your-client-id'}
NUXT_PUBLIC_AUTH0_CLIENT_SECRET=${auth0Config.clientSecret || 'your-client-secret'}
NUXT_PUBLIC_AUTH0_AUDIENCE=${auth0Config.audience || 'your-api-audience'}
`
        : `# Local username (when not using Auth0)
NUXT_PUBLIC_USER_NAME=${process.env.USER || 'local-user'}
`
}
\`\`\`

## 📚 Documentation

- [Module Creation Guide](docs/guides/creating-modules.md)
- [Module API Reference](docs/reference/module-api.md)
- [Documentation Index](docs/README.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Update DESIGN.md with any architectural decisions
4. Submit a pull request

## 📄 License

[Your License Here]
`;

    fs.writeFileSync(readmePath, readmeContent);
    console.log('✅ Created README.md');

    // Create DESIGN.md from template
    const designPath = path.join(process.cwd(), 'DESIGN.md');
    const currentDate = new Date().toISOString().split('T')[0];
    const designTemplate = fs.readFileSync(
        path.join(__dirname, 'design', 'design_template.md'),
        'utf-8'
    );
    const designContent = replaceTemplatePlaceholders(designTemplate, {
        APP_TITLE: appTitle,
        DATE: currentDate,
        APP_ID: cleanAppId,
        DESCRIPTION: description,
        AUTH: needsAuth ? 'Auth0' : 'None (public app)',
        CESIUM: needsCesium ? 'Cesium' : 'Not required',
        QUERY_SERVER: needsQueryServer ? queryServerAddress : 'Not configured',
    });

    fs.writeFileSync(designPath, designContent);
    console.log("✅ Created DESIGN.md - Your project's blueprint!");
    console.log('   📝 Update DESIGN.md with your project vision and architecture.');
    console.log('   🤖 AI agents read this first to understand what you want to build.');

    // Step 8: Design your project
    console.log('\n🎨 Step 8: Design Your Project\n');
    console.log('Update DESIGN.md to describe:');
    console.log("   • What you're building and why");
    console.log('   • Who will use your application');
    console.log('   • The key features you need\n');
    console.log('As you start building, create feature docs in design/ to plan work');
    console.log('with your AI agent. Copy design/feature_template.md to get started.\n');

    const shouldOpenDesign = await askYesNo(
        'Would you like to open DESIGN.md in your editor now?',
        true
    );
    if (shouldOpenDesign) {
        let opened = false;
        let cursorAvailable = false;

        // First, check if cursor command is available
        try {
            const checkCommand = process.platform === 'win32' ? 'where cursor' : 'which cursor';
            execSync(checkCommand, { stdio: 'ignore' });
            cursorAvailable = true;
        } catch (e) {
            // cursor command not found
        }

        if (cursorAvailable) {
            // Try to open with Cursor
            try {
                execSync(`cursor "${designPath}"`, { stdio: 'ignore' });
                console.log('✅ Opening DESIGN.md in Cursor...');
                console.log('   Please update it before proceeding!\n');
                opened = true;
            } catch (e) {
                // cursor command failed
            }
        } else {
            // Cursor CLI not installed, provide helpful instructions
            console.log('\n💡 Cursor CLI not found. To enable direct Cursor integration:');
            console.log('   1. Open Cursor');
            console.log('   2. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)');
            console.log('   3. Type "Install \'cursor\' command in PATH" and select it');
            console.log('   4. Re-run this init script for direct Cursor integration\n');
        }

        // If Cursor didn't work, try the system default
        if (!opened) {
            try {
                const opener =
                    process.platform === 'darwin'
                        ? 'open'
                        : process.platform === 'win32'
                          ? 'start'
                          : 'xdg-open';
                execSync(`${opener} ${designPath}`, { stdio: 'ignore' });
                console.log('✅ Opening DESIGN.md in your default editor...');
                if (!cursorAvailable) {
                    console.log('   (Follow the steps above to enable Cursor integration)');
                }
                console.log('   Please update it before proceeding!\n');
                opened = true;
            } catch (e) {
                // Both methods failed
            }
        }

        if (opened) {
            // Give them a moment to realize the file is opening
            await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
            console.log('⚠️  Could not open DESIGN.md automatically.');
            console.log(`   Please open ${designPath} manually in Cursor.`);
        }
    }

    // Create .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = `# Aether Application Configuration
# Generated by init script on ${new Date().toLocaleString()}

# App Identity (REQUIRED - Must be unique per app!)
NUXT_PUBLIC_APP_ID=${cleanAppId}
NUXT_PUBLIC_APP_NAME="${appTitle}"

# Deploy target: 'electron' for desktop app, 'vercel' for web deployment
DEPLOY_TARGET=${deployTarget}

# Query Server Configuration
# Leave empty if not using the query server
NUXT_PUBLIC_QUERY_SERVER_ADDRESS=${queryServerAddress}
`;

    if (needsCesium) {
        envContent += `
# Cesium Configuration
${cesiumToken ? `NUXT_PUBLIC_CESIUM_ACCESS_TOKEN=${cesiumToken}` : '# NUXT_PUBLIC_CESIUM_ACCESS_TOKEN=your-token-here'}
`;
    }

    if (needsAuth) {
        envContent += `
# When using Auth0, NUXT_PUBLIC_USER_NAME must be empty
NUXT_PUBLIC_USER_NAME=

# Auth0 Configuration
${auth0Config.clientId ? `NUXT_PUBLIC_AUTH0_CLIENT_ID=${auth0Config.clientId}` : '# NUXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id'}
${auth0Config.clientSecret ? `NUXT_PUBLIC_AUTH0_CLIENT_SECRET=${auth0Config.clientSecret}` : '# NUXT_PUBLIC_AUTH0_CLIENT_SECRET=your-client-secret'}
${auth0Config.audience ? `NUXT_PUBLIC_AUTH0_AUDIENCE=${auth0Config.audience}` : '# NUXT_PUBLIC_AUTH0_AUDIENCE=your-api-audience'}
`;
    } else {
        envContent += `
# Local username (when not using Auth0)
NUXT_PUBLIC_USER_NAME=${process.env.USER || 'local-user'}
`;
    }

    // Add Firebase config section
    envContent += `
# Firebase Configuration (for preferences storage)
# Get these from your Firebase project settings
# NUXT_PUBLIC_FIREBASE_API_KEY=your-api-key
# NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
# NUXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
# NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
# NUXT_PUBLIC_FIREBASE_APP_ID=your-app-id
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file');

    // Create .env.example
    const envExamplePath = path.join(process.cwd(), '.env.example');
    fs.writeFileSync(envExamplePath, envContent.replace(/=.*/g, '='));
    console.log('✅ Created .env.example');

    // Update .gitignore if needed
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
        let gitignore = fs.readFileSync(gitignorePath, 'utf-8');
        if (!gitignore.includes('.env')) {
            gitignore += '\n# Environment files\n.env\n.env.local\n';
            fs.writeFileSync(gitignorePath, gitignore);
            console.log('✅ Updated .gitignore');
        }
    }

    // Remove example features if not wanted
    if (!includeExamples) {
        console.log('\n🧹 Removing example features...');
        const featuresToRemove = [
            'event-sender',
            'event-receiver',
            'module-debug',
            'cesium-globe',
            'entity-lookup',
        ];

        for (const feature of featuresToRemove) {
            const featurePath = path.join(process.cwd(), 'features', feature);
            if (fs.existsSync(featurePath)) {
                fs.rmSync(featurePath, { recursive: true, force: true });
                console.log(`   Removed ${feature}`);
            }
        }

        // Update plugins/01.module-registry.client.ts to remove registrations
        const pluginPath = path.join(process.cwd(), 'plugins', '01.module-registry.client.ts');
        if (fs.existsSync(pluginPath)) {
            let pluginContent = fs.readFileSync(pluginPath, 'utf-8');

            // Remove imports
            pluginContent = pluginContent.replace(
                /import\s+\w+\s+from\s+['"]~\/features\/(event-sender|event-receiver|module-debug|cesium-globe|entity-lookup)['"]\s*;?\s*\n/g,
                ''
            );

            // Remove registrations
            pluginContent = pluginContent.replace(/moduleRegistry\.register\(\w+\);\s*\n/g, '');

            fs.writeFileSync(pluginPath, pluginContent);
            console.log('✅ Cleaned up module registrations');
        }
    }

    // Step 9: Install dependencies
    console.log('\n📦 Step 9: Install Dependencies\n');

    const shouldInstall = await askYesNo(
        'Would you like to install dependencies now? (This may take a minute)',
        true
    );

    if (shouldInstall) {
        console.log('\n📦 Installing dependencies...\n');
        try {
            execSync('npm install', { stdio: 'inherit' });
            console.log('\n✅ Dependencies installed successfully!');
        } catch (error) {
            console.error('\n❌ Error installing dependencies:', error.message);
            console.log('You can install them manually by running: npm install');
        }
    }

    // Final message
    console.log('\n' + '='.repeat(70));
    console.log('\n🎉 PROJECT SETUP COMPLETE! 🎉\n');
    console.log('='.repeat(70));

    console.log('\n🚀 READY TO BUILD!\n');

    console.log('⚡ QUICK START:\n');
    console.log('1. Start the development server:');
    console.log('   → npm run dev\n');
    console.log('2. Open your browser to:');
    console.log('   → http://localhost:3000\n');

    if (includeExamples) {
        console.log('3. Explore the example features:');
        console.log('   → Check out Event Sender/Receiver to see module communication');
        console.log('   → Try the Cesium Globe for 3D visualization\n');
    }

    console.log('📝 NEXT STEPS:\n');
    console.log('1. Update DESIGN.md with your project vision and architecture');
    console.log('2. Create a feature doc in design/ to plan your first feature');
    console.log('   (copy design/feature_template.md to get started)');
    console.log('3. Open your AI assistant and start building!\n');

    console.log('📚 DOCUMENTATION:\n');
    console.log('• Quick Start: README.md');
    console.log('• Creating Modules: docs/guides/creating-modules.md');
    console.log('• Publishing Modules: docs/guides/publishing-modules.md');
    console.log('• All Documentation: docs/README.md\n');

    console.log('💡 YOUR APP ID: ' + cleanAppId);
    console.log('   This uniquely identifies your app for preferences storage.\n');

    console.log('='.repeat(70));
    console.log('\nHappy building with Aether! 🌎✨\n');

    rl.close();
}

// Non-interactive mode implementation
async function runNonInteractiveInit(config) {
    const {
        projectName,
        appId,
        appTitle,
        description = 'A modular application built with Aether',
        queryServer = '',
        cesiumToken = '',
        deployTarget = 'vercel',
        includeExamples = true,
        skipInstall = false,
        auth0ClientId = '',
        auth0ClientSecret = '',
        auth0Audience = '',
    } = config;

    const cleanProjectName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const cleanAppId = appId || generateAppId(projectName);
    const title =
        appTitle ||
        cleanProjectName
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

    // Update package.json
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

    packageJson.name = cleanProjectName;
    packageJson.productName = title;
    packageJson.description = description;

    if (!packageJson.scripts.init) {
        packageJson.scripts.init = 'node init-project.js';
    }

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json');

    // Update nuxt.config.ts
    const nuxtConfigPath = path.join(process.cwd(), 'nuxt.config.ts');
    let nuxtConfig = fs.readFileSync(nuxtConfigPath, 'utf-8');

    if (nuxtConfig.includes('title:')) {
        nuxtConfig = nuxtConfig.replace(/title:\s*["'].*?["']/, `title: "${title}"`);
    }

    fs.writeFileSync(nuxtConfigPath, nuxtConfig);
    console.log('✅ Updated nuxt.config.ts');

    // Create README.md (simplified for non-interactive)
    const readmePath = path.join(process.cwd(), 'README.md');
    const readmeContent = `# ${title}

${description}

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Configuration

See \`.env\` for configuration options.

## Documentation

- [Quick Start Guide](README.md)
- [Creating Modules](docs/guides/creating-modules.md)
- [Documentation Index](docs/README.md)
`;

    fs.writeFileSync(readmePath, readmeContent);
    console.log('✅ Created README.md');

    // Create DESIGN.md from template
    const designPath = path.join(process.cwd(), 'DESIGN.md');
    const currentDate = new Date().toISOString().split('T')[0];
    const designTemplate = fs.readFileSync(
        path.join(__dirname, 'design', 'design_template.md'),
        'utf-8'
    );
    const designContent = replaceTemplatePlaceholders(designTemplate, {
        APP_TITLE: title,
        DATE: currentDate,
        APP_ID: cleanAppId,
        DESCRIPTION: description,
        AUTH: auth0ClientId ? 'Auth0' : 'Not yet configured',
        CESIUM: cesiumToken ? 'Cesium' : 'Not yet configured',
        QUERY_SERVER: queryServer || 'Not yet configured',
    });

    fs.writeFileSync(designPath, designContent);
    console.log('✅ Created DESIGN.md');

    // Create .env file
    const envPath = path.join(process.cwd(), '.env');
    const envContent = `# Aether Application Configuration
# Generated by init script on ${new Date().toLocaleString()}

# App Identity (REQUIRED - Must be unique per app!)
NUXT_PUBLIC_APP_ID=${cleanAppId}
NUXT_PUBLIC_APP_NAME="${title}"

# Deploy target: 'electron' for desktop app, 'vercel' for web deployment
DEPLOY_TARGET=${deployTarget}

# Query Server Configuration
# Leave empty if not using the query server
NUXT_PUBLIC_QUERY_SERVER_ADDRESS=${queryServer}

# Cesium Configuration
${cesiumToken ? `NUXT_PUBLIC_CESIUM_ACCESS_TOKEN=${cesiumToken}` : '# NUXT_PUBLIC_CESIUM_ACCESS_TOKEN=your-token-here'}

# User configuration
${auth0ClientId ? '# When using Auth0, NUXT_PUBLIC_USER_NAME must be empty\nNUXT_PUBLIC_USER_NAME=' : `# Local username (when not using Auth0)\nNUXT_PUBLIC_USER_NAME=${process.env.USER || 'local-user'}`}

# Auth0 Configuration
${auth0ClientId ? `NUXT_PUBLIC_AUTH0_CLIENT_ID=${auth0ClientId}` : '# NUXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id'}
${auth0ClientSecret ? `NUXT_PUBLIC_AUTH0_CLIENT_SECRET=${auth0ClientSecret}` : '# NUXT_PUBLIC_AUTH0_CLIENT_SECRET=your-client-secret'}
${auth0Audience ? `NUXT_PUBLIC_AUTH0_AUDIENCE=${auth0Audience}` : '# NUXT_PUBLIC_AUTH0_AUDIENCE=your-api-audience'}
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file');

    // Create .env.example
    const envExamplePath = path.join(process.cwd(), '.env.example');
    fs.writeFileSync(envExamplePath, envContent.replace(/=.*/g, '='));
    console.log('✅ Created .env.example');

    // Remove example features if requested
    if (!includeExamples) {
        const featuresToRemove = [
            'event-sender',
            'event-receiver',
            'module-debug',
            'cesium-globe',
            'entity-lookup',
        ];

        for (const feature of featuresToRemove) {
            const featurePath = path.join(process.cwd(), 'features', feature);
            if (fs.existsSync(featurePath)) {
                fs.rmSync(featurePath, { recursive: true, force: true });
            }
        }

        // Clean up plugins/01.module-registry.client.ts
        const pluginPath = path.join(process.cwd(), 'plugins', '01.module-registry.client.ts');
        if (fs.existsSync(pluginPath)) {
            let pluginContent = fs.readFileSync(pluginPath, 'utf-8');
            pluginContent = pluginContent.replace(
                /import\s+\w+\s+from\s+['"]~\/features\/(event-sender|event-receiver|module-debug|cesium-globe|entity-lookup)['"]\s*;?\s*\n/g,
                ''
            );
            pluginContent = pluginContent.replace(/moduleRegistry\.register\(\w+\);\s*\n/g, '');
            fs.writeFileSync(pluginPath, pluginContent);
        }

        console.log('✅ Removed example features');
    }

    if (!skipInstall) {
        console.log('\n📦 Installing dependencies...\n');
        try {
            execSync('npm install', { stdio: 'inherit' });
            console.log('\n✅ Dependencies installed successfully!');
        } catch (error) {
            console.error('\n❌ Error installing dependencies:', error.message);
            console.log('You can install them manually by running: npm install');
        }
    }
}

// Quick local-dev setup: creates .env with sensible defaults, no wizard.
// Reads broadchurch.yaml if present for project-specific values.
function runLocalInit() {
    const rawName = path.basename(process.cwd());
    const cleanName = rawName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    const appId = cleanName;
    const title = cleanName
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    let queryServer = '';
    let gatewayUrl = '';
    let tenantOrgId = '';

    const bcPath = path.join(process.cwd(), 'broadchurch.yaml');
    if (fs.existsSync(bcPath)) {
        const yaml = fs.readFileSync(bcPath, 'utf-8');
        queryServer = yamlSectionUrl(yaml, 'query_server');
        gatewayUrl = yamlSectionUrl(yaml, 'gateway');
        tenantOrgId = yamlSectionValue(yaml, 'tenant', 'org_id');
    }

    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        console.log('ℹ️  .env already exists — skipping creation.');
    } else {
        const envContent = `# Local development configuration (generated by npm run init -- --local)
NUXT_PUBLIC_APP_ID=${appId}
NUXT_PUBLIC_APP_NAME="${title}"
NUXT_PUBLIC_USER_NAME=dev-user
DEPLOY_TARGET=vercel
${queryServer ? `NUXT_PUBLIC_QUERY_SERVER_ADDRESS=${queryServer}` : '# NUXT_PUBLIC_QUERY_SERVER_ADDRESS='}
${gatewayUrl ? `NUXT_PUBLIC_GATEWAY_URL=${gatewayUrl}` : '# NUXT_PUBLIC_GATEWAY_URL='}
${tenantOrgId ? `NUXT_PUBLIC_TENANT_ORG_ID=${tenantOrgId}` : '# NUXT_PUBLIC_TENANT_ORG_ID='}
`;
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Created .env with local-dev defaults (Auth0 bypassed).');
    }

    console.log('\nReady! Run:\n');
    console.log('  npm install');
    console.log('  npm run dev\n');
}

// Show help if requested
if (args.help) {
    console.log(`
Aether Project Initializer

Usage:
  npm run init                       # Interactive wizard
  npm run init -- --local            # Quick local-dev setup (creates .env, no prompts)
  npm run init -- --non-interactive  # CI mode (used by tenant-init workflow)

Options:
  --local                      Quick setup: create .env with dev defaults and exit
  --non-interactive            Run full init without prompts (for CI)
  --name, -n <string>          Project name (default: directory name)
  --id, -i <string>            Unique app ID for preferences
  --title <string>             App display title
  --description <string>       Project description
  --query-server <string>      Query server address
  --deploy-target <string>     Deploy target: 'vercel' (default) or 'electron'
  --auth0-client-id <string>   Auth0 client ID
  --auth0-client-secret <string> Auth0 client secret
  --auth0-audience <string>    Auth0 API audience
  --include-examples           Include example features (default: true)
  --skip-install               Skip npm install step
  --help, -h                   Show this help message

Examples:
  npm run init -- --local
  npm run init -- --non-interactive --name "My App" --id "my-app-2024"
  npm run init -- --non-interactive --skip-install --no-include-examples
`);
    process.exit(0);
}

// Main entry point
if (args.local) {
    runLocalInit();
    process.exit(0);
} else if (args['non-interactive']) {
    const config = {
        projectName: args.name || path.basename(process.cwd()),
        appId: args.id,
        appTitle: args.title,
        description: args.description,
        queryServer: args['query-server'],
        cesiumToken: args.cesium,
        deployTarget: args['deploy-target'] || 'vercel',
        auth0ClientId: args['auth0-client-id'],
        auth0ClientSecret: args['auth0-client-secret'],
        auth0Audience: args['auth0-audience'],
        includeExamples: args['include-examples'] !== false,
        skipInstall: args['skip-install'] || false,
    };

    console.log('🚀 Running Aether initialization in non-interactive mode...');
    console.log(`   Project: ${config.projectName}`);
    console.log(`   App ID: ${config.appId || 'auto-generated'}`);

    runNonInteractiveInit(config)
        .then(() => {
            console.log('\n✅ Project initialized successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error:', error.message);
            process.exit(1);
        });
} else {
    // Interactive wizard
    init().catch((error) => {
        console.error('Error:', error);
        rl.close();
        process.exit(1);
    });
}
