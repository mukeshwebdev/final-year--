import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { firAPI } from "../../api/fir";
import { courtAPI } from "../../api/court";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";

const STATUS_FLOW = ["FILED", "UNDER_INVESTIGATION", "CHARGESHEET_GENERATED", "COURT", "CLOSED"];
const STATUS_COLORS = { FILED: "bg-blue-100 text-blue-800", UNDER_INVESTIGATION: "bg-yellow-100 text-yellow-800", CHARGESHEET_GENERATED: "bg-purple-100 text-purple-800", COURT: "bg-orange-100 text-orange-800", CLOSED: "bg-green-100 text-green-800" };

const FIRDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fir, setFir] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const loadFIR = async () => {
    try {
      const data = await firAPI.get(id);
      setFir(data);
    } catch (err) {
      navigate("/firs");
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async () => {
    try {
      const data = await courtAPI.getTimeline(id);
      setTimeline(data.timeline || []);
    } catch (e) {}
  };

  useEffect(() => { loadFIR(); loadTimeline(); }, [id]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setAddingNote(true);
    try {
      await firAPI.addLog(id, note);
      setNote("");
      loadFIR();
    } catch (err) {
      alert("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await firAPI.updateStatus(id, status);
      loadFIR();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update status");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await firAPI.downloadPDF(id);
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `FIR_${fir.firNumber.replace(/\//g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to generate PDF");
    }
  };

  const handleGetSummary = async () => {
    setLoadingSummary(true);
    try {
      const data = await firAPI.getSummary(id);
      setSummary(data);
    } catch (err) {
      alert("Failed to get AI summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  if (!fir) return null;

  const tabs = ["details", "investigation", "timeline", "evidence"];
  if (["INSPECTOR", "SUPER_ADMIN"].includes(user.role)) tabs.push("chargesheet");

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
            <h1 className="text-2xl font-bold text-gray-800">{fir.firNumber}</h1>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[fir.status]}`}>{fir.status?.replace(/_/g, " ")}</span>
            {fir.urgency === "CRITICAL" && <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-800 animate-pulse">CRITICAL</span>}
          </div>
          <p className="text-gray-500 text-sm mt-1">{fir.crimeType} · Filed on {new Date(fir.createdAt).toLocaleDateString("en-IN")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadPDF} className="btn-secondary text-sm">📄 Download PDF</button>
          {["INSPECTOR", "SUPER_ADMIN"].includes(user.role) && (
            <button onClick={handleGetSummary} disabled={loadingSummary} className="btn-secondary text-sm">
              {loadingSummary ? "..." : "🤖 AI Summary"}
            </button>
          )}
        </div>
      </div>

      {fir.accused?.isRepeatOffender && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          ⚠️ <strong>Repeat Offender</strong> — Accused has prior criminal records in the system.
        </div>
      )}
      {fir.accused?.isWatchlisted && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          🔴 <strong>Watchlisted Individual</strong> — Accused is on the active watchlist.
        </div>
      )}

      {summary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-800 mb-2">🤖 AI Case Summary</p>
          <p className="text-sm text-blue-700">{summary.summary}</p>
        </div>
      )}

      {["INSPECTOR", "SUPER_ADMIN"].includes(user.role) && (
        <div className="card">
          <p className="text-sm font-medium text-gray-600 mb-3">Update Status</p>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FLOW.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${fir.status === s ? "bg-blue-700 text-white border-blue-700" : "border-gray-300 text-gray-600 hover:border-blue-400"}`}
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "details" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Complainant</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Name:</span> <strong>{fir.complainant?.name}</strong></div>
              <div><span className="text-gray-500">Phone:</span> {fir.complainant?.phone}</div>
              <div><span className="text-gray-500">Address:</span> {fir.complainant?.address}</div>
              {fir.complainant?.aadhaarNumber && <div><span className="text-gray-500">Aadhaar:</span> {fir.complainant.aadhaarNumber}</div>}
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Accused</h3>
            {fir.accused ? (
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">Name:</span> <strong>{fir.accused.name}</strong></div>
                <div><span className="text-gray-500">Address:</span> {fir.accused.address || "Unknown"}</div>
                {fir.accused.aadhaarNumber && <div><span className="text-gray-500">Aadhaar:</span> {fir.accused.aadhaarNumber}</div>}
              </div>
            ) : <p className="text-gray-400 text-sm">No accused details on record</p>}
          </div>
          <div className="card md:col-span-2">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Incident Details</h3>
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div><span className="text-gray-500">Date:</span> <strong>{new Date(fir.incidentDate).toLocaleDateString("en-IN")}</strong></div>
              <div><span className="text-gray-500">Time:</span> {fir.incidentTime || "Not specified"}</div>
              <div><span className="text-gray-500">Location:</span> {fir.incidentLocation}</div>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{fir.description}</p>
            {fir.witnessDetails && (
              <div className="mt-4 pt-4 border-t"><p className="text-sm font-medium text-gray-600">Witnesses:</p><p className="text-sm text-gray-600">{fir.witnessDetails}</p></div>
            )}
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Assigned Officers</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Filed by:</span> {fir.filedBy?.name} ({fir.filedBy?.badgeNumber || "N/A"})</div>
              <div><span className="text-gray-500">Assigned to:</span> {fir.assignedTo?.name || "Unassigned"} {fir.assignedTo?.badgeNumber ? `(${fir.assignedTo.badgeNumber})` : ""}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "investigation" && (
        <div className="space-y-4">
          {["SI", "INSPECTOR", "SUPER_ADMIN"].includes(user.role) && (
            <div className="card">
              <label className="label">Add Investigation Note</label>
              <textarea className="input-field" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Enter investigation update..." />
              <button onClick={handleAddNote} disabled={addingNote || !note.trim()} className="btn-primary mt-2 text-sm">
                {addingNote ? "Adding..." : "Add Note"}
              </button>
            </div>
          )}
          <div className="space-y-3">
            {fir.investigationLogs?.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No investigation logs yet</p>}
            {fir.investigationLogs?.map((log) => (
              <div key={log.id} className="card border-l-4 border-blue-400 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{log.addedBy?.name} <span className="text-gray-400 font-normal text-xs">({log.addedBy?.role})</span></span>
                  <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString("en-IN")}</span>
                </div>
                <p className="text-sm text-gray-600">{log.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Case Timeline</h3>
          {timeline.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No timeline events</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-6 pl-12">
                {timeline.map((event, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-8 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow" />
                    <p className="text-xs text-gray-400">{new Date(event.date).toLocaleString("en-IN")}</p>
                    <p className="text-sm font-medium text-gray-700">{event.type?.replace(/_/g, " ")}</p>
                    <p className="text-sm text-gray-500">{event.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "evidence" && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Evidence Files</h3>
          {fir.evidences?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No evidence files uploaded</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {fir.evidences?.map((ev) => (
                <a key={ev.id} href={ev.fileUrl} target="_blank" rel="noreferrer" className="border rounded-lg p-3 hover:border-blue-400 hover:shadow-sm transition-all text-center">
                  <div className="text-3xl mb-2">{ev.fileType?.includes("image") ? "🖼️" : "📄"}</div>
                  <p className="text-xs text-gray-600 truncate">{ev.fileName}</p>
                  <p className="text-xs text-gray-400">{ev.fileType}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "chargesheet" && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Chargesheet</h3>
          {fir.chargesheets?.length === 0 ? (
            <div>
              <p className="text-gray-400 text-sm mb-4">No chargesheet generated yet</p>
              <GenerateChargesheet firId={id} onSuccess={loadFIR} />
            </div>
          ) : (
            <div className="space-y-4">
              {fir.chargesheets?.map((cs) => (
                <div key={cs.id} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Chargesheet</span>
                    <span className="text-xs text-gray-400">{new Date(cs.generatedAt).toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{cs.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const GenerateChargesheet = ({ firId, onSuccess }) => {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await firAPI.generateChargesheet(firId, content);
      onSuccess();
    } catch (err) {
      alert("Failed to generate chargesheet");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <label className="label">Chargesheet Content</label>
      <textarea className="input-field" rows={8} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Enter chargesheet content..." />
      <button onClick={handleGenerate} disabled={saving || !content.trim()} className="btn-primary mt-2">
        {saving ? "Generating..." : "Generate Chargesheet"}
      </button>
    </div>
  );
};

export default FIRDetail;
