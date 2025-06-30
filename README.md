# ZATCA Phase-2 e-Invoice SDK – Freemium + Premium

A comprehensive Node.js SDK for generating and submitting legally-valid electronic invoices to the Saudi Arabia Zakat, Tax & Customs Authority (ZATCA) Phase-2 system.

## 🚀 Quick Start

### Free Sandbox Tier
Perfect for testing and development with ZATCA simulation endpoints:

```bash
npm install @zatca-sdk/core
```

```javascript
import { ZATCAInvoiceSDK } from '@zatca-sdk/core';

const sdk = new ZATCAInvoiceSDK({
  vatNumber: '123456789012345',
  sellerName: 'Your Company Ltd'
});

// Generate device credentials
const credentials = await sdk.generateDeviceCredentials();

// Build and submit invoice (simulation mode)
const invoice = { /* invoice data */ };
const xml = sdk.buildInvoiceXML(invoice);
const result = await sdk.submitForClearance(xml, 'simplified', 'csid');
```

### Premium Production Tier
Unlock production endpoints and advanced features:

```bash
npm install @zatca-sdk/pro
```

```javascript
import { ZATCAInvoiceSDKPro } from '@zatca-sdk/pro';

const sdk = new ZATCAInvoiceSDKPro({
  vatNumber: '123456789012345',
  sellerName: 'Your Company Ltd',
  environment: 'production', // Production endpoints
  args: process.argv // For --licence flag
});

// All production features enabled
sdk.switchToProduction();
sdk.enableAutoRetry(3, 1000);
sdk.enableCertificateAutoRenewal();
```

## 🔑 Getting Your Licence Key

**Premium features require a valid licence token.**

👉 **[Get your licence key at /buy.html](./docs/buy.html)**

### Licence Token Usage

**Environment Variable (recommended):**
```bash
export ZSDK_LICENCE_KEY=ZSDK1234567890ABCDEF
```

**CLI Flag:**
```bash
npm run pro-demo -- --licence ZSDK1234567890ABCDEF
```

## 📦 Package Structure

This is a monorepo with two packages:

### `@zatca-sdk/core` (Free Sandbox)
- **License:** MIT
- **Features:** 
  - Complete ZATCA Phase-2 implementation
  - Sandbox simulation endpoints only
  - All cryptographic operations
  - UBL XML generation
  - TLV QR code generation
- **Limitations:** 
  - Forced `Clearance-Status: SIMULATION` header
  - Cannot connect to production endpoints

### `@zatca-sdk/pro` (Premium Production)
- **License:** Commercial
- **Features:**
  - Everything in Core package
  - **Production ZATCA endpoints**
  - **Automatic retry** (3×, exponential backoff)
  - **Certificate auto-renewal** (30 days before expiry)
  - **TypeScript definitions** (`.d.ts` files)
- **Requirements:** Valid licence token

## 🛠️ Development & Testing

### Run Core Demo (Free)
```bash
npm install
npm run core-demo
```
Expected output: `✅ CLEARED (simulation)`

### Run Pro Demo (Premium)
```bash
npm run pro-demo -- --licence ZSDK1234567890ABCDEF
```

### Run Tests
```bash
npm test
```

## 🏗️ Business Model

### Free Tier
- Perfect for **development and testing**
- Access to complete ZATCA implementation
- Sandbox simulation endpoints
- Community support

### Premium Tier
- **Production-ready** for live businesses
- Real ZATCA endpoint integration
- Advanced resilience features
- Priority support
- Certificate lifecycle management

## 📋 API Reference

### Core Functions (Available in both tiers)

```javascript
// Device credentials
const credentials = await sdk.generateDeviceCredentials();

// Invoice building
const xml = sdk.buildInvoiceXML(invoiceData);
const qrCode = sdk.generateTLVQR(invoiceData);

// Cryptographic operations
const signed = await sdk.signInvoice(xml, privateKey, certificate);
```

### Premium-Only Functions

```javascript
// Production endpoints
sdk.switchToProduction();

// Advanced features
sdk.enableAutoRetry(maxRetries, delay);
sdk.enableCertificateAutoRenewal();

// Certificate monitoring
const status = await sdk.checkCertificateExpiry('./cert.pem');
```

## 🔒 Security & Compliance

- **Cryptography:** secp256k1 elliptic curve
- **Standards:** UBL 2.1, ISO 8601, ZATCA QR spec v2.1
- **Endpoints:** ZATCA-certified sandbox and production URLs
- **Authentication:** CSID-based with certificate embedding

## 📄 License

- **Core package:** MIT License (free for any use)
- **Pro package:** Commercial license (requires valid token)

## 🆘 Support

- **Free tier:** Community support via GitHub issues
- **Premium tier:** Priority email support included
- **Documentation:** Comprehensive guides and examples
- **Updates:** Automatic ZATCA specification compliance

---

**Ready to go live in Saudi Arabia?** 
👉 **[Get your production licence key](./docs/buy.html)**