import { ReactNode } from "react";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export default function PageHero({ title, subtitle, icon, children }: PageHeroProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 py-10 md:py-14">
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #f97316 0%, transparent 50%), radial-gradient(circle at 80% 20%, #ea580c 0%, transparent 40%)" }} />
      <div className="container-app relative z-10">
        <div className="flex items-center gap-3 mb-2">
          {icon && <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">{icon}</div>}
          <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
        </div>
        {subtitle && <p className="text-gray-400 text-sm mt-1 ml-0">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
