import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { firAPI } from "../../api/fir";
import LoadingSpinner from "../../components/LoadingSpinner";

const SIDashboard = () => {
  const [firs, setFirs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    firAPI.list({ assignedToMe: true, limit: 50 }).then((d) => setFirs(d.firs || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;

  const pending = firs.filter((f) => f.status === "UNDER_INVESTIGATION").length;
  const total = firs.length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">SI Dashboard</h1>
      <p className="text-gray-500 text-sm -mt-4">Your assigned cases</p>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "My Cases", value: total, icon: "📋", bg: "bg-blue-50 text-blue-700" },
          { label: "Under Investigation", value: pending, icon: "🔍", bg: "bg-yellow-50 text-yellow-700" },
          { label: "Closed", value: firs.filter((f) => f.status === "CLOSED").length, icon: "✅", bg: "bg-green-50 text-green-700" },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${s.bg}`}>{s.icon}</div>
            <div><p className="text-2xl font-bold text-gray-800">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">My Assigned Cases</h3>
          <Link to="/firs?assignedToMe=true" className="text-blue-600 text-sm hover:underline">View all</Link>
        </div>
        {firs.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No cases assigned yet</p>
        ) : (
          <div className="space-y-3">
            {firs.slice(0, 10).map((fir) => (
              <div key={fir.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div>
                  <Link to={`/firs/${fir.id}`} className="font-medium text-blue-600 hover:underline text-sm">{fir.firNumber}</Link>
                  <p className="text-xs text-gray-500">{fir.crimeType} · {fir.incidentLocation}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${fir.status === "UNDER_INVESTIGATION" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"}`}>{fir.status?.replace("_", " ")}</span>
                  <p className="text-xs text-gray-400 mt-1">{new Date(fir.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SIDashboard;
