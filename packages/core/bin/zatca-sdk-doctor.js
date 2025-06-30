#!/usr/bin/env node

/**
 * ZATCA SDK Doctor - Post-install sanity check
 * Verifies system requirements and connectivity
 */

import https from 'https';
import { execSync } from 'child_process';

// Simple console logging without chalk dependency
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

const log = (color, message) => {
  const colorCode = colors[color] || colors.white;
  console.log(`${colorCode}${message}${colors.reset}`);
};

async function checkNodeVersion() {
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (major >= 18) {
    log('green', `✅ Node.js ${nodeVersion} (≥18 required)`);
    return true;
  } else {
    log('red', `❌ Node.js ${nodeVersion} - Please upgrade to Node.js 18+`);
    return false;
  }
}

async function checkOpenSSL() {
  try {
    const opensslVersion = execSync('openssl version', { encoding: 'utf8' });
    
    // Check if secp256k1 curve is available
    const curves = execSync('openssl ecparam -list_curves', { encoding: 'utf8' });
    
    if (curves.includes('secp256k1')) {
      log('green', `✅ OpenSSL with secp256k1 support`);
      log('white', `   ${opensslVersion.trim()}`);
      return true;
    } else {
      log('red', `❌ OpenSSL missing secp256k1 curve support`);
      log('yellow', '   Install OpenSSL with EC curve support');
      return false;
    }
  } catch (error) {
    log('red', `❌ OpenSSL not found or not accessible`);
    log('yellow', '   Install OpenSSL for cryptographic operations');
    return false;
  }
}

async function checkZATCAConnectivity() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'gw-fatoora.zatca.gov.sa',
      port: 443,
      path: '/e-invoicing/developer-portal',
      method: 'HEAD',
      timeout: 5000
    };
    
    const req = https.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        log('green', '✅ ZATCA sandbox endpoint reachable');
        resolve(true);
      } else {
        log('yellow', `⚠️  ZATCA endpoint responded with ${res.statusCode}`);
        resolve(true); // Still reachable
      }
    });
    
    req.on('error', (error) => {
      log('red', '❌ Cannot reach ZATCA sandbox endpoint');
      log('yellow', '   Check internet connection and firewall settings');
      resolve(false);
    });
    
    req.on('timeout', () => {
      log('red', '❌ ZATCA endpoint timeout');
      log('yellow', '   Check internet connection');
      resolve(false);
    });
    
    req.end();
  });
}

async function checkCryptoModules() {
  try {
    const crypto = await import('crypto');
    
    // Test secp256k1 key generation
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp256k1',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    if (publicKey && privateKey) {
      log('green', '✅ secp256k1 key generation working');
      return true;
    }
  } catch (error) {
    log('red', '❌ Crypto module secp256k1 support failed');
    log('yellow', `   Error: ${error.message}`);
    return false;
  }
}

async function runDiagnostics() {
  log('blue', '🔍 ZATCA SDK Doctor - System Diagnostics');
  log('blue', '=====================================\n');
  
  const checks = [
    { name: 'Node.js Version', fn: checkNodeVersion },
    { name: 'OpenSSL & secp256k1', fn: checkOpenSSL },
    { name: 'Crypto Module', fn: checkCryptoModules },
    { name: 'ZATCA Connectivity', fn: checkZATCAConnectivity }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const check of checks) {
    try {
      const result = await check.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log('red', `❌ ${check.name} check failed: ${error.message}`);
      failed++;
    }
  }
  
  log('', '\n📊 Diagnostic Results:');
  log('', '====================');
  log('green', `✅ Passed: ${passed}`);
  log('red', `❌ Failed: ${failed}`);
  
  if (failed === 0) {
    log('green', '\n🎉 All checks passed! ZATCA SDK is ready to use.');
    log('white', '\nNext steps:');
    log('white', '1. Run: npm run core-demo (free tier)');
    log('white', '2. Or: npm run pro-demo --licence <token> (premium)');
    process.exit(0);
  } else {
    log('yellow', '\n⚠️  Some checks failed. Please resolve the issues above.');
    log('white', '\nFor support: https://github.com/your-repo/issues');
    process.exit(1);
  }
}

// Run diagnostics if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDiagnostics().catch(error => {
    log('red', `❌ Doctor script failed: ${error.message}`);
    process.exit(1);
  });
}

export { runDiagnostics };