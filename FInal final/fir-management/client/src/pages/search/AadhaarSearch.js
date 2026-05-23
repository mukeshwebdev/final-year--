import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { aadhaarAPI } from "../../api/aadhaar";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";

const AadhaarSearch = () => {
  const { user } = useAuth();
  const [aadhaar, setAadhaar] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [watchlistReason, setWatchlistReason] = useState("");
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);
  const [activeTab, setActiveTab] = useState("search");

  useEffect(() => {
    aadhaarAPI.getWatchlist().then(setWatchlist).catch(console.error).finally(() => setWatchlistLoading(false));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (aadhaar.length !== 12) { setError("Aadhaar number must be exactly 12 digits"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await aadhaarAPI.search(aadhaar);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || "Search failed. Please verify the Aadhaar number.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!result?.accused?.id || !watchlistReason.trim()) return;
    setAddingToWatchlist(true);
    try {
      await aadhaarAPI.addToWatchlist(result.accused.id, watchlistReason);
      alert("Added to watchlist successfully");
      setWatchlistReason("");
      const updatedWatchlist = await aadhaarAPI.getWatchlist();
      setWatchlist(updatedWatchlist);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add to watchlist");
    } finally {
      setAddingToWatchlist(false);
    }
  };

  const handleRemoveFromWatchlist = async (accusedId) => {
    if (!window.confirm("Remove from watchlist?")) return;
    try {
      await aadhaarAPI.removeFromWatchlist(accusedId);
      const updatedWatchlist = await aadhaarAPI.getWatchlist();
      setWatchlist(updatedWatchlist);
    } catch (err) {
      alert("Failed to remove from watchlist");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Aadhaar-Based Criminal Search</h1>
        <p className="text-gray-500 text-sm mt-1">Search criminal history by Aadhaar number</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {["search", "watchlist"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab === "watchlist" ? `Watchlist (${watchlist.length})` : "Search"}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "search" && (
        <>
          <div className="card">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1">
                <input
                  className="input-field"
                  type="text"
                  maxLength={12}
                  minLength={12}
                  pattern="\d{12}"
                  placeholder="Enter 12-digit Aadhaar number"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
              <button type="submit" disabled={loading || aadhaar.length !== 12} className="btn-primary px-8">
                {loading ? "Searching..." : "🔍 Search"}
              </button>
            </form>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </div>

          {loading && <div className="flex items-center justify-center h-32"><LoadingSpinner size="lg" text="Searching records..." /></div>}

          {result && (
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl flex-shrink-0">
                    {result.citizen?.photoUrl ? <img src={result.citizen.photoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : "👤"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-xl font-bold text-gray-800">{result.citizen?.name}</h2>
                      {result.isRepeatOffender && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">⚠️ Repeat Offender</span>}
                      {result.isWatchlisted && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium animate-pulse">🔴 Watchlisted</span>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                      <div><span className="text-gray-500">Aadhaar:</span><p className="font-mono font-medium">{result.citizen?.aadhaarNumber}</p></div>
                      <div><span className="text-gray-500">DOB:</span><p>{result.citizen?.dob ? new Date(result.citizen.dob).toLocaleDateString("en-IN") : "N/A"}</p></div>
                      <div><span className="text-gray-500">Phone:</span><p>{result.citizen?.phone}</p></div>
                      <div><span className="text-gray-500">Total Cases:</span><p className="font-bold text-red-700">{result.totalCases}</p></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{result.citizen?.address}</p>
                  </div>
                </div>
              </div>

              {result.criminalHistory?.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-gray-700 mb-4">Criminal History ({result.criminalHistory.length} cases)</h3>
                  <div className="space-y-2">
                    {result.criminalHistory.map((fir) => (
                      <div key={fir.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <Link to={`/firs/${fir.id}`} className="text-blue-600 hover:underline font-medium text-sm">{fir.firNumber}</Link>
                          <p className="text-xs text-gray-500">{fir.crimeType} · {fir.incidentLocation}</p>
                          <p className="text-xs text-gray-400">{new Date(fir.incidentDate).toLocaleDateString("en-IN")}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${fir.status === "CLOSED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{fir.status?.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {["INSPECTOR", "SUPER_ADMIN"].includes(user.role) && result.accused && !result.isWatchlisted && (
                <div className="card">
                  <h3 className="font-semibold text-gray-700 mb-3">Add to Watchlist</h3>
                  <div className="flex gap-3">
                    <input className="input-field flex-1" placeholder="Reason for watchlisting..." value={watchlistReason} onChange={(e) => setWatchlistReason(e.target.value)} />
                    <button onClick={handleAddToWatchlist} disabled={addingToWatchlist || !watchlistReason.trim()} className="btn-danger text-sm">
                      {addingToWatchlist ? "Adding..." : "Add to Watchlist"}
                    </button>
                  </div>
                </div>
              )}

              {result.criminalHistory?.length === 0 && !result.isRepeatOffender && (
                <div className="card text-center py-8">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="font-medium text-gray-700">No criminal record found</p>
                  <p className="text-sm text-gray-400">This individual has no prior FIRs in the system</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "watchlist" && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Active Watchlist</h3>
          {watchlistLoading ? (
            <div className="flex items-center justify-center h-32"><LoadingSpinner /></div>
          ) : watchlist.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No individuals on watchlist</p>
          ) : (
            <div className="space-y-3">
              {watchlist.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 border border-red-100 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{entry.accused?.name}</p>
                    <p className="text-xs text-gray-500">Aadhaar: {entry.accused?.aadhaarNumber || "N/A"}</p>
                    <p className="text-xs text-gray-500">Reason: {entry.reason}</p>
                    <p className="text-xs text-gray-400">Added by: {entry.addedBy?.name} ({entry.addedBy?.badgeNumber})</p>
                  </div>
                  {["INSPECTOR", "SUPER_ADMIN"].includes(user.role) && (
                    <button onClick={() => handleRemoveFromWatchlist(entry.accusedId)} className="text-xs text-red-600 hover:text-red-800">Remove</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AadhaarSearch;
