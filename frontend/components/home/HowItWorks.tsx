const steps = [
  { step: "01", title: "Choose Your Service", desc: "Pick Meal Box, Delivery Box, or Full Catering based on your event size." },
  { step: "02", title: "Customize Menu", desc: "Select dishes from starters, mains, breads, and desserts. Set your guest count." },
  { step: "03", title: "Schedule & Pay", desc: "Pick your event date, delivery address, and complete payment securely via Razorpay." },
  { step: "04", title: "Track & Enjoy", desc: "Get real-time updates from kitchen to delivery. Sit back and enjoy your event." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gray-50 py-16">
      <div className="container-app">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">How It Works</h2>
          <p className="text-gray-500">From menu to delivery in 4 simple steps</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div key={s.step} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-3xl font-black text-brand-200 mb-3">{s.step}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
