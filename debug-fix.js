const fs = require('fs')

// Fix CtaBand - find and show the broken line
let cta = fs.readFileSync('frontend-next/src/components/landing/CtaBand.tsx', 'utf8')
const ctaLines = cta.split('\n')
const ctaLine = ctaLines.find(l => l.includes('fetch(') && l.includes('API'))
console.log('CtaBand fetch line:', JSON.stringify(ctaLine))

// Fix RecurringSection - find and show the broken line  
let rec = fs.readFileSync('frontend-next/src/components/landing/RecurringSection.tsx', 'utf8')
const recLines = rec.split('\n')
const recLine = recLines.find(l => l.includes('ext-[13px]') || l.includes('text-[13px] font-bold'))
console.log('RecurringSection class line:', JSON.stringify(recLine))
