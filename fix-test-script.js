const fs = require('fs');
let code = fs.readFileSync('test-product-journey.js', 'utf8');

// Replace: await question('Enter OTP for seller: ')
code = code.replace(/await question\('Enter OTP for seller: '\)/g, "'123456'");
// Replace: await question('Enter OTP for buyer: ')
code = code.replace(/await question\('Enter OTP for buyer: '\)/g, "'123456'");

fs.writeFileSync('test-product-journey.js', code);
console.log("Replaced interactive OTP inputs with '123456'");
