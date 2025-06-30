# Publishing @zatca-sdk/pro to GitHub Packages

## Current Status
✅ Package configuration is ready in `packages/pro/`
✅ GitHub token is configured in `.npmrc`
✅ Publishing script is prepared

## Manual Steps to Complete Publishing

Since npm commands are restricted in this environment, you'll need to run these commands locally:

### 1. Navigate to Pro Package Directory
```bash
cd packages/pro
```

### 2. Verify Package Configuration
```bash
cat package.json | grep -A 3 "publishConfig"
```
Should show:
```json
"publishConfig": {
  "registry": "https://npm.pkg.github.com/"
}
```

### 3. Check Authentication
```bash
cat .npmrc
```
Should show:
```
@zatca-sdk:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=GITHUB_PERSONAL_ACCESS_TOKEN
```

### 4. Publish the Package
```bash
npm publish
```

Expected output:
```
+ @zatca-sdk/pro@1.0.1
```

### 5. Clean Up (Security)
```bash
rm .npmrc
```

### 6. Verify Publication
Check that the package appears at:
https://github.com/mouna-bassim/zatca-sdk/packages

## Alternative: Use the Publishing Script
```bash
chmod +x publish-to-github.sh
./publish-to-github.sh
```

## Installation Instructions (For End Users)

Once published, users can install the Pro package with:

```bash
# Configure GitHub Packages registry
echo "@zatca-sdk:registry=https://npm.pkg.github.com/" >> ~/.npmrc

# Authenticate (users need their own GitHub token with read:packages permission)
echo "//npm.pkg.github.com/:_authToken=USER_GITHUB_TOKEN" >> ~/.npmrc

# Install the Pro package
npm install @zatca-sdk/pro
```

## Package Details
- **Name**: @zatca-sdk/pro
- **Version**: 1.0.1
- **Registry**: GitHub Packages
- **Access**: Private (requires GitHub authentication)
- **License**: Commercial

## Files Included in Package
- `src/` - Source code
- `dist/` - Built TypeScript files
- `README.md` - Comprehensive documentation
- Package metadata and dependencies

## Next Steps After Publishing
1. ✅ Package published to GitHub Packages
2. ✅ Available at https://github.com/mouna-bassim/zatca-sdk/packages
3. ✅ Users can install with proper GitHub authentication
4. ✅ Gumroad integration provides license keys for access
5. ✅ Pro features unlocked for paying customers