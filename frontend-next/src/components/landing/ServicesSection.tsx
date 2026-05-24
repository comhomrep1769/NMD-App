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

export default function ServicesSection() {
  const [active, setActive] = useState<Category>('Residential')
  const services = SERVICES[active]

  return (
    <section className="nmd-section-full" id="services">
      <div className="nmd-section-inner">
        <div className="nmd-section-header">
          <p className="nmd-section-eyebrow">What we do</p>
          <h2 className="nmd-section-title">
            Every surface. Every property type.
          </h2>
          <p className="nmd-section-sub">
            From single-family homes to industrial facilities — if it needs cleaning,
            we have a process for it. Serving Brevard &amp; Orange County, FL.
          </p>
        </div>

        <div className="nmd-services-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`nmd-tab${active === cat ? ' active' : ''}`}
              onClick={() => setActive(cat)}
            >
              {cat === 'Specialty' ? 'Specialty & Restoration' : cat}
            </button>
          ))}
        </div>

        <div className="nmd-services-grid">
          {services.map((s) => (
            <div key={s} className="nmd-service-chip">
              <span className="nmd-service-chip-dot" />
              {s}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <a href="/client/request-service" className="btn-primary btn-lg">
            Request a Service →
          </a>
        </div>
      </div>
    </section>
  )
}