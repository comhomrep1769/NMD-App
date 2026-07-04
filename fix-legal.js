const fs = require('fs');

// Fix footer links
let footer = fs.readFileSync('frontend-next/src/components/landing/Footer.tsx', 'utf8');
footer = footer.replace('href="#" className="text-xs !text-white/22">Privacy Policy', 'href="/privacy-policy" className="text-xs !text-white/22">Privacy Policy');
footer = footer.replace('href="#" className="text-xs !text-white/22">Terms of Service', 'href="/terms-of-service" className="text-xs !text-white/22">Terms of Service');
fs.writeFileSync('frontend-next/src/components/landing/Footer.tsx', footer, 'utf8');
console.log('Footer done');

// Add Legal to PAGE_LABELS
let sc = fs.readFileSync('frontend-next/src/app/site-content/page.tsx', 'utf8');
sc = sc.replace("login: 'Login & Auth Pages',", "login: 'Login & Auth Pages',\n  legal: 'Legal Pages',");
fs.writeFileSync('frontend-next/src/app/site-content/page.tsx', sc, 'utf8');
console.log('PAGE_LABELS done');
