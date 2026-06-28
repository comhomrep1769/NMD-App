'use client'

import { useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'

type Chemical = {
  name: string
  category: string
  price: string
  useCases: string
  purchaseUrl: string
  caution?: string
}

type Sealer = {
  name: string
  surface: string
  price: string
  bestFor: string
  notes: string
  purchaseUrl: string
}

const CHEMICALS: Chemical[] = [
  {
    name: 'SH / Sodium Hypochlorite / Bleach / Chlorine',
    category: 'Organic Growth',
    price: '~$5.98/gal (Pool Essentials at Lowe\'s)',
    useCases: 'Core soft-wash chemical for algae, mildew, mold, roof stains, siding, vinyl, concrete post-treat, pavers, fences.',
    purchaseUrl: 'https://www.lowes.com/pd/Pool-Essentials-1-Gallon-Liquid-Pool-Chlorine/5001527059',
  },
  {
    name: 'GreenOx Renew',
    category: 'Organic Growth',
    price: '~$29.95–$34.95/gal',
    useCases: 'Wood cleaner/restorer, mold/mildew stains, weathered wood, fences, decks, docks. Bleach alternative for over-water or vegetation-sensitive jobs.',
    purchaseUrl: 'https://www.greenflowusa.com/products/p/style-01-ej5na-6fm47',
  },
  {
    name: 'Sodium Percarbonate',
    category: 'Organic Growth',
    price: '~$25 (Texas PW Store)',
    useCases: 'Wood cleaning, deck/fence restoration, organic soil removal on wood. Safer oxygen-based cleaning before oxalic brightener.',
    purchaseUrl: 'https://www.texaspressurewashingstore.com/product/sodium-percarbonate-wood-cleaner/',
  },
  {
    name: 'Simple Green Oxy Solve Total Outdoor',
    category: 'Organic Growth',
    price: '~$23.99/gal (Home Depot)',
    useCases: 'Light mildew/algae, siding, non-SH alternative for light organic growth. Homeowner-friendly cleaner.',
    purchaseUrl: 'https://www.homedepot.com/p/Simple-Green-1-Gal-Concentrated-All-Purpose-Cleaner-2730103613005/100060853',
  },
  {
    name: 'Hotter N Hell Degreaser',
    category: 'Degreaser',
    price: '~$28.75/gal · $85/5gal · $319/25gal',
    useCases: 'Heavy grease, oil, machinery, concrete, shop floors, fleet/equipment cleaning, restaurant/drive-through grease. Great for commercial concrete and burnout/oil jobs.',
    purchaseUrl: 'https://www.hotternhell.us/collections/degreasers',
    caution: 'Use appropriate PPE. Highly concentrated.',
  },
  {
    name: 'Dragon Juice NV / NV2',
    category: 'Degreaser',
    price: '~$55–$60/gal · $250/5gal',
    useCases: 'Heavy-duty cleaner/degreaser, gutters, mud dauber nests, thick algae, exterior grime, painted surfaces (carefully), tough stains.',
    purchaseUrl: 'https://www.texaspressurewashingstoretampa.com/product/dragon-juice-nv-1-gallon-4/',
  },
  {
    name: 'Purple Power',
    category: 'Degreaser',
    price: '~$8.98/gal (Walmart)',
    useCases: 'Budget degreaser for oil, grease, dirt, concrete, shop areas, driveways, equipment, and general grime.',
    purchaseUrl: 'https://www.homedepot.com/p/Purple-Power-128-oz-1-Gal-Industrial-Strength-All-Purpose-Cleaner-and-Degreaser-Concentrate-100539322/308623047',
    caution: 'Use caution on sensitive metals and painted surfaces.',
  },
  {
    name: 'Simple Green Pro HD / All-Purpose',
    category: 'Degreaser',
    price: '~$9.98–$15.58/gal (Home Depot)',
    useCases: 'Light degreasing, general exterior cleaning, vehicles/equipment, siding, light concrete cleaning.',
    purchaseUrl: 'https://www.homedepot.com/p/Simple-Green-1-Gal-Concentrated-All-Purpose-Cleaner-2730103613005/100060853',
  },
  {
    name: 'Pull It Out by CHOMP!',
    category: 'Degreaser',
    price: '~$7.97/32oz (Home Depot)',
    useCases: 'Oil/grease stain lifting from porous concrete, brick, pavers, garage floors, driveways, parking spaces, drive-through lanes. Best for spot-treatment.',
    purchaseUrl: 'https://www.homedepot.com/p/Chomp-32-oz-Concrete-Stain-Remover-53019/203082110',
  },
  {
    name: 'Sodium Hydroxide / Caustic Soda',
    category: 'Degreaser',
    price: 'Available at Texas PW Store (4–10 oz/gal use concentration)',
    useCases: 'Heavy grease, restaurant grease, dumpster pads, oil/animal fat, degreaser boosting.',
    purchaseUrl: 'https://www.texaspressurewashingstore.com/product/sodium-hydroxide/',
    caution: 'VERY CAUSTIC. Serious PPE required at all times. Handle with extreme care.',
  },
  {
    name: 'F9 BARC',
    category: 'Rust & Mineral',
    price: '~$208/5gal (PowerWashStore) · covers 400–800 sq ft/gal',
    useCases: 'Professional rust, fertilizer stain, battery acid stain, orange stains, sprinkler rust, concrete/paver/brick rust issues.',
    purchaseUrl: 'https://www.powerwashstore.com/P/3553/F9BARC-5GallonBucket',
    caution: 'Acid-based. Follow dilution instructions carefully.',
  },
  {
    name: 'Rust Pro',
    category: 'Rust & Mineral',
    price: 'Contact supplier for current pricing',
    useCases: 'Rust stains, sprinkler rust, battery acid staining, red clay, masonry/concrete/wood rust removal.',
    purchaseUrl: 'https://pressureworksinc.com/product/rust-pro-rust-stain-remover/',
  },
  {
    name: 'White Ox / White Ox Granules',
    category: 'Rust & Mineral',
    price: '~$28.95/4lb (Daytona Pressure) · ~$36.15/4lb (Walmart)',
    useCases: 'Well-water rust stains, concrete rust, hardscape rust, bathroom mineral/rust stains. Use ~1/2 lb per gallon of water.',
    purchaseUrl: 'https://daytona-pressure.com/products/white-ox-rust-stain-remover-4-lb',
    caution: 'Rinse windows immediately after application.',
  },
  {
    name: 'Oxalic Acid',
    category: 'Rust & Mineral',
    price: '~$25 (Texas PW Store) · ~$16.99/2lb (Amazon)',
    useCases: 'Wood brightening after percarbonate/metasilicate, pH neutralizing, light rust removal, tannin/rust stains, fence/deck restoration.',
    purchaseUrl: 'https://www.texaspressurewashingstore.com/product/oxalic-acid/',
    caution: 'Note: correct spelling is Oxalic Acid, not "Oxolic".',
  },
  {
    name: 'OneRestore by EaCo Chem',
    category: 'Rust & Mineral',
    price: '~$50/gal · $190/5gal (Pressure Washing Skids)',
    useCases: 'Multi-surface restoration, deep stains, masonry, limestone, brownstone, unpolished marble, brick, block, terracotta, glass deposits, anodized aluminum restoration.',
    purchaseUrl: 'https://pressurewashingskids.com/products/eaco-chem-onerestore-stain-remover',
  },
  {
    name: 'EBC Restorer / Enviro Bio Cleaner',
    category: 'Rust & Mineral',
    price: '~$38.14/gal · $164.86/5gal (PowerWashStore)',
    useCases: 'Concrete brightening, efflorescence, mineral deposits, rust, soot/fire burnout, tire marks. Low-pH restoration cleaner replacing harsher acids.',
    purchaseUrl: 'https://www.panhandlepowerwashsupply.com/ebc-restorer.html',
  },
  {
    name: 'Sodium Metasilicate',
    category: 'Wood Restoration',
    price: '~$25 (Texas PW Store)',
    useCases: 'Wood cleaner/light stripper, fence/deck cleaning, algae/mildew removal on wood. Use before oxalic acid brightener.',
    purchaseUrl: 'https://www.texaspressurewashingstore.com/product/sodium-metasilicate/',
  },
  {
    name: 'NMD 80 by EaCo Chem',
    category: 'Masonry',
    price: 'Available through distributors (contact Panhandle PW Supply)',
    useCases: 'New masonry cleaning, mortar smear removal, efflorescence, polymeric sand haze, brick/block/stone/paver cleanup. NOTE: Not related to NMD brand — same letters, different product.',
    purchaseUrl: 'https://eacochem.com/eaco_products/_product_nmd80/',
  },
  {
    name: 'F9 Groundskeeper',
    category: 'Maintenance',
    price: '~$59.99/gal (Soft Wash Depot)',
    useCases: 'Post-cleaning protection/maintenance, reducing re-growth/contaminants, keeping surfaces cleaner longer, hardscape maintenance.',
    purchaseUrl: 'https://softwashdepot.com/products/f9-groundskeeper',
  },
  {
    name: 'Cleansol BC',
    category: 'Specialty',
    price: '~$190.02+ (Panhandle PW Supply, hazmat shipping)',
    useCases: 'Oxidized painted/vinyl surfaces, oxidation removal, specialized house-wash restoration.',
    purchaseUrl: 'https://www.panhandlepowerwashsupply.com/cleansol-bc.html',
    caution: 'Must test carefully — oxidation chemicals can damage paint if misused.',
  },
  {
    name: 'Elemonator / Apple Wash Surfactant',
    category: 'Surfactant',
    price: '~$57.37/gal (Amazon) · ~$124.17/5gal',
    useCases: 'SH surfactant, house wash soap, helps cling/dwell, masks bleach odor. Used for siding/roof/concrete soft washing.',
    purchaseUrl: 'https://www.amazon.com/Elemonator-Chlora-Boost-Surfactant-Cleaning-Hypochlorite/dp/B0C9JT7J5K',
  },
  {
    name: 'Slo-Mo Surfactant',
    category: 'Surfactant',
    price: '~$105/5gal (PressureWasherProducts)',
    useCases: 'SH-stable surfactant for roofs, siding, vertical cling, longer dwell time, soft washing, roof washing.',
    purchaseUrl: 'https://shop.pressurewasherproducts.com/products/slo-mo-softwash-chlorine-stable-surfactant-5-gallons',
  },
  {
    name: 'Dawn Dish Soap',
    category: 'Surfactant',
    price: '~$5.94/38oz (Walmart)',
    useCases: 'Budget soap/surfactant, small test mixes, light degreasing. Backup/DIY use — not a pro SH-stable surfactant.',
    purchaseUrl: 'https://www.walmart.com/browse/household-essentials/dawn-dish-soap/1115193_8250903_8960327_2262803',
  },
  {
    name: 'White Vinegar / Cleaning Vinegar',
    category: 'Testing',
    price: '~$2.57–$18.47 (Walmart, varies by size/strength)',
    useCases: 'Test acid reaction, mineral deposits, light household cleaning, small test spots.',
    purchaseUrl: 'https://www.walmart.com/c/kp/vinegar-cleaning',
    caution: 'Acidic — can etch/damage stone, concrete, sealed surfaces, and wood finishes.',
  },
  {
    name: 'Isonem Liquid Glass',
    category: 'Sealer / Coating',
    price: '~$239.38/1.1gal · $206.73 each for 10+',
    useCases: 'Transparent waterproofing/sealing/protective coating for tile, stone, concrete, wood, marble, granite, ceramic, aluminum.',
    purchaseUrl: 'https://store.paradiseconcretesolutions.com/11-Gal-Isonem-Liquid-Glass/item/162300001',
  },
]

const SEALERS: Sealer[] = [
  {
    name: 'Seal \'n Lock Super/Ultra Wet Look',
    surface: 'Pavers — Wet Look',
    price: '~$259–$315/5gal',
    bestFor: 'Brick pavers, concrete pavers, pool decks, patios, driveways, walkways',
    notes: 'Great upsell after paver cleaning. Adds color pop and joint stabilization. Must clean, remove efflorescence, and dry/prep properly.',
    purchaseUrl: 'https://www.panhandlepowerwashsupply.com/super-wet-look.html',
  },
  {
    name: 'Trident Hurricane CAT 5',
    surface: 'Pavers — Premium',
    price: '~$328.91–$575.75/kit',
    bestFor: 'High-end paver sealing, strong gloss, joint sand hardening, premium jobs',
    notes: '2-part water-based urethane. More technical application. Good for higher-ticket paver sealing packages.',
    purchaseUrl: 'https://softwashdepot.com/products/trident-hurricane-cat-5-full-kit',
  },
  {
    name: 'Glaze \'N Seal Wet Look',
    surface: 'Pavers / Concrete — Budget Wet Look',
    price: '~$51.98–$72.25/gal · $241–$350/5gal',
    bestFor: 'Budget wet-look pavers, patios, decorative concrete',
    notes: 'Can look great but surface sealers can become slippery or turn cloudy if moisture is trapped. Always test first.',
    purchaseUrl: 'https://www.homedepot.com/b/Glaze-N-Seal/N-5yc1vZfcu',
  },
  {
    name: 'Foundation Armor SX5000 WB',
    surface: 'Concrete / Brick — Natural Look',
    price: '~$65.60/gal',
    bestFor: 'Driveways, sidewalks, concrete pads, garage aprons, commercial walkways, brick walls, chimneys',
    notes: 'Best "natural look" penetrating protection. Repels water but does NOT give strong oil/stain protection like a coating.',
    purchaseUrl: 'https://www.homedepot.com/p/Foundation-Armor-1-gal-Penetrating-Water-Based-Silane-Siloxane-Concrete-Sealer-Brick-Sealer-and-Masonry-Water-Repellent-SX5000WB1GAL/205719732',
  },
  {
    name: 'Ghostshield Siloxa-Tek 8500',
    surface: 'Concrete / Masonry — Natural Look',
    price: '~$69.88/gal',
    bestFor: 'Concrete driveways, masonry, block walls, retaining walls',
    notes: 'Penetrating silane/siloxane. Keeps natural look. Good after cleaning/restoration.',
    purchaseUrl: 'https://www.homedepot.com/p/Foundation-Armor-1-gal-Penetrating-Water-Based-Silane-Siloxane-Concrete-Sealer-Brick-Sealer-and-Masonry-Water-Repellent-SX5000WB1GAL/205719732',
  },
  {
    name: 'Foundation Armor AR350',
    surface: 'Concrete — Wet Look',
    price: 'Available at Home Depot (1-gal category)',
    bestFor: 'Decorative concrete, stamped concrete, older faded pavers/concrete',
    notes: 'Solvent-based acrylic wet-look. Good for appearance. Consider grit additive on walking surfaces — slippery risk.',
    purchaseUrl: 'https://www.homedepot.com/b/Paint-Concrete-Coatings-Concrete-Sealers/Foundation-Armor/1-Gallon/N-5yc1vZcj9bZen6Z1z1dquo',
  },
  {
    name: 'Miracle Sealants 511 Impregnator',
    surface: 'Natural Stone / Tile / Travertine',
    price: 'Available on Amazon',
    bestFor: 'Travertine pool decks, stone patios, tile, porous stone, marble/granite areas',
    notes: 'Use a stone-safe penetrating sealer. Do NOT use paver sealer on natural stone. Always test for darkening, hazing, or slipperiness.',
    purchaseUrl: 'https://www.amazon.com/Miracle-Sealants-511GAL4-Impregnator-Penetrating/dp/B00IPO6GEM',
  },
  {
    name: 'Rain Guard Stucco Sealer',
    surface: 'Stucco',
    price: '~$20/gal · ~$36.85/32oz concentrate (makes 5 gal)',
    bestFor: 'Bare stucco, cement plaster, unpainted stucco protection',
    notes: 'Great add-on after soft washing stucco. Dries invisible. Avoid sealing dirty or chalky surfaces.',
    purchaseUrl: 'https://www.homedepot.com/p/RAIN-GUARD-1-Gal-Stucco-Sealer-Premium-Clear-Waterproofer-SP-7004/300750995',
  },
  {
    name: 'Ready Seal Exterior Wood Stain & Sealer',
    surface: 'Wood — Stained Finish',
    price: '~$39.99–$42.57/gal · $171–$199/5gal',
    bestFor: 'Fences, decks, pergolas, wood siding, pressure-treated wood',
    notes: 'Strong NMD upsell after fence/deck washing and oxalic brightening. Wood must be fully dry before application.',
    purchaseUrl: 'https://www.homedepot.com/p/Ready-Seal-5-Gal-Burnt-Hickory-Exterior-Wood-Stain-and-Sealer-545/305311421',
  },
  {
    name: 'Thompson\'s WaterSeal / Olympic Clear Sealer',
    surface: 'Wood — Clear',
    price: '~$38–$40/gal (Home Depot)',
    bestFor: 'Basic fence/deck waterproofing, budget protection option',
    notes: 'Clear sealers protect but do not hide aging like semi-transparent or solid stain.',
    purchaseUrl: 'https://www.homedepot.com/b/Paint-Exterior-Wood-Coatings-Exterior-Wood-Sealers/Thompsons-WaterSeal/N-5yc1vZaquxZ6ss',
  },
  {
    name: 'Kool Seal / SurfaceLogix Roof Clear',
    surface: 'Cement / Barrel Tile Roof',
    price: 'Contact supplier for pricing',
    bestFor: 'Cement tile roofs, barrel tile, concrete roof tiles after soft wash',
    notes: '100% clear acrylic sealer. Specialty upsell. Check roof warranties, tile condition, and local licensing before offering.',
    purchaseUrl: 'https://surfacelogix.net/products/roof-clear',
  },
  {
    name: 'Henry 887 Tropi-Cool / Lanco Siliconizer 1000',
    surface: 'Flat / Metal Roof Coating',
    price: '~$298–$369/4.75–5gal',
    bestFor: 'Metal roofs, low-slope roofs, RV/mobile structures, commercial waterproofing',
    notes: 'Silicone or elastomeric roof coating. More roofing/coating work than pressure washing. Only offer if comfortable with prep, warranty terms, and liability.',
    purchaseUrl: 'https://www.homedepot.com/b/Building-Materials-Roofing-Commercial-Roofing-Roof-Coatings/N-5yc1vZaqu6',
  },
  {
    name: 'Gardner Metal-X Metal Roof Coating',
    surface: 'Metal Roof',
    price: '~$149.81/5gal (Home Depot)',
    bestFor: 'Metal roofs, panels, outbuildings, barns, commercial metal roofing',
    notes: 'Surface prep is everything. Rust must be addressed before coating.',
    purchaseUrl: 'https://www.homedepot.com/p/Gardner-5-Gal-Metal-X-Metal-Roof-Acrylic-Coating-SK-8055/203856114',
  },
  {
    name: 'Glaze \'N Seal Multi-Purpose Waterproofing',
    surface: 'Multi-Surface',
    price: '~$197.76/5gal (up to 300 sq ft/gal)',
    bestFor: 'Concrete, natural stone, masonry, patios, walkways',
    notes: 'Good general category. Always match the product to the exact surface type.',
    purchaseUrl: 'https://www.homedepot.com/p/Glaze-N-Seal-5-gal-Multi-Purpose-Waterproofing-Sealer-134/301316643',
  },
  {
    name: 'SX5000 WB / Siloxa-Tek 8500 + Anti-Slip Additive',
    surface: 'Pool Decks / Slip Areas',
    price: '~$65–$70/gal',
    bestFor: 'Pool decks, patios, walkways, entries where safety is critical',
    notes: 'Avoid high-gloss slick finishes without adding traction. Pool decks need safety-first recommendations.',
    purchaseUrl: 'https://www.homedepot.com/p/Foundation-Armor-1-gal-Penetrating-Water-Based-Silane-Siloxane-Concrete-Sealer-Brick-Sealer-and-Masonry-Water-Repellent-SX5000WB1GAL/205719732',
  },
  {
    name: 'Trident CAT 5 / Acrylic Coating',
    surface: 'Commercial Concrete',
    price: 'Contact supplier',
    bestFor: 'Restaurants, drive-throughs, dumpster pads, storefront concrete',
    notes: 'No sealer makes concrete bulletproof against hot oil, brake fluid, gas, or caustics. Set correct expectations.',
    purchaseUrl: 'https://softwashdepot.com/products/trident-hurricane-cat-5-full-kit',
  },
]

const CATEGORIES = ['All', 'Organic Growth', 'Degreaser', 'Rust & Mineral', 'Wood Restoration', 'Masonry', 'Surfactant', 'Maintenance', 'Specialty', 'Testing', 'Sealer / Coating']

const SEALER_SURFACES = ['All', 'Pavers — Wet Look', 'Pavers — Premium', 'Pavers / Concrete — Budget Wet Look', 'Concrete / Brick — Natural Look', 'Concrete / Masonry — Natural Look', 'Concrete — Wet Look', 'Natural Stone / Tile / Travertine', 'Stucco', 'Wood — Stained Finish', 'Wood — Clear', 'Cement / Barrel Tile Roof', 'Flat / Metal Roof Coating', 'Metal Roof', 'Multi-Surface', 'Pool Decks / Slip Areas', 'Commercial Concrete']

// ── Category colors: aligned to the confirmed status palette where the meaning
// genuinely overlaps (Rust & Mineral = danger, Degreaser = warning, Organic
// Growth = success, Surfactant = info, Maintenance = purple, Testing = neutral).
// Categories with no confirmed-system equivalent keep distinct bespoke colors
// in the same soft-pastel style so they stay visually distinguishable.
const CATEGORY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Organic Growth':   { bg: '#F0FDF9', color: '#059669', border: '#A7F3D0' },
  'Degreaser':         { bg: '#FEF9C3', color: '#92400E', border: '#FDE68A' },
  'Rust & Mineral':    { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
  'Wood Restoration':  { bg: '#FEF8EE', color: '#8B4513', border: '#F5D8A0' },
  'Masonry':           { bg: '#F0F4FF', color: '#2D4AA3', border: '#B0C0F0' },
  'Surfactant':        { bg: '#EFF6FF', color: '#1D4ED8', border: '#93C5FD' },
  'Maintenance':       { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
  'Specialty':         { bg: '#FFF0F8', color: '#8B2D6B', border: '#F5A0D8' },
  'Testing':           { bg: '#F8FAF9', color: '#6B7280', border: '#E5E7EB' },
  'Sealer / Coating':  { bg: '#F0FDF9', color: '#0F766E', border: '#A7F3D0' },
}

export default function EmployeeChemicalsPage() {
  const [tab, setTab] = useState<'chemicals' | 'sealers'>('chemicals')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filteredChemicals = CHEMICALS.filter(c => {
    const matchSearch = `${c.name} ${c.useCases} ${c.category}`.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || c.category === category
    return matchSearch && matchCat
  })

  const filteredSealers = SEALERS.filter(s => {
    const matchSearch = `${s.name} ${s.bestFor} ${s.surface} ${s.notes}`.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || s.surface === category
    return matchSearch && matchCat
  })

  return (
    <PortalShell requiredRole="employee">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>Employee Portal</div>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 6 }}>Chemicals & Sealers</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Reference guide for all NMD chemicals and sealers. Tap any item to see full details and purchase link.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
        {(['chemicals', 'sealers'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setCategory('All'); setSearch('') }}
            style={{ padding: '0.55rem 1.25rem', borderRadius: 8, border: `1px solid ${tab === t ? '#0F766E' : '#E5E7EB'}`, background: tab === t ? '#0F766E' : 'white', color: tab === t ? 'white' : '#6B7280', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', textTransform: 'capitalize' }}>
            {t === 'chemicals' ? `🧪 Chemicals (${CHEMICALS.length})` : `🛡️ Sealers (${SEALERS.length})`}
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={tab === 'chemicals' ? 'Search chemicals...' : 'Search sealers...'}
          style={{ flex: 1, minWidth: 200, padding: '0.6rem 0.9rem', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', color: '#111827', background: 'white', outline: 'none' }}
        />
        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ padding: '0.6rem 0.9rem', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', color: '#111827', background: 'white', outline: 'none' }}>
          {(tab === 'chemicals' ? CATEGORIES.filter(c => c === 'All' || CHEMICALS.some(ch => ch.category === c)) : ['All', ...SEALER_SURFACES.filter(s => s !== 'All')]).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginBottom: '0.75rem', fontWeight: 500 }}>
        Showing {tab === 'chemicals' ? filteredChemicals.length : filteredSealers.length} {tab === 'chemicals' ? 'chemicals' : 'sealers'}
        {search && ` matching "${search}"`}
      </div>

      {/* Chemicals list */}
      {tab === 'chemicals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredChemicals.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
              No chemicals found matching your search.
            </div>
          ) : filteredChemicals.map(chem => {
            const catStyle = CATEGORY_COLORS[chem.category] || { bg: '#F8FAF9', color: '#6B7280', border: '#E5E7EB' }
            const isOpen = expanded === chem.name
            return (
              <div key={chem.name} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                <div onClick={() => setExpanded(isOpen ? null : chem.name)}
                  style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{chem.name}</span>
                      {chem.caution && <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>⚠️ Caution</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}>
                        {chem.category}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{chem.price}</span>
                    </div>
                  </div>
                  <span style={{ color: '#9CA3AF', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
                {isOpen && (
                  <div style={{ borderTop: '1px solid #E5E7EB', padding: '1rem 1.25rem', background: '#F8FAF9', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 4 }}>Use Cases</div>
                      <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{chem.useCases}</div>
                    </div>
                    {chem.caution && (
                      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '0.65rem 0.9rem', fontSize: '0.82rem', color: '#B91C1C', lineHeight: 1.5 }}>
                        ⚠️ <strong>Caution:</strong> {chem.caution}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 4 }}>Current Price Reference</div>
                      <div style={{ fontSize: '0.875rem', color: '#374151' }}>{chem.price}</div>
                    </div>
                    <a href={chem.purchaseUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', borderRadius: 8, background: '#0F766E', color: 'white', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none', alignSelf: 'flex-start' }}>
                      🛒 Purchase / View Product →
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Sealers list */}
      {tab === 'sealers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredSealers.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
              No sealers found matching your search.
            </div>
          ) : filteredSealers.map(sealer => {
            const isOpen = expanded === sealer.name
            return (
              <div key={sealer.name} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                <div onClick={() => setExpanded(isOpen ? null : sealer.name)}
                  style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827', marginBottom: 4 }}>{sealer.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#F0FDF9', color: '#0F766E', border: '1px solid #A7F3D0' }}>
                        {sealer.surface}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{sealer.price}</span>
                    </div>
                  </div>
                  <span style={{ color: '#9CA3AF', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
                {isOpen && (
                  <div style={{ borderTop: '1px solid #E5E7EB', padding: '1rem 1.25rem', background: '#F8FAF9', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 4 }}>Best For</div>
                      <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{sealer.bestFor}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 4 }}>Notes</div>
                      <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{sealer.notes}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 4 }}>Price Reference</div>
                      <div style={{ fontSize: '0.875rem', color: '#374151' }}>{sealer.price}</div>
                    </div>
                    <a href={sealer.purchaseUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', borderRadius: 8, background: '#0F766E', color: 'white', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none', alignSelf: 'flex-start' }}>
                      🛒 Purchase / View Product →
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </PortalShell>
  )
}