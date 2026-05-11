import Link from "next/link";

const events = [
  { name: "Birthday",       emoji: "🎂", gradient: "from-pink-400 to-rose-500",    bg: "bg-pink-50"   },
  { name: "Wedding",        emoji: "💍", gradient: "from-purple-400 to-violet-500", bg: "bg-purple-50" },
  { name: "Corporate",      emoji: "💼", gradient: "from-blue-400 to-indigo-500",   bg: "bg-blue-50"   },
  { name: "Sangeet",        emoji: "🎶", gradient: "from-fuchsia-400 to-pink-500",  bg: "bg-fuchsia-50"},
  { name: "Farmhouse Party",emoji: "🏡", gradient: "from-green-400 to-emerald-500", bg: "bg-green-50"  },
  { name: "Tea Party",      emoji: "☕", gradient: "from-amber-400 to-orange-500",  bg: "bg-amber-50"  },
  { name: "Family Reunion", emoji: "👨‍👩‍👧‍👦", gradient: "from-orange-400 to-red-500",   bg: "bg-orange-50" },
  { name: "Other",          emoji: "🎉", gradient: "from-brand-400 to-orange-500",  bg: "bg-brand-50"  },
];

export default function EventTypes() {
  return (
    <section className="py-20 bg-white">
      <div className="container-app">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
            Every Occasion
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            We Cater for{" "}
            <span className="bg-gradient-to-r from-brand-500 to-orange-500 bg-clip-text text-transparent">All Events</span>
          </h2>
          <p className="text-gray-500">From intimate gatherings to grand celebrations</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {events.map((e) => (
            <Link
              key={e.name}
              href={`/get-quote?event=${encodeURIComponent(e.name)}`}
              className={`group relative overflow-hidden flex flex-col items-center gap-3 ${e.bg} rounded-3xl py-7 px-4 border border-transparent hover:border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              {/* Gradient glow on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${e.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl`} />

              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${e.gradient} flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                <span className="text-2xl">{e.emoji}</span>
              </div>
              <span className="text-sm font-semibold text-gray-800 text-center leading-tight">{e.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
