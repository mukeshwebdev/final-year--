import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { firAPI } from "../../api/fir";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";

const STATUS_COLORS = {
  FILED: "bg-blue-100 text-blue-800",
  UNDER_INVESTIGATION: "bg-yellow-100 text-yellow-800",
  CHARGESHEET_GENERATED: "bg-purple-100 text-purple-800",
  COURT: "bg-orange-100 text-orange-800",
  CLOSED: "bg-green-100 text-green-800",
};
const URGENCY_COLORS = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

const FIRList = () => {
  const { user } = useAuth();
  const [firs, setFirs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", crimeType: "", search: "", page: 1, limit: 15 });

  const loadFIRs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.crimeType) params.crimeType = filters.crimeType;
      if (filters.search) params.search = filters.search;
      params.page = filters.page;
      params.limit = filters.limit;
      if (user.role === "SI") params.assignedToMe = true;

      const data = await firAPI.list(params);
      setFirs(data.firs || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, user.role]);

  useEffect(() => { loadFIRs(); }, [loadFIRs]);

  const setFilter = (k) => (e) => setFilters((p) => ({ ...p, [k]: e.target.value, page: 1 }));

  const handleDownloadPDF = async (fir) => {
    try {
      const blob = await firAPI.downloadPDF(fir.id);
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `FIR_${fir.firNumber.replace(/\//g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download PDF");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">FIR List</h1>
          <p className="text-gray-500 text-sm">{total} total records</p>
        </div>
        {["WRITER", "SUPER_ADMIN", "INSPECTOR"].includes(user.role) && (
          <Link to="/fir/new" className="btn-primary">✍️ File New FIR</Link>
        )}
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="input-field" placeholder="Search FIR no., location, name..." value={filters.search} onChange={setFilter("search")} />
          <select className="input-field" value={filters.status} onChange={setFilter("status")}>
            <option value="">All Statuses</option>
            <option value="FILED">Filed</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="CHARGESHEET_GENERATED">Chargesheet</option>
            <option value="COURT">Court</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select className="input-field" value={filters.crimeType} onChange={setFilter("crimeType")}>
            <option value="">All Crime Types</option>
            {["Theft","Assault","Murder","Robbery","Fraud","Cybercrime","Domestic Violence","Harassment","Kidnapping","Drug Offense"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn-secondary" onClick={loadFIRs}>🔄 Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><LoadingSpinner size="lg" /></div>
      ) : firs.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <p className="font-medium">No FIRs found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["FIR Number", "Complainant", "Crime Type", "Location", "Status", "Urgency", "Filed On", "Actions"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {firs.map((fir) => (
                  <tr key={fir.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4"><Link to={`/firs/${fir.id}`} className="text-blue-600 hover:underline font-medium">{fir.firNumber}</Link></td>
                    <td className="py-3 px-4 text-gray-800">{fir.complainant?.name || "—"}</td>
                    <td className="py-3 px-4 text-gray-600">{fir.crimeType}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{fir.incidentLocation}</td>
                    <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[fir.status]}`}>{fir.status?.replace(/_/g, " ")}</span></td>
                    <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${URGENCY_COLORS[fir.urgency]}`}>{fir.urgency}</span></td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{new Date(fir.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => handleDownloadPDF(fir)} className="text-xs text-blue-600 hover:text-blue-800 mr-2" title="Download PDF">📄</button>
                      <Link to={`/firs/${fir.id}`} className="text-xs text-gray-600 hover:text-gray-800">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <p className="text-sm text-gray-500">Page {filters.page} of {pages}</p>
              <div className="flex gap-2">
                <button disabled={filters.page <= 1} onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))} className="btn-secondary text-xs py-1 px-3 disabled:opacity-50">← Prev</button>
                <button disabled={filters.page >= pages} onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))} className="btn-secondary text-xs py-1 px-3 disabled:opacity-50">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FIRList;
