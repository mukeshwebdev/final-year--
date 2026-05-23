import React, { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { adminAPI } from "../../api/admin";
import LoadingSpinner from "../../components/LoadingSpinner";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const StatCard = ({ label, value, icon, color = "blue" }) => {
  const colors = { blue: "bg-blue-50 text-blue-700", green: "bg-green-50 text-green-700", red: "bg-red-50 text-red-700", purple: "bg-purple-50 text-purple-700" };
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
};

const SuperAdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnalytics().then(setAnalytics).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  if (!analytics) return <div className="text-center text-gray-500">Failed to load analytics</div>;

  const statusData = (analytics.statusBreakdown || []).map((s) => ({
    name: s.status?.replace("_", " "),
    value: s._count,
  }));

  const crimeData = (analytics.crimeTypeBreakdown || []).slice(0, 8).map((c) => ({
    name: c.crimeType,
    count: c._count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Super Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">System overview and analytics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total FIRs" value={analytics.totalFIRs} icon="📋" color="blue" />
        <StatCard label="FIRs This Week" value={analytics.recentFIRs} icon="🗓" color="green" />
        <StatCard label="Repeat Offenders" value={analytics.repeatOffenders} icon="⚠️" color="red" />
        <StatCard label="Watchlisted" value={analytics.watchlistCount} icon="👁" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Crime Type Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={crimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Case Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4">Top Crime Locations</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2 text-gray-500 font-medium">Location</th><th className="text-right py-2 text-gray-500 font-medium">Cases</th></tr></thead>
            <tbody>
              {(analytics.topLocations || []).map((loc, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-2 text-gray-800">{loc.incidentLocation}</td>
                  <td className="py-2 text-right font-semibold text-blue-700">{loc._count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
