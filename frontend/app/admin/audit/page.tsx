"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { ShieldCheck } from "lucide-react";

interface AuditEntry {
  id: number;
  admin_name: string;
  action: string;
  entity_type: string;
  entity_id: number;
  detail: string;
  created_at: string;
}

const actionLabel: Record<string, string> = {
  order_status_changed: "Order status changed",
};

export default function AuditLogPage() {
  const { isAdmin } = useAuthStore();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin()) { router.push("/"); return; }
    api.get("/audit/logs").then((r) => { setLogs(r.data); setLoading(false); });
  }, []);

  return (
    <>
      <Navbar />
      <main className="container-app py-10">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="w-7 h-7 text-brand-600" />
          <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No audit entries yet</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Time", "Admin", "Action", "Target", "Detail"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{l.admin_name}</td>
                      <td className="px-4 py-3 text-gray-600">{actionLabel[l.action] ?? l.action}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{l.entity_type} #{l.entity_id}</td>
                      <td className="px-4 py-3 text-gray-600">{l.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">{logs.length} entries</div>
          </div>
        )}
      </main>
    </>
  );
}
