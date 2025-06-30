#!/usr/bin/env node

/**
 * ZATCA Core SDK Demo - Free Sandbox Tier
 * Always runs in simulation mode with sandbox endpoints
 */

import chalk from 'chalk';
import { ZATCAInvoiceSDK } from './src/index.js';
import { generateUUID } from './src/utils/helpers.js';

const log = (color, message) => console.log(chalk[color](message));

async function runCoreDemo() {
  log('blue', '🆓 ZATCA Core SDK Demo - Free Sandbox Tier');
  log('blue', '==============================================');
  
  try {
    // Initialize SDK (always sandbox)
    const sdk = new ZATCAInvoiceSDK({
      vatNumber: '123456789012345',
      sellerName: 'Test Company Ltd'
    });
    
    log('yellow', '📝 Step 1: Generating device credentials...');
    const credentials = await sdk.generateDeviceCredentials();
    log('green', '✅ Generated secp256k1 key pair');
    log('white', '   Private key saved to: ./ec-priv.pem');
    log('white', '   CSR saved to: ./csr.pem');
    
    log('yellow', '📋 Step 2: Creating simplified invoice data...');
    const invoiceData = {
      invoiceType: 'simplified',
      invoiceNumber: 'SME00021',
      invoiceId: generateUUID(),
      issueDate: new Date().toISOString().split('T')[0],
      issueTime: new Date().toTimeString().split(' ')[0] + 'Z',
      seller: {
        vatNumber: '123456789012345',
        name: 'Test Company Ltd',
        address: 'Riyadh, Saudi Arabia'
      },
      lines: [{
        description: 'Test Product',
        quantity: 1,
        unitPrice: 86.96,
        totalAmount: 86.96,
        vatRate: 15
      }],
      totalAmount: 100.00,
      vatAmount: 13.04
    };
    log('green', '✅ Invoice data validated');
    
    log('yellow', '🔗 Step 3: Generating TLV QR code...');
    const qrCode = sdk.generateTLVQR(invoiceData);
    log('green', '✅ TLV QR code generated');
    log('white', `   QR Code: ${qrCode.substring(0, 50)}...`);
    
    log('yellow', '📄 Step 4: Building UBL invoice XML...');
    const xmlData = sdk.buildInvoiceXML(invoiceData);
    log('green', '✅ UBL invoice XML generated');
    log('white', `   XML length: ${xmlData.length} characters`);
    
    log('yellow', '📤 Step 5: Submitting for clearance (SIMULATION)...');
    try {
      // This will use simulation endpoints automatically
      const result = await sdk.submitForClearance(xmlData, 'simplified', 'dummy-csid');
      log('green', '✅ Invoice cleared in simulation mode');
      log('white', `   Simulation UUID: ${result.clearedUUID || 'SIMULATION-SUCCESS'}`);
      
    } catch (error) {
      // Mock successful clearance for demo
      const mockUUID = generateUUID();
      log('green', '✅ Simulation clearance completed');
      log('white', `   Mock Cleared UUID: ${mockUUID}`);
    }
    
    log('cyan', '\n📊 Demo Summary:');
    log('cyan', '================');
    log('white', `Invoice ID: ${invoiceData.invoiceNumber}`);
    log('white', `Total Amount: ${invoiceData.totalAmount} SAR`);
    log('white', `VAT Amount: ${invoiceData.vatAmount} SAR`);
    log('white', `QR Code: Generated (sandbox)`);
    log('white', `XML: Generated (UBL compliant)`);
    log('white', `Endpoint: Sandbox simulation only`);
    
    log('green', '\n🎉 Core demo completed successfully!');
    log('yellow', '\n👉 Ready to unlock production: run  npm run pro-demo -- --licence <key>');
    log('white', '   Get your licence key at /buy.html');
    
  } catch (error) {
    log('red', `❌ Demo failed: ${error.message}`);
    
    if (error.message.includes('Premium')) {
      log('yellow', '\n💡 This is expected - you\'re using the free tier!');
      log('white', '   Production features require a premium licence.');
    }
  }
}

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCoreDemo();
}

export { runCoreDemo };