import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { firAPI } from "../../api/fir";
import { courtAPI } from "../../api/court";
import LoadingSpinner from "../../components/LoadingSpinner";

const COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#f97316", "#10b981"];
const STATUS_LABEL = { FILED: "Filed", UNDER_INVESTIGATION: "Investigating", CHARGESHEET_GENERATED: "Chargesheet", COURT: "Court", CLOSED: "Closed" };

const InspectorDashboard = () => {
  const [firs, setFirs] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      firAPI.list({ limit: 50 }),
      courtAPI.getUpcoming(),
    ]).then(([firData, hearingData]) => {
      setFirs(firData.firs || []);
      setHearings(hearingData || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;

  const pending = firs.filter((f) => f.status === "FILED").length;
  const investigating = firs.filter((f) => f.status === "UNDER_INVESTIGATION").length;

  const statusData = Object.entries(
    firs.reduce((acc, f) => { acc[f.status] = (acc[f.status] || 0) + 1; return acc; }, {})
  ).map(([k, v]) => ({ name: STATUS_LABEL[k] || k, value: v }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Inspector Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Cases", value: firs.length, icon: "📋", bg: "bg-blue-50", text: "text-blue-700" },
          { label: "Pending Approval", value: pending, icon: "⏳", bg: "bg-yellow-50", text: "text-yellow-700" },
          { label: "Under Investigation", value: investigating, icon: "🔍", bg: "bg-orange-50", text: "text-orange-700" },
          { label: "Upcoming Hearings", value: hearings.length, icon: "⚖️", bg: "bg-purple-50", text: "text-purple-700" },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${s.bg} ${s.text}`}>{s.icon}</div>
            <div><p className="text-2xl font-bold text-gray-800">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Case Status Overview</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Upcoming Court Hearings</h3>
            <Link to="/court" className="text-blue-600 text-sm hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {hearings.length === 0 && <p className="text-gray-400 text-sm">No hearings this week</p>}
            {hearings.slice(0, 5).map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-800">{h.fir?.firNumber}</p>
                  <p className="text-xs text-gray-500">{h.courtName}</p>
                </div>
                <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                  {new Date(h.hearingDate).toLocaleDateString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Recent FIRs Requiring Action</h3>
          <Link to="/firs" className="text-blue-600 text-sm hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left">
              <th className="py-2 pr-4 text-gray-500 font-medium">FIR No.</th>
              <th className="py-2 pr-4 text-gray-500 font-medium">Crime Type</th>
              <th className="py-2 pr-4 text-gray-500 font-medium">Status</th>
              <th className="py-2 pr-4 text-gray-500 font-medium">Urgency</th>
              <th className="py-2 text-gray-500 font-medium">Filed</th>
            </tr></thead>
            <tbody>
              {firs.filter((f) => f.status === "FILED").slice(0, 10).map((fir) => (
                <tr key={fir.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-4"><Link to={`/firs/${fir.id}`} className="text-blue-600 hover:underline font-medium">{fir.firNumber}</Link></td>
                  <td className="py-2 pr-4 text-gray-700">{fir.crimeType}</td>
                  <td className="py-2 pr-4"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{fir.status}</span></td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fir.urgency === "CRITICAL" ? "bg-red-100 text-red-800" : fir.urgency === "HIGH" ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-600"}`}>{fir.urgency}</span>
                  </td>
                  <td className="py-2 text-gray-500 text-xs">{new Date(fir.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InspectorDashboard;
