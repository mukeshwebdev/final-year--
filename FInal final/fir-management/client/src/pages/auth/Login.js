import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const DEMO_ACCOUNTS = [
  { role: "Super Admin", email: "admin@fir.gov", password: "Admin@123" },
  { role: "Inspector", email: "inspector@fir.gov", password: "Inspect@123" },
  { role: "SI", email: "si@fir.gov", password: "SI@12345" },
  { role: "Writer", email: "writer1@fir.gov", password: "Writer@123" },
  { role: "Citizen", email: "citizen@fir.gov", password: "Citizen@123" },
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-blue-800 text-white p-10 flex flex-col justify-between">
          <div>
            <div className="text-5xl mb-4">🚔</div>
            <h1 className="text-3xl font-bold mb-2">FIR Management System</h1>
            <p className="text-blue-200 text-sm mb-8">Government of India — Ministry of Home Affairs<br />Secure Police Station Portal</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-blue-100 text-sm"><span>✅</span> AI-powered crime categorization</div>
              <div className="flex items-center gap-3 text-blue-100 text-sm"><span>✅</span> Duplicate FIR detection</div>
              <div className="flex items-center gap-3 text-blue-100 text-sm"><span>✅</span> Aadhaar-based criminal search</div>
              <div className="flex items-center gap-3 text-blue-100 text-sm"><span>✅</span> Court hearing management</div>
              <div className="flex items-center gap-3 text-blue-100 text-sm"><span>✅</span> PDF export with QR verification</div>
            </div>
          </div>
          <div>
            <p className="text-blue-300 text-xs mt-8">Demo Credentials — click to fill:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => fillDemo(acc)}
                  className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Sign In</h2>
          <p className="text-gray-500 text-sm mb-6">Enter your credentials to access the system</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@fir.gov"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Authorised personnel only. All activity is logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
