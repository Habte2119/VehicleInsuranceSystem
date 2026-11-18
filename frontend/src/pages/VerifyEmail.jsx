
// import { useEffect, useState } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import api from "../lib/axios";
// import useAuthStore from "../store/authStore";

// const VerifyEmail = () => {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const checkAuth = useAuthStore((state) => state.checkAuth);

//   const [status, setStatus] = useState("verifying");
//   const [message, setMessage] = useState("Verifying your email...");

//   useEffect(() => {
//     const verify = async () => {
//       const token = searchParams.get("token");

//       if (!token) {
//         setStatus("error");
//         setMessage("Verification token is missing.");
//         return;
//       }

//       try {
//         const response = await api.get("/auth/verifyemail", {
//           params: { token },
//         });

//         await checkAuth();

//         setStatus("success");
//         setMessage(response.data.message);
//       } catch (error) {
//         setStatus("error");
//         setMessage(
//           error.response?.data?.message || "Email verification failed."
//         );
//       }
//     };

//     verify();
//   }, [searchParams, checkAuth]);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
//       <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
//         <h1 className="mb-4 text-2xl font-bold">
//           Email Verification
//         </h1>

//         <p className="mb-6 text-gray-600">{message}</p>

//         {status === "verifying" && <p>Please wait...</p>}

//         {status === "success" && (
//           <button
//             onClick={() => navigate("/login")}
//             className="rounded-lg bg-blue-600 px-6 py-3 text-white"
//           >
//             Continue to Login
//           </button>
//         )}

//         {status === "error" && (
//           <button
//             onClick={() => navigate("/")}
//             className="rounded-lg bg-gray-700 px-6 py-3 text-white"
//           >
//             Back to Home
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default VerifyEmail;


import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../lib/axios";

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryToken = urlParams.get("token");

    if (queryToken && queryToken.length === 6) {
      setCode(queryToken.split(""));
    } else {
      inputs.current[0]?.focus();
    }
  }, []);

  function handleCodeChange(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);

    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event) {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    event.preventDefault();
    setCode([
      ...pasted.split(""),
      ..."".padEnd(6 - pasted.length, " "),
    ].map((digit) => (digit === " " ? "" : digit)));

    inputs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleVerify(event) {
    event.preventDefault();

    const token = code.join("");

    if (token.length !== 6) {
      toast.error("Enter the complete 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);

      // The backend verification route accepts a token query parameter.
      await api.get("/auth/verifyemail", {
        params: { token },
      });

      toast.success("Email verified successfully!");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Verification failed. Check your code and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      toast.error("Please return to registration and enter your email again.");
      return;
    }

    try {
      setResending(true);
      const response = await api.post("/auth/resend-code", { email });
      toast.success(response.data.message || "A new verification code has been sent to your email.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not resend the verification code."
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <Link to="/" className="auth-logo">
          <span className="auth-logo-icon">V</span>
          VIMS
        </Link>

        <div className="auth-brand-content">
          <span className="auth-eyebrow">ONE QUICK STEP</span>
          <h1>Verify today. Drive with confidence.</h1>
          <p>
            Confirm your email address to help secure your account and get
            started with your vehicle insurance dashboard.
          </p>

          {/* Vehicle Showcase Image Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 my-6 group">
            <img
              src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=900"
              alt="Verified Vehicle"
              className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Bank-Grade Encryption Active</span>
              </div>
              <span className="text-[11px] text-slate-300 font-medium bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                100% Secure
              </span>
            </div>
          </div>

          <div className="auth-benefits">
            <span>✓ Help protect your account</span>
            <span>✓ Access your insurance dashboard</span>
            <span>✓ Keep your account details connected</span>
          </div>
        </div>

        <p className="auth-footer-note">Your journey. Your protection.</p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <Link to="/" className="auth-mobile-logo">
            <span className="auth-logo-icon">V</span>
            VIMS
          </Link>

          <div className="auth-heading">
            <span className="auth-eyebrow">EMAIL VERIFICATION</span>
            <h2>Check your inbox</h2>
            <p>
              Enter the 6-digit verification code sent to your email address.
            </p>
            {email && <p className="verify-email-address">{email}</p>}
          </div>

          <form onSubmit={handleVerify} className="auth-form">
            <label>Verification code</label>

            <div className="verify-code-inputs" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => (inputs.current[index] = element)}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  aria-label={`Verification digit ${index + 1}`}
                  maxLength={1}
                  value={digit}
                  onChange={(event) =>
                    handleCodeChange(index, event.target.value)
                  }
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  required
                />
              ))}
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify email"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="auth-switch">
            Didn't receive the code?{" "}
            <button
              type="button"
              className="verify-resend-button"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? "Sending..." : "Resend code"}
            </button>
          </p>

          <Link to="/register" className="auth-back-link">
            ← Back to registration
          </Link>
        </div>
      </section>
    </main>
  );
}
