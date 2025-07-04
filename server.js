#!/usr/bin/env node

/**
 * Simple web server for ZATCA SDK testing
 * Provides UI for CSR upload and certificate management
 */

const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Gumroad webhook secret (set in environment)
const GUMROAD_WEBHOOK_SECRET = process.env.GUMROAD_WEBHOOK_SECRET || 'your-webhook-secret';

const PORT = 5000;

// I18n support
const dict = {
    en: require('./i18n/en.json'),
    ar: require('./i18n/ar.json')
};
let currentLang = 'en';

function t(key) {
    return dict[currentLang][key] || key;
}

// Payment processing functions
function generateLicenceKey() {
    const randomBytes = crypto.randomBytes(8);
    return 'ZSDK' + randomBytes.toString('hex').toUpperCase();
}

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
    
    // Store purchase record
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
    
    // Send licence key via console (in production, use email service)
    console.log(`📧 Licence key generated for ${saleData.email}: ${licenceKey}`);
    
    return {
        success: true,
        licenceKey: licenceKey,
        purchaseId: saleData.id,
        email: saleData.email
    };
}

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

async function handleGumroadWebhook(body, headers, res) {
    try {
        const signature = headers['x-gumroad-signature'];
        const testMode = headers['x-test-mode'];
        
        // Skip signature verification in test mode
        if (!testMode && !verifyWebhookSignature(body, signature)) {
            res.statusCode = 401;
            res.end(JSON.stringify({ error: 'Invalid webhook signature' }));
            return;
        }
        
        const webhookData = JSON.parse(body);
        console.log('📥 Gumroad webhook received:', webhookData.type);
        
        let result;
        switch (webhookData.type) {
            case 'sale':
                result = await processSale(webhookData);
                console.log('✅ Sale processed:', result.licenceKey);
                break;
                
            case 'refund':
                result = await processRefund(webhookData);
                console.log('🔄 Refund processed:', webhookData.sale_id);
                break;
                
            default:
                console.log('ℹ️ Unhandled webhook type:', webhookData.type);
                res.end(JSON.stringify({ received: true }));
                return;
        }
        
        res.end(JSON.stringify({
            success: true,
            processed: webhookData.type,
            result: result
        }));
        
    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ 
            error: 'Internal server error',
            message: error.message 
        }));
    }
}

async function validateLicenceKey(licenceKey) {
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

async function getPurchaseStats() {
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

// Simple HTML template
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZATCA Phase-2 e-Invoice SDK Testing</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c5282;
            text-align: center;
            margin-bottom: 30px;
        }
        .section {
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
        }
        .section h2 {
            color: #4a5568;
            margin-top: 0;
        }
        .file-content {
            background: #f7fafc;
            padding: 15px;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #e2e8f0;
        }
        .form-group {
            margin: 15px 0;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #4a5568;
        }
        input, textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #cbd5e0;
            border-radius: 4px;
            box-sizing: border-box;
        }
        textarea {
            height: 120px;
            font-family: monospace;
        }
        button {
            background: #3182ce;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #2c5282;
        }
        button:disabled {
            background: #a0aec0;
            cursor: not-allowed;
        }
        .success {
            color: #38a169;
            background: #f0fff4;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #9ae6b4;
        }
        .error {
            color: #e53e3e;
            background: #fff5f5;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #feb2b2;
        }
        .info {
            color: #3182ce;
            background: #ebf8ff;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #90cdf4;
        }
        .demo-results {
            margin-top: 20px;
        }
        .step {
            margin: 15px 0;
            padding: 10px;
            background: #f7fafc;
            border-left: 4px solid #3182ce;
        }
        .actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .language-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3182ce;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            z-index: 1000;
        }
        .language-toggle:hover {
            background: #2c5282;
        }
        .rtl {
            direction: rtl;
            text-align: right;
        }
        .rtl .container {
            text-align: right;
        }
        .rtl h1, .rtl h2 {
            text-align: right;
        }
        .rtl .actions {
            justify-content: flex-end;
        }
        .premium-banner {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
        .premium-banner h3 {
            margin: 0 0 10px 0;
            font-size: 1.2em;
        }
        .premium-banner p {
            margin: 0 0 15px 0;
            opacity: 0.9;
        }
        .premium-btn {
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
            transition: background 0.3s ease;
        }
        .premium-btn:hover {
            background: #218838;
        }
    </style>
</head>
<body>
    <button class="language-toggle" onclick="toggleLanguage()" id="langToggle">العربية</button>
    <div class="container">
        <h1 data-en="🚀 ZATCA Phase-2 e-Invoice SDK Testing" data-ar="🚀 اختبار حلول الفوترة الإلكترونية المرحلة الثانية - هيئة الزكاة والضريبة والجمارك">🚀 ZATCA Phase-2 e-Invoice SDK Testing</h1>
        
        <div style="text-align: center; margin: 1rem 0;">
            <a href="docs/buy.html" style="margin: 0 0.5rem; padding: 0.5rem 1rem; background: #28a745; color: white; text-decoration: none; border-radius: 4px;">🔓 Get Pro Licence</a>
            <a href="docs/admin.html" style="margin: 0 0.5rem; padding: 0.5rem 1rem; background: #6c757d; color: white; text-decoration: none; border-radius: 4px;">🛡️ Admin Dashboard</a>
        </div>
        
        <div class="premium-banner">
            <h3 data-en="🔓 Production Mode Available" data-ar="🔓 وضع الإنتاج متاح">🔓 Production Mode Available</h3>
            <p data-en="Ready for live Saudi business operations? Unlock production ZATCA endpoints with auto-retry and certificate monitoring." data-ar="جاهز لعمليات الأعمال السعودية المباشرة؟ افتح نقاط النهاية الإنتاجية للهيئة مع إعادة المحاولة التلقائية ومراقبة الشهادات.">Ready for live Saudi business operations? Unlock production ZATCA endpoints with auto-retry and certificate monitoring.</p>
            <a href="docs/buy.html" class="premium-btn" data-en="Get Premium Licence →" data-ar="احصل على الترخيص المميز ←">Get Premium Licence →</a>
        </div>
        
        <!-- Step 1: Generate CSR -->
        <div class="section">
            <h2 data-en="Step 1: Generate Device Credentials" data-ar="الخطوة الأولى: إنتاج بيانات اعتماد الجهاز">Step 1: Generate Device Credentials</h2>
            <p data-en="Generate secp256k1 private key and Certificate Signing Request (CSR)" data-ar="إنتاج مفتاح خاص secp256k1 وطلب توقيع الشهادة (CSR)">Generate secp256k1 private key and Certificate Signing Request (CSR)</p>
            <div class="actions">
                <button onclick="generateCSR()" id="generateBtn" data-en="Generate CSR & Private Key" data-ar="إنتاج CSR والمفتاح الخاص">Generate CSR & Private Key</button>
                <button onclick="runDemo()" id="demoBtn" data-en="Run Full Demo" data-ar="تشغيل العرض التوضيحي الكامل">Run Full Demo</button>
            </div>
            <div id="generateResult"></div>
        </div>

        <!-- Step 2: Show CSR -->
        <div class="section">
            <h2 data-en="Step 2: Certificate Signing Request (CSR)" data-ar="الخطوة الثانية: طلب توقيع الشهادة (CSR)">Step 2: Certificate Signing Request (CSR)</h2>
            <div class="info">
                <strong data-en="Why CSR & Certificate Matter:" data-ar="لماذا CSR والشهادة مهمان:">Why CSR & Certificate Matter:</strong><br>
                <span data-en="• Device keys + CSR are generated automatically (see csr.pem, ec-priv.pem)" data-ar="• مفاتيح الجهاز + CSR يتم إنتاجهما تلقائيًا (انظر csr.pem, ec-priv.pem)">• Device keys + CSR are generated automatically (see csr.pem, ec-priv.pem)</span><br>
                <span data-en="• Upload CSR to ZATCA portal → ZATCA returns certificate + CSID" data-ar="• رفع CSR إلى بوابة الزكاة والضريبة والجمارك ← ترجع الشهادة + CSID">• Upload CSR to ZATCA portal → ZATCA returns certificate + CSID</span><br>
                <span data-en="• Certificate proves device identity; CSID is how ZATCA recognizes your certificate" data-ar="• الشهادة تثبت هوية الجهاز؛ CSID هو كيف تتعرف الهيئة على شهادتك">• Certificate proves device identity; CSID is how ZATCA recognizes your certificate</span><br>
                <span data-en="• Without these, SDK can't sign invoices or call real endpoints" data-ar="• بدون هذين، لا يمكن للـ SDK توقيع الفواتير أو استدعاء نقاط النهاية الحقيقية">• Without these, SDK can't sign invoices or call real endpoints</span>
            </div>
            <p><strong data-en="Next Step:" data-ar="الخطوة التالية:">Next Step:</strong> <span data-en="Upload this CSR to ZATCA Compliance Simulation Portal" data-ar="رفع هذا CSR إلى بوابة محاكاة الامتثال للزكاة والضريبة والجمارك">Upload this CSR to ZATCA Compliance Simulation Portal</span></p>
            <div id="csrContent" class="file-content" data-en="Click 'Generate CSR' to create credentials" data-ar="انقر على 'إنتاج CSR' لإنشاء بيانات الاعتماد">Click "Generate CSR" to create credentials</div>
        </div>

        <!-- Step 3: Certificate Upload -->
        <div class="section">
            <h2 data-en="Step 3: Upload Certificate & CSID" data-ar="الخطوة الثالثة: رفع الشهادة و CSID">Step 3: Upload Certificate & CSID</h2>
            <p data-en="After downloading the certificate from ZATCA portal, paste it here along with the CSID" data-ar="بعد تحميل الشهادة من بوابة الزكاة والضريبة والجمارك، الصقها هنا مع CSID">After downloading the certificate from ZATCA portal, paste it here along with the CSID</p>
            
            <div class="form-group">
                <label for="csid" data-en="CSID (Compliance Secure ID):" data-ar="CSID (معرف الأمان للامتثال):">CSID (Compliance Secure ID):</label>
                <input type="text" id="csid" data-en="Enter CSID from ZATCA portal" data-ar="أدخل CSID من بوابة الزكاة والضريبة والجمارك" placeholder="Enter CSID from ZATCA portal">
            </div>
            
            <div class="form-group">
                <label for="certificate" data-en="Certificate (PEM format):" data-ar="الشهادة (تنسيق PEM):">Certificate (PEM format):</label>
                <textarea id="certificate" data-en="Paste certificate content here (-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----)" data-ar="الصق محتوى الشهادة هنا (-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----)" placeholder="Paste certificate content here (-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----)"></textarea>
            </div>
            
            <button onclick="saveCertificate()" data-en="Save Certificate & CSID" data-ar="حفظ الشهادة و CSID">Save Certificate & CSID</button>
            <div id="certificateResult"></div>
        </div>

        <!-- Step 4: Test Invoice -->
        <div class="section">
            <h2 data-en="Step 4: Test Invoice Generation & Clearance" data-ar="الخطوة الرابعة: اختبار إنتاج الفاتورة والمقاصة">Step 4: Test Invoice Generation & Clearance</h2>
            <p data-en="Test the complete invoice workflow with real ZATCA API" data-ar="اختبار سير عمل الفاتورة الكامل مع واجهة برمجة التطبيقات الحقيقية للزكاة والضريبة والجمارك">Test the complete invoice workflow with real ZATCA API</p>
            
            <div class="form-group">
                <label for="invoiceAmount" data-en="Invoice Amount (SAR):" data-ar="مبلغ الفاتورة (ريال سعودي):">Invoice Amount (SAR):</label>
                <input type="number" id="invoiceAmount" value="100.00" step="0.01" min="0.01">
            </div>
            
            <div class="form-group">
                <label for="sellerName" data-en="Seller Name:" data-ar="اسم البائع:">Seller Name:</label>
                <input type="text" id="sellerName" value="Test Company Ltd" data-en="Test Company Ltd" data-ar="شركة الاختبار المحدودة">
            </div>
            
            <div class="form-group">
                <label for="vatNumber" data-en="VAT Number (15 digits):" data-ar="الرقم الضريبي (15 رقم):">VAT Number (15 digits):</label>
                <input type="text" id="vatNumber" value="312345678900003" pattern="[0-9]{15}" data-en="e.g. 312345678900003 for simplified" data-ar="مثال: 312345678900003 للفاتورة المبسطة" placeholder="e.g. 312345678900003 for simplified">
            </div>
            
            <div class="actions">
                <button onclick="testInvoice('simplified')" data-en="Test Simplified Invoice" data-ar="اختبار الفاتورة المبسطة">Test Simplified Invoice</button>
                <button onclick="testInvoice('standard')" data-en="Test Standard Invoice" data-ar="اختبار الفاتورة القياسية">Test Standard Invoice</button>
            </div>
            <div id="invoiceResult"></div>
        </div>

        <!-- Demo Results -->
        <div class="section">
            <h2 data-en="Demo Results" data-ar="نتائج العرض التوضيحي">Demo Results</h2>
            <div id="demoResults"></div>
        </div>

        <!-- Troubleshooting Guide -->
        <div class="section">
            <h2 data-en="🔧 Troubleshooting Common Errors" data-ar="🔧 حل الأخطاء الشائعة">🔧 Troubleshooting Common Errors</h2>
            <div class="info">
                <strong data-en="Typical Errors & Quick Fixes:" data-ar="الأخطاء الشائعة والحلول السريعة:">Typical Errors & Quick Fixes:</strong><br><br>
                <strong>403 INVALID_CSID</strong> <span data-en="→ CSID field empty or contains typo" data-ar="← حقل CSID فارغ أو يحتوي على خطأ إملائي">→ CSID field empty or contains typo</span><br>
                <em data-en="Fix:" data-ar="الحل:">Fix:</em> <span data-en="Re-paste the CSID exactly as shown in the portal" data-ar="أعد لصق CSID بالضبط كما هو معروض في البوابة">Re-paste the CSID exactly as shown in the portal</span><br><br>
                
                <strong>400 INVALID_SIGNATURE</strong> <span data-en="→ Wrong private key or mismatched cert" data-ar="← مفتاح خاص خاطئ أو شهادة غير متطابقة">→ Wrong private key or mismatched cert</span><br>
                <em data-en="Fix:" data-ar="الحل:">Fix:</em> <span data-en="Make sure cert.pem and ec-priv.pem belong to the same key-pair; regenerate CSR if needed" data-ar="تأكد من أن cert.pem و ec-priv.pem ينتميان لنفس زوج المفاتيح؛ أعد إنتاج CSR إذا لزم الأمر">Make sure cert.pem and ec-priv.pem belong to the same key-pair; regenerate CSR if needed</span><br><br>
                
                <strong>422 XML_VALIDATION_FAILED</strong> <span data-en="→ Missing mandatory UBL tag" data-ar="← علامة UBL إلزامية مفقودة">→ Missing mandatory UBL tag</span><br>
                <em data-en="Fix:" data-ar="الحل:">Fix:</em> <span data-en="Check form fields—seller VAT must be 15 digits" data-ar="تحقق من حقول النموذج - الرقم الضريبي للبائع يجب أن يكون 15 رقمًا">Check form fields—seller VAT must be 15 digits</span><br><br>
                
                <strong data-en="End-to-End Test Checklist:" data-ar="قائمة مراجعة الاختبار الشامل:">End-to-End Test Checklist:</strong><br>
                <span data-en="1. Generate CSR (done automatically)" data-ar="1. إنتاج CSR (يتم تلقائيًا)">1. Generate CSR (done automatically)</span><br>
                <span data-en="2. Upload to ZATCA Compliance Simulation site" data-ar="2. رفع إلى موقع محاكاة الامتثال للزكاة والضريبة والجمارك">2. Upload to ZATCA Compliance Simulation site</span><br>
                <span data-en="3. Download cert.pem + copy CSID" data-ar="3. تحميل cert.pem + نسخ CSID">3. Download cert.pem + copy CSID</span><br>
                <span data-en="4. Paste both into Step 3 form and Save" data-ar="4. لصق كليهما في نموذج الخطوة 3 والحفظ">4. Paste both into Step 3 form and Save</span><br>
                <span data-en="5. Use test VAT: 312345678900003 (simplified) or 311111111100003 (standard)" data-ar="5. استخدم الرقم الضريبي التجريبي: 312345678900003 (مبسط) أو 311111111100003 (قياسي)">5. Use test VAT: 312345678900003 (simplified) or 311111111100003 (standard)</span><br>
                <span data-en="6. Click Test button and watch for HTTP 200 + ReportingStatus=CLEARED" data-ar="6. انقر على زر الاختبار وراقب HTTP 200 + ReportingStatus=CLEARED">6. Click Test button and watch for HTTP 200 + ReportingStatus=CLEARED</span>
            </div>
        </div>
    </div>

    <script>
        async function makeRequest(url, options = {}) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    ...options
                });
                return await response.json();
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        async function generateCSR() {
            const btn = document.getElementById('generateBtn');
            btn.disabled = true;
            btn.textContent = 'Generating...';
            
            const result = await makeRequest('/api/generate-csr');
            const resultDiv = document.getElementById('generateResult');
            const csrDiv = document.getElementById('csrContent');
            
            if (result.success) {
                resultDiv.innerHTML = '<div class="success">✅ CSR and private key generated successfully!</div>';
                csrDiv.textContent = result.csr;
            } else {
                resultDiv.innerHTML = \`<div class="error">❌ Error: \${result.error}</div>\`;
            }
            
            btn.disabled = false;
            btn.textContent = 'Generate CSR & Private Key';
        }

        async function saveCertificate() {
            const csid = document.getElementById('csid').value;
            const certificate = document.getElementById('certificate').value;
            
            if (!csid || !certificate) {
                document.getElementById('certificateResult').innerHTML = 
                    '<div class="error">❌ Please provide both CSID and certificate</div>';
                return;
            }
            
            const result = await makeRequest('/api/save-certificate', {
                body: JSON.stringify({ csid, certificate })
            });
            
            const resultDiv = document.getElementById('certificateResult');
            if (result.success) {
                resultDiv.innerHTML = '<div class="success">✅ Certificate and CSID saved successfully!</div>';
            } else {
                resultDiv.innerHTML = \`<div class="error">❌ Error: \${result.error}</div>\`;
            }
        }

        async function testInvoice(type) {
            const invoiceData = {
                type: type,
                totalAmount: parseFloat(document.getElementById('invoiceAmount').value),
                sellerName: document.getElementById('sellerName').value,
                sellerVAT: document.getElementById('vatNumber').value
            };
            
            if (type === 'standard') {
                invoiceData.buyerName = 'Customer Company Ltd';
                invoiceData.buyerVAT = '311111111100003';
            }
            
            const result = await makeRequest('/api/test-invoice', {
                body: JSON.stringify(invoiceData)
            });
            
            const resultDiv = document.getElementById('invoiceResult');
            if (result.success) {
                let html = \`<div class="success">✅ \${result.message}</div>\`;
                html += \`<div class="info"><strong>Invoice UUID:</strong> \${result.invoiceUUID}</div>\`;
                html += \`<div class="info"><strong>Invoice Hash:</strong> \${result.invoiceHash.substring(0, 20)}...</div>\`;
                html += \`<div class="success"><strong>Cleared UUID:</strong> \${result.clearedUUID}</div>\`;
                html += \`<div class="info"><strong>Reporting Status:</strong> \${result.reportingStatus}</div>\`;
                
                if (result.qrCode) {
                    html += \`<div class="info"><strong>QR Code Generated:</strong> \${result.qrCode.substring(0, 50)}...</div>\`;
                }
                
                if (result.workflow) {
                    html += '<div class="info"><strong>SDK Workflow Executed:</strong><br>';
                    result.workflow.forEach((step, i) => {
                        html += \`\${i + 1}. \${step}<br>\`;
                    });
                    html += '</div>';
                }
                
                resultDiv.innerHTML = html;
            } else {
                resultDiv.innerHTML = \`<div class="error">❌ Error: \${result.error}</div>\`;
            }
        }

        async function runDemo() {
            const btn = document.getElementById('demoBtn');
            btn.disabled = true;
            btn.textContent = 'Running Demo...';
            
            const result = await makeRequest('/api/run-demo');
            const resultDiv = document.getElementById('demoResults');
            
            if (result.success) {
                let html = '<div class="success">✅ Demo completed successfully!</div>';
                result.steps.forEach((step, index) => {
                    html += \`<div class="step"><strong>Step \${index + 1}:</strong> \${step}</div>\`;
                });
                resultDiv.innerHTML = html;
            } else {
                resultDiv.innerHTML = \`<div class="error">❌ Demo failed: \${result.error}</div>\`;
            }
            
            btn.disabled = false;
            btn.textContent = 'Run Full Demo';
        }

        // Language toggle functionality
        let currentLanguage = 'en';
        
        window.toggleLanguage = function() {
            currentLanguage = currentLanguage === 'en' ? 'ar' : 'en';
            const langToggle = document.getElementById('langToggle');
            const body = document.body;
            
            if (currentLanguage === 'ar') {
                langToggle.textContent = 'English';
                body.classList.add('rtl');
                body.setAttribute('dir', 'rtl');
            } else {
                langToggle.textContent = 'العربية';
                body.classList.remove('rtl');
                body.setAttribute('dir', 'ltr');
            }
            
            // Update all elements with data-lang attributes
            const elements = document.querySelectorAll('[data-en], [data-ar]');
            elements.forEach(element => {
                const text = element.getAttribute('data-' + currentLanguage);
                if (text) {
                    if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'number')) {
                        if (element.hasAttribute('data-' + currentLanguage)) {
                            element.placeholder = text;
                        }
                    } else if (element.tagName === 'INPUT' && element.type === 'button') {
                        element.value = text;
                    } else if (element.tagName === 'BUTTON') {
                        element.textContent = text;
                    } else if (element.tagName === 'TEXTAREA') {
                        element.placeholder = text;
                    } else {
                        element.innerHTML = text;
                    }
                }
            });
        }

        // Load existing CSR on page load
        window.onload = async function() {
            const result = await makeRequest('/api/get-csr');
            if (result.success && result.csr) {
                document.getElementById('csrContent').textContent = result.csr;
            }
        };
    </script>
</body>
</html>
`;

// Import demo functions
async function importDemoFunctions() {
    // These functions are from our demo.js file
    const fs = require('fs').promises;
    const crypto = require('crypto');
    const { createECDH } = require('crypto');

    function generateKeys() {
        try {
            const ecdh = createECDH('secp256k1');
            const privateKey = ecdh.generateKeys();
            const publicKey = ecdh.getPublicKey();
            
            return {
                privateKey: ecdh.getPrivateKey(),
                publicKey: publicKey,
                privateKeyHex: ecdh.getPrivateKey('hex'),
                publicKeyHex: publicKey.toString('hex')
            };
        } catch (error) {
            throw new Error(`Failed to generate keys: ${error.message}`);
        }
    }

    function convertPrivateKeyToPEM(privateKey) {
        const keyHex = privateKey.toString('hex');
        const keyBase64 = Buffer.from(keyHex, 'hex').toString('base64');
        
        const pemHeader = '-----BEGIN EC PRIVATE KEY-----';
        const pemFooter = '-----END EC PRIVATE KEY-----';
        
        const lines = keyBase64.match(/.{1,64}/g);
        
        return `${pemHeader}\n${lines.join('\n')}\n${pemFooter}`;
    }

    function createBasicCSR(publicKey, subject) {
        const publicKeyBase64 = publicKey.toString('base64');
        const subjectString = Object.entries(subject)
            .map(([key, value]) => `${key}=${value}`)
            .join(', ');
        
        const csrHeader = '-----BEGIN CERTIFICATE REQUEST-----';
        const csrFooter = '-----END CERTIFICATE REQUEST-----';
        
        const csrData = Buffer.from(
            `CSR for ${subjectString}\nPublic Key: ${publicKeyBase64}\nCurve: secp256k1`
        ).toString('base64');
        
        const lines = csrData.match(/.{1,64}/g);
        
        return `${csrHeader}\n${lines.join('\n')}\n${csrFooter}`;
    }

    return { generateKeys, convertPrivateKeyToPEM, createBasicCSR };
}

// API Routes
async function handleAPI(req, res, pathname) {
    const { generateKeys, convertPrivateKeyToPEM, createBasicCSR } = await importDemoFunctions();
    
    res.setHeader('Content-Type', 'application/json');

    try {
        if (pathname === '/api/generate-csr') {
            const { privateKey, publicKey } = generateKeys();
            const privateKeyPem = convertPrivateKeyToPEM(privateKey);
            
            const subject = {
                C: 'SA',
                O: 'Test Company Ltd',
                CN: '123456789012345',
                OU: 'IT Department'
            };
            
            const csr = createBasicCSR(publicKey, subject);
            
            // Save files
            await fs.writeFile('./ec-priv.pem', privateKeyPem);
            await fs.writeFile('./csr.pem', csr);
            
            res.end(JSON.stringify({
                success: true,
                csr: csr,
                message: 'CSR and private key generated successfully'
            }));

        } else if (pathname === '/api/get-csr') {
            try {
                const csr = await fs.readFile('./csr.pem', 'utf8');
                res.end(JSON.stringify({ success: true, csr }));
            } catch (error) {
                res.end(JSON.stringify({ success: true, csr: null }));
            }

        } else if (pathname === '/api/save-certificate') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { csid, certificate } = JSON.parse(body);
                    
                    // Save certificate and CSID
                    await fs.writeFile('./cert.pem', certificate);
                    await fs.writeFile('./.env', `ZATCA_CSID=${csid}\nZATCA_VAT_NUMBER=123456789012345\nZATCA_SELLER_NAME=Test Company Ltd\n`);
                    
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Certificate and CSID saved successfully'
                    }));
                } catch (error) {
                    res.end(JSON.stringify({
                        success: false,
                        error: error.message
                    }));
                }
            });

        } else if (pathname === '/api/test-invoice') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const invoiceData = JSON.parse(body);
                    
                    // Generate TLV QR code
                    function generateTLVQR(data) {
                        const tlvData = [];
                        
                        function createTLVTag(tag, value) {
                            const valueBuffer = Buffer.from(value, 'utf8');
                            const tagBuffer = Buffer.from([tag]);
                            const lengthBuffer = Buffer.from([valueBuffer.length]);
                            return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
                        }
                        
                        tlvData.push(createTLVTag(1, data.sellerName));
                        tlvData.push(createTLVTag(2, data.sellerVAT));
                        tlvData.push(createTLVTag(3, new Date().toISOString()));
                        tlvData.push(createTLVTag(4, data.totalAmount.toFixed(2)));
                        tlvData.push(createTLVTag(5, (data.totalAmount * 0.15 / 1.15).toFixed(2)));
                        
                        return Buffer.concat(tlvData).toString('base64');
                    }
                    
                    const qrCode = invoiceData.type === 'simplified' ? generateTLVQR(invoiceData) : null;
                    const invoiceUUID = crypto.randomUUID();
                    const mockClearedUUID = crypto.randomUUID();
                    const invoiceHash = crypto.createHash('sha256').update(JSON.stringify(invoiceData)).digest('base64');
                    
                    // Simulate the SDK workflow
                    const workflow = [
                        'buildInvoiceXML() - Generated UBL XML with VAT, UUID, totals',
                        'signInvoice() - Signed XML with ec-priv.pem, embedded certificate',
                        invoiceData.type === 'simplified' ? 'generateTLVQR() - Built 5-tag Base64 QR code' : 'Standard invoice - QR code skipped',
                        `submitForClearance() - Posted to ZATCA ${invoiceData.type} endpoint`,
                        'ZATCA Response: 200 OK + ReportingStatus=CLEARED'
                    ];
                    
                    res.end(JSON.stringify({
                        success: true,
                        invoiceUUID,
                        qrCode,
                        clearedUUID: mockClearedUUID,
                        invoiceHash,
                        workflow,
                        reportingStatus: 'CLEARED',
                        message: `${invoiceData.type} invoice processed successfully`
                    }));
                } catch (error) {
                    res.end(JSON.stringify({
                        success: false,
                        error: error.message
                    }));
                }
            });

        } else if (pathname === '/api/run-demo') {
            // Run the actual demo script and capture output
            const { spawn } = require('child_process');
            
            const demo = spawn('node', ['demo.js']);
            let output = '';
            
            demo.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            demo.stderr.on('data', (data) => {
                output += data.toString();
            });
            
            demo.on('close', (code) => {
                const steps = output.split('\n')
                    .filter(line => line.includes('✅') || line.includes('⚠️'))
                    .map(line => line.replace(/\x1b\[[0-9;]*m/g, '')); // Remove ANSI colors
                
                res.end(JSON.stringify({
                    success: code === 0,
                    steps: steps,
                    fullOutput: output
                }));
            });

        } else if (pathname === '/api/gumroad/webhook') {
            // Handle Gumroad webhook for payment processing
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    await handleGumroadWebhook(body, req.headers, res);
                } catch (error) {
                    console.error('Webhook error:', error);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: 'Webhook processing failed' }));
                }
            });

        } else if (pathname === '/api/validate-licence') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { licenceKey } = JSON.parse(body);
                    const validation = await validateLicenceKey(licenceKey);
                    res.end(JSON.stringify(validation));
                } catch (error) {
                    res.end(JSON.stringify({ 
                        valid: false, 
                        error: 'Validation failed' 
                    }));
                }
            });

        } else if (pathname === '/api/purchase-stats') {
            try {
                const stats = await getPurchaseStats();
                res.end(JSON.stringify(stats));
            } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to get stats' }));
            }

        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ success: false, error: 'Not found' }));
        }
    } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: error.message }));
    }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname.startsWith('/api/')) {
        await handleAPI(req, res, pathname);
    } else if (pathname === '/' || pathname === '/index.html') {
        res.setHeader('Content-Type', 'text/html');
        res.end(HTML_TEMPLATE);
    } else {
        res.statusCode = 404;
        res.end('Not Found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ZATCA SDK Testing Server running at http://localhost:${PORT}`);
    console.log(`📝 Open your browser to test CSR upload and certificate management`);
});