# @zatca-sdk/core

[![npm version](https://badge.fury.io/js/@zatca-sdk%2Fcore.svg)](https://badge.fury.io/js/@zatca-sdk%2Fcore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/mouna-bassim/zatca-sdk/workflows/Node.js%20CI/badge.svg)](https://github.com/mouna-bassim/zatca-sdk/actions)

A comprehensive Node.js SDK for **ZATCA Phase-2 e-invoicing compliance** in Saudi Arabia. Generate, sign, and submit legally-valid electronic invoices to the Saudi Arabia Zakat, Tax & Customs Authority with full UBL 2.1 compliance.

## 🚀 Quick Start

```bash
npm install @zatca-sdk/core
```

```javascript
import { ZATCAInvoiceSDK } from '@zatca-sdk/core';

const sdk = new ZATCAInvoiceSDK({
  vatNumber: '399999999800003',
  sellerName: 'Your Company Name',
  environment: 'sandbox' // or 'production'
});

// Generate device credentials
const credentials = await sdk.generateDeviceCredentials();

// Create and submit simplified invoice
const invoice = await sdk.createSimplifiedInvoice({
  invoiceNumber: 'SME00001',
  issueDate: '2025-01-15',
  totalAmount: 115.00,
  vatAmount: 15.00,
  buyerVatNumber: '399999999900003'
});

const result = await sdk.submitForClearance(invoice);
console.log('Invoice cleared:', result.clearedUUID);
```

## 📋 Features

### ✅ Core SDK (Free)
- **Sandbox Testing**: Full ZATCA sandbox environment support
- **Invoice Generation**: UBL 2.1 compliant XML for simplified invoices
- **Digital Signing**: secp256k1 cryptographic signing with certificate embedding
- **QR Code Generation**: TLV-encoded QR codes for simplified invoices
- **CSR Generation**: Automated Certificate Signing Request creation
- **Multi-language**: Arabic and English support
- **TypeScript**: Full TypeScript definitions included

### 🔓 Pro Features Available
Upgrade to `@zatca-sdk/pro` for production features:
- Production endpoint support
- Standard invoice (B2B/B2G) processing
- Auto-retry with exponential backoff
- Certificate expiry monitoring
- Bulk invoice processing
- Priority support

## 🏗️ Architecture

```
@zatca-sdk/core/
├── src/
│   ├── crypto/           # Key generation & signing
│   ├── invoice/          # XML building & QR codes
│   ├── api/              # ZATCA API integration
│   └── utils/            # Helper functions
├── bin/                  # CLI tools
├── i18n/                 # Internationalization
└── examples/             # Usage examples
```

## 🔧 Installation & Setup

### 1. Install Package
```bash
npm install @zatca-sdk/core
```

### 2. Environment Configuration
Create `.env` file:
```env
ZATCA_VAT_NUMBER=399999999800003
ZATCA_SELLER_NAME=Your Company Name
ZATCA_API_BASE_URL=https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal
```

### 3. Generate Device Credentials
```bash
# Using CLI
npx zatca-sdk generate-csr

# Or programmatically
const credentials = await sdk.generateDeviceCredentials();
```

### 4. Obtain ZATCA Certificate
1. Upload generated CSR to [ZATCA Compliance Portal](https://zatca.gov.sa)
2. Download certificate and save as `certificate.pem`
3. Configure CSID in environment variables

## 📖 API Documentation

### Core SDK Class

```javascript
import { ZATCAInvoiceSDK } from '@zatca-sdk/core';

const sdk = new ZATCAInvoiceSDK({
  vatNumber: 'string',        // Your VAT registration number
  sellerName: 'string',       // Legal entity name
  environment: 'sandbox',     // 'sandbox' or 'production' (Pro only)
  apiBaseUrl: 'string',       // Optional: Custom API URL
  csid: 'string'              // Optional: Compliance CSID
});
```

### Invoice Creation

```javascript
// Simplified Invoice (B2C)
const invoiceData = {
  invoiceNumber: 'SME00001',
  issueDate: '2025-01-15',
  totalAmount: 115.00,
  vatAmount: 15.00,
  items: [
    {
      name: 'Product Name',
      quantity: 1,
      unitPrice: 100.00,
      vatRate: 0.15
    }
  ]
};

const invoice = await sdk.createSimplifiedInvoice(invoiceData);
```

### Digital Signing

```javascript
const signedInvoice = await sdk.signInvoice(
  invoice.xml,
  './private-key.pem',
  './certificate.pem'
);
```

### QR Code Generation

```javascript
const qrCode = sdk.generateTLVQR({
  sellerName: 'Your Company',
  vatNumber: '399999999800003',
  timestamp: '2025-01-15T10:30:00Z',
  totalAmount: 115.00,
  vatAmount: 15.00
});
```

### Submit for Clearance

```javascript
const result = await sdk.submitForClearance(
  signedInvoice.xml,
  'simplified',
  'your-csid'
);

console.log('Cleared UUID:', result.clearedUUID);
console.log('Invoice Hash:', result.invoiceHash);
```

## 🛠️ CLI Tools

```bash
# System diagnostics
npx zatca-sdk doctor

# Generate CSR and private key
npx zatca-sdk generate-csr

# Validate invoice XML
npx zatca-sdk validate-xml invoice.xml

# Test QR code generation
npx zatca-sdk generate-qr --total 115 --vat 15
```

## 📱 Examples

### Basic Simplified Invoice
```javascript
import { ZATCAInvoiceSDK } from '@zatca-sdk/core';

const sdk = new ZATCAInvoiceSDK({
  vatNumber: '399999999800003',
  sellerName: 'Test Company'
});

async function createInvoice() {
  try {
    // Generate credentials (one-time setup)
    await sdk.generateDeviceCredentials();
    
    // Create invoice
    const invoice = await sdk.createSimplifiedInvoice({
      invoiceNumber: 'SME00001',
      issueDate: new Date().toISOString().split('T')[0],
      totalAmount: 115.00,
      vatAmount: 15.00
    });
    
    // Submit for clearance
    const result = await sdk.submitForClearance(invoice.xml, 'simplified');
    
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createInvoice();
```

### With TypeScript
```typescript
import { ZATCAInvoiceSDK, InvoiceData, ClearanceResult } from '@zatca-sdk/core';

const sdk = new ZATCAInvoiceSDK({
  vatNumber: '399999999800003',
  sellerName: 'Test Company'
});

const invoiceData: InvoiceData = {
  invoiceNumber: 'SME00001',
  issueDate: '2025-01-15',
  totalAmount: 115.00,
  vatAmount: 15.00
};

const result: ClearanceResult = await sdk.submitForClearance(
  invoice.xml,
  'simplified'
);
```

## 🔍 Error Handling

```javascript
try {
  const result = await sdk.submitForClearance(invoice.xml, 'simplified');
} catch (error) {
  if (error.code === 'ZATCA_VALIDATION_ERROR') {
    console.error('Invoice validation failed:', error.details);
  } else if (error.code === 'ZATCA_API_ERROR') {
    console.error('ZATCA API error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## 📊 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testNamePattern="QR Code"

# Run with coverage
npm run test:coverage
```

## 🌍 Internationalization

```javascript
import { ZATCAInvoiceSDK } from '@zatca-sdk/core';

const sdk = new ZATCAInvoiceSDK({
  vatNumber: '399999999800003',
  sellerName: 'شركة الاختبار',
  language: 'ar' // Arabic support
});
```

## 🔒 Security

- **secp256k1 Cryptography**: Industry-standard elliptic curve cryptography
- **Certificate Validation**: Automatic certificate chain validation
- **Secure Key Storage**: Best practices for private key management
- **API Authentication**: CSID-based authentication with ZATCA
- **Input Validation**: Comprehensive input sanitization

## 🚀 Performance

- **Lightweight**: Minimal dependencies, optimized for performance
- **Async/Await**: Non-blocking operations for better throughput
- **Memory Efficient**: Streaming XML processing for large invoices
- **Caching**: Intelligent caching of certificates and API responses

## 📋 Requirements

- **Node.js**: 16.x or higher
- **OpenSSL**: With secp256k1 curve support
- **ZATCA Registration**: Valid VAT number and ZATCA portal access

## 🛡️ Compliance

- **UBL 2.1**: Universal Business Language specification
- **ZATCA Phase-2**: Full compliance with Saudi e-invoicing regulations
- **ISO 8601**: Date/time formatting standards
- **RFC 3986**: URI encoding standards

## 📈 Upgrade to Pro

Unlock production features with `@zatca-sdk/pro`:

```bash
npm install @zatca-sdk/pro
```

**Pro Features:**
- ✅ Production ZATCA endpoints
- ✅ Standard invoices (B2B/B2G)
- ✅ Auto-retry with exponential backoff
- ✅ Certificate expiry monitoring
- ✅ Bulk processing capabilities
- ✅ Priority email support

[Get Pro License →](https://mounabsm.gumroad.com/l/zydki)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [GitHub Repository](https://github.com/mouna-bassim/zatca-sdk)
- **Issues**: [GitHub Issues](https://github.com/mouna-bassim/zatca-sdk/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mouna-bassim/zatca-sdk/discussions)

## 🙏 Acknowledgments

- Saudi Arabia ZATCA for comprehensive e-invoicing standards
- Node.js community for excellent cryptographic libraries
- Contributors and users of this SDK

---

**Built with ❤️ for the Saudi Arabian business community**

*ZATCA Phase-2 e-invoicing compliance made simple.*