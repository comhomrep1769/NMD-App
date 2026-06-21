const TRUST_ITEMS: [string, string][] = [
  ['✅', 'Licensed & Insured'],
  ['🏠', 'Residential & Commercial'],
  ['🔬', 'Soft Wash Specialists'],
  ['📍', 'Orlando & Orange County — Primary'],
  ['📍', 'Brevard County'],
  ['🔄', '20% Recurring Discount'],
]

export default function TrustBadges() {
  return (
    <div className="border-y border-gray-200 bg-white px-6 py-6 sm:px-10">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-center gap-8">
        {TRUST_ITEMS.map(([icon, label]) => (
          <div key={label} className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-gray-600">
            <span>{icon}</span>
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}