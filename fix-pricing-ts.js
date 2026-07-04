const fs = require('fs');
const f = 'frontend-next/src/components/landing/PricingSection.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.replace("import { motion } from 'framer-motion'", "import { motion, type Variants } from 'framer-motion'");
c = c.replace('const fadeUp = {', 'const fadeUp: Variants = {');
c = c.replace("ease: 'easeOut' }", "ease: 'easeOut' as const }");
fs.writeFileSync(f, c, 'utf8');
console.log('Done');
