import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { firAPI } from "../../api/fir";

const CRIME_TYPES = ["Theft", "Assault", "Murder", "Robbery", "Fraud", "Cybercrime", "Domestic Violence", "Harassment", "Kidnapping", "Drug Offense", "Vandalism", "Extortion", "Other"];

const FileFIR = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [files, setFiles] = useState([]);

  const [form, setForm] = useState({
    complainantName: "", complainantAddress: "", complainantPhone: "", complainantAadhaar: "", complainantEmail: "",
    accusedName: "", accusedAddress: "", accusedAadhaar: "",
    incidentDate: "", incidentTime: "", incidentLocation: "", description: "", crimeType: "", witnessDetails: "",
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const analyzeWithAI = async () => {
    if (!form.description || form.description.length < 20) return;
    try {
      const [dupResult] = await Promise.all([
        firAPI.checkDuplicates(form.description),
      ]);
      if (dupResult.is_duplicate) setDuplicateWarning(dupResult);
      if (dupResult.crime_type && !form.crimeType) setForm((p) => ({ ...p, crimeType: dupResult.crime_type }));
    } catch (e) {
      console.error("AI analysis failed:", e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("complainant[name]", form.complainantName);
      fd.append("complainant[address]", form.complainantAddress);
      fd.append("complainant[phone]", form.complainantPhone);
      fd.append("complainant[aadhaarNumber]", form.complainantAadhaar);
      if (form.complainantEmail) fd.append("complainant[email]", form.complainantEmail);
      if (form.accusedName) {
        fd.append("accused[name]", form.accusedName);
        if (form.accusedAddress) fd.append("accused[address]", form.accusedAddress);
        if (form.accusedAadhaar) fd.append("accused[aadhaarNumber]", form.accusedAadhaar);
      }
      fd.append("incidentDate", form.incidentDate);
      if (form.incidentTime) fd.append("incidentTime", form.incidentTime);
      fd.append("incidentLocation", form.incidentLocation);
      fd.append("description", form.description);
      fd.append("crimeType", form.crimeType);
      if (form.witnessDetails) fd.append("witnessDetails", form.witnessDetails);
      files.forEach((f) => fd.append("evidences", f));

      const result = await firAPI.create(fd);
      setAiResult(result.aiAnalysis);
      navigate(`/firs/${result.fir.id}`, { state: { justFiled: true } });
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || "Failed to file FIR");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "input-field";
  const labelCls = "label";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">File New FIR</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in all details carefully. AI will assist with crime categorization.</p>
      </div>

      <div className="flex items-center mb-8">
        {["Complainant", "Accused", "Incident", "Review"].map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-blue-700 text-white" : "bg-gray-200 text-gray-400"}`}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <p className={`text-xs mt-1 ${step === i + 1 ? "text-blue-700 font-medium" : "text-gray-400"}`}>{label}</p>
            </div>
            {i < 3 && <div className={`flex-1 h-1 mx-2 ${step > i + 1 ? "bg-green-400" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

      {duplicateWarning && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg text-sm mb-4">
          <strong>⚠️ Possible Duplicate Detected</strong> — Similarity: {(duplicateWarning.highest_similarity * 100).toFixed(0)}%
          <br />This complaint may be similar to existing FIRs. Please verify before submitting.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card space-y-4">
          {step === 1 && (
            <>
              <h2 className="font-semibold text-gray-700 text-lg border-b pb-2">Complainant Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Full Name *</label><input className={inputCls} value={form.complainantName} onChange={set("complainantName")} required /></div>
                <div><label className={labelCls}>Phone Number *</label><input className={inputCls} type="tel" value={form.complainantPhone} onChange={set("complainantPhone")} required /></div>
                <div className="col-span-2"><label className={labelCls}>Address *</label><textarea className={inputCls} rows={2} value={form.complainantAddress} onChange={set("complainantAddress")} required /></div>
                <div><label className={labelCls}>Aadhaar Number</label><input className={inputCls} maxLength={12} value={form.complainantAadhaar} onChange={set("complainantAadhaar")} placeholder="12-digit Aadhaar" /></div>
                <div><label className={labelCls}>Email (optional)</label><input className={inputCls} type="email" value={form.complainantEmail} onChange={set("complainantEmail")} /></div>
              </div>
              <div className="flex justify-end"><button type="button" className="btn-primary" onClick={() => setStep(2)}>Next →</button></div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-semibold text-gray-700 text-lg border-b pb-2">Accused Details <span className="text-gray-400 font-normal text-sm">(if known)</span></h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Full Name</label><input className={inputCls} value={form.accusedName} onChange={set("accusedName")} /></div>
                <div><label className={labelCls}>Aadhaar Number</label><input className={inputCls} maxLength={12} value={form.accusedAadhaar} onChange={set("accusedAadhaar")} placeholder="12-digit Aadhaar" /></div>
                <div className="col-span-2"><label className={labelCls}>Address</label><textarea className={inputCls} rows={2} value={form.accusedAddress} onChange={set("accusedAddress")} /></div>
              </div>
              <div className="flex justify-between">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button type="button" className="btn-primary" onClick={() => setStep(3)}>Next →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-semibold text-gray-700 text-lg border-b pb-2">Incident Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Incident Date *</label><input className={inputCls} type="date" value={form.incidentDate} onChange={set("incidentDate")} required max={new Date().toISOString().split("T")[0]} /></div>
                <div><label className={labelCls}>Incident Time</label><input className={inputCls} type="time" value={form.incidentTime} onChange={set("incidentTime")} /></div>
                <div className="col-span-2"><label className={labelCls}>Incident Location *</label><input className={inputCls} value={form.incidentLocation} onChange={set("incidentLocation")} required placeholder="Street, area, city..." /></div>
                <div className="col-span-2">
                  <label className={labelCls}>Incident Description *</label>
                  <textarea className={inputCls} rows={5} value={form.description} onChange={set("description")} onBlur={analyzeWithAI} required minLength={20} placeholder="Describe the incident in detail..." />
                  <p className="text-xs text-gray-400 mt-1">AI will auto-suggest crime type after you finish typing</p>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Crime Type *</label>
                  <select className={inputCls} value={form.crimeType} onChange={set("crimeType")} required>
                    <option value="">Select crime type...</option>
                    {CRIME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><label className={labelCls}>Witness Details</label><textarea className={inputCls} rows={2} value={form.witnessDetails} onChange={set("witnessDetails")} placeholder="Name, contact of witnesses (if any)" /></div>
                <div className="col-span-2">
                  <label className={labelCls}>Evidence Files</label>
                  <input className={inputCls} type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={(e) => setFiles(Array.from(e.target.files))} />
                  <p className="text-xs text-gray-400 mt-1">Max 10 files, 10MB each. JPG, PNG, PDF, DOC allowed.</p>
                </div>
              </div>
              <div className="flex justify-between">
                <button type="button" className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
                <button type="button" className="btn-primary" onClick={() => setStep(4)}>Review →</button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-semibold text-gray-700 text-lg border-b pb-2">Review & Submit</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                <div><strong className="text-gray-600">Complainant:</strong> {form.complainantName} · {form.complainantPhone}</div>
                {form.accusedName && <div><strong className="text-gray-600">Accused:</strong> {form.accusedName}</div>}
                <div><strong className="text-gray-600">Date/Time:</strong> {form.incidentDate} {form.incidentTime}</div>
                <div><strong className="text-gray-600">Location:</strong> {form.incidentLocation}</div>
                <div><strong className="text-gray-600">Crime Type:</strong> {form.crimeType}</div>
                <div><strong className="text-gray-600">Description:</strong> {form.description.slice(0, 200)}{form.description.length > 200 ? "..." : ""}</div>
                {files.length > 0 && <div><strong className="text-gray-600">Evidence files:</strong> {files.length} file(s)</div>}
              </div>
              <div className="flex justify-between">
                <button type="button" className="btn-secondary" onClick={() => setStep(3)}>← Edit</button>
                <button type="submit" disabled={loading} className="btn-primary px-8">
                  {loading ? "Submitting..." : "Submit FIR"}
                </button>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default FileFIR;
