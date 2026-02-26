"use client";

interface DashboardStatsProps {
  events: any[];
}

export default function DashboardStats({ events }: DashboardStatsProps) {
  const totalEvents = events.length;

  const totalSold = events.reduce((acc, curr) => {
    if (curr.status === "Cancelled") return acc; 
    return acc + (curr.sold || 0);
  }, 0);

  const totalRevenue = events.reduce((acc, curr) => {
    if (curr.status === "Cancelled") return acc; 
    const numericRevenue = parseFloat(curr.revenue?.split(" ")[0]) || 0;
    return acc + numericRevenue;
  }, 0);

  const activeEvents = events.filter(
    (e) => e.status === "Upcoming" || e.status === "On Sale" || e.status === "Ongoing" || e.status === "Active"
  ).length;

  const stats = [
    {
      label: "Total Events",
      value: totalEvents.toString(),
      icon: "calendar_today",
    },
    {
      label: "Active Events",
      value: activeEvents.toString(),
      icon: "confirmation_number",
    },
    {
      label: "Tickets Sold",
      value: totalSold.toLocaleString(),
      icon: "group",
    },
    {
      label: "Total Revenue",
      value: `${totalRevenue.toFixed(2)} SOL`,
      icon: "payments",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {stats.map(({ icon, label, value }) => (
        <div
          key={label}
          className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-[#5048e5]/10 rounded-lg w-fit">
              <span className="material-symbols-outlined text-[#5048e5]">{icon}</span>
            </div>
            <div className="size-2 rounded-full bg-[#5048e5]/20 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}