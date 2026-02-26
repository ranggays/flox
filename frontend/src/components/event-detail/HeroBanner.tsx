import type { EventDetail } from "@/lib/types";

interface HeroBannerProps {
  event: EventDetail;
}

export default function HeroBanner({ event }: HeroBannerProps) {
  return (
    <section className="relative px-6 py-8 md:py-12">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800 relative group">
        {/* Background image */}
        <div
          className="aspect-21/9 w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url('${event.heroImageUrl}')` }}
          role="img"
          aria-label={event.heroImageAlt}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            {/* Status badge */}
            <div className="mb-4 inline-flex items-center rounded-full bg-[#5048e5]/20 border border-[#5048e5]/30 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm">
              {event.status}
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
              {event.title}
            </h1>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-6 text-slate-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5048e5]">
                  calendar_today
                </span>
                <span className="text-sm md:text-base font-medium">
                  {event.dateRange}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5048e5]">
                  schedule
                </span>
                <span className="text-sm md:text-base font-medium">
                  {event.time}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5048e5]">
                  location_on
                </span>
                <span className="text-sm md:text-base font-medium">
                  {event.location}
                </span>
              </div>
            </div>
          </div>

          {/* View Lineup CTA */}
          <button className="flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-8 text-slate-900 font-bold hover:bg-slate-100 transition-colors shrink-0">
            <span className="material-symbols-outlined">play_circle</span>
            View Lineup
          </button>
        </div>
      </div>
    </section>
  );
}