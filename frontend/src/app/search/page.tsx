"use client";
import { useState } from "react";
import { searchPlate, plateHistory } from "@/lib/api";
import { Search, History, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await searchPlate(query.trim());
      setResults(res.data.results);
      if (res.data.count === 0) toast("No records found for this plate.");
    } catch {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Vehicle Search</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Search detection history by plate number</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            placeholder="Enter plate e.g. KA01AB1234"
            className="form-input pl-10 font-mono"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-6">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Search
        </button>
      </form>

      {results.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[rgba(42,82,130,0.2)] flex items-center gap-2">
            <History size={15} className="text-brand-400" />
            <span className="text-sm font-semibold text-white">Results for "{query}"</span>
            <span className="ml-auto text-xs bg-brand-600/20 text-brand-400 px-2 py-0.5 rounded-full">{results.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plate Number</th>
                  <th>Confidence</th>
                  <th>Camera</th>
                  <th>Location</th>
                  <th>Valid</th>
                  <th>Source</th>
                  <th>Detected At</th>
                </tr>
              </thead>
              <tbody>
                {results.map((d) => (
                  <tr key={d.id}>
                    <td><span className="plate-badge">{d.plate_number}</span></td>
                    <td>
                      <span className="text-sm font-mono text-brand-400">{(d.confidence * 100).toFixed(0)}%</span>
                    </td>
                    <td className="text-[var(--text-muted)]">{d.camera_id || "—"}</td>
                    <td className="text-[var(--text-muted)]">{d.location || "—"}</td>
                    <td>
                      <span className={`text-xs font-medium ${d.is_valid_format === "true" ? "text-accent-green" : "text-accent-amber"}`}>
                        {d.is_valid_format === "true" ? "✓" : "✗"} {d.is_valid_format === "true" ? "Valid" : "Unknown"}
                      </span>
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.source === "stream" ? "bg-brand-600/20 text-brand-400" : "bg-emerald-600/20 text-emerald-400"}`}>
                        {d.source}
                      </span>
                    </td>
                    <td className="text-xs text-[var(--text-muted)]">{d.detected_at ? new Date(d.detected_at).toLocaleString("en-IN") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
