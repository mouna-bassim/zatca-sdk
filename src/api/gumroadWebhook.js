/**
 * Gumroad webhook handler for ZATCA SDK Pro licence purchases
 * Handles payment verification and licence key generation
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// Configure your Gumroad webhook secret (set in environment)
const GUMROAD_WEBHOOK_SECRET = process.env.GUMROAD_WEBHOOK_SECRET || 'your-webhook-secret';

/**
 * Generate ZATCA SDK licence key
 * Format: ZSDK + 16 hex characters
 */
function generateLicenceKey() {
    const randomBytes = crypto.randomBytes(8);
    return 'ZSDK' + randomBytes.toString('hex').toUpperCase();
}

/**
 * Verify Gumroad webhook signature
 * @param {string} payload - Webhook payload
 * @param {string} signature - X-Gumroad-Signature header
 * @returns {boolean} Verification result
 */
function verifyWebhookSignature(payload, signature) {
    if (!signature) return false;
    
    const expectedSignature = crypto
        .createHmac('sha256', GUMROAD_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
    
    return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
    );
}

/**
 * Process Gumroad sale webhook
 * @param {Object} saleData - Sale data from Gumroad
 * @returns {Object} Processing result
 */
async function processSale(saleData) {
    const licenceKey = generateLicenceKey();
    const purchaseRecord = {
        id: saleData.id,
        email: saleData.email,
        product_name: saleData.product_name,
        licenceKey: licenceKey,
        purchaseDate: new Date().toISOString(),
        amount: saleData.price,
        currency: saleData.currency || 'USD',
        status: 'active',
        expiryDate: null, // Lifetime licence
        features: [
            'production_endpoints',
            'auto_retry',
            'certificate_monitoring',
            'priority_support',
            'typescript_definitions'
        ]
    };
    
    // Store purchase record (in production, use proper database)
    const purchasesDir = './data/purchases';
    try {
        await fs.mkdir(purchasesDir, { recursive: true });
        await fs.writeFile(
            path.join(purchasesDir, `${saleData.id}.json`),
            JSON.stringify(purchaseRecord, null, 2)
        );
    } catch (error) {
        console.error('Failed to store purchase record:', error);
    }
    
    return {
        success: true,
        licenceKey: licenceKey,
        purchaseId: saleData.id,
        email: saleData.email
    };
}

/**
 * Process Gumroad refund webhook
 * @param {Object} refundData - Refund data from Gumroad
 * @returns {Object} Processing result
 */
async function processRefund(refundData) {
    const purchaseFile = `./data/purchases/${refundData.sale_id}.json`;
    
    try {
        const purchaseData = JSON.parse(await fs.readFile(purchaseFile, 'utf8'));
        purchaseData.status = 'refunded';
        purchaseData.refundDate = new Date().toISOString();
        
        await fs.writeFile(purchaseFile, JSON.stringify(purchaseData, null, 2));
        
        return {
            success: true,
            licenceKey: purchaseData.licenceKey,
            status: 'deactivated'
        };
    } catch (error) {
        console.error('Failed to process refund:', error);
        return { success: false, error: 'Purchase record not found' };
    }
}

/**
 * Handle Gumroad webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleGumroadWebhook(req, res) {
    try {
        const payload = JSON.stringify(req.body);
        const signature = req.headers['x-gumroad-signature'];
        
        // Verify webhook signature
        if (!verifyWebhookSignature(payload, signature)) {
            return res.status(401).json({ 
                error: 'Invalid webhook signature' 
            });
        }
        
        const webhookData = req.body;
        console.log('📥 Gumroad webhook received:', webhookData.type);
        
        let result;
        switch (webhookData.type) {
            case 'sale':
                result = await processSale(webhookData);
                console.log('✅ Sale processed:', result.licenceKey);
                
                // TODO: Send licence key via email
                await sendLicenceEmail(result.email, result.licenceKey);
                break;
                
            case 'refund':
                result = await processRefund(webhookData);
                console.log('🔄 Refund processed:', webhookData.sale_id);
                break;
                
            default:
                console.log('ℹ️ Unhandled webhook type:', webhookData.type);
                return res.status(200).json({ received: true });
        }
        
        res.status(200).json({
            success: true,
            processed: webhookData.type,
            result: result
        });
        
    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}

/**
 * Send licence key via email (placeholder implementation)
 * @param {string} email - Customer email
 * @param {string} licenceKey - Generated licence key
 */
async function sendLicenceEmail(email, licenceKey) {
    // In production, integrate with email service (SendGrid, etc.)
    console.log(`📧 Email sent to ${email}:`);
    console.log(`
🎉 Thank you for purchasing ZATCA SDK Pro!

Your licence key: ${licenceKey}

Quick start:
1. Set environment variable: export ZSDK_LICENCE_KEY=${licenceKey}
2. Run: npm run pro-demo
3. Your SDK now has access to production endpoints!

Features unlocked:
✅ Production ZATCA endpoints
✅ Automatic retry with exponential backoff
✅ Certificate expiry monitoring
✅ TypeScript definitions
✅ Priority email support

Need help? Reply to this email for priority support.

Best regards,
ZATCA SDK Team
    `);
}

/**
 * Validate licence key from purchase records
 * @param {string} licenceKey - Licence key to validate
 * @returns {Object} Validation result
 */
export async function validateLicenceKey(licenceKey) {
    if (!licenceKey || !licenceKey.startsWith('ZSDK')) {
        return { valid: false, error: 'Invalid licence key format' };
    }
    
    try {
        const purchasesDir = './data/purchases';
        const files = await fs.readdir(purchasesDir);
        
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            
            const purchaseData = JSON.parse(
                await fs.readFile(path.join(purchasesDir, file), 'utf8')
            );
            
            if (purchaseData.licenceKey === licenceKey) {
                if (purchaseData.status === 'active') {
                    return {
                        valid: true,
                        purchaseId: purchaseData.id,
                        email: purchaseData.email,
                        features: purchaseData.features,
                        purchaseDate: purchaseData.purchaseDate
                    };
                } else {
                    return { 
                        valid: false, 
                        error: `Licence ${purchaseData.status}` 
                    };
                }
            }
        }
        
        return { valid: false, error: 'Licence key not found' };
        
    } catch (error) {
        console.error('Licence validation error:', error);
        return { valid: false, error: 'Validation system error' };
    }
}

/**
 * Get purchase statistics (for admin dashboard)
 * @returns {Object} Purchase statistics
 */
export async function getPurchaseStats() {
    try {
        const purchasesDir = './data/purchases';
        const files = await fs.readdir(purchasesDir);
        
        let totalSales = 0;
        let activeLicences = 0;
        let refundedLicences = 0;
        let totalRevenue = 0;
        
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            
            const purchaseData = JSON.parse(
                await fs.readFile(path.join(purchasesDir, file), 'utf8')
            );
            
            totalSales++;
            totalRevenue += parseFloat(purchaseData.amount || 0);
            
            if (purchaseData.status === 'active') {
                activeLicences++;
            } else if (purchaseData.status === 'refunded') {
                refundedLicences++;
            }
        }
        
        return {
            totalSales,
            activeLicences,
            refundedLicences,
            totalRevenue,
            conversionRate: totalSales > 0 ? (activeLicences / totalSales * 100).toFixed(1) : 0
        };
        
    } catch (error) {
        console.error('Stats error:', error);
        return {
            totalSales: 0,
            activeLicences: 0,
            refundedLicences: 0,
            totalRevenue: 0,
            conversionRate: 0
        };
    }
}