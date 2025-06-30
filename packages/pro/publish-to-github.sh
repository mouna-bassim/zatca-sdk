#!/bin/bash

# Publish @zatca-sdk/pro to GitHub Packages
echo "📦 Publishing @zatca-sdk/pro to GitHub Packages..."

# Ensure we're in the correct directory
cd "$(dirname "$0")"

# Check if .npmrc exists
if [ ! -f .npmrc ]; then
    echo "❌ .npmrc file not found. Please create it with GitHub token."
    exit 1
fi

# Check package.json configuration
echo "✅ Package configuration:"
echo "   Name: $(jq -r '.name' package.json)"
echo "   Version: $(jq -r '.version' package.json)"
echo "   Registry: $(jq -r '.publishConfig.registry' package.json)"

# Build the package if build script exists
if npm run build --if-present; then
    echo "✅ Package built successfully"
else
    echo "⚠️  No build script found, proceeding with source files"
fi

# Publish to GitHub Packages
echo "🚀 Publishing to GitHub Packages..."
if npm publish; then
    echo "✅ Successfully published @zatca-sdk/pro@$(jq -r '.version' package.json)"
    echo "📋 Package available at: https://github.com/mouna-bassim/zatca-sdk/packages"
    echo "📦 Install with: npm install @zatca-sdk/pro --registry=https://npm.pkg.github.com/"
    
    # Clean up .npmrc for security
    echo "🧹 Cleaning up authentication file..."
    rm -f .npmrc
    echo "✅ Cleanup complete"
else
    echo "❌ Publishing failed"
    exit 1
fi