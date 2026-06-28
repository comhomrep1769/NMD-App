function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-700">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
function HouseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-700">
      <path d="m3 9 9-7 9 7" />
      <path d="M9 22V12h6v10" />
      <path d="M5 10v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10" />
    </svg>
  )
}
function DropletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-700">
      <path d="M12 2.69s5.66 6.93 5.66 11.31a5.66 5.66 0 1 1-11.32 0c0-4.38 5.66-11.31 5.66-11.31Z" />
    </svg>
  )
}
function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
function RefreshIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M8 21H3v-5" />
    </svg>
  )
}

export default function TrustBadges() {
  return (
    <div className="border-y border-gray-200 bg-white px-3 py-4 sm:px-4">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <div className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium text-gray-700">
          <ShieldIcon /> Licensed &amp; Insured
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium text-gray-700">
          <HouseIcon /> Residential &amp; Commercial
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium text-gray-700">
          <DropletIcon /> Soft Wash Specialists
        </div>

        <span className="hidden h-4 w-px flex-shrink-0 bg-gray-200 sm:block" />

        <div className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600">
          <PinIcon /> Orlando &amp; Orange County &mdash; Primary
        </div>
        <div className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600">
          <PinIcon /> Brevard County
        </div>
        <div className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600">
          <RefreshIcon /> 20% Recurring Discount
        </div>
      </div>
    </div>
  )
}








