import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { firAPI } from "../../api/fir";
import LoadingSpinner from "../../components/LoadingSpinner";

const WriterDashboard = () => {
  const [firs, setFirs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    firAPI.list({ limit: 20 }).then((d) => setFirs(d.firs || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const today = new Date().toDateString();
  const todayFIRs = firs.filter((f) => new Date(f.createdAt).toDateString() === today);

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Writer Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Filed Today", value: todayFIRs.length, icon: "📝", bg: "bg-blue-50 text-blue-700" },
          { label: "Total FIRs", value: firs.length, icon: "📋", bg: "bg-gray-50 text-gray-700" },
          { label: "Pending Ack.", value: firs.filter((f) => f.status === "FILED").length, icon: "📨", bg: "bg-yellow-50 text-yellow-700" },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${s.bg}`}>{s.icon}</div>
            <div><p className="text-2xl font-bold text-gray-800">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link to="/fir/new" className="flex-1 btn-primary text-center py-4 text-base rounded-xl">
          ✍️ File New FIR
        </Link>
        <Link to="/firs" className="flex-1 btn-secondary text-center py-4 text-base rounded-xl">
          📋 View All FIRs
        </Link>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4">Today's FIRs</h3>
        {todayFIRs.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No FIRs filed today</p>
        ) : (
          <div className="space-y-3">
            {todayFIRs.map((fir) => (
              <div key={fir.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Link to={`/firs/${fir.id}`} className="font-medium text-blue-600 hover:underline text-sm">{fir.firNumber}</Link>
                  <p className="text-xs text-gray-500">{fir.complainant?.name} · {fir.crimeType}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${fir.status === "FILED" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>{fir.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WriterDashboard;
