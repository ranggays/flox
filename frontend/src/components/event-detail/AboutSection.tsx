import { EventDetail } from "@/lib/types";
import EventHostCard from "@/components/event-detail/EventHostCard";

interface AboutSectionProps {
  event: EventDetail;
}

export default function AboutSection({ event }: AboutSectionProps) {
  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left: About content */}
          <div className="lg:w-2/3">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
              <span className="material-symbols-outlined text-[#5048e5]">
                info
              </span>
              About the Event
            </h3>

            <div className="space-y-4 mb-8">
              {event.description.map((para, i) => (
                <p
                  key={i}
                  className="text-lg leading-relaxed text-slate-600 dark:text-slate-400"
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Feature highlight cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {event.features?.map((feat) => (
                <div
                  key={feat.title}
                  className="bg-[#5048e5]/5 p-4 rounded-lg border border-[#5048e5]/10"
                >
                  <span className="material-symbols-outlined text-[#5048e5] mb-2 block">
                    {feat.icon}
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                    {feat.title}
                  </h4>
                  <p className="text-sm text-slate-500">{feat.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Host card */}
          <div className="lg:w-1/3">
            <EventHostCard host={event.host} />
          </div>
        </div>
      </div>
    </section>
  );
}