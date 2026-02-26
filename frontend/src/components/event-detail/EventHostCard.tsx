import { EventHost } from "@/lib/types";

interface EventHostCardProps {
  host: EventHost;
}

export default function EventHostCard({ host }: EventHostCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sticky top-24">
      <h4 className="font-bold text-slate-900 dark:text-white mb-4">
        Event Host
      </h4>

      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 rounded-full bg-linear-to-tr from-[#5048e5] to-purple-400 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {host.initial}
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-white">
            {host.name}
          </p>
          <p className="text-xs text-slate-500">{host.subtitle}</p>
        </div>
      </div>

      <button className="w-full rounded-lg border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mb-3 text-slate-900 dark:text-white">
        Follow Organizer
      </button>
      <button className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 py-2.5 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-white">
        Contact Support
      </button>
    </div>
  );
}