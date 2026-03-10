"use client";
import { useEffect, useState } from "react";
import { getBlacklist, addToBlacklist, removeFromBlacklist, getAlertLogs } from "@/lib/api";
import { ShieldAlert, Plus, Trash2, Bell, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AlertsPage() {
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [alertLogs, setAlertLogs] = useState<any[]>([]);
  const [newPlate, setNewPlate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<"blacklist" | "logs">("blacklist");

  const loadData = async () => {
    try {
      const [bl, logs] = await Promise.all([getBlacklist(), getAlertLogs()]);
      setBlacklist(bl.data.blacklist);
      setAlertLogs(logs.data.alerts);
    } catch {}
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim()) return;
    setAdding(true);
    try {
      await addToBlacklist(newPlate.trim().toUpperCase(), newReason);
      toast.success(`${newPlate.toUpperCase()} added to blacklist`);
      setNewPlate(""); setNewReason("");
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to add");
    } finally { setAdding(false); }
  };

  const handleRemove = async (plate: string) => {
    try {
      await removeFromBlacklist(plate);
      toast.success(`${plate} removed from blacklist`);
      loadData();
    } catch { toast.error("Failed to remove"); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Alerts & Blacklist</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage blacklisted vehicles and view alert history</p>
      </div>

      {/* Add form */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Plus size={15} className="text-brand-400" />Add to Blacklist</h2>
        <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
          <input
            value={newPlate}
            onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
            placeholder="Plate number e.g. TN01AB1234"
            className="form-input flex-1 min-w-48 font-mono"
          />
          <input
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Reason (optional)"
            className="form-input flex-1 min-w-48"
          />
          <button type="submit" disabled={adding} className="btn-danger flex items-center gap-2 px-5">
            {adding ? <Loader2 size={15} className="animate-spin" /> : <ShieldAlert size={15} />}
            Blacklist
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["blacklist", "logs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-brand-600/20 text-brand-400 border border-brand-600/30" : "text-[var(--text-muted)] hover:text-white"}`}
          >
            {t === "blacklist" ? <ShieldAlert size={14} /> : <Bell size={14} />}
            {t === "blacklist" ? `Blacklist (${blacklist.length})` : `Alert Logs (${alertLogs.length})`}
          </button>
        ))}
      </div>

      {/* Blacklist table */}
      {tab === "blacklist" && (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr><th>Plate</th><th>Reason</th><th>Added By</th><th>Date</th><th>Action</th></tr>
            </thead>
            <tbody>
              {blacklist.length === 0 && (
                <tr><td colSpan={5} className="text-center text-[var(--text-muted)] py-10">No blacklisted vehicles</td></tr>
              )}
              {blacklist.map((b) => (
                <tr key={b.id}>
                  <td><span className="plate-badge">{b.plate_number}</span></td>
                  <td className="text-[var(--text-muted)]">{b.reason || "—"}</td>
                  <td className="text-[var(--text-muted)]">{b.added_by || "—"}</td>
                  <td className="text-xs text-[var(--text-muted)]">{b.added_at ? new Date(b.added_at).toLocaleDateString("en-IN") : "—"}</td>
                  <td>
                    <button onClick={() => handleRemove(b.plate_number)} className="flex items-center gap-1 text-xs text-accent-red hover:text-red-300 transition-colors">
                      <Trash2 size={13} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Alert logs table */}
      {tab === "logs" && (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr><th>Plate</th><th>Type</th><th>Camera</th><th>Message</th><th>Time</th></tr>
            </thead>
            <tbody>
              {alertLogs.length === 0 && (
                <tr><td colSpan={5} className="text-center text-[var(--text-muted)] py-10">No alerts triggered yet</td></tr>
              )}
              {alertLogs.map((a) => (
                <tr key={a.id}>
                  <td><span className="plate-badge">{a.plate_number}</span></td>
                  <td><span className="text-xs px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 font-medium">{a.alert_type}</span></td>
                  <td className="text-[var(--text-muted)]">{a.camera_id || "—"}</td>
                  <td className="text-xs text-[var(--text-muted)] max-w-xs truncate">{a.message || "—"}</td>
                  <td className="text-xs text-[var(--text-muted)]">{a.created_at ? new Date(a.created_at).toLocaleString("en-IN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
