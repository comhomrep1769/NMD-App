const fs = require('fs');
const f = 'frontend-next/src/components/landing/PricingSection.tsx';
let c = fs.readFileSync(f, 'utf8');

// Fix TypeScript
c = c.replace("import { motion } from 'framer-motion'", "import { motion, type Variants } from 'framer-motion'");
c = c.replace('const fadeUp = {', 'const fadeUp: Variants = {');
c = c.replace("ease: 'easeOut' }", "ease: 'easeOut' as const }");

// Restore correct grid columns (desktop-first, not mobile-first)
c = c.replace('grid-pricing-cards mb-12 grid grid-cols-2 gap-4 sm:grid-cols-5', 'grid-pricing-cards mb-12 grid grid-cols-5 gap-4');
c = c.replace('grid-packages grid grid-cols-1 gap-5 sm:grid-cols-3', 'grid-packages grid grid-cols-3 gap-5');

fs.writeFileSync(f, c, 'utf8');
console.log('Done');
