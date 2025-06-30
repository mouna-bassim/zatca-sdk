/**
 * Demo script for ZATCA Standard Invoice (B2B/B2G)
 * This script demonstrates the complete flow for standard invoices
 */

import dotenv from 'dotenv';
import chalk from 'chalk';
import { ZATCAInvoiceSDK } from '../index.js';
import { validateInvoiceData } from '../src/utils/helpers.js';

// Load environment variables
dotenv.config();

async function runStandardInvoiceDemo() {
  console.log(chalk.blue('🚀 ZATCA Standard Invoice Demo (B2B/B2G)'));
  console.log(chalk.gray('=========================================\n'));

  try {
    // Initialize SDK
    const sdk = new ZATCAInvoiceSDK({
      vatNumber: process.env.ZATCA_VAT_NUMBER || '123456789012345',
      sellerName: process.env.ZATCA_SELLER_NAME || 'Test Company Ltd',
      apiBaseUrl: process.env.ZATCA_API_BASE_URL || 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal'
    });

    // Create sample standard invoice data
    console.log(chalk.yellow('📋 Creating standard invoice data...'));
    
    const invoiceData = {
      type: 'standard',
      id: 'STD00021',
      totalAmount: 2300.00, // 2300 SAR including VAT
      
      // Seller information
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
      
      // Buyer information (required for standard invoices)
      buyerName: 'Business Customer Ltd',
      buyerVAT: '987654321098765',
      buyerAddress: {
        street: 'Prince Mohammed Bin Abdulaziz Road',
        buildingNumber: '5678',
        plotId: '5678',
        district: 'Al Malqa',
        city: 'Riyadh',
        postalCode: '54321'
      },
      
      // Line items
      lineItems: [
        {
          id: '1',
          itemName: 'Software Development Services',
          quantity: 40,
          unitCode: 'HUR',
          unitPrice: 50.00, // Price excluding VAT per hour
          itemType: 'S'
        },
        {
          id: '2',
          itemName: 'Project Management',
          quantity: 1,
          unitCode: 'PCE',
          unitPrice: 0.00, // Included in development services
          itemType: 'S'
        }
      ],
      
      paymentMeans: '30', // Credit transfer
      deliveryDate: new Date().toISOString().split('T')[0]
    };

    // Validate invoice data
    console.log(chalk.yellow('🔍 Validating invoice data...'));
    const validation = validateInvoiceData(invoiceData, 'standard');
    if (!validation.valid) {
      console.log(chalk.red('❌ Invoice validation failed:'));
      validation.errors.forEach(error => console.log(chalk.red(`   - ${error}`)));
      return;
    }

    console.log(chalk.green('✅ Invoice data validated'));
    
    if (validation.warnings.length > 0) {
      console.log(chalk.yellow('⚠️  Warnings:'));
      validation.warnings.forEach(warning => 
        console.log(chalk.yellow(`   - ${warning}`))
      );
    }

    // Build invoice XML
    console.log(chalk.yellow('📄 Building UBL invoice XML...'));
    
    const invoiceXML = sdk.buildInvoiceXML(invoiceData);
    console.log(chalk.green('✅ UBL invoice XML generated'));
    console.log(chalk.gray(`   XML length: ${invoiceXML.length} characters`));

    // Sign invoice (if certificate is available)
    console.log(chalk.yellow('🔐 Signing invoice...'));
    
    let signedInvoice;
    try {
      signedInvoice = await sdk.signInvoice(invoiceXML, './ec-priv.pem', './cert.pem');
      console.log(chalk.green('✅ Invoice signed successfully'));
      console.log(chalk.gray(`   Certificate Serial: ${signedInvoice.certificateSerialNumber}`));
    } catch (error) {
      console.log(chalk.orange('⚠️  Signing skipped (certificate not found)'));
      console.log(chalk.gray(`   Error: ${error.message}`));
      signedInvoice = { signedXML: invoiceXML };
    }

    // Submit for compliance check
    console.log(chalk.yellow('🔍 Submitting for compliance check...'));
    
    const csid = process.env.ZATCA_CSID;
    if (csid) {
      try {
        const complianceResult = await sdk.submitForCompliance(
          signedInvoice.signedXML,
          csid
        );

        if (complianceResult.success) {
          console.log(chalk.green('✅ Compliance check passed!'));
          console.log(chalk.green(`   Status: ${complianceResult.complianceStatus}`));
          
          if (complianceResult.validationResults && complianceResult.validationResults.length > 0) {
            console.log(chalk.blue('📋 Validation Results:'));
            complianceResult.validationResults.forEach(result => 
              console.log(chalk.blue(`   - ${result}`))
            );
          }
        } else {
          console.log(chalk.red('❌ Compliance check failed'));
          console.log(chalk.red(`   Status Code: ${complianceResult.statusCode}`));
        }
      } catch (error) {
        console.log(chalk.orange('⚠️  Compliance check skipped'));
        console.log(chalk.gray(`   Error: ${error.message}`));
      }
    }

    // Submit for clearance
    console.log(chalk.yellow('📤 Submitting for clearance...'));
    
    if (csid) {
      try {
        const clearanceResult = await sdk.submitForClearance(
          signedInvoice.signedXML,
          'standard',
          csid
        );

        if (clearanceResult.success) {
          console.log(chalk.green('✅ Invoice cleared successfully!'));
          console.log(chalk.green(`   Cleared UUID: ${clearanceResult.clearedUUID}`));
          console.log(chalk.green(`   Status: ${clearanceResult.reportingStatus}`));
          console.log(chalk.green(`   Invoice Hash: ${clearanceResult.invoiceHash}`));
          
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

    // Calculate totals for summary
    const taxableAmount = (invoiceData.totalAmount / 1.15).toFixed(2);
    const vatAmount = (invoiceData.totalAmount - taxableAmount).toFixed(2);

    // Demo summary
    console.log(chalk.blue('\n📊 Demo Summary:'));
    console.log(chalk.blue('================'));
    console.log(chalk.gray(`Invoice Type: Standard (B2B/B2G)`));
    console.log(chalk.gray(`Invoice ID: ${invoiceData.id}`));
    console.log(chalk.gray(`Seller: ${invoiceData.sellerName} (${invoiceData.sellerVAT})`));
    console.log(chalk.gray(`Buyer: ${invoiceData.buyerName} (${invoiceData.buyerVAT})`));
    console.log(chalk.gray(`Taxable Amount: ${taxableAmount} SAR`));
    console.log(chalk.gray(`VAT Amount: ${vatAmount} SAR`));
    console.log(chalk.gray(`Total Amount: ${invoiceData.totalAmount} SAR`));
    console.log(chalk.gray(`Line Items: ${invoiceData.lineItems.length}`));
    console.log(chalk.gray(`XML: ${invoiceXML ? 'Generated' : 'Failed'}`));
    console.log(chalk.gray(`Signed: ${signedInvoice?.signedXML ? 'Yes' : 'No'}`));

    console.log(chalk.green('\n🎉 Standard invoice demo completed successfully!'));

  } catch (error) {
    console.log(chalk.red('\n❌ Demo failed with error:'));
    console.log(chalk.red(error.message));
    console.log(chalk.gray('\nStack trace:'));
    console.log(chalk.gray(error.stack));
  }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  runStandardInvoiceDemo().catch(console.error);
}

export default runStandardInvoiceDemo;
