const steps = [
  {
    step: "01",
    title: "Choose Your Service",
    desc: "Pick Meal Box, Delivery Box, or Full Catering based on your event size and budget.",
    emoji: "🎯",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    step: "02",
    title: "Customise Your Menu",
    desc: "Select dishes from starters, mains, breads, and desserts. Set your exact guest count.",
    emoji: "🍽️",
    gradient: "from-amber-500 to-yellow-500",
  },
  {
    step: "03",
    title: "Schedule & Pay",
    desc: "Pick your event date and delivery address, then pay securely via Razorpay.",
    emoji: "📅",
    gradient: "from-brand-500 to-orange-500",
  },
  {
    step: "04",
    title: "Track & Enjoy",
    desc: "Get real-time updates from kitchen to delivery. Sit back and enjoy your event.",
    emoji: "🎉",
    gradient: "from-rose-500 to-pink-500",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="container-app">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            From Menu to Delivery in{" "}
            <span className="bg-gradient-to-r from-brand-500 to-orange-500 bg-clip-text text-transparent">4 Steps</span>
          </h2>
          <p className="text-gray-500 max-w-sm mx-auto">Simple, transparent, and hassle-free — every time.</p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-orange-300 via-brand-400 to-rose-300" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.step}
                className="relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center text-center">

                {/* Step circle */}
                <div className={`relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br ${s.gradient} flex flex-col items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-[10px] font-black text-white/70 tracking-wider">{s.step}</span>
                </div>

                {/* Step number badge */}
                <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-white border-2 border-gray-100 shadow flex items-center justify-center text-xs font-black text-gray-400">
                  {i + 1}
                </div>

                <h3 className="font-bold text-gray-900 text-base mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
