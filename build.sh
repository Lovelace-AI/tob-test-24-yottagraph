#!/bin/bash

# Electron build script for macOS
# This script builds and optionally notarizes the Electron app

echo "🔨 Electron Build Script for macOS"
echo "==================================="

# Default settings
ARCH="arm64"
MODE="sign"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --arch)
            ARCH="$2"
            shift 2
            ;;
        --x64|--intel)
            ARCH="x64"
            shift
            ;;
        --arm64|--apple-silicon)
            ARCH="arm64"
            shift
            ;;
        --universal)
            ARCH="universal"
            shift
            ;;
        --notarize)
            MODE="notarize"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --notarize               Enable notarization (requires Apple Developer account)"
            echo "  --arch <arch>            Build architecture (x64/arm64/universal)"
            echo "  --x64, --intel           Build for Intel Macs"
            echo "  --arm64, --apple-silicon Build for Apple Silicon Macs (default)"
            echo "  --universal              Build for both architectures"
            echo "  --help, -h               Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                       # Build signed app for Apple Silicon"
            echo "  $0 --x64                 # Build signed app for Intel"
            echo "  $0 --universal --notarize # Build and notarize for both architectures"
            echo ""
            echo "Note: For notarization, create a .env.codesign file with:"
            echo "  export APPLE_ID='your-apple-id@example.com'"
            echo "  export APPLE_APP_SPECIFIC_PASSWORD='xxxx-xxxx-xxxx-xxxx'"
            echo "  export APPLE_TEAM_ID='YOUR_TEAM_ID'"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help to see available options"
            exit 1
            ;;
    esac
done

# Check for signing certificate
if ! security find-identity -v -p codesigning | grep -q "Developer ID Application"; then
    echo "⚠️  Warning: No Developer ID Application certificate found"
    echo "   The app will be built unsigned. Users will see security warnings."
    echo "   See CODE_SIGNING_SETUP.md for instructions on setting up code signing."
    echo ""
    export CSC_IDENTITY_AUTO_DISCOVERY=false
else
    # Certificate found, use it
    echo "✅ Found Developer ID Application certificate"
fi

# Handle notarization mode
if [ "$MODE" = "notarize" ]; then
    echo "📝 Mode: Notarization enabled"
    
    if [ -f .env.codesign ]; then
        source .env.codesign
        if [ -z "$APPLE_APP_SPECIFIC_PASSWORD" ] || [ -z "$APPLE_ID" ] || [ -z "$APPLE_TEAM_ID" ]; then
            echo "❌ ERROR: Missing required notarization variables in .env.codesign"
            echo "   Required: APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID"
            echo "   See CODE_SIGNING_SETUP.md for instructions"
            exit 1
        fi
        echo "✅ Notarization credentials loaded"
    else
        echo "❌ ERROR: .env.codesign not found"
        echo "   This file is required for notarization."
        echo "   See CODE_SIGNING_SETUP.md for setup instructions"
        exit 1
    fi
else
    echo "✍️  Mode: Signing only (notarization disabled)"
    # Clear any notarization variables to prevent accidental notarization
    unset APPLE_ID APPLE_ID_PASSWORD APPLE_APP_SPECIFIC_PASSWORD
    unset APPLE_TEAM_ID NOTARIZE_APPLE_ID NOTARIZE_APPLE_ID_PASSWORD NOTARIZE_TEAM_ID
fi

# Display architecture selection
echo "🏗️  Architecture: $ARCH"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist-electron

# Configure architecture flag for electron-builder
if [ "$ARCH" = "universal" ]; then
    echo "📦 Building universal binary (Intel + Apple Silicon)..."
    ARCH_FLAG=""
else
    echo "📦 Building for $ARCH..."
    ARCH_FLAG="--$ARCH"
fi

# Build process
echo "🏗️  Starting build process..."
echo ""

# First generate the static Nuxt files
echo "1️⃣  Generating static files..."
npm run generate

echo ""
echo "2️⃣  Building Electron app..."
# Run electron-builder with the appropriate architecture flag
npx electron-builder --mac $ARCH_FLAG

# Show results
echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Output files:"
ls -lh dist-electron/*.dmg 2>/dev/null || echo "   No .dmg files found"
echo ""
echo "📁 Build location: dist-electron/"
