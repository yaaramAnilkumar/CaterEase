import Link from "next/link";
import { ChefHat } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-2xl bg-brand-500 flex items-center justify-center mb-6">
        <ChefHat className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-xl font-semibold text-gray-700 mb-2">Page not found</p>
      <p className="text-gray-400 mb-8 max-w-sm">
        Looks like this page took the day off. Let's get you back to something delicious.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="bg-brand-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-600 transition-colors">
          Go Home
        </Link>
        <Link href="/menu" className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors">
          View Menu
        </Link>
      </div>
    </div>
  );
}
