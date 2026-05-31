const fs = require('fs');

let content = fs.readFileSync('D:/Projects/Yakuzi/yakuzi-web/apps/buyer/src/app/products/page.tsx', 'utf8');

content = content.replace(
  `import Navbar from '@/components/landing/Navbar';`,
  `import Navbar from '@/components/landing/Navbar';\nimport HeroSection from '@/components/landing/HeroSection';`
);

content = content.replace(
  `        <Navbar\n          showUserActions={true}\n          onLoginClick={() => setIsLoginOpen(true)}\n          onFilterClick={() => setShowMobileFilters(true)}\n        />\n      </div>`,
  `        <Navbar\n          showUserActions={true}\n          onLoginClick={() => setIsLoginOpen(true)}\n          onFilterClick={() => setShowMobileFilters(true)}\n        />\n      </div>\n      <div className="w-full max-w-[1600px] mx-auto relative z-10 pt-4 pb-8">\n        <HeroSection />\n      </div>`
);

fs.writeFileSync('D:/Projects/Yakuzi/yakuzi-web/apps/buyer/src/app/page.tsx', content, 'utf8');
fs.unlinkSync('D:/Projects/Yakuzi/yakuzi-web/apps/buyer/src/app/products/page.tsx');
console.log('Merge complete!');
