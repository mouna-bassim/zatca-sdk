/**
 * Demo script for ZATCA Simplified Invoice
 * This script demonstrates the complete flow of creating, signing, and clearing a simplified invoice
 */

import dotenv from 'dotenv';
import chalk from 'chalk';
import { ZATCAInvoiceSDK } from '../index.js';
import { validateInvoiceData } from '../src/utils/helpers.js';

// Load environment variables
dotenv.config();

async function runSimplifiedInvoiceDemo() {
  console.log(chalk.blue('🚀 ZATCA Simplified Invoice Demo'));
  console.log(chalk.gray('=====================================\n'));

  try {
    // Initialize SDK
    const sdk = new ZATCAInvoiceSDK({
      vatNumber: process.env.ZATCA_VAT_NUMBER || '123456789012345',
      sellerName: process.env.ZATCA_SELLER_NAME || 'Test Company Ltd',
      apiBaseUrl: process.env.ZATCA_API_BASE_URL || 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal'
    });

    // Step 1: Generate CSR and keys (if not exists)
    console.log(chalk.yellow('📝 Step 1: Generating device credentials...'));
    
    try {
      const credentials = await sdk.generateDeviceCredentials();
      console.log(chalk.green('✅ Device credentials generated'));
      console.log(chalk.gray(`   Private Key: ${credentials.privateKeyPath}`));
      console.log(chalk.gray(`   CSR: ${credentials.csrPath}`));
      console.log(chalk.orange('\n⚠️  Manual Step Required:'));
      console.log(chalk.orange('   Upload CSR to ZATCA Compliance Portal'));
      console.log(chalk.orange('   Download the certificate and save as ./cert.pem'));
      console.log(chalk.orange('   Set ZATCA_CSID in your .env file\n'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Using existing credentials (CSR generation failed)'));
    }

    // Step 2: Create sample simplified invoice data
    console.log(chalk.yellow('📋 Step 2: Creating simplified invoice data...'));
    
    const invoiceData = {
      type: 'simplified',
      id: 'SME00021',
      totalAmount: 100.00, // 100 SAR including VAT
      sellerName: sdk.config.sellerName,
      sellerVAT: sdk.config.vatNumber,
      sellerAddress: {
        street: 'King Fahd Road',
        buildingNumber: '1234',
        plotId: '1234',
        district: 'Al Olaya',
        city: 'Riyadh',
        postalCode: '12345'
      },
      lineItems: [
        {
          id: '1',
          itemName: 'Professional Services',
          quantity: 1,
          unitCode: 'HUR',
          unitPrice: 86.96, // Price excluding VAT
          itemType: 'S'
        }
      ],
      paymentMeans: '10' // Cash
    };

    // Validate invoice data
    const validation = validateInvoiceData(invoiceData, 'simplified');
    if (!validation.valid) {
      console.log(chalk.red('❌ Invoice validation failed:'));
      validation.errors.forEach(error => console.log(chalk.red(`   - ${error}`)));
      return;
    }

    console.log(chalk.green('✅ Invoice data validated'));

    // Step 3: Generate TLV QR Code
    console.log(chalk.yellow('🔗 Step 3: Generating TLV QR code...'));
    
    const qrCode = sdk.generateTLVQR(invoiceData);
    console.log(chalk.green('✅ TLV QR code generated'));
    console.log(chalk.gray(`   QR Code: ${qrCode.substring(0, 50)}...`));

    // Step 4: Build invoice XML
    console.log(chalk.yellow('📄 Step 4: Building UBL invoice XML...'));
    
    const invoiceXML = sdk.buildInvoiceXML(invoiceData);
    console.log(chalk.green('✅ UBL invoice XML generated'));
    console.log(chalk.gray(`   XML length: ${invoiceXML.length} characters`));

    // Step 5: Sign invoice (if certificate is available)
    console.log(chalk.yellow('🔐 Step 5: Signing invoice...'));
    
    let signedInvoice;
    try {
      signedInvoice = await sdk.signInvoice(invoiceXML, './ec-priv.pem', './cert.pem');
      console.log(chalk.green('✅ Invoice signed successfully'));
    } catch (error) {
      console.log(chalk.orange('⚠️  Signing skipped (certificate not found)'));
      console.log(chalk.gray(`   Error: ${error.message}`));
      signedInvoice = { signedXML: invoiceXML };
    }

    // Step 6: Submit for clearance (if CSID is available)
    console.log(chalk.yellow('📤 Step 6: Submitting for clearance...'));
    
    const csid = process.env.ZATCA_CSID;
    if (csid) {
      try {
        const clearanceResult = await sdk.submitForClearance(
          signedInvoice.signedXML,
          'simplified',
          csid
        );

        if (clearanceResult.success) {
          console.log(chalk.green('✅ Invoice cleared successfully!'));
          console.log(chalk.green(`   Cleared UUID: ${clearanceResult.clearedUUID}`));
          console.log(chalk.green(`   Status: ${clearanceResult.reportingStatus}`));
          
          if (clearanceResult.warnings && clearanceResult.warnings.length > 0) {
            console.log(chalk.yellow('⚠️  Warnings:'));
            clearanceResult.warnings.forEach(warning => 
              console.log(chalk.yellow(`   - ${warning}`))
            );
          }
        } else {
          console.log(chalk.red('❌ Clearance failed'));
          console.log(chalk.red(`   Status Code: ${clearanceResult.statusCode}`));
          
          if (clearanceResult.errors && clearanceResult.errors.length > 0) {
            clearanceResult.errors.forEach(error => 
              console.log(chalk.red(`   - ${error}`))
            );
          }
        }
      } catch (error) {
        console.log(chalk.red('❌ Clearance submission failed'));
        console.log(chalk.red(`   Error: ${error.message}`));
      }
    } else {
      console.log(chalk.orange('⚠️  Clearance skipped (ZATCA_CSID not configured)'));
      console.log(chalk.orange('   Set ZATCA_CSID in your .env file after certificate upload'));
    }

    // Demo summary
    console.log(chalk.blue('\n📊 Demo Summary:'));
    console.log(chalk.blue('================'));
    console.log(chalk.gray(`Invoice ID: ${invoiceData.id}`));
    console.log(chalk.gray(`Invoice UUID: ${invoiceData.uuid || 'Generated'}`));
    console.log(chalk.gray(`Total Amount: ${invoiceData.totalAmount} SAR`));
    console.log(chalk.gray(`VAT Amount: ${(invoiceData.totalAmount * 0.15 / 1.15).toFixed(2)} SAR`));
    console.log(chalk.gray(`QR Code: ${qrCode ? 'Generated' : 'Failed'}`));
    console.log(chalk.gray(`XML: ${invoiceXML ? 'Generated' : 'Failed'}`));
    console.log(chalk.gray(`Signed: ${signedInvoice?.signedXML ? 'Yes' : 'No'}`));

    console.log(chalk.green('\n🎉 Demo completed successfully!'));

  } catch (error) {
    console.log(chalk.red('\n❌ Demo failed with error:'));
    console.log(chalk.red(error.message));
    console.log(chalk.gray('\nStack trace:'));
    console.log(chalk.gray(error.stack));
  }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  runSimplifiedInvoiceDemo().catch(console.error);
}

export default runSimplifiedInvoiceDemo;
