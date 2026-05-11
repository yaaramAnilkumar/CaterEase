import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    event: "Wedding · 350 guests",
    rating: 5,
    text: "Absolutely wonderful experience! The food was fresh, flavourful, and served on time. Our guests couldn't stop complimenting the biryani and paneer dishes. Highly recommend CaterEase!",
    avatar: "PS",
  },
  {
    name: "Rahul Mehta",
    event: "Corporate Event · 120 guests",
    rating: 5,
    text: "We used CaterEase for our annual company meet. The online ordering was seamless, the meal boxes arrived hot, and the variety was impressive. Will definitely book again.",
    avatar: "RM",
  },
  {
    name: "Anita Reddy",
    event: "Birthday Party · 80 guests",
    rating: 5,
    text: "From customising the menu to tracking the delivery live — everything was so smooth. The starters were a huge hit and the team was very responsive. 10/10!",
    avatar: "AR",
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 bg-white">
      <div className="container-app">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-600 text-sm font-medium px-3 py-1 rounded-full mb-3">
            <Star className="w-3.5 h-3.5 fill-brand-500 text-brand-500" /> Customer Reviews
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">What Our Customers Say</h2>
          <p className="text-gray-500">Trusted by 500+ families across Bangalore & Tirupati</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-600 text-sm leading-relaxed mb-5">"{t.text}"</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.event}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
