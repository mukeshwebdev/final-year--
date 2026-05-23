import React, { useState } from "react";
import { Link } from "react-router-dom";
import { firAPI } from "../../api/fir";

const STATUS_STEPS = ["FILED", "UNDER_INVESTIGATION", "CHARGESHEET_GENERATED", "COURT", "CLOSED"];
const STATUS_LABEL = { FILED: "Filed", UNDER_INVESTIGATION: "Under Investigation", CHARGESHEET_GENERATED: "Chargesheet", COURT: "In Court", CLOSED: "Closed" };

const CitizenDashboard = () => {
  const [firNumber, setFirNumber] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    setError(""); setResult(null); setLoading(true);
    try {
      const data = await firAPI.trackByNumber(firNumber.trim().toUpperCase());
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || "FIR not found. Please check the number.");
    } finally {
      setLoading(false);
    }
  };

  const stepIdx = result ? STATUS_STEPS.indexOf(result.status) : -1;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="text-5xl mb-3">🏛️</div>
        <h1 className="text-2xl font-bold text-gray-800">Citizen FIR Portal</h1>
        <p className="text-gray-500 text-sm mt-1">Track your complaint or file a new one</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link to="/fir/new" className="card flex flex-col items-center justify-center gap-3 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer text-center">
          <span className="text-3xl">✍️</span>
          <div><p className="font-semibold text-gray-800">File a Complaint</p><p className="text-xs text-gray-500">Register a new FIR online</p></div>
        </Link>
        <div className="card flex flex-col items-center justify-center gap-3 text-center">
          <span className="text-3xl">🔎</span>
          <div><p className="font-semibold text-gray-800">Track Status</p><p className="text-xs text-gray-500">Use FIR number below</p></div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4">Track Your FIR</h3>
        <form onSubmit={handleTrack} className="flex gap-3">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Enter FIR number (e.g. FIR/2024/0001)"
            value={firNumber}
            onChange={(e) => setFirNumber(e.target.value)}
            required
          />
          <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
            {loading ? "Searching..." : "Track"}
          </button>
        </form>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        {result && (
          <div className="mt-6">
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">FIR Number:</span> <strong>{result.firNumber}</strong></div>
                <div><span className="text-gray-500">Crime Type:</span> <strong>{result.crimeType}</strong></div>
                <div><span className="text-gray-500">Incident Date:</span> <strong>{new Date(result.incidentDate).toLocaleDateString("en-IN")}</strong></div>
                <div><span className="text-gray-500">Location:</span> <strong>{result.incidentLocation}</strong></div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Progress</p>
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((s, i) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= stepIdx ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}>
                        {i < stepIdx ? "✓" : i + 1}
                      </div>
                      <p className={`text-xs mt-1 text-center w-20 ${i <= stepIdx ? "text-blue-700 font-medium" : "text-gray-400"}`}>{STATUS_LABEL[s]}</p>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-1 mx-1 ${i < stepIdx ? "bg-blue-500" : "bg-gray-200"}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;
