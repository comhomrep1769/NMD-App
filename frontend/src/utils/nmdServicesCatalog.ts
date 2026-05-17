export type NmdServiceCategoryKey = "residential" | "commercial" | "industrial";

export type NmdServiceItem = {
  id: string;
  title: string;
  category: NmdServiceCategoryKey;
  shortDescription: string;
  fullDescription: string;
  keywords: string[];
  commonTreatments: string[];
  photoHelpful: boolean;
  estimateNotes: string;
};

export type NmdServiceCategory = {
  key: NmdServiceCategoryKey;
  title: string;
  subtitle: string;
  description: string;
};

export const nmdServiceCategories: NmdServiceCategory[] = [
  {
    key: "residential",
    title: "Residential Services",
    subtitle: "Home exterior cleaning, curb appeal, and property protection.",
    description:
      "Residential pressure washing and soft washing services for homes, driveways, roofs, patios, pool cages, pavers, gutters, and more."
  },
  {
    key: "commercial",
    title: "Commercial Services",
    subtitle: "Cleaner storefronts, walkways, drive-thrus, and managed properties.",
    description:
      "Commercial exterior cleaning for businesses, restaurants, retail centers, property managers, HOAs, and recurring maintenance programs."
  },
  {
    key: "industrial",
    title: "Industrial Services",
    subtitle: "Heavy-duty cleaning for equipment, facilities, docks, and fleets.",
    description:
      "Industrial cleaning services for heavy equipment, warehouse floors, loading docks, tanks, silos, fleet vehicles, and construction equipment."
  }
];

export const nmdServicesCatalog: NmdServiceItem[] = [
  {
    id: "house-washing",
    title: "House Washing",
    category: "residential",
    shortDescription: "Soft washing exterior walls and siding to remove mildew and restore curb appeal.",
    fullDescription:
      "Soft washing exterior walls and siding including vinyl, stucco, wood, and brick to remove mildew, algae, organic growth, and surface dirt while protecting the exterior finish.",
    keywords: ["house", "siding", "vinyl", "stucco", "wood", "brick", "mildew", "algae"],
    commonTreatments: ["Standard House Wash", "Oxidation-Sensitive Siding Wash", "Plant Protection"],
    photoHelpful: true,
    estimateNotes:
      "Photos of all sides of the home, height, access limitations, oxidation, and heavy growth help improve estimate accuracy."
  },
  {
    id: "roof-cleaning",
    title: "Roof Cleaning",
    category: "residential",
    shortDescription: "Low-pressure roof cleaning for black streaks, moss, and lichen.",
    fullDescription:
      "Low-pressure roof cleaning to remove black streaks, gloeocapsa magma, moss, lichen, and organic discoloration without damaging shingles, tile, or roof surfaces.",
    keywords: ["roof", "black streaks", "moss", "lichen", "tile", "shingles", "gloeocapsa"],
    commonTreatments: ["Roof Cleaning Soft Wash", "Plant Protection"],
    photoHelpful: true,
    estimateNotes:
      "Photos of roof pitch, staining, moss level, gutters, downspouts, landscaping, and safe access points are highly recommended."
  },
  {
    id: "driveway-sidewalk-cleaning",
    title: "Driveway & Sidewalk Cleaning",
    category: "residential",
    shortDescription: "Concrete and asphalt cleaning for oil, tire marks, dirt, and organic growth.",
    fullDescription:
      "Cleaning driveways, sidewalks, walkways, and hard surfaces to remove oil, tire marks, embedded dirt, mildew, algae, and general buildup from concrete and asphalt.",
    keywords: ["driveway", "sidewalk", "concrete", "asphalt", "oil", "tire marks", "flatwork"],
    commonTreatments: ["Concrete Surface Cleaning", "Rust Stain Removal"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show total surface area, stains, cracks, paint/coating, rust, oil, and water access."
  },
  {
    id: "patio-deck-cleaning",
    title: "Patio & Deck Cleaning",
    category: "residential",
    shortDescription: "Cleaning wood, composite, and stone patios/decks.",
    fullDescription:
      "Restoring wood decks, composite materials, stone patios, and exterior living areas by removing organic growth, soil, and buildup while preparing surfaces for staining or sealing where needed.",
    keywords: ["patio", "deck", "wood", "composite", "stone", "stain prep", "sealing prep"],
    commonTreatments: ["Wood Fence Cleaning", "Concrete Surface Cleaning", "Paver Cleaning"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show material type, condition, railings, furniture, access, staining, and whether sealing/staining is planned."
  },
  {
    id: "pool-cage-enclosure-washing",
    title: "Pool Cage & Enclosure Washing",
    category: "residential",
    shortDescription: "Cleaning aluminum and screen pool enclosures common in Central Florida.",
    fullDescription:
      "Clearing algae, salt deposits, dirt, and organic buildup from aluminum frames, screen enclosures, pool cages, and surrounding pool deck areas.",
    keywords: ["pool cage", "screen enclosure", "aluminum", "pool deck", "salt", "algae"],
    commonTreatments: ["Standard House Wash", "Pool-Safe Cleaning", "Plant Protection"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show screen condition, frame height, pool proximity, algae level, deck material, and access."
  },
  {
    id: "paver-cleaning-sealing",
    title: "Paver Cleaning & Sealing",
    category: "residential",
    shortDescription: "Deep cleaning pavers with sand and seal options.",
    fullDescription:
      "Deep cleaning brick pavers and concrete pavers followed by polymeric sanding, sand and seal, or sealant application to protect against weeds, oil, water intrusion, and long-term staining.",
    keywords: ["pavers", "sand", "seal", "sealing", "polymeric sand", "weeds", "oil"],
    commonTreatments: ["Paver Cleaning", "Rust Stain Removal"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show total paver area, joint sand condition, weeds, oil stains, rust, previous sealer, and drainage."
  },
  {
    id: "gutter-cleaning",
    title: "Gutter Cleaning",
    category: "residential",
    shortDescription: "Clearing gutter debris and cleaning inside/outside gutter surfaces.",
    fullDescription:
      "Clearing debris from gutters and cleaning the inside and outside of gutters to ensure proper water flow, reduce overflow stains, and improve home exterior appearance.",
    keywords: ["gutters", "tiger stripes", "debris", "overflow", "water flow"],
    commonTreatments: ["Gutter Cleaning", "Oxidation-Sensitive Siding Wash"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show gutter height, staining, roofline access, debris level, downspouts, and landscaping near runoff areas."
  },
  {
    id: "storefront-building-washing",
    title: "Storefront & Exterior Building Washing",
    category: "commercial",
    shortDescription: "Maintaining retail, restaurant, and office building exteriors.",
    fullDescription:
      "Maintaining the clean appearance of retail shops, restaurants, offices, and commercial buildings through exterior washing, soft washing, and surface cleaning.",
    keywords: ["storefront", "building", "restaurant", "office", "retail", "commercial"],
    commonTreatments: ["Standard House Wash", "Concrete Surface Cleaning"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show building size, storefront glass, signage, awnings, sidewalk traffic areas, and staining."
  },
  {
    id: "parking-lot-garage-cleaning",
    title: "Parking Lot & Parking Garage Cleaning",
    category: "commercial",
    shortDescription: "Cleaning stalls, entryways, driving lanes, oil, gum, and traffic buildup.",
    fullDescription:
      "Removing oil, transmission fluid, chewing gum, tire marks, dirt, and grime from parking stalls, entryways, curbs, driving lanes, and parking garage surfaces.",
    keywords: ["parking lot", "parking garage", "oil", "gum", "traffic lanes", "curbs"],
    commonTreatments: ["Concrete Surface Cleaning", "Oil And Grease Stains On Concrete", "Gum Removal"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show square footage, stain types, traffic flow, water access, drainage, and night/weekend access needs."
  },
  {
    id: "dumpster-pad-cleaning",
    title: "Dumpster Pad Cleaning",
    category: "commercial",
    shortDescription: "Sanitizing waste areas and removing odor, grease, and buildup.",
    fullDescription:
      "Cleaning and sanitizing dumpster pads, waste areas, and commercial trash zones to remove grease, foul odors, bacterial buildup, food residue, and slippery grime.",
    keywords: ["dumpster pad", "waste area", "odor", "bacteria", "grease", "restaurant"],
    commonTreatments: ["Restaurant Degreasing", "Disinfecting Cleaner"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show pad size, grease level, drainage, dumpster access, water access, and food waste buildup."
  },
  {
    id: "sidewalk-walkway-commercial",
    title: "Sidewalk & Walkway Pressure Washing",
    category: "commercial",
    shortDescription: "High-traffic sidewalk and walkway cleaning.",
    fullDescription:
      "Cleaning high-traffic sidewalks, walkways, shopping center paths, office park walkways, and commercial concrete surfaces.",
    keywords: ["sidewalk", "walkway", "retail center", "office park", "commercial concrete"],
    commonTreatments: ["Concrete Surface Cleaning", "Gum Removal"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show length, width, traffic staining, gum, drainage, water access, and business hours."
  },
  {
    id: "drive-thru-cleaning",
    title: "Drive-Thru Cleaning",
    category: "commercial",
    shortDescription: "Cleaning spills, exhaust stains, and grime from drive-thru lanes.",
    fullDescription:
      "Removing spills, exhaust stains, oil, grease, grime, and high-traffic buildup from fast-food, coffee shop, and bank drive-thru lanes.",
    keywords: ["drive-thru", "fast food", "bank", "spills", "exhaust stains", "grease"],
    commonTreatments: ["Restaurant Degreasing", "Concrete Surface Cleaning"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show lane layout, stains, curbs, menu-board area, drainage, and best off-hours access."
  },
  {
    id: "graffiti-removal",
    title: "Graffiti Removal",
    category: "commercial",
    shortDescription: "Chemical-assisted graffiti removal from exterior surfaces.",
    fullDescription:
      "Promptly applying chemical agents and pressure washing methods to safely remove painted or spray-on graffiti from building facades, walls, concrete, brick, and other surfaces.",
    keywords: ["graffiti", "paint", "spray paint", "wall", "facade", "brick", "concrete"],
    commonTreatments: ["Graffiti Removal"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show graffiti size, surface material, paint type if known, previous coating, and surrounding sensitive surfaces."
  },
  {
    id: "property-management-hoa",
    title: "Property Management / HOA Maintenance",
    category: "commercial",
    shortDescription: "Scheduled exterior cleaning for communities and managed properties.",
    fullDescription:
      "Routine scheduled exterior cleaning programs for HOAs, property managers, apartment communities, and larger properties to keep sidewalks, buildings, amenities, and common areas compliant and clean.",
    keywords: ["HOA", "property management", "community", "maintenance", "recurring"],
    commonTreatments: ["Standard House Wash", "Concrete Surface Cleaning", "Paver Cleaning"],
    photoHelpful: true,
    estimateNotes:
      "Photos, property maps, unit counts, recurring frequency, and scope details are recommended."
  },
  {
    id: "heavy-equipment-cleaning",
    title: "Heavy Equipment Cleaning",
    category: "industrial",
    shortDescription: "Degreasing and cleaning machinery to reduce buildup and support maintenance.",
    fullDescription:
      "Degreasing and cleaning construction, agricultural, and industrial machinery to prevent mechanical issues, reduce grime buildup, improve inspections, and support compliance standards.",
    keywords: ["heavy equipment", "machinery", "construction", "agriculture", "degreasing"],
    commonTreatments: ["Commercial Degreaser", "Fleet Washing"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show equipment type, grease level, access, water source, runoff control, and number of machines."
  },
  {
    id: "warehouse-factory-floor-cleaning",
    title: "Warehouse & Factory Floor Cleaning",
    category: "industrial",
    shortDescription: "Cleaning large concrete floors with oils, forklift marks, and industrial dirt.",
    fullDescription:
      "Scrubbing and pressure washing large concrete floors to remove industrial oils, forklift tire marks, dust, grime, and heavy operational buildup.",
    keywords: ["warehouse", "factory", "floor", "forklift marks", "industrial oils"],
    commonTreatments: ["Concrete Surface Cleaning", "Restaurant Degreasing"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show square footage, stains, drains, equipment restrictions, operating hours, and water access."
  },
  {
    id: "loading-dock-cleaning",
    title: "Loading Dock Cleaning",
    category: "industrial",
    shortDescription: "Removing grease, hydraulic fluid, and debris from loading bays.",
    fullDescription:
      "Removing grease, hydraulic fluids, debris, tire marks, and buildup from high-traffic loading docks, shipping areas, and warehouse entry points.",
    keywords: ["loading dock", "hydraulic fluid", "shipping", "grease", "debris"],
    commonTreatments: ["Commercial Degreaser", "Concrete Surface Cleaning"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show dock size, fluid staining, drains, truck access, and safe work windows."
  },
  {
    id: "storage-tank-silo-cleaning",
    title: "Storage Tank & Silo Cleaning",
    category: "industrial",
    shortDescription: "High-access cleaning for tanks, silos, and containment units.",
    fullDescription:
      "High-access exterior cleaning and washing of large industrial containment units, storage tanks, silos, and related equipment surfaces.",
    keywords: ["tank", "silo", "containment", "high access", "industrial"],
    commonTreatments: ["Standard House Wash", "Commercial Degreaser"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show height, access points, surface material, staining, lift needs, and safety requirements."
  },
  {
    id: "fleet-washing",
    title: "Fleet Washing",
    category: "industrial",
    shortDescription: "Recurring washing for transport trucks, delivery vehicles, and fleets.",
    fullDescription:
      "Specialized recurring pressure washing and soft washing for transport trucks, delivery vehicles, corporate fleets, trailers, and service vehicles.",
    keywords: ["fleet", "trucks", "trailers", "delivery vehicles", "road film"],
    commonTreatments: ["Fleet Washing"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show vehicle types, count, wash location, water access, frequency, and road film severity."
  },
  {
    id: "construction-equipment-cleaning",
    title: "Construction Equipment Cleaning",
    category: "industrial",
    shortDescription: "Cleaning construction equipment, attachments, and job-site machinery.",
    fullDescription:
      "Cleaning construction equipment, attachments, trailers, and job-site machinery to remove mud, grease, concrete dust, grime, and heavy buildup.",
    keywords: ["construction equipment", "mud", "trailers", "attachments", "machinery"],
    commonTreatments: ["Heavy Equipment Cleaning", "Commercial Degreaser"],
    photoHelpful: true,
    estimateNotes:
      "Photos should show equipment count, mud/grease level, access, job-site rules, water source, and runoff requirements."
  }
];

export function getServicesByCategory(category: NmdServiceCategoryKey) {
  return nmdServicesCatalog.filter((service) => service.category === category);
}

export function searchNmdServices(search: string, category: NmdServiceCategoryKey | "all" = "all") {
  const value = search.trim().toLowerCase();

  return nmdServicesCatalog.filter((service) => {
    const matchesCategory = category === "all" || service.category === category;

    if (!value) return matchesCategory;

    const haystack = [
      service.title,
      service.shortDescription,
      service.fullDescription,
      service.category,
      service.keywords.join(" "),
      service.commonTreatments.join(" ")
    ]
      .join(" ")
      .toLowerCase();

    return matchesCategory && haystack.includes(value);
  });
}
