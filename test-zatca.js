#!/usr/bin/env node

/**
 * Simple test script for ZATCA SDK functionality
 * Run with: node test-zatca.js
 */

const fs = require('fs');
const crypto = require('crypto');

// Simple UUID v4 generator for testing
function generateUUID() {
    return crypto.randomUUID();
}

console.log('🧪 ZATCA SDK Test Suite');
console.log('========================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        failed++;
    }
}

// Test 1: Check if required files exist
test('CSR and private key files exist', () => {
    if (!fs.existsSync('./csr.pem')) throw new Error('csr.pem not found');
    if (!fs.existsSync('./ec-priv.pem')) throw new Error('ec-priv.pem not found');
});

// Test 2: Validate CSR format
test('CSR has valid PEM format', () => {
    const csr = fs.readFileSync('./csr.pem', 'utf8');
    if (!csr.includes('-----BEGIN CERTIFICATE REQUEST-----')) {
        throw new Error('Invalid CSR format');
    }
});

// Test 3: Validate private key format
test('Private key has valid PEM format', () => {
    const privateKey = fs.readFileSync('./ec-priv.pem', 'utf8');
    if (!privateKey.includes('-----BEGIN EC PRIVATE KEY-----')) {
        throw new Error('Invalid private key format');
    }
});

// Test 4: UUID generation
test('UUID generation works', () => {
    const uuid = generateUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) throw new Error('Invalid UUID format');
});

// Test 5: I18n files exist
test('Internationalization files exist', () => {
    if (!fs.existsSync('./i18n/en.json')) throw new Error('English i18n file not found');
    if (!fs.existsSync('./i18n/ar.json')) throw new Error('Arabic i18n file not found');
});

// Test 6: I18n files are valid JSON
test('I18n files contain valid JSON', () => {
    const en = JSON.parse(fs.readFileSync('./i18n/en.json', 'utf8'));
    const ar = JSON.parse(fs.readFileSync('./i18n/ar.json', 'utf8'));
    if (!en.title || !ar.title) throw new Error('Missing required translation keys');
});

// Test 7: Main SDK files exist
test('Main SDK files exist', () => {
    const requiredFiles = [
        './src/crypto/keyGenerator.js',
        './src/invoice/xmlBuilder.js', 
        './src/invoice/qrGenerator.js',
        './src/api/zatcaEndpoints.js',
        './index.js',
        './demo.js',
        './server.js'
    ];
    
    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            throw new Error(`Required file missing: ${file}`);
        }
    }
});

console.log('\n📊 Test Results:');
console.log('================');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
    console.log('\n🎉 All tests passed! SDK is ready for ZATCA testing.');
    console.log('\nNext steps:');
    console.log('1. Upload ./csr.pem to ZATCA Compliance Portal');
    console.log('2. Download certificate and get CSID');
    console.log('3. Test with real ZATCA sandbox endpoints');
} else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
}