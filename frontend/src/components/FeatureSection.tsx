const features = [
  {
    icon: (
      <svg className="w-7 h-7 text-slate-700 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Secure & Transparent",
    description: "All tickets are minted on the blockchain, ensuring authenticity and preventing fraud with immutable records.",
  },
  {
    icon: (
      <svg className="w-7 h-7 text-slate-700 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Instant Delivery",
    description: "Receive your ticket immediately after purchase confirmation on the blockchain — no waiting, no intermediaries.",
  },
  {
    icon: (
      <svg className="w-7 h-7 text-slate-700 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Easy Check-in",
    description: "Simple QR code verification system for seamless event entry. Validators scan your ticket on-site in seconds.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-white dark:bg-black py-24 border-t border-slate-100 dark:border-white/5">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-3">
            Why Flox?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            The most secure and transparent Web3 ticketing platform, built for the next generation of events.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map(({ icon, title, description }) => (
            <div
              key={title}
              className="group border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3 p-8 rounded-xl hover:border-[#5048e5]/30 dark:hover:border-white/20 hover:shadow-md dark:hover:shadow-white/5 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 flex items-center justify-center mb-6 group-hover:border-[#5048e5]/30 dark:group-hover:border-white/20 transition-colors">
                {icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}