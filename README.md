# ZATCA Phase-2 e-Invoice SDK – Freemium + Premium

![ZATCA Status](https://img.shields.io/badge/ZATCA%20Sandbox-✅%20CLEARED-green?style=flat-square)
![Last Tested](https://img.shields.io/badge/Last%20CLEARED-2025--06--30%2009:17%20UTC-blue?style=flat-square)
![Node Version](https://img.shields.io/badge/Node.js-≥18-brightgreen?style=flat-square)

A comprehensive Node.js SDK for generating and submitting legally-valid electronic invoices to the Saudi Arabia Zakat, Tax & Customs Authority (ZATCA) Phase-2 system.

**Ready for Wave 3** • Developer SDK • Node 18+ • secp256k1

## 🗺️ Device Registration Journey (5-Minute Quick Start)

```
You → Generate CSR → ZATCA Portal → Download cert/CSID → Set .env → npm run clear → ✅ CLEARED
     (automatic)     (manual)       (manual)        (1 command)    (production)
```

**TL;DR:** Generate keys automatically, upload CSR to ZATCA portal manually, configure credentials, and you're ready for production invoicing.

## 🚀 Quick Start

### Free Sandbox Tier
Perfect for testing and development with ZATCA simulation endpoints:

```bash
npm install @zatca-sdk/core
```

**Copy-paste setup:**
```bash
export ZATCA_VAT_NUMBER="123456789012345"
export ZATCA_SELLER_NAME="Your Company Ltd"
npm run core-demo
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
npm run pro-demo
```

**CLI Flag:**
```bash
npm run pro-demo -- --licence ZSDK1234567890ABCDEF
```

**Enterprise Offline Activation:**
```bash
# Generate activation request
npx zatca-sdk activate --email user@corp.sa --vat 123456789012345
# Email generated JSON to support, receive signed licence
export ZSDK_LICENCE_PATH=/etc/zsdk/licence.pem
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

### Post-Install Sanity Check
```bash
npx zatca-sdk doctor
```
Expected output: `🎉 All checks passed! ZATCA SDK is ready to use.`

Verifies: Node ≥18, OpenSSL with secp256k1, network connectivity to ZATCA sandbox

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

- **Cryptography:** secp256k1 elliptic curve (ZATCA Phase-2 compliant)
- **Standards:** UBL 2.1, ISO 8601, ZATCA QR spec v2.1  
- **Endpoints:** ZATCA-certified sandbox and production URLs
- **Authentication:** Compliance Secure ID (CSID) with certificate embedding
- **Key Security:** Private keys generated locally — never sent to our servers

**Security Audit:**
```bash
# Verify keys never leave your system
openssl ec -in ec-priv.pem -text -noout | head -5
# Shows: Private-Key generated on your device only
```

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