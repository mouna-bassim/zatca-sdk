# @mouna-bassim/pro

[![npm version](https://badge.fury.io/js/@zatca-sdk%2Fpro.svg)](https://badge.fury.io/js/@zatca-sdk%2Fpro)
[![License: Commercial](https://img.shields.io/badge/License-Commercial-red.svg)](LICENSE)
[![Node.js CI](https://github.com/mouna-bassim/zatca-sdk/workflows/Node.js%20CI/badge.svg)](https://github.com/mouna-bassim/zatca-sdk/actions)

**Premium Node.js SDK for ZATCA Phase-2 e-invoicing** with production endpoints, advanced features, and enterprise support. Unlock the full power of Saudi Arabia's electronic invoicing system with professional-grade capabilities.

## 🔓 Premium Features

### ✅ Production Ready
- **Live ZATCA Endpoints**: Direct integration with production APIs
- **Standard Invoices**: Full B2B/B2G invoice processing
- **Certificate Management**: Advanced certificate lifecycle management
- **High Availability**: 99.9% uptime SLA with redundant infrastructure

### 🚀 Advanced Capabilities  
- **Auto-Retry Logic**: Exponential backoff with intelligent retry strategies
- **Bulk Processing**: Process thousands of invoices efficiently
- **Certificate Monitoring**: Automatic expiry alerts and renewal reminders
- **Priority Support**: Direct access to technical experts

### 🔧 Enterprise Features
- **Custom Webhooks**: Real-time invoice status notifications
- **Analytics Dashboard**: Comprehensive invoice processing metrics
- **Multi-Tenant**: Support for multiple VAT registrations
- **Audit Logging**: Complete compliance audit trails

## 💳 Licensing

This is a **commercial package** requiring a valid license key.

[**Purchase License Key →**](https://mounabsm.gumroad.com/l/zydki)

**Pricing:**
- **Pro License**: $99/month - Production access + premium features
- **Enterprise**: $299/month - Bulk processing + priority support  
- **Custom**: Contact us for high-volume enterprise solutions

## 🚀 Quick Start

### 1. Install Package
```bash
npm install @mouna-bassim/pro
```

### 2. Authentication Setup
```bash
# Configure GitHub Packages authentication
echo "@mouna-bassim:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc
```

### 3. License Activation
```javascript
import { ZATCAProSDK } from '@zatca-sdk/pro';

const sdk = new ZATCAProSDK({
  licenseKey: 'ZSDK1234567890ABCDEF', // Your purchased license
  vatNumber: '399999999800003',
  sellerName: 'Your Company Name',
  environment: 'production' // Full production access
});
```

### 4. Production Invoice Processing
```javascript
// Standard B2B Invoice with production endpoints
const standardInvoice = await sdk.createStandardInvoice({
  invoiceNumber: 'STD00001',
  issueDate: '2025-01-15',
  buyer: {
    vatNumber: '399999999900003',
    name: 'Buyer Company',
    address: 'Riyadh, Saudi Arabia'
  },
  totalAmount: 1150.00,
  vatAmount: 150.00
});

const result = await sdk.submitForClearance(standardInvoice, {
  retryAttempts: 3,
  timeout: 30000,
  webhookUrl: 'https://your-domain.com/webhook'
});

console.log('Production UUID:', result.clearedUUID);
```

## 📋 Pro vs Core Comparison

| Feature | Core (Free) | Pro (Premium) |
|---------|-------------|---------------|
| **Environment** | Sandbox only | Production + Sandbox |
| **Invoice Types** | Simplified (B2C) | Standard (B2B) + Simplified |
| **Auto-Retry** | ❌ | ✅ Exponential backoff |
| **Bulk Processing** | ❌ | ✅ Up to 10,000/batch |
| **Certificate Monitoring** | ❌ | ✅ Auto-renewal alerts |
| **Priority Support** | ❌ | ✅ 24/7 email support |
| **SLA** | Best effort | 99.9% uptime |
| **Webhooks** | ❌ | ✅ Real-time notifications |
| **Analytics** | ❌ | ✅ Comprehensive dashboard |

## 🏗️ Architecture

```
@zatca-sdk/pro/
├── src/
│   ├── core/             # Extended core functionality
│   ├── standard/         # B2B/B2G invoice processing  
│   ├── bulk/             # Batch processing capabilities
│   ├── monitoring/       # Certificate & system monitoring
│   ├── webhooks/         # Real-time notifications
│   └── analytics/        # Usage metrics & reporting
├── bin/                  # Premium CLI tools
├── config/               # Production configurations
└── examples/             # Pro usage examples
```

## 🔧 Advanced Configuration

### Production Environment Setup
```javascript
const sdk = new ZATCAProSDK({
  licenseKey: process.env.ZATCA_PRO_LICENSE,
  environment: 'production',
  
  // Advanced retry configuration
  retryConfig: {
    maxAttempts: 5,
    backoffStrategy: 'exponential',
    initialDelay: 1000,
    maxDelay: 30000
  },
  
  // Certificate monitoring
  certificateMonitoring: {
    enabled: true,
    renewalAlertDays: 30,
    webhookUrl: 'https://your-domain.com/cert-webhook'
  },
  
  // High availability settings
  loadBalancing: {
    enabled: true,
    strategy: 'round-robin',
    healthCheckInterval: 30000
  }
});
```

### Bulk Invoice Processing
```javascript
const invoices = [
  { invoiceNumber: 'BULK001', totalAmount: 115.00 },
  { invoiceNumber: 'BULK002', totalAmount: 230.00 },
  // ... up to 10,000 invoices
];

const results = await sdk.processBulkInvoices(invoices, {
  batchSize: 100,
  parallelProcessing: true,
  errorHandling: 'continue', // or 'stop'
  progressCallback: (processed, total) => {
    console.log(`Processed: ${processed}/${total}`);
  }
});

console.log(`Success: ${results.successful.length}`);
console.log(`Failed: ${results.failed.length}`);
```

### Standard Invoice (B2B/B2G)
```javascript
const standardInvoice = await sdk.createStandardInvoice({
  invoiceNumber: 'STD00001',
  issueDate: '2025-01-15',
  dueDate: '2025-02-14',
  
  seller: {
    vatNumber: '399999999800003',
    name: 'Your Company',
    address: {
      street: 'King Fahd Road',
      city: 'Riyadh', 
      postalCode: '12345',
      country: 'SA'
    }
  },
  
  buyer: {
    vatNumber: '399999999900003',
    name: 'Buyer Company',
    address: {
      street: 'Prince Sultan Street',
      city: 'Jeddah',
      postalCode: '54321', 
      country: 'SA'
    }
  },
  
  items: [
    {
      name: 'Professional Services',
      quantity: 10,
      unitPrice: 100.00,
      vatRate: 0.15,
      vatCategoryCode: 'S'
    }
  ],
  
  paymentTerms: 'Net 30',
  purchaseOrderNumber: 'PO-2025-001'
});
```

### Real-time Webhooks
```javascript
// Configure webhook notifications
await sdk.configureWebhooks({
  invoiceCleared: 'https://your-domain.com/invoice-cleared',
  invoiceRejected: 'https://your-domain.com/invoice-rejected',
  certificateExpiring: 'https://your-domain.com/cert-expiring',
  systemMaintenance: 'https://your-domain.com/maintenance'
});

// Webhook payload example
/*
{
  "event": "invoice.cleared",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "invoiceNumber": "STD00001",
    "clearedUUID": "12345678-1234-1234-1234-123456789012",
    "invoiceHash": "abc123...",
    "clearanceTimestamp": "2025-01-15T10:30:00Z"
  }
}
*/
```

## 📊 Analytics & Monitoring

### Usage Analytics
```javascript
const analytics = await sdk.getAnalytics({
  period: 'last-30-days',
  metrics: ['invoice-count', 'success-rate', 'avg-processing-time']
});

console.log('Invoices processed:', analytics.invoiceCount);
console.log('Success rate:', analytics.successRate);
console.log('Avg processing time:', analytics.avgProcessingTime);
```

### Certificate Monitoring
```javascript
const certStatus = await sdk.getCertificateStatus();

console.log('Expires in:', certStatus.daysUntilExpiry);
console.log('Status:', certStatus.status); // 'active', 'expiring', 'expired'

if (certStatus.daysUntilExpiry <= 30) {
  await sdk.sendRenewalAlert();
}
```

## 🛠️ Premium CLI Tools

```bash
# Production invoice submission
npx zatca-pro submit-invoice --file invoice.xml --environment production

# Bulk processing
npx zatca-pro bulk-process --directory ./invoices --output results.json

# Certificate management
npx zatca-pro cert-status --alert-days 30

# Analytics dashboard
npx zatca-pro analytics --period last-month --export csv

# System health check
npx zatca-pro health-check --production
```

## 🔒 Security & Compliance

### Enterprise Security
- **HSM Integration**: Hardware Security Module support for key storage
- **Role-Based Access**: Multi-user access with permission management
- **Audit Logging**: Complete API access logs for compliance
- **Data Encryption**: End-to-end encryption for sensitive data

### Compliance Features
```javascript
// Audit trail access
const auditLogs = await sdk.getAuditLogs({
  dateRange: ['2025-01-01', '2025-01-31'],
  actions: ['invoice-created', 'invoice-submitted', 'certificate-used']
});

// Compliance report generation
const complianceReport = await sdk.generateComplianceReport({
  period: 'Q1-2025',
  format: 'pdf',
  includeMetrics: true
});
```

## 🚀 Performance Optimization

### High-Volume Processing
```javascript
// Optimized for high throughput
const sdk = new ZATCAProSDK({
  licenseKey: process.env.ZATCA_PRO_LICENSE,
  performance: {
    connectionPoolSize: 50,
    requestTimeout: 30000,
    enableCaching: true,
    cacheSize: 10000
  }
});

// Parallel processing with rate limiting
const results = await sdk.submitMultipleInvoices(invoices, {
  maxConcurrency: 10,
  rateLimit: 100 // requests per minute
});
```

## 📈 Migration from Core

### Upgrade Existing Code
```javascript
// Before (Core)
import { ZATCAInvoiceSDK } from '@zatca-sdk/core';
const sdk = new ZATCAInvoiceSDK({ environment: 'sandbox' });

// After (Pro)  
import { ZATCAProSDK } from '@zatca-sdk/pro';
const sdk = new ZATCAProSDK({ 
  licenseKey: 'ZSDK...', 
  environment: 'production' 
});

// All Core methods remain compatible
const credentials = await sdk.generateDeviceCredentials();
const invoice = await sdk.createSimplifiedInvoice(data);
```

## 💬 Support Channels

### Premium Support (24/7)
- **Priority Email**: pro-support@zatca-sdk.com
- **Technical Hotline**: +966-XX-XXXX-XXXX  
- **Slack Channel**: zatca-sdk-pro.slack.com
- **Dedicated Account Manager**: Enterprise customers

### Self-Service Resources
- **Knowledge Base**: [docs.zatca-sdk.com](https://docs.zatca-sdk.com)
- **API Reference**: [api.zatca-sdk.com](https://api.zatca-sdk.com)
- **Video Tutorials**: [YouTube Channel](https://youtube.com/@zatca-sdk)

## 📄 Licensing & Legal

### Commercial License Terms
- Valid for production use with purchased license key
- Includes 1 year of updates and priority support
- Enterprise licensing available for unlimited VAT registrations
- Contact legal@zatca-sdk.com for custom licensing agreements

### Service Level Agreement
- **Uptime**: 99.9% monthly uptime guarantee
- **Response Time**: <2 hours for critical issues
- **Processing Speed**: <500ms average API response time
- **Support**: 24/7 technical support via email/phone

## 🔗 Links & Resources

- **Purchase License**: [Get Pro License →](https://mounabsm.gumroad.com/l/zydki)
- **Documentation**: [GitHub Repository](https://github.com/mouna-bassim/zatca-sdk)
- **Support Portal**: [Support Center](https://support.zatca-sdk.com)
- **Status Page**: [System Status](https://status.zatca-sdk.com)

---

**Enterprise-grade ZATCA compliance with premium support**

*Unlock the full potential of Saudi Arabia's e-invoicing ecosystem with @zatca-sdk/pro*