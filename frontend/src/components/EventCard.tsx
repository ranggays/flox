import Link from "next/link";

interface EventCardProps {
  event: any; 
}

const CATEGORY_LABELS: Record<string, string> = {
  music: "Music",
  conference: "Conference",
  sports: "Sports",
  art: "Art",
  other: "Other",
};

export default function EventCard({ event }: EventCardProps) {
  const getCategory = (catObj: any) => {
    if (!catObj) return "Other";
    const key = Object.keys(catObj)[0]; 
    return CATEGORY_LABELS[key] || "Event";
  };

  const formattedDate = new Date(event.startTime * 1000).toLocaleDateString("en-US", {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });

  const now = Math.floor(Date.now() / 1000);
  let badgeText = null;
  if (event.status?.cancelled) badgeText = "Cancelled";
  else if (now > event.endTime) badgeText = "Ended";
  else if (now < event.startTime) badgeText = "Upcoming";

  return (
    <Link
      href={`/events/${event.id}`} 
      className="group block border border-slate-200 dark:border-white/10 bg-white dark:bg-black rounded-xl overflow-hidden hover:border-[#5048e5]/30 dark:hover:border-white/20 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-white/5 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={event.imageUri || "/placeholder.jpg"} 
          alt={event.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 bg-slate-100 dark:bg-slate-800"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          {badgeText && (
            <div className={`px-2.5 py-1 rounded-full border border-white/20 backdrop-blur-sm ${
              badgeText === 'Cancelled' ? 'bg-red-500/80' : 
              badgeText === 'Ended' ? 'bg-slate-500/80' : 'bg-[#5048e5]/80'
            }`}>
              <span className="text-[10px] font-bold text-white">{badgeText}</span>
            </div>
          )}
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-xl font-bold text-white leading-tight drop-shadow-md truncate">
            {event.name}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Meta */}
        <div className="flex flex-col gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{event.location}</span>
            {event.eventType?.virtual && (
              <span className="text-[10px] border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 text-slate-400 ml-auto shrink-0 uppercase tracking-widest">
                Virtual
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-white/5" />

        {/* Price + CTA */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
              Available Tickets
            </p>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {event.available || 0}{" "}
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono">
                LEFT
              </span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#5048e5] text-white text-xs font-bold hover:bg-[#5048e5]/90 transition-colors">
            {badgeText === 'Ended' || badgeText === 'Cancelled' ? 'View Details' : 'Buy Tickets'}
            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}