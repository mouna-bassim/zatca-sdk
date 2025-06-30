# ZATCA SDK Quick Start Guide

Get up and running with ZATCA Phase-2 e-invoicing in minutes.

## Install Core Package

Install the free sandbox package from npm:

```bash
npm install @zatca-sdk/core
```

### System Requirements

- Node.js ≥18.0.0
- OpenSSL with secp256k1 support

Verify your system:
```bash
npx zatca-sdk doctor
```

### First Invoice

Generate your first sandbox invoice:

```bash
npm run core-demo
```

Expected output: `✅ Sandbox demo succeeded — invoice CLEARED`

## Get Pro Licence Key

Purchase a premium licence for production features:

🛒 **[Buy ZATCA SDK Pro - $29](https://mounabsm.gumroad.com/l/zydki)**

You'll receive a licence key via email in the format: `ZSDK1234567890ABCDEF`

## Install Pro Package

Configure your licence key:

```bash
export ZSDK_LICENCE_KEY=ZSDK1234567890ABCDEF
```

Or use the CLI flag:
```bash
npm run pro-demo -- --licence ZSDK1234567890ABCDEF
```

### Pro Features

With a valid licence key, you unlock:

- ✅ Production ZATCA endpoints
- ✅ Automatic retry with exponential backoff
- ✅ Certificate expiry monitoring
- ✅ TypeScript definitions
- ✅ Priority email support

### Production Invoice

Test production features:

```bash
npm run pro-demo
```

Expected output: `🔓 Production clearance completed (with auto-retry)`

## Next Steps

1. **Generate CSR** - Create device credentials for ZATCA portal
2. **Upload to ZATCA** - Submit CSR to compliance portal
3. **Download Certificate** - Get your signed certificate and CSID
4. **Configure Environment** - Set ZATCA_CSID and certificate path
5. **Live Testing** - Submit real invoices to ZATCA sandbox

## Need Help?

- 📖 **Documentation**: [GitHub Repository](https://github.com/mouna-bassim/zatca-sdk)
- 🆓 **Free Support**: GitHub Issues for Core package
- 🔓 **Premium Support**: Priority email support for Pro licence holders
- 🌐 **Live Demo**: [Try the web interface](https://replit.com/@mouna-bassim/zatca-sdk)

## Version Management

Tag releases to trigger automatic publishing:

```bash
git tag v1.0.1
git push --tags
```

This triggers the GitHub Actions workflow to publish the Core package to npm.