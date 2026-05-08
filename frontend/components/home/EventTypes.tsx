import Link from "next/link";

const events = [
  { name: "Birthday", emoji: "🎂" },
  { name: "Wedding", emoji: "💍" },
  { name: "Corporate", emoji: "💼" },
  { name: "Sangeet", emoji: "🎶" },
  { name: "Farmhouse Party", emoji: "🏡" },
  { name: "Tea Party", emoji: "☕" },
  { name: "Family Reunion", emoji: "👨‍👩‍👧‍👦" },
  { name: "Other", emoji: "🎉" },
];

export default function EventTypes() {
  return (
    <section className="container-app py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Every Occasion, Covered</h2>
        <p className="text-gray-500">We cater for all types of events</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {events.map((e) => (
          <Link
            key={e.name}
            href={`/menu?event=${encodeURIComponent(e.name)}`}
            className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-2xl py-6 hover:border-brand-300 hover:shadow-sm transition-all group"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">{e.emoji}</span>
            <span className="text-sm font-medium text-gray-700">{e.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
