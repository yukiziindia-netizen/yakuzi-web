const fs = require('fs');
let code = fs.readFileSync('test-product-journey.js', 'utf8');

// Replace the getUserInput function body correctly
const targetFunc = `function getUserInput(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}`;

const mockFunc = `function getUserInput(prompt) {
  console.log(prompt + "123456");
  return Promise.resolve('123456');
}`;

code = code.replace(targetFunc, mockFunc);

fs.writeFileSync('test-product-journey.js', code);
console.log("Mocked getUserInput to always return 123456");
