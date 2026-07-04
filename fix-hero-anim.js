const fs = require('fs')
const ROOT = 'C:/Dev/NMD-App'
const f = ROOT + '/frontend-next/src/components/landing/Hero.tsx'
let c = fs.readFileSync(f, 'utf8')
const hasCRLF = c.includes('\r\n')
let w = c.replace(/\r\n/g, '\n')
const patches = [
  [
    '<section className="relative overflow-hidden pt-[68px]">',
    '<section className="relative overflow-hidden pt-[68px]">\n      <style>{\n        @keyframes nmdHeroBgZoom { from { transform: scale(1.06); } to { transform: scale(1); } }\n        @keyframes nmdFadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }\n        @keyframes nmdFadeRight { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }\n        .nmd-hero-bg { animation: nmdHeroBgZoom 16s ease-out forwards; }\n        .nmd-fade-up-1 { animation: nmdFadeUp 0.7s ease both; animation-delay: 0ms; }\n        .nmd-fade-up-2 { animation: nmdFadeUp 0.7s ease both; animation-delay: 150ms; }\n        .nmd-fade-up-3 { animation: nmdFadeUp 0.7s ease both; animation-delay: 300ms; }\n        .nmd-fade-up-4 { animation: nmdFadeUp 0.7s ease both; animation-delay: 450ms; }\n        .nmd-fade-up-5 { animation: nmdFadeUp 0.7s ease both; animation-delay: 600ms; }\n        .nmd-fade-right { animation: nmdFadeRight 0.8s ease both; animation-delay: 350ms; }\n      }</style>',
    'style tag'
  ],
  ['className="absolute inset-0 bg-cover bg-top sm:bg-center"', 'className="nmd-hero-bg absolute inset-0 bg-cover bg-top sm:bg-center"', 'bg'],
  ['className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300"', 'className="nmd-fade-up-1 mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300"', 'badge'],
  ['className="mb-5 text-4xl font-extrabold leading-[1.1] tracking-tight !text-white sm:text-5xl lg:text-6xl"', 'className="nmd-fade-up-2 mb-5 text-4xl font-extrabold leading-[1.1] tracking-tight !text-white sm:text-5xl lg:text-6xl"', 'h1'],
  ['className="mb-8 max-w-[480px] text-base leading-relaxed !text-white/70"', 'className="nmd-fade-up-3 mb-8 max-w-[480px] text-base leading-relaxed !text-white/70"', 'subtext'],
  ['className="mb-10 flex flex-wrap gap-3"', 'className="nmd-fade-up-4 mb-10 flex flex-wrap gap-3"', 'buttons'],
  ['className="flex gap-10"', 'className="nmd-fade-up-5 flex gap-10"', 'stats'],
  ['className="rounded-2xl border border-white/15 bg-white/10 p-7 backdrop-blur-xl"', 'className="nmd-fade-right rounded-2xl border border-white/15 bg-white/10 p-7 backdrop-blur-xl"', 'card'],
]
let allOk = true
for (const [old, rep, name] of patches) {
  if (!w.includes(old)) { console.error('MISS: ' + name); allOk = false }
  else { w = w.replace(old, rep); console.log('OK: ' + name) }
}
if (!allOk) process.exit(1)
const final = hasCRLF ? w.replace(/\n/g, '\r\n') : w
fs.writeFileSync(f, final, 'utf8')
console.log('Hero animated')
