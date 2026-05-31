const fs = require('fs');
let code = fs.readFileSync('test-product-journey.js', 'utf8');

// Replace the getUserInput function body
code = code.replace(/const getUserInput = \(query\) => \{[\s\S]*?return new Promise\(\(resolve\) => rl\.question\(query, resolve\)\);\n\};/, `const getUserInput = (query) => {
  console.log(query + "123456");
  return Promise.resolve('123456');
};`);

fs.writeFileSync('test-product-journey.js', code);
console.log("Mocked getUserInput to always return 123456");
