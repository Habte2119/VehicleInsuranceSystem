import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Shield,
  Car,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  CreditCard,
  Lock,
  Download,
  RefreshCw,
  FileText,
  Sparkles,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import api from "../lib/axios";
import useAuthStore from "../store/authStore";
import ThemeToggle from "../components/ThemeToggle";

export default function GetQuote() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  const [step, setStep] = useState(1);
  const [calculating, setCalculating] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [userVehicles, setUserVehicles] = useState([]);

  // Results
  const [calculatedQuote, setCalculatedQuote] = useState(null);
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Form State: clean empty defaults without hardcoded fake values
  const [formData, setFormData] = useState({
    // Driver Details
    fullName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
    email: user?.email || "",
    phone: "",
    age: "",
    address: "",
    driversLicenseNumber: "",

    // Vehicle Details
    selectedExistingVehicleId: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleVin: "",
    vehicleType: "sedan",
    vehicleUsage: "personal",
    primaryParkingLocation: "Garage",
    annualMileage: "",
    odometerReading: "",
    estimatedValue: "",
    hasAntiTheftDevices: false,

    // Coverage Preferences
    coverageLevel: (() => {
      const p = (searchParams.get("plan") || "Standard").toLowerCase();
      if (p === "basic") return "Basic";
      if (p === "comprehensive" || p === "premium") return "Comprehensive";
      return "Standard";
    })(),
    deductibleAmount: 500,
    coverageDuration: 12,
    startDate: new Date().toISOString().split("T")[0],
    collisionCoverage: (() => {
      const p = (searchParams.get("plan") || "Standard").toLowerCase();
      return p !== "basic";
    })(),
    comprehensiveCoverage: (() => {
      const p = (searchParams.get("plan") || "Standard").toLowerCase();
      return p === "comprehensive" || p === "premium";
    })(),
    liabilityCoverage: true,
    roadsideAssistance: true,
    rentalReimbursement: (() => {
      const p = (searchParams.get("plan") || "Standard").toLowerCase();
      return p === "comprehensive" || p === "premium";
    })(),

    // Payment & Billing
    cardholderName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
    billingAddress: "",
    city: "",
    zipCode: "",
    cardNumber: "",
    cardExpiry: "",
    cardExpiryMonth: "",
    cardExpiryYear: "",
    cardCvc: "",
    password: "",
  });

  // Load existing vehicles and profile if user is logged in
  useEffect(() => {
    if (isAuthenticated) {
      api
        .get("/vehicle/getvehicle")
        .then((res) => {
          if (res.data?.success && res.data.vehicles?.length > 0) {
            const list = res.data.vehicles;
            setUserVehicles(list);

            // Auto-select vehicle if vehicleId was passed in query string (e.g. from Dashboard)
            const urlVehicleId = searchParams.get("vehicleId");
            if (urlVehicleId) {
              const matchedVeh = list.find((v) => v.id === urlVehicleId);
              if (matchedVeh) {
                setFormData((prev) => ({
                  ...prev,
                  selectedExistingVehicleId: matchedVeh.id,
                  vehicleMake: matchedVeh.brand,
                  vehicleModel: matchedVeh.model,
                  vehicleYear: String(matchedVeh.year),
                  vehicleVin: matchedVeh.vin || "",
                  vehicleType: (matchedVeh.vehicleType || "sedan").toLowerCase(),
                  estimatedValue: matchedVeh.marketValue ? String(matchedVeh.marketValue) : prev.estimatedValue,
                  odometerReading: matchedVeh.odometerReading ? String(matchedVeh.odometerReading) : prev.odometerReading,
                }));
              }
            }
          }
        })
        .catch(() => {});

      api
        .get("/user/getmyprofile")
        .then((res) => {
          if (res.data?.success && res.data.userProfile) {
            const up = res.data.userProfile;
            const p = up.profile || {};
            setFormData((prev) => ({
              ...prev,
              fullName: `${up.firstName || ""} ${up.lastName || ""}`.trim() || prev.fullName,
              email: up.email || prev.email,
              phone: p.phone || prev.phone,
              age: p.age ? String(p.age) : prev.age,
              address: p.address || prev.address,
              city: p.city || prev.city,
              cardholderName: `${up.firstName || ""} ${up.lastName || ""}`.trim() || prev.cardholderName,
              billingAddress: p.address || prev.billingAddress,
            }));
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, searchParams]);

  // Handle vehicle selection from existing list
  const handleSelectExistingVehicle = (vehicleId) => {
    if (!vehicleId) {
      setFormData((prev) => ({
        ...prev,
        selectedExistingVehicleId: "",
        vehicleMake: "",
        vehicleModel: "",
        vehicleYear: "",
        vehicleVin: "",
        vehicleType: "sedan",
        estimatedValue: "",
        odometerReading: "",
      }));
      return;
    }

    const v = userVehicles.find((item) => item.id === vehicleId);
    if (v) {
      setFormData((prev) => ({
        ...prev,
        selectedExistingVehicleId: v.id,
        vehicleMake: v.brand,
        vehicleModel: v.model,
        vehicleYear: String(v.year),
        vehicleVin: v.vin || "",
        vehicleType: (v.vehicleType || "sedan").toLowerCase(),
        estimatedValue: v.marketValue ? String(v.marketValue) : "",
        odometerReading: v.odometerReading ? String(v.odometerReading) : "",
      }));
    }
  };

  // Plan level presets
  const handleSelectPlanTier = (tierId) => {
    if (tierId === "Basic") {
      setFormData((prev) => ({
        ...prev,
        coverageLevel: "Basic",
        collisionCoverage: false,
        comprehensiveCoverage: false,
        roadsideAssistance: false,
        rentalReimbursement: false,
      }));
    } else if (tierId === "Standard") {
      setFormData((prev) => ({
        ...prev,
        coverageLevel: "Standard",
        collisionCoverage: true,
        comprehensiveCoverage: false,
        roadsideAssistance: true,
        rentalReimbursement: false,
      }));
    } else if (tierId === "Comprehensive") {
      setFormData((prev) => ({
        ...prev,
        coverageLevel: "Comprehensive",
        collisionCoverage: true,
        comprehensiveCoverage: true,
        roadsideAssistance: true,
        rentalReimbursement: true,
      }));
    }
  };

  // Step 1 Validation -> Go to Step 2
  const handleProceedToCoverage = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.error("Please enter driver name and email.");
      return;
    }
    if (!formData.age || parseInt(formData.age, 10) < 18) {
      toast.error("Driver must be at least 18 years of age.");
      return;
    }

    // Only validate make/model/year if NOT selecting an existing registered vehicle
    if (!formData.selectedExistingVehicleId) {
      if (!formData.vehicleMake.trim() || !formData.vehicleModel.trim()) {
        toast.error("Please enter vehicle make and model.");
        return;
      }
      if (!formData.vehicleYear || parseInt(formData.vehicleYear, 10) < 1980) {
        toast.error("Please enter a valid vehicle year (1980 or newer).");
        return;
      }
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Step 2 -> Calculate Quote -> Step 3
  const handleCalculateQuote = async (e) => {
    e.preventDefault();
    try {
      setCalculating(true);

      const payload = {
        fullName: formData.fullName.trim(),
        age: parseInt(formData.age, 10) || 30,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        driversLicenseNumber: formData.driversLicenseNumber.trim() || null,
        vehicleType: formData.vehicleType.toLowerCase(),
        vehicleMake: formData.vehicleMake.trim(),
        vehicleModel: formData.vehicleModel.trim(),
        vehicleYear: parseInt(formData.vehicleYear, 10) || new Date().getFullYear(),
        vehicleVin: formData.vehicleVin.trim() || `VIN-${Date.now().toString(36).toUpperCase()}`,
        ownershipType: "owned",
        vehicleUsage: formData.vehicleUsage || "personal",
        primaryParkingLocation: formData.primaryParkingLocation || "Garage",
        annualMileage: formData.annualMileage ? parseInt(formData.annualMileage, 10) : null,
        odometerReading: formData.odometerReading ? parseFloat(formData.odometerReading) : null,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : null,
        hasAntiTheftDevices: Boolean(formData.hasAntiTheftDevices),
        collisionCoverage: Boolean(formData.collisionCoverage),
        comprehensiveCoverage: Boolean(formData.comprehensiveCoverage),
        liabilityCoverage: Boolean(formData.liabilityCoverage),
        roadsideAssistance: Boolean(formData.roadsideAssistance),
        rentalReimbursement: Boolean(formData.rentalReimbursement),
        deductibleAmount: parseInt(formData.deductibleAmount, 10) || 500,
        coverageDuration: parseInt(formData.coverageDuration, 10) || 12,
        startDate: formData.startDate || new Date().toISOString().split("T")[0],
        coverageLevel: formData.coverageLevel || "Standard",
        userId: (isAuthenticated && user?.id) ? user.id : null,
        vehicleId: formData.selectedExistingVehicleId || null,
      };

      const res = await api.post("/quote/calculate", payload);

      if (res.data?.success && res.data.data) {
        setCalculatedQuote(res.data.data);
        setStep(3);
        toast.success("Quote calculated successfully!");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to calculate quote. Please verify details.");
    } finally {
      setCalculating(false);
    }
  };

  // Step 3 -> Proceed to Checkout (Step 4)
  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      toast.info("Please log in or create an account to activate your policy.");
      navigate("/login");
      return;
    }
    setStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Step 4 -> Confirm & Pay -> Activate Policy
  const handleConfirmPurchase = async (e) => {
    e.preventDefault();

    if (!calculatedQuote?.id) {
      toast.error("Valid quote required. Please recalculate.");
      return;
    }

    if (!formData.cardNumber || !formData.cardNumber.trim()) {
      toast.error("Please enter your card number.");
      return;
    }

    if (!formData.cardExpiryMonth || !formData.cardExpiryYear) {
      toast.error("Please select both card expiration month and year.");
      return;
    }

    if (!formData.cardCvc || !formData.cardCvc.trim()) {
      toast.error("Please enter your card CVC security code.");
      return;
    }

    try {
      setPurchasing(true);

      const payload = {
        quoteId: calculatedQuote.id,
        amount: calculatedQuote.monthlyPremium,
        cardholderName: formData.cardholderName || formData.fullName,
        billingAddress: formData.billingAddress || formData.address,
        city: formData.city || "Addis Ababa",
        zipCode: formData.zipCode || "1000",
        password: formData.password || undefined,
        userId: user?.id,
      };

      const res = await api.post("/payment/process", payload);

      if (res.data?.success) {
        setPurchaseResult(res.data);
        setStep(5); // Success State
        toast.success("Congratulations! Your insurance policy is now ACTIVE.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment processing failed. Please check your details.");
    } finally {
      setPurchasing(false);
    }
  };

  // Download PDF Policy
  const handleDownloadPdf = async () => {
    if (!purchaseResult?.newPolicyId) return;

    try {
      setDownloadingPdf(true);
      const res = await api.get(`/policy/${purchaseResult.newPolicyId}/document`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `VIMS_Policy_${purchaseResult.newPolicyId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Policy document downloaded.");
    } catch (err) {
      toast.error("Failed to download PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Compute live estimated range on Step 2 per tier
  const getTierEstimate = (tierKey) => {
    let base = formData.vehicleType === "luxury" ? 200 : formData.vehicleType === "suv" ? 150 : formData.vehicleType === "truck" ? 170 : 110;
    let mult = tierKey === "Basic" ? 0.75 : tierKey === "Comprehensive" ? 1.50 : 1.0;
    let ded = formData.deductibleAmount === 250 ? 1.35 : formData.deductibleAmount === 1000 ? 0.85 : 1.0;
    let addOns = tierKey === "Comprehensive" ? 7 : 0;
    let est = Math.round((base * mult * ded) + addOns);
    return {
      min: Math.round(est * 0.75),
      max: est,
    };
  };

  const getLiveTierEstimate = () => {
    let base = formData.vehicleType === "luxury" ? 200 : formData.vehicleType === "suv" ? 150 : formData.vehicleType === "truck" ? 170 : 110;
    let mult = formData.coverageLevel === "Basic" ? 0.75 : formData.coverageLevel === "Comprehensive" ? 1.50 : 1.0;
    let ded = formData.deductibleAmount === 250 ? 1.35 : formData.deductibleAmount === 1000 ? 0.85 : 1.0;
    let addOns = (formData.collisionCoverage && formData.coverageLevel === "Basic" ? 18 : 0) +
                 (formData.comprehensiveCoverage && formData.coverageLevel !== "Comprehensive" ? 24 : 0) +
                 (formData.roadsideAssistance && formData.coverageLevel === "Basic" ? 8 : 0) +
                 (formData.rentalReimbursement ? 7 : 0);
    let est = Math.round((base * mult * ded) + addOns);
    return {
      min: Math.round(est * 0.75), // With max discounts
      max: est, // Before discounts
    };
  };

  const liveEstimate = getLiveTierEstimate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 transition-colors shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/20">
              V
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-wide">VIMS</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Home
            </Link>
            <Link
              to="/plans"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Plan
            </Link>
            <Link
              to="/about"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Contact Us
            </Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle size="sm" />
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
              >
                Dashboard →
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        {/* Step Progress Header */}
        {step <= 4 && (
          <div className="mb-10">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {[
                { num: 1, label: "Vehicle & Driver" },
                { num: 2, label: "Coverage Level" },
                { num: 3, label: "Quote Result" },
                { num: 4, label: "Activation" },
              ].map((s, idx) => (
                <div key={s.num} className="flex flex-col items-center flex-1 relative">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      step >= s.num
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-500/30"
                        : "bg-white text-slate-400 border border-slate-200"
                    }`}
                  >
                    {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium hidden sm:block ${
                      step >= s.num ? "text-slate-800 font-semibold" : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                  {idx < 3 && (
                    <div
                      className={`absolute top-4 left-1/2 w-full h-[2px] -z-10 ${
                        step > s.num ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 1: VEHICLE & DRIVER INFO */}
        {/* ========================================================= */}
        {step === 1 && (
          <form
            onSubmit={handleProceedToCoverage}
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm"
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-6 h-6 text-blue-600" />
                Tell us about your vehicle & driver
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Enter your details to calculate your personalized insurance quote and qualifying discounts.
              </p>
            </div>

            {/* Select Existing Vehicle if logged in */}
            {userVehicles.length > 0 && (
              <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-xl space-y-2">
                <label className="text-xs font-semibold text-blue-700 block uppercase tracking-wider">
                  Quick Select: Use one of your registered vehicles
                </label>
                <select
                  value={formData.selectedExistingVehicleId}
                  onChange={(e) => handleSelectExistingVehicle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Or enter a new vehicle below --</option>
                  {userVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.year}) - VIN: {v.vin}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Driver Information */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Primary Driver Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Habtemariam Hailu"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Driver Age *</label>
                  <input
                    type="number"
                    required
                    min="18"
                    max="99"
                    placeholder="e.g. 30"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Phone Number <span className="text-slate-400 font-normal">(Optional - can skip)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+215 9XX XXX XXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Driver's License # <span className="text-slate-400 font-normal">(Optional - can skip)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DL-88239"
                    value={formData.driversLicenseNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, driversLicenseNumber: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Residential Address <span className="text-slate-400 font-normal">(Optional - can skip)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bole Sub-City, Addis Ababa"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Vehicle Specs */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Vehicle Specifications
                </h3>
                {formData.selectedExistingVehicleId && (
                  <span className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    Locked to registered vehicle
                  </span>
                )}
              </div>

              {formData.selectedExistingVehicleId ? (
                /* Verified Registered Vehicle: Specifications are locked to database record */
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded">
                            Verified Fleet Record
                          </span>
                        </div>
                        <h4 className="text-slate-900 font-bold text-base mt-0.5">
                          {formData.vehicleYear} {formData.vehicleMake} {formData.vehicleModel}
                        </h4>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectExistingVehicle("")}
                      className="text-xs text-blue-600 hover:text-blue-700 underline self-start sm:self-auto transition font-medium"
                    >
                      Change Vehicle
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 block text-[11px]">Make & Model</span>
                      <span className="font-semibold text-slate-900 mt-1 block">
                        {formData.vehicleMake} {formData.vehicleModel}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 block text-[11px]">Manufacture Year</span>
                      <span className="font-semibold text-slate-900 mt-1 block">
                        {formData.vehicleYear}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 block text-[11px]">Body Type</span>
                      <span className="font-semibold text-slate-900 mt-1 block capitalize">
                        {formData.vehicleType || "Sedan"}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 block text-[11px]">VIN Number</span>
                      <span className="font-mono text-slate-900 mt-1 block truncate font-semibold">
                        {formData.vehicleVin || "On Record"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Vehicle Usage (Driving Purpose)
                      </label>
                      <select
                        value={formData.vehicleUsage}
                        onChange={(e) => setFormData({ ...formData, vehicleUsage: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                      >
                        <option value="personal">Personal / Leisure</option>
                        <option value="commute">Daily Commuting</option>
                        <option value="commercial">Commercial / Rideshare</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 self-end pb-2">
                      <input
                        type="checkbox"
                        id="antiTheft"
                        checked={formData.hasAntiTheftDevices}
                        onChange={(e) =>
                          setFormData({ ...formData, hasAntiTheftDevices: e.target.checked })
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="antiTheft" className="text-xs text-slate-700 font-medium">
                        GPS Tracker / Anti-Theft Device (7% discount)
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-blue-50 border border-blue-200 p-2.5 rounded-xl">
                    <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>
                      Specifications are locked to the registered vehicle record to maintain policy underwriting accuracy.
                    </span>
                  </div>
                </div>
              ) : (
                /* Editable inputs when quoting / registering a new vehicle */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Make / Brand *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Toyota"
                        value={formData.vehicleMake}
                        onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Model *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Camry"
                        value={formData.vehicleModel}
                        onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Year of Manufacture *</label>
                      <input
                        type="number"
                        required
                        min="1980"
                        max={new Date().getFullYear() + 1}
                        placeholder="e.g. 2022"
                        value={formData.vehicleYear}
                        onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Body Type
                      </label>
                      <select
                        value={formData.vehicleType}
                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                      >
                        <option value="sedan">Sedan (Standard)</option>
                        <option value="suv">SUV / Crossover</option>
                        <option value="truck">Pickup / Truck</option>
                        <option value="luxury">Luxury / Sports</option>
                        <option value="motorcycle">Motorcycle</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Vehicle Usage
                      </label>
                      <select
                        value={formData.vehicleUsage}
                        onChange={(e) => setFormData({ ...formData, vehicleUsage: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                      >
                        <option value="personal">Personal / Leisure</option>
                        <option value="commute">Daily Commuting</option>
                        <option value="commercial">Commercial / Rideshare</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Estimated Market Value ($) <span className="text-slate-400 font-normal">(Optional - can skip)</span>
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 25000"
                        value={formData.estimatedValue}
                        onChange={(e) =>
                          setFormData({ ...formData, estimatedValue: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      VIN (Vehicle Identification Number) <span className="text-slate-400 font-normal">(Optional - can skip empty)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="17-character VIN (Leave blank to generate temporary)"
                      value={formData.vehicleVin}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicleVin: e.target.value.toUpperCase() })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="antiTheftNew"
                      checked={formData.hasAntiTheftDevices}
                      onChange={(e) =>
                        setFormData({ ...formData, hasAntiTheftDevices: e.target.checked })
                      }
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="antiTheftNew" className="text-xs text-slate-700 font-medium">
                      Vehicle has an approved GPS Tracker or Anti-Theft Alarm (Qualifies for 7% discount)
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-blue-600/20 transition"
              >
                <span>Next: Coverage Options</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 2: COVERAGE SELECTION */}
        {/* ========================================================= */}
        {step === 2 && (
          <form
            onSubmit={handleCalculateQuote}
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-8 shadow-sm"
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                Select Your Coverage Level & Deductible
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Notice how the price tier dynamically adjusts based on the protection level you choose.
              </p>
            </div>

            {/* Plan Tiers with Distinct Pricing Multipliers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: "Basic",
                  name: "Basic Liability",
                  tag: "Budget Tier",
                  priceRange: `$${getTierEstimate("Basic").min} – $${getTierEstimate("Basic").max} / mo`,
                  multiplierText: "0.75x Baseline (-25%)",
                  desc: "Essential state-minimum coverage for bodily injury and third-party property damage.",
                },
                {
                  id: "Standard",
                  name: "Standard Protection",
                  tag: "Most Popular",
                  priceRange: `$${getTierEstimate("Standard").min} – $${getTierEstimate("Standard").max} / mo`,
                  multiplierText: "1.00x Baseline",
                  popular: true,
                  desc: "Comprehensive liability plus collision coverage and 24/7 roadside emergency aid.",
                },
                {
                  id: "Comprehensive",
                  name: "Full Comprehensive",
                  tag: "Max Coverage",
                  priceRange: `$${getTierEstimate("Comprehensive").min} – $${getTierEstimate("Comprehensive").max} / mo`,
                  multiplierText: "1.50x Baseline (+50%)",
                  desc: "Max protection including theft, weather, vandalism, zero-deductible glass & rental car.",
                },
              ].map((tier) => (
                <div
                  key={tier.id}
                  onClick={() => handleSelectPlanTier(tier.id)}
                  className={`p-5 rounded-2xl cursor-pointer border transition relative flex flex-col justify-between ${
                    formData.coverageLevel === tier.id
                      ? "bg-blue-50/70 border-blue-600 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/30"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                      Recommended
                    </span>
                  )}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold text-blue-600 tracking-wider">
                        {tier.tag}
                      </span>
                      {formData.coverageLevel === tier.id && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mt-1">{tier.name}</h3>
                    <div className="text-xl font-extrabold text-slate-900 mt-2">
                      {tier.priceRange}
                    </div>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{tier.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    Pricing factor: <strong className="text-slate-800">{tier.multiplierText}</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Estimate Feedback Box */}
            <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Info className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-xs text-slate-700">
                  Selected: <strong className="text-slate-900">{formData.coverageLevel} Plan</strong> with{" "}
                  <strong className="text-slate-900">${formData.deductibleAmount} Deductible</strong>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 block">Estimated Monthly:</span>
                <span className="text-lg font-bold text-emerald-600">
                  ${liveEstimate.min} – ${liveEstimate.max} / mo
                </span>
              </div>
            </div>

            {/* Deductible Choice */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <label className="text-sm font-semibold text-slate-900 block">
                Choose Your Deductible Amount (Out-of-Pocket on Claim)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { amount: 1000, label: "$1,000", sub: "Lowest premium (-15%)" },
                  { amount: 500, label: "$500", sub: "Standard balanced choice" },
                  { amount: 250, label: "$250", sub: "Low deductible (+35%)" },
                ].map((d) => (
                  <button
                    type="button"
                    key={d.amount}
                    onClick={() => setFormData({ ...formData, deductibleAmount: d.amount })}
                    className={`p-4 rounded-xl border text-center transition ${
                      formData.deductibleAmount === d.amount
                        ? "bg-blue-600 text-white border-blue-600 font-bold shadow-md shadow-blue-600/20"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-lg font-bold">{d.label}</div>
                    <div className="text-[11px] opacity-80 mt-1">{d.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Coverage Features Switches */}
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <label className="text-sm font-semibold text-slate-900 block">
                Coverage Inclusions & Add-Ons
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { key: "liabilityCoverage", label: "Liability Protection ($100k/$300k)", fee: "Included" },
                  { key: "collisionCoverage", label: "Collision & Vehicle Repair Damage", fee: "+$18/mo" },
                  { key: "comprehensiveCoverage", label: "Theft, Fire & Weather Protection", fee: "+$24/mo" },
                  { key: "roadsideAssistance", label: "24/7 Roadside Assistance & Towing", fee: "+$8/mo" },
                  { key: "rentalReimbursement", label: "Rental Car Reimbursement Allowance", fee: "+$7/mo" },
                ].map((feat) => (
                  <label
                    key={feat.key}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={Boolean(formData[feat.key])}
                        onChange={(e) => setFormData({ ...formData, [feat.key]: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-800 font-medium">{feat.label}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold">{feat.fee}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={calculating}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-blue-600/20 transition"
              >
                {calculating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Calculating Real-Time Rates...</span>
                  </>
                ) : (
                  <>
                    <span>Calculate Instant Quote</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 3: QUOTE BREAKDOWN */}
        {/* ========================================================= */}
        {step === 3 && calculatedQuote && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Quote ID: {calculatedQuote.id}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">Your Personalized Insurance Quote</h2>
                <p className="text-sm text-slate-500">
                  Covering: {formData.vehicleYear} {formData.vehicleMake} {formData.vehicleModel} ({formData.coverageLevel})
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-extrabold text-slate-900">
                  ${calculatedQuote.monthlyPremium}
                  <span className="text-sm font-normal text-slate-500"> / month</span>
                </div>
                <div className="text-xs text-emerald-600 font-semibold mt-1">
                  {calculatedQuote.estimatedSavings > 0
                    ? `Estimated $${calculatedQuote.estimatedSavings} annual savings applied`
                    : "Standard transparent annual rate"}
                </div>
              </div>
            </div>

            {/* Highlights Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Deductible</span>
                <span className="text-lg font-bold text-slate-900 mt-1 block">
                  ${formData.deductibleAmount}
                </span>
                <span className="text-[11px] text-slate-500">Per approved incident claim</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Coverage Tier</span>
                <span className="text-lg font-bold text-blue-600 mt-1 block capitalize">
                  {formData.coverageLevel}
                </span>
                <span className="text-[11px] text-slate-500">
                  {formData.coverageLevel === "Basic" ? "Liability protection" : "Includes collision & aid"}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Annual Commitment</span>
                <span className="text-lg font-bold text-emerald-600 mt-1 block">
                  ${(calculatedQuote.monthlyPremium * 12).toFixed(2)} / yr
                </span>
                <span className="text-[11px] text-slate-500">Lock in your rate for 12 months</span>
              </div>
            </div>

            {/* Applied Discounts */}
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Discounts Applied to This Policy</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {calculatedQuote.discounts && calculatedQuote.discounts.length > 0 ? (
                  (typeof calculatedQuote.discounts === "string"
                    ? JSON.parse(calculatedQuote.discounts)
                    : calculatedQuote.discounts
                  ).map((d, i) => (
                    <span
                      key={i}
                      className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full font-semibold"
                    >
                      ✓ {d}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">
                    Standard rate (no qualifying discounts)
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Adjust Coverage</span>
              </button>
              <button
                onClick={handleProceedToCheckout}
                className="bg-blue-600 hover:bg-blue-500 text-white px-7 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-blue-600/20 transition"
              >
                <span>Purchase & Activate Policy</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: CHECKOUT & ACTIVATION */}
        {/* ========================================================= */}
        {step === 4 && calculatedQuote && (
          <form
            onSubmit={handleConfirmPurchase}
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-8 shadow-sm"
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-blue-600" />
                Payment & Policy Activation
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Complete checkout to bind your insurance coverage immediately and generate your official policy PDF.
              </p>
            </div>

            {/* Payment Summary Box */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <div className="font-semibold text-slate-900 text-base">Initial Premium Due Today</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Policy: {formData.vehicleMake} {formData.vehicleModel} ({formData.coverageLevel})
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                ${calculatedQuote.monthlyPremium}
              </div>
            </div>

            {/* Card Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Card Information (Simulated Sandbox)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Cardholder Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Name as it appears on card"
                    value={formData.cardholderName}
                    onChange={(e) =>
                      setFormData({ ...formData, cardholderName: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Card Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, cardNumber: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Expiration Date *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      required
                      value={formData.cardExpiryMonth || ""}
                      onChange={(e) => {
                        const month = e.target.value;
                        const year = formData.cardExpiryYear || "26";
                        setFormData({
                          ...formData,
                          cardExpiryMonth: month,
                          cardExpiry: `${month}/${year}`,
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Month</option>
                      {[
                        "01", "02", "03", "04", "05", "06",
                        "07", "08", "09", "10", "11", "12",
                      ].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <select
                      required
                      value={formData.cardExpiryYear || ""}
                      onChange={(e) => {
                        const year = e.target.value;
                        const month = formData.cardExpiryMonth || "01";
                        setFormData({
                          ...formData,
                          cardExpiryYear: year,
                          cardExpiry: `${month}/${year}`,
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 11 }, (_, i) => {
                        const yFull = new Date().getFullYear() + i;
                        const yShort = String(yFull).slice(-2);
                        return (
                          <option key={yShort} value={yShort}>
                            {yFull}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">CVC *</label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    value={formData.cardCvc}
                    onChange={(e) => setFormData({ ...formData, cardCvc: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Addis Ababa"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1000"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Account Password Confirmation */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Account Password Confirmation (Optional / Security)
              </label>
              <input
                type="password"
                placeholder="Enter account password to confirm transaction"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500">
                Authorized under active session: {user?.email}
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={purchasing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
              >
                {purchasing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing & Binding Policy...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirm & Activate Policy (${calculatedQuote.monthlyPremium})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 5: SUCCESS STATE */}
        {/* ========================================================= */}
        {step === 5 && purchaseResult && (
          <div className="bg-white border border-emerald-200 rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-sm relative overflow-hidden">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-600 shadow-md shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="max-w-lg mx-auto">
              <h2 className="text-3xl font-extrabold text-slate-900">Your Policy is Active!</h2>
              <p className="text-sm text-slate-600 mt-2">
                Payment has been processed, your vehicle is officially covered, and your policy
                contract has been generated.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2.5">
              <div className="flex justify-between text-slate-500">
                <span>Policy Number:</span>
                <span className="font-mono text-slate-900 font-semibold">
                  {purchaseResult.newPolicyId}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Payment Reference:</span>
                <span className="font-mono text-slate-900">{purchaseResult.paymentId}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Insured Vehicle:</span>
                <span className="text-slate-900 font-medium">
                  {formData.vehicleYear} {formData.vehicleMake} {formData.vehicleModel}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Amount Paid:</span>
                <span className="text-emerald-600 font-bold">${calculatedQuote?.monthlyPremium}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Status:</span>
                <span className="text-emerald-700 font-semibold uppercase">Active & Protected</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>{downloadingPdf ? "Downloading..." : "Download Official PDF Policy"}</span>
              </button>

              <button
                onClick={() => navigate("/dashboard")}
                className="bg-blue-600 hover:bg-blue-500 text-white px-7 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-blue-600/20 transition"
              >
                <span>View on My Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        © {new Date().getFullYear()} VIMS Insurance System. All rights reserved.
      </footer>
    </div>
  );
}
