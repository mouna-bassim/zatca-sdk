#!/usr/bin/env node

/**
 * Post-install hints for ZATCA SDK
 * Shows developers how to get started after npm install
 */

console.log(`
🎉 ZATCA SDK installed successfully!

✅ Run \x1b[32mnpm run core-demo\x1b[0m to clear a sandbox invoice.

🔓 Unlock production: \x1b[32mnpm run pro-demo -- --licence ZSDK…\x1b[0m

📚 Quick Commands:
   \x1b[36mnpx zatca-sdk doctor\x1b[0m     - Validate system requirements
   \x1b[36mnpm run core-demo\x1b[0m        - Test sandbox invoice clearance
   \x1b[36mnpm test\x1b[0m                 - Run test suite

🛒 Get Pro licence: https://mounabsm.gumroad.com/l/zydki
📖 Documentation: https://github.com/mouna-bassim/zatca-sdk

`);