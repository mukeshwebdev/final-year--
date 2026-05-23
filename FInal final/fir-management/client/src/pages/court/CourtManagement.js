import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { courtAPI } from "../../api/court";
import { firAPI } from "../../api/fir";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";

const CourtManagement = () => {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState([]);
  const [firs, setFirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFirId, setSelectedFirId] = useState("");
  const [hearingForm, setHearingForm] = useState({ hearingDate: "", courtName: "", judge: "", order: "", outcome: "", nextDate: "" });
  const [addingHearing, setAddingHearing] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(null);

  useEffect(() => {
    Promise.all([
      courtAPI.getUpcoming(),
      firAPI.list({ status: "COURT", limit: 50 }),
    ]).then(([u, f]) => {
      setUpcoming(u || []);
      setFirs(f.firs || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const setField = (k) => (e) => setHearingForm((p) => ({ ...p, [k]: e.target.value }));

  const handleAddHearing = async (e) => {
    e.preventDefault();
    if (!selectedFirId) { alert("Please select a FIR"); return; }
    setAddingHearing(true);
    try {
      await courtAPI.addHearing(selectedFirId, hearingForm);
      setShowAddForm(false);
      setHearingForm({ hearingDate: "", courtName: "", judge: "", order: "", outcome: "", nextDate: "" });
      const updated = await courtAPI.getUpcoming();
      setUpcoming(updated || []);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add hearing");
    } finally {
      setAddingHearing(false);
    }
  };

  const handleSendReminder = async (hearingId) => {
    setSendingReminder(hearingId);
    try {
      await courtAPI.sendReminder(hearingId);
      alert("Reminder sent successfully");
    } catch (err) {
      alert("Failed to send reminder — check email configuration");
    } finally {
      setSendingReminder(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Court Management</h1>
          <p className="text-gray-500 text-sm mt-1">Track hearings and court proceedings</p>
        </div>
        {["INSPECTOR", "SUPER_ADMIN"].includes(user.role) && (
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">
            {showAddForm ? "✕ Cancel" : "+ Add Hearing"}
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Schedule Court Hearing</h3>
          <form onSubmit={handleAddHearing} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Select FIR *</label>
                <select className="input-field" value={selectedFirId} onChange={(e) => setSelectedFirId(e.target.value)} required>
                  <option value="">Choose a FIR...</option>
                  {firs.map((f) => <option key={f.id} value={f.id}>{f.firNumber} — {f.crimeType}</option>)}
                </select>
              </div>
              <div><label className="label">Hearing Date *</label><input className="input-field" type="date" value={hearingForm.hearingDate} onChange={setField("hearingDate")} required /></div>
              <div><label className="label">Court Name *</label><input className="input-field" value={hearingForm.courtName} onChange={setField("courtName")} placeholder="e.g. Sessions Court, Delhi" required /></div>
              <div><label className="label">Judge Name</label><input className="input-field" value={hearingForm.judge} onChange={setField("judge")} /></div>
              <div className="col-span-2"><label className="label">Court Order / Notes</label><textarea className="input-field" rows={2} value={hearingForm.order} onChange={setField("order")} /></div>
              <div><label className="label">Outcome</label><input className="input-field" value={hearingForm.outcome} onChange={setField("outcome")} placeholder="e.g. Bail granted, Next date set" /></div>
              <div><label className="label">Next Hearing Date</label><input className="input-field" type="date" value={hearingForm.nextDate} onChange={setField("nextDate")} /></div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={addingHearing} className="btn-primary">{addingHearing ? "Saving..." : "Schedule Hearing"}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {[["upcoming", `Upcoming (${upcoming.length})`], ["court-cases", `Court Cases (${firs.length})`]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "upcoming" && (
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-gray-500">No upcoming hearings in the next 7 days</p>
            </div>
          ) : upcoming.map((h) => (
            <div key={h.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center bg-blue-50 rounded-lg px-4 py-2 min-w-[70px]">
                  <p className="text-2xl font-bold text-blue-700">{new Date(h.hearingDate).getDate()}</p>
                  <p className="text-xs text-blue-500">{new Date(h.hearingDate).toLocaleDateString("en-IN", { month: "short" })}</p>
                </div>
                <div>
                  <Link to={`/firs/${h.firId}`} className="font-semibold text-blue-600 hover:underline text-sm">{h.fir?.firNumber}</Link>
                  <p className="text-sm text-gray-600">{h.courtName}</p>
                  <p className="text-xs text-gray-400">{h.fir?.crimeType} · Judge: {h.judge || "TBD"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {h.outcome && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{h.outcome}</span>}
                {["INSPECTOR", "SUPER_ADMIN"].includes(user.role) && (
                  <button onClick={() => handleSendReminder(h.id)} disabled={sendingReminder === h.id} className="btn-secondary text-xs py-1 px-3">
                    {sendingReminder === h.id ? "..." : "📧 Remind"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "court-cases" && (
        <div className="card p-0 overflow-hidden">
          {firs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No cases in court stage</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{["FIR Number", "Crime Type", "Location", "Filed On", "Actions"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium text-xs">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {firs.map((fir) => (
                  <tr key={fir.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4"><Link to={`/firs/${fir.id}`} className="text-blue-600 hover:underline font-medium">{fir.firNumber}</Link></td>
                    <td className="py-3 px-4 text-gray-600">{fir.crimeType}</td>
                    <td className="py-3 px-4 text-gray-500">{fir.incidentLocation}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{new Date(fir.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="py-3 px-4">
                      <Link to={`/firs/${fir.id}`} className="text-xs text-blue-600 hover:underline">View Details →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default CourtManagement;
