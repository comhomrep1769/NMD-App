'use client'

import { useState } from 'react'

const CATEGORIES = ['Residential', 'Commercial', 'Industrial', 'Specialty', 'Seasonal'] as const
type Category = typeof CATEGORIES[number]

const SERVICES: Record<Category, string[]> = {
  Residential: [
    'House Washing', 'Roof Cleaning', 'Driveway Cleaning', 'Sidewalk Cleaning',
    'Walkway Cleaning', 'Patio Cleaning', 'Pool Deck Cleaning', 'Pool Cage & Screen Enclosure',
    'Deck Cleaning', 'Deck Restoration', 'Fence Cleaning', 'Fence Restoration',
    'Vinyl Fence Cleaning', 'Wood Fence Cleaning', 'Paver Cleaning', 'Paver Sanding',
    'Paver Sealing', 'Gutter Cleaning', 'Exterior Window Cleaning', 'Garage Floor Cleaning',
    'Rust Stain Removal', 'Oil Stain Removal', 'Mold & Mildew Removal', 'Algae Removal',
    'Oxidation Removal', 'Soft Washing', 'Stucco Cleaning', 'Brick Cleaning',
    'Concrete Cleaning', 'Natural Stone Cleaning', 'Outdoor Furniture Cleaning',
    'Lanai Cleaning', 'Screen Cleaning', 'Awning Cleaning', 'Dumpster Area Cleaning',
    'Trash Can & Bin Cleaning', 'Solar Panel Cleaning', 'Playground Equipment Cleaning',
    'HOA Community Cleaning', 'Entryway Cleaning', 'Retaining Wall Cleaning',
    'Surface Prep Before Painting',
  ],
  Commercial: [
    'Storefront Cleaning', 'Exterior Building Washing', 'Shopping Center Cleaning',
    'Restaurant Exterior Cleaning', 'Restaurant Patio Cleaning', 'Drive-Thru Cleaning',
    'Gas Station Cleaning', 'Sidewalk & Walkway Pressure Washing', 'Parking Lot Cleaning',
    'Parking Garage Cleaning', 'Dumpster Pad Cleaning', 'Dumpster Washing (Recurring)', 'Graffiti Removal', 'Gum Removal',
    'Apartment Complex Washing', 'Condo Community Cleaning', 'HOA Property Maintenance',
    'Hotel & Hospitality Cleaning', 'Office Building Cleaning', 'Fleet Washing',
    'Commercial Roof Cleaning', 'Heavy Foot-Traffic Area Cleaning', 'Loading Dock Cleaning',
    'Warehouse Exterior Cleaning', 'Sign Cleaning', 'Awning Cleaning',
    'Outdoor Dining Area Cleaning', 'Public Restroom Cleaning', 'Portable Restroom Cleaning',
    'Event Cleanup Services', 'Property Management Programs',
  ],
  Industrial: [
    'Heavy Equipment Cleaning', 'Construction Equipment Cleaning', 'Fleet Vehicle Washing',
    'Trailer Washing', 'Warehouse Floor Cleaning', 'Factory Floor Cleaning',
    'Industrial Degreasing', 'Oil & Grease Removal', 'Loading Dock Cleaning',
    'Storage Tank Cleaning', 'Silo Cleaning', 'Concrete Pad Cleaning',
    'Industrial Surface Restoration', 'Machinery Exterior Cleaning',
    'Industrial Building Washing', 'Equipment Pad Cleaning', 'Large Flatwork Cleaning',
    'Fuel Island Cleaning', 'Dumpster Washing (Recurring)',
  ],
  Specialty: [
    'Rust Removal & Restoration', 'Oxidation Removal', 'Efflorescence Removal',
    'Calcium & Mineral Deposit Removal', 'Oil Stain Treatment', 'Tire Mark Removal',
    'Graffiti Removal', 'Paint Removal Preparation', 'Surface Prep for Coatings',
    'Wood Brightening', 'Wood Restoration', 'Paver Restoration', 'Concrete Brightening',
    'Mold Remediation Exterior', 'Smoke & Soot Cleanup', 'Post-Construction Cleanup',
    'Soft Wash Chemical Treatments', 'Specialty Stain Removal',
    'Roof Moss Removal', 'Algae Treatment Programs',
  ],
  Seasonal: [
    'Holiday Light Installation', 'Holiday Light Removal', 'Seasonal Cleanup Services',
    'Storm Cleanup Washing', 'Pre-Sale Property Cleaning', 'Open House Exterior Cleaning',
    'Move-In / Move-Out Cleaning', 'Recurring Maintenance Plans',
    'Monthly Trash Bin Cleaning', 'Quarterly Property Wash Programs',
    'Annual Property Maintenance Packages',
  ],
}

const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  Residential: 'Specialized cleaning for homes, driveways, roofs, decks, and all outdoor living spaces — protecting your biggest investment.',
  Commercial: 'Maintain professional curb appeal for your business exterior, parking areas, storefronts, and commercial facilities.',
  Industrial: 'Heavy-duty cleaning solutions for industrial facilities, equipment, large surfaces, and high-grease environments.',
  Specialty: 'Expert restoration and treatment for challenging stains, weathered surfaces, and specialized cleaning requirements.',
  Seasonal: 'Targeted seasonal cleaning packages to protect and maintain your property through every Central Florida season.',
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-teal-600">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

const PREVIEW_COUNT = 9

export default function ServicesSection() {
  const [active, setActive] = useState<Category>('Residential')
  const [expanded, setExpanded] = useState(false)

  const services = SERVICES[active]
  const visibleServices = expanded ? services : services.slice(0, PREVIEW_COUNT)
  const hasMore = services.length > PREVIEW_COUNT

  const handleCategoryChange = (cat: Category) => {
    setActive(cat)
    setExpanded(false)
  }

  return (
    <section className="bg-white py-20" id="services">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-[65px]">
        <div className="mb-10 flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-teal-700">Services</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Every Surface, Every Property Type
            </h2>
            <p className="max-w-[560px] text-base leading-relaxed text-gray-500">
              From residential driveways to industrial equipment &mdash; certified
              technicians covering every surface across Central Florida.
            </p>
          </div>
          
            href="/client/request-service"
            className="flex-shrink-0 rounded-lg border border-teal-700 px-5 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50"
          >
            View All Services
          </a>
        </div>

        <div className="mb-8 flex flex-wrap gap-x-8 border-b border-gray-200">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={
                active === cat
                  ? 'border-b-2 border-teal-700 pb-3 text-sm font-semibold text-teal-700'
                  : 'border-b-2 border-transparent pb-3 text-sm font-medium text-gray-500 hover:text-gray-700'
              }
            >
              {cat === 'Specialty' ? 'Specialty & Restoration' : cat}
            </button>
          ))}
        </div>

        <p className="mb-7 max-w-2xl text-[15px] leading-relaxed text-gray-500">{CATEGORY_DESCRIPTIONS[active]}</p>

        <div className="grid-services grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 sm:gap-x-10">
          {visibleServices.map((s) => (
            <div key={s} className="flex items-center gap-2.5 border-b border-gray-100 py-2.5">
              <CheckIcon />
              <span className="text-sm text-gray-700">{s}</span>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setExpanded(e => !e)}
              className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-5 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-100"
            >
              {expanded
                ? 'Show less ↑'
                : `Show all ${services.length} services ↓`}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
