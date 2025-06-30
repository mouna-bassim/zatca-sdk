#!/bin/bash

# ZATCA SDK Production Deployment Script
# Run this script to deploy to GitHub and npm

set -e

echo "🚀 ZATCA SDK Production Deployment"
echo "===================================="

# Step 1: Configure Git remote
echo "📡 Adding GitHub remote..."
git remote add origin git@github.com:mouna-bassim/zatca-sdk.git || echo "Remote already exists"

# Step 2: Add all production files
echo "📦 Adding production files..."
git add .

# Step 3: Commit production-ready structure
echo "💾 Committing production structure..."
git commit -m "feat: Production-ready ZATCA SDK packages

🎯 Core Features:
✅ @zatca-sdk/core - Free npm package for sandbox testing
✅ @zatca-sdk/pro - Premium GitHub package for production
✅ Gumroad payment integration (https://mounabsm.gumroad.com/l/zydki)
✅ Automated CI/CD pipeline for npm publishing
✅ TypeScript support with build configurations
✅ Comprehensive documentation and quick-start guide

🏗️ Infrastructure:
✅ GitHub Actions workflow for automated publishing
✅ Webhook handlers for licence key generation
✅ Demo environment separated from production packages
✅ Security audit capabilities and doctor script
✅ Multilingual support (Arabic/English)
✅ Post-install hints for developer experience

🔧 Production Ready:
✅ Proper package metadata and repository links
✅ MIT licence for Core, Commercial for Pro
✅ GitHub Packages configuration for premium features
✅ Complete payment processing infrastructure
✅ Version tagging for automated releases"

# Step 4: Push to GitHub
echo "🌐 Pushing to GitHub..."
git push -u origin main

# Step 5: Create and push first release tag
echo "🏷️ Creating v1.0.0 release tag..."
git tag v1.0.0
git push --tags

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🎯 What happens next:"
echo "• GitHub Actions will automatically build and publish @zatca-sdk/core to npm"
echo "• Core package will be available: npm install @zatca-sdk/core"
echo "• Pro package ready for GitHub Packages distribution"
echo "• GitHub release will be created with changelog"
echo ""
echo "🔗 Monitor progress:"
echo "• Repository: https://github.com/mouna-bassim/zatca-sdk"
echo "• Actions: https://github.com/mouna-bassim/zatca-sdk/actions"
echo "• npm: https://www.npmjs.com/package/@zatca-sdk/core"
echo ""
echo "⚙️ Next steps:"
echo "1. Configure NPM_TOKEN secret in GitHub repository settings"
echo "2. Set up Gumroad webhook endpoint for payment processing"
echo "3. Test package installation: npm install @zatca-sdk/core"
echo "4. Verify doctor script: npx zatca-sdk doctor"
echo ""
echo "🎉 ZATCA SDK is ready for production use!" 