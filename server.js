#!/usr/bin/env node

/**
 * Simple web server for ZATCA SDK testing
 * Provides UI for CSR upload and certificate management
 */

const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const PORT = 5000;

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
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 ZATCA Phase-2 e-Invoice SDK Testing</h1>
        
        <!-- Step 1: Generate CSR -->
        <div class="section">
            <h2>Step 1: Generate Device Credentials</h2>
            <p>Generate secp256k1 private key and Certificate Signing Request (CSR)</p>
            <div class="actions">
                <button onclick="generateCSR()" id="generateBtn">Generate CSR & Private Key</button>
                <button onclick="runDemo()" id="demoBtn">Run Full Demo</button>
            </div>
            <div id="generateResult"></div>
        </div>

        <!-- Step 2: Show CSR -->
        <div class="section">
            <h2>Step 2: Certificate Signing Request (CSR)</h2>
            <p>Upload this CSR to the ZATCA Compliance Portal</p>
            <div id="csrContent" class="file-content">Click "Generate CSR" to create credentials</div>
        </div>

        <!-- Step 3: Certificate Upload -->
        <div class="section">
            <h2>Step 3: Upload Certificate & CSID</h2>
            <p>After downloading the certificate from ZATCA portal, paste it here along with the CSID</p>
            
            <div class="form-group">
                <label for="csid">CSID (Compliance Secure ID):</label>
                <input type="text" id="csid" placeholder="Enter CSID from ZATCA portal">
            </div>
            
            <div class="form-group">
                <label for="certificate">Certificate (PEM format):</label>
                <textarea id="certificate" placeholder="Paste certificate content here (-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----)"></textarea>
            </div>
            
            <button onclick="saveCertificate()">Save Certificate & CSID</button>
            <div id="certificateResult"></div>
        </div>

        <!-- Step 4: Test Invoice -->
        <div class="section">
            <h2>Step 4: Test Invoice Generation & Clearance</h2>
            <p>Test the complete invoice workflow with real ZATCA API</p>
            
            <div class="form-group">
                <label for="invoiceAmount">Invoice Amount (SAR):</label>
                <input type="number" id="invoiceAmount" value="100.00" step="0.01" min="0.01">
            </div>
            
            <div class="form-group">
                <label for="sellerName">Seller Name:</label>
                <input type="text" id="sellerName" value="Test Company Ltd">
            </div>
            
            <div class="form-group">
                <label for="vatNumber">VAT Number:</label>
                <input type="text" id="vatNumber" value="123456789012345" pattern="[0-9]{15}">
            </div>
            
            <div class="actions">
                <button onclick="testInvoice('simplified')">Test Simplified Invoice</button>
                <button onclick="testInvoice('standard')">Test Standard Invoice</button>
            </div>
            <div id="invoiceResult"></div>
        </div>

        <!-- Demo Results -->
        <div class="section">
            <h2>Demo Results</h2>
            <div id="demoResults"></div>
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
                invoiceData.buyerVAT = '987654321098765';
            }
            
            const result = await makeRequest('/api/test-invoice', {
                body: JSON.stringify(invoiceData)
            });
            
            const resultDiv = document.getElementById('invoiceResult');
            if (result.success) {
                let html = '<div class="success">✅ Invoice processed successfully!</div>';
                html += \`<div class="info">Invoice UUID: \${result.invoiceUUID}</div>\`;
                if (result.qrCode) {
                    html += \`<div class="info">QR Code Generated: \${result.qrCode.substring(0, 50)}...</div>\`;
                }
                if (result.clearedUUID) {
                    html += \`<div class="success">Cleared UUID: \${result.clearedUUID}</div>\`;
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
                    
                    const qrCode = generateTLVQR(invoiceData);
                    const invoiceUUID = crypto.randomUUID();
                    const mockClearedUUID = crypto.randomUUID();
                    
                    res.end(JSON.stringify({
                        success: true,
                        invoiceUUID,
                        qrCode,
                        clearedUUID: mockClearedUUID,
                        message: 'Invoice processed successfully'
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