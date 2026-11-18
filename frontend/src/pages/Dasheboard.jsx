import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  Shield,
  Car,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Download,
  LogOut,
  User,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  ChevronRight,
  X,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  UploadCloud,
  Paperclip,
  Image,
  Bell,
  BarChart3,
  CheckCheck,
  Trash2,
  Filter,
  Menu,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import api from "../lib/axios";
import useAuthStore from "../store/authStore";
import ThemeToggle from "../components/ThemeToggle";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading, logout, setUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState("overview");
  const [dataLoading, setDataLoading] = useState(true);

  // Data states
  const [vehicles, setVehicles] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [viewingClaim, setViewingClaim] = useState(null);
  const [profileData, setProfileData] = useState(null);

  // Notifications and Reports States
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifFilter, setNotifFilter] = useState("all");
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [downloadingStatementType, setDownloadingStatementType] = useState(null);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const notifDropdownRef = useRef(null);

  // Responsive Navigation & Session States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Modals
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [submittingVehicle, setSubmittingVehicle] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [downloadingPolicyId, setDownloadingPolicyId] = useState(null);
  const [downloadingSettlementId, setDownloadingSettlementId] = useState(null);

  // Forms
  const [vehicleForm, setVehicleForm] = useState({
    name: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    vin: "",
    color: "",
    fuelType: "Petrol",
    vehicleType: "Sedan",
    marketValue: "",
    odometerReading: "",
    isCommercial: false,
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  const [claimForm, setClaimForm] = useState({
    vehicleId: "",
    policyId: "",
    type: "Collision",
    estimatedAmount: "",
    incidentDate: new Date().toISOString().split("T")[0],
    incidentTime: "12:00",
    location: "",
    description: "",
    currentMileage: "",
    contactPhone: "",
    contactEmail: "",
    customShopName: "",
    customShopAddress: "",
    supportingDocuments: [],
  });
  const [uploadingClaimFiles, setUploadingClaimFiles] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phone2: "",
    address: "",
    city: "",
    subCity: "",
    country: "Ethiopia",
    age: "",
    gender: "Male",
    occupation: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  // Load all dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setDataLoading(true);

      const [vehicleRes, policyRes, claimRes, profileRes, notifsRes] = await Promise.allSettled([
        api.get("/vehicle/getvehicle"),
        api.get("/policy/user-policies"),
        api.get("/claim/getuserclaim"),
        api.get("/user/getmyprofile"),
        api.get(`/notifications?userId=${user?.id || ""}`),
      ]);

      const rawVehicles = (vehicleRes.status === "fulfilled" && vehicleRes.value.data?.success)
        ? (vehicleRes.value.data.vehicles || [])
        : [];
      const rawPolicies = (policyRes.status === "fulfilled" && policyRes.value.data?.success)
        ? (policyRes.value.data.data || [])
        : [];

      const policyMap = new Map();
      rawPolicies.forEach((p) => {
        if (p && p.id) policyMap.set(p.id, p);
      });
      rawVehicles.forEach((v) => {
        if (v && v.policies && Array.isArray(v.policies)) {
          v.policies.forEach((vp) => {
            if (vp && vp.id && !policyMap.has(vp.id)) {
              policyMap.set(vp.id, { ...vp, vehicle: v, vehicleId: v.id });
            }
          });
        }
      });
      const unifiedPolicies = Array.from(policyMap.values());

      setVehicles(rawVehicles);
      setPolicies(unifiedPolicies);

      if (claimRes.status === "fulfilled" && claimRes.value.data?.success) {
        setClaims(claimRes.value.data.claims || []);
      }

      if (notifsRes.status === "fulfilled" && notifsRes.value.data?.success) {
        const notifs = notifsRes.value.data.notifications || [];
        setNotifications(notifs);
        setUnreadNotifCount(notifs.filter((n) => n.status === "unread").length);
      }

      if (profileRes.status === "fulfilled" && profileRes.value.data?.success) {
        const u = profileRes.value.data.userProfile;
        if (u) {
          setProfileData(u);
          const p = u.profile || {};
          setProfileForm({
            firstName: u.firstName || "",
            lastName: u.lastName || "",
            email: u.email || "",
            phone: p.phone || "",
            phone2: p.phone2 || "",
            address: p.address || "",
            city: p.city || "",
            subCity: p.subCity || "",
            country: p.country || "Ethiopia",
            age: p.age || "",
            gender: p.gender || "Male",
            occupation: p.occupation || "",
            emergencyContactName: p.emergencyContactName || "",
            emergencyContactPhone: p.emergencyContactPhone || "",
          });
        }
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }

    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [authLoading, isAuthenticated, navigate, loadDashboardData]);

  // Set default policy in claim form if available
  useEffect(() => {
    if (policies.length > 0 && !claimForm.policyId) {
      setClaimForm((prev) => ({ ...prev, policyId: policies[0].id }));
    }
  }, [policies, claimForm.policyId]);

  // Auto-open claim details if claimId is provided in URL query parameters
  useEffect(() => {
    const claimIdParam = searchParams.get("claimId");
    if (claimIdParam && claims.length > 0) {
      const found = claims.find(
        (c) => String(c.id).toLowerCase() === String(claimIdParam).toLowerCase()
      );
      if (found) {
        setViewingClaim(found);
        setActiveTab("claims");
      }
    }
  }, [searchParams, claims]);

  // Click-outside listener for notification dropdown & Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(event.target)
      ) {
        setShowNotificationDropdown(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setShowNotificationDropdown(false);
        setShowLogoutConfirm(false);
        setMobileMenuOpen(false);
      }
    }

    if (showNotificationDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNotificationDropdown]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
      toast.success("Logged out successfully");
      navigate("/");
    } catch (err) {
      setShowLogoutConfirm(false);
      navigate("/");
    }
  };

  // Notification Handlers
  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.put("/notifications/mark-as-read", { userId: user?.id });
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
      setUnreadNotifCount(0);
      toast.success("All notifications marked as read.");
    } catch (err) {
      console.error("Error marking all read:", err);
      // Fallback local update
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
      setUnreadNotifCount(0);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (notif.status === "unread") {
        await api.put(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, status: "read" } : n))
        );
        setUnreadNotifCount((prev) => Math.max(0, prev - 1));
      }
      setShowNotificationDropdown(false);

      if (notif.type === "claim" || (notif.message && notif.message.toLowerCase().includes("claim"))) {
        setActiveTab("claims");
        const matched = claims.find(
          (c) =>
            (notif.referenceId && String(c.id) === String(notif.referenceId)) ||
            (notif.message && notif.message.includes(c.id))
        );
        if (matched) {
          setViewingClaim(matched);
        }
      } else if (notif.type === "policy" || (notif.message && notif.message.toLowerCase().includes("policy"))) {
        setActiveTab("policies");
      }
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleDeleteNotification = async (notifId, e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    try {
      const target = notifications.find((n) => n.id === notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      if (target?.status === "unread") {
        setUnreadNotifCount((prev) => Math.max(0, prev - 1));
      }

      await api.delete(`/notifications/${notifId}`);
      toast.success("Notification removed.");
    } catch (err) {
      console.error("Error deleting notification:", err);
      loadDashboardData();
      toast.error("Could not delete notification. Please try again.");
    }
  };

  // Add Vehicle Submit
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.brand?.trim() || !vehicleForm.model?.trim() || !vehicleForm.vin?.trim()) {
      toast.error("Make (brand), Model, and VIN are required.");
      return;
    }
    if (!vehicleForm.color?.trim()) {
      toast.error("Vehicle color is required.");
      return;
    }
    const val = parseFloat(vehicleForm.marketValue);
    if (isNaN(val) || val <= 0) {
      toast.error("Estimated market value ($ USD) greater than 0 is required.");
      return;
    }
    const odo = parseInt(vehicleForm.odometerReading, 10);
    if (isNaN(odo) || odo < 0) {
      toast.error("Valid odometer reading (km) is required.");
      return;
    }

    try {
      setSubmittingVehicle(true);
      const res = await api.post("/vehicle/addvehicle", {
        ...vehicleForm,
        name: vehicleForm.name || `${vehicleForm.brand} ${vehicleForm.model}`,
        year: parseInt(vehicleForm.year, 10) || new Date().getFullYear(),
        marketValue: val,
        odometerReading: odo,
        color: vehicleForm.color.trim(),
      });

      if (res.data?.success) {
        toast.success("Vehicle registered successfully!");
        setShowVehicleModal(false);
        setVehicleForm({
          name: "",
          brand: "",
          model: "",
          year: new Date().getFullYear(),
          vin: "",
          color: "",
          fuelType: "Petrol",
          vehicleType: "Sedan",
          marketValue: "",
          odometerReading: "",
          isCommercial: false,
          purchaseDate: new Date().toISOString().split("T")[0],
        });
        loadDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add vehicle.");
    } finally {
      setSubmittingVehicle(false);
    }
  };

  // Open Claim Modal with dynamic vehicle/policy linkage
  const openClaimModal = (targetVehicleId = null) => {
    let chosenVehId = targetVehicleId;
    if (!chosenVehId && vehicles.length > 0) {
      chosenVehId = vehicles[0].id;
    }
    const targetVeh = vehicles.find((v) => v.id === chosenVehId);
    const matchingPolicy = chosenVehId
      ? (policies.find((p) => p.vehicleId === chosenVehId || p.vehicle?.id === chosenVehId) || targetVeh?.policies?.[0] || null)
      : (policies[0] || null);

    setClaimForm((prev) => ({
      ...prev,
      vehicleId: chosenVehId || "",
      policyId: matchingPolicy?.id || "",
      contactPhone: profileForm.phone || prev.contactPhone || "",
      contactEmail: user?.email || prev.contactEmail || "",
      supportingDocuments: [],
    }));
    setShowClaimModal(true);
  };

  // Upload damage evidence files to backend
  const handleClaimFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      setUploadingClaimFiles(true);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success && res.data.urls) {
        setClaimForm((prev) => ({
          ...prev,
          supportingDocuments: [...(prev.supportingDocuments || []), ...res.data.urls],
        }));
        toast.success(`${files.length} incident document(s) uploaded!`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload evidence file(s). Please try again.");
    } finally {
      setUploadingClaimFiles(false);
      e.target.value = "";
    }
  };

  const handleRemoveClaimFile = (indexToRemove) => {
    setClaimForm((prev) => ({
      ...prev,
      supportingDocuments: (prev.supportingDocuments || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // File Claim Submit
  const handleFileClaim = async (e) => {
    e.preventDefault();
    if (!claimForm.vehicleId) {
      toast.error("Please select a registered vehicle for this claim.");
      return;
    }
    const vehClaims = claims.filter(
      (c) => c.vehicleId === claimForm.vehicleId || c.vehicle?.id === claimForm.vehicleId
    );
    if (vehClaims.length >= 3) {
      toast.error("Maximum annual claim limit (3 claims) reached for this vehicle.");
      return;
    }
    if (!claimForm.policyId) {
      toast.error("An active insurance policy is required to file a claim for this vehicle.");
      return;
    }
    if (!claimForm.description?.trim() || !claimForm.location?.trim()) {
      toast.error("Please fill in incident description and location.");
      return;
    }

    try {
      setSubmittingClaim(true);
      const res = await api.post("/claim/create", {
        ...claimForm,
        vehicleId: claimForm.vehicleId,
        policyId: claimForm.policyId,
        currentMileage: claimForm.currentMileage ? parseInt(claimForm.currentMileage, 10) : undefined,
      });

      if (res.data?.success) {
        toast.success("Claim submitted successfully!");
        setShowClaimModal(false);
        setClaimForm({
          vehicleId: "",
          policyId: "",
          type: "Collision",
          estimatedAmount: "",
          incidentDate: new Date().toISOString().split("T")[0],
          incidentTime: "12:00",
          location: "",
          description: "",
          currentMileage: "",
          contactPhone: "",
          contactEmail: "",
          customShopName: "",
          customShopAddress: "",
          supportingDocuments: [],
        });
        loadDashboardData();
        setActiveTab("claims");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit claim.");
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Save Profile Changes
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await api.put("/user/updateprofile", profileForm);
      if (res.data?.success) {
        toast.success("Profile updated successfully!");
        if (user) {
          setUser({
            ...user,
            firstName: profileForm.firstName,
            lastName: profileForm.lastName,
          });
        }
        loadDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Download Policy PDF
  const handleDownloadPolicy = async (policyId, policyName) => {
    try {
      setDownloadingPolicyId(policyId);
      const res = await api.get(`/policy/${policyId}/document`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Policy_${policyName ? policyName.replace(/\s+/g, "_") : policyId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Policy document downloaded.");
    } catch (err) {
      toast.error("Could not download policy PDF. Please try again.");
    } finally {
      setDownloadingPolicyId(null);
    }
  };

  // Download Claim Settlement Notice PDF
  const handleDownloadSettlementLetter = async (claimId) => {
    try {
      setDownloadingSettlementId(claimId);
      const res = await api.get(`/claim/${claimId}/settlement-document`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Settlement_Notice_${claimId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Settlement authorization notice downloaded.");
    } catch (err) {
      console.error("Settlement PDF download error:", err);
      toast.error("Could not generate settlement notice. Please try again.");
    } finally {
      setDownloadingSettlementId(null);
    }
  };

  // Download Official Statement, Proof of Insurance Certificate, or Loss Run Statement
  const handleDownloadStatement = async (statementType = "statement") => {
    try {
      setDownloadingReport(true);
      setDownloadingStatementType(statementType);

      const res = await api.get("/reports/customer-statement", {
        params: { type: statementType },
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const filenameMap = {
        certificate: "Proof_of_Insurance_Certificate",
        loss_run: "Loss_Run_Claims_Statement",
        claims: "Loss_Run_Claims_Statement",
        statement: "Coverage_Statement",
      };
      const label = filenameMap[statementType] || "Coverage_Statement";
      a.download = `VIMS_${label}_${user?.firstName ? `${user.firstName}_` : ""}${user?.id ? String(user.id).slice(0, 8) : "Account"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      const successMessages = {
        certificate: "Proof of Insurance Certificate downloaded successfully!",
        loss_run: "Loss Run & Claims Statement downloaded successfully!",
        claims: "Loss Run & Claims Statement downloaded successfully!",
        statement: "Official Coverage Statement downloaded successfully!",
      };
      toast.success(successMessages[statementType] || "Statement downloaded successfully!");
    } catch (err) {
      console.error("Statement PDF download error:", err);
      toast.error("Could not generate statement PDF. Please try again.");
    } finally {
      setDownloadingReport(false);
      setDownloadingStatementType(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="font-medium text-slate-600">Loading your portal...</span>
        </div>
      </div>
    );
  }

  const activePoliciesCount = policies.filter(
    (p) => (p.status || "").toLowerCase() === "active"
  ).length;

  const pendingClaimsCount = claims.filter((c) =>
    ["pending", "processing", "under review"].includes((c.status || "").toLowerCase())
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      {/* Mobile Top Header (Small Screens Only) */}
      <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-sm text-white shadow-md shadow-blue-500/20">
            V
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 leading-tight">VIMS</div>
            <div className="text-[10px] text-blue-600 capitalize font-medium">{activeTab}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Switcher Toggle */}
          <ThemeToggle size="sm" />

          {/* Mobile Notification Bell */}
          <button
            onClick={() => {
              setActiveTab("notifications");
              setMobileMenuOpen(false);
            }}
            className="relative p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR: Desktop Persistent / Mobile Slide-Out Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-64 md:flex ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl text-white shadow-md shadow-blue-500/20">
                V
              </div>
              <div>
                <div className="font-bold text-lg text-slate-900 tracking-wide">VIMS</div>
                <div className="text-xs text-blue-600 font-semibold">Customer Portal</div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => {
                setActiveTab("overview");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5" />
                <span>Overview</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab("vehicles");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === "vehicles"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5" />
                <span>My Vehicles</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === "vehicles" ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {vehicles.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("policies");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === "policies"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                <span>My Policies</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === "policies" ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {policies.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("claims");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === "claims"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <span>Claims</span>
              </div>
              {pendingClaimsCount > 0 && (
                <span className="text-xs bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                  {pendingClaimsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("profile");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === "profile"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5" />
                <span>My Profile</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab("notifications");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === "notifications"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </div>
              {unreadNotifCount > 0 && (
                <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("reports");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === "reports"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5" />
                <span>Statements & Reports</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: User info & logout (Docked inside menu) */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          {/* Appearance Toggle */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-700">Appearance</span>
            <ThemeToggle size="sm" showLabel={true} />
          </div>

          <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              {user?.firstName?.[0] || "U"}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-slate-900 truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Customer"}
              </div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setShowLogoutConfirm(true);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200 px-6 py-4 flex flex-wrap justify-between items-center gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 capitalize">
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "vehicles" && "Vehicle Fleet Management"}
              {activeTab === "policies" && "Insurance Policies"}
              {activeTab === "claims" && "Claims & Incident Reports"}
              {activeTab === "profile" && "Account & Contact Profile"}
              {activeTab === "notifications" && "Notification Center"}
              {activeTab === "reports" && "Statements & Coverage Reports"}
            </h1>
            {user?.isVerified ? (
              <span className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                Unverified
              </span>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Notification Bell with Outside Click Close */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 transition"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Quick Dropdown Drawer */}
              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">Your Notices</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                        {notifications.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotificationDropdown(false);
                          setActiveTab("notifications");
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        View all
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNotificationDropdown(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title="Close panel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No notifications found
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setShowNotificationDropdown(false);
                            setActiveTab("notifications");
                          }}
                          className={`p-3 rounded-xl transition cursor-pointer group ${
                            n.status === "unread"
                              ? "bg-blue-50/70 text-slate-800 hover:bg-blue-50 border-l-2 border-blue-600"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">{n.title}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-slate-400">
                                {new Date(n.sentDate).toLocaleDateString()}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteNotification(n.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                title="Delete notification"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {user?.role === "ADMIN" && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 px-3 py-2 rounded-xl text-sm font-semibold transition"
              >
                <Shield className="w-4 h-4 text-amber-700" />
                <span>Admin Console</span>
              </Link>
            )}
            <button
              onClick={() => setShowVehicleModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-blue-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Register Vehicle</span>
            </button>
            <button
              onClick={() => openClaimModal()}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>File a Claim</span>
            </button>
            {/* Theme Toggle (Light / Dark Option) */}
            <ThemeToggle size="md" />

            <button
              onClick={loadDashboardData}
              title="Refresh Data"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 max-w-7xl mx-auto space-y-8">
          {user?.role === "ADMIN" && (
            <div className="admin-mode-banner p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <span>Administrator Mode Active</span>
                    <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/30">
                      ADMIN
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    You have administrative underwriting and claims adjudication privileges.
                  </p>
                </div>
              </div>
              <Link
                to="/admin"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition whitespace-nowrap"
              >
                <span>Switch to Admin Console</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          )}
          {/* ========================================================= */}
          {/* TAB 1: OVERVIEW */}
          {/* ========================================================= */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Welcome Banner */}
              <div className="welcome-banner relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50/60 to-slate-100 border border-blue-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="max-w-2xl">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    Welcome back, {user?.firstName || "Customer"}!
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 mt-2 text-sm sm:text-base leading-relaxed">
                    Here is your real-time vehicle protection snapshot. You can manage registered
                    vehicles, review active policies, and track claims directly from this portal.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-6">
                    <button
                      onClick={() => setActiveTab("vehicles")}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition"
                    >
                      Manage Vehicles ({vehicles.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("policies")}
                      className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition"
                    >
                      View Coverage & PDFs
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div
                  onClick={() => setActiveTab("vehicles")}
                  className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition"
                  title="Click to view all vehicles"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      My Vehicles
                    </span>
                    <div className="text-3xl font-bold text-slate-900 mt-1">{vehicles.length}</div>
                    <span className="text-xs text-blue-600 font-medium mt-1 inline-block">
                      {vehicles.length === 1 ? "1 vehicle registered" : `${vehicles.length} vehicles registered`}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Car className="w-6 h-6" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("policies")}
                  className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer hover:border-emerald-400 hover:shadow-md transition"
                  title="Click to view all policies"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Active Policies
                    </span>
                    <div className="text-3xl font-bold text-slate-900 mt-1">
                      {activePoliciesCount || policies.length}
                    </div>
                    <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">
                      {policies.length > 0 ? "Coverage is in effect" : "No active policies yet"}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("claims")}
                  className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer hover:border-amber-400 hover:shadow-md transition"
                  title="Click to view all claims"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Claims Filed
                    </span>
                    <div className="text-3xl font-bold text-slate-900 mt-1">{claims.length}</div>
                    <span className="text-xs text-amber-600 font-medium mt-1 inline-block">
                      {pendingClaimsCount > 0
                        ? `${pendingClaimsCount} under review`
                        : "0 open pending claims"}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("profile")}
                  className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer hover:border-purple-400 hover:shadow-md transition"
                  title="Click to view account profile"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Account Status
                    </span>
                    <div className="text-2xl font-bold text-slate-900 mt-1">
                      {user?.isVerified ? "Verified" : "Pending"}
                    </div>
                    <span className="text-xs text-slate-500 mt-1 inline-block">
                      Role: {user?.role || "CUSTOMER"}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                    <User className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Two Column Grid: Recent Policies & Recent Vehicles */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Policies Preview */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-lg text-slate-900">Your Insurance Policies</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("policies")}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                      <span>View All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {policies.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <Shield className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm">You do not have any active insurance policies yet.</p>
                      <button
                        onClick={() => navigate("/get-quote")}
                        className="mt-3 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1 shadow-sm"
                      >
                        Explore Coverage Plans
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {policies.slice(0, 3).map((policy) => (
                        <div
                          key={policy.id}
                          className="bg-slate-50 border border-slate-200 hover:border-slate-300 p-4 rounded-xl flex items-center justify-between transition"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{policy.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {policy.vehicle
                                ? `${policy.vehicle.brand} ${policy.vehicle.model} (${policy.vehicle.year})`
                                : `Type: ${policy.type || "Auto Coverage"}`}
                            </div>
                            <div className="text-xs text-emerald-600 font-semibold mt-1">
                              Premium: ${policy.premiumAmount || 0} / term
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full uppercase font-medium">
                              {policy.status || "Active"}
                            </span>
                            <button
                              onClick={() => handleDownloadPolicy(policy.id, policy.name)}
                              disabled={downloadingPolicyId === policy.id}
                              title="Download PDF"
                              className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-sm transition"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Registered Vehicles Preview */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-lg text-slate-900">Registered Vehicles</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("vehicles")}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                      <span>View All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {vehicles.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <Car className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm">No vehicles registered under your account.</p>
                      <button
                        onClick={() => setShowVehicleModal(true)}
                        className="mt-3 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Register Your First Vehicle
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {vehicles.slice(0, 3).map((vehicle) => (
                        <div
                          key={vehicle.id}
                          className="bg-slate-50 border border-slate-200 hover:border-slate-300 p-4 rounded-xl flex items-center justify-between transition"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">
                              {vehicle.brand} {vehicle.model}{" "}
                              <span className="text-xs text-slate-500">({vehicle.year})</span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                              VIN: {vehicle.vin}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {vehicle.vehicleType} • {vehicle.fuelType} • {vehicle.color}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
                              {vehicle.status || "Registered"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: MY VEHICLES */}
          {/* ========================================================= */}
          {activeTab === "vehicles" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Your Registered Vehicles</h2>
                  <p className="text-sm text-slate-500">
                    Add and manage the vehicles covered under your VIMS insurance plans.
                  </p>
                </div>
                <button
                  onClick={() => setShowVehicleModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 self-start sm:self-auto shadow-md shadow-blue-600/20 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Vehicle</span>
                </button>
              </div>

              {vehicles.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <Car className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900">No vehicles found</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                    You have not registered any vehicles yet. Registering your vehicle allows you to
                    purchase tailored insurance policies and file claims quickly.
                  </p>
                  <button
                    onClick={() => setShowVehicleModal(true)}
                    className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 shadow-md shadow-blue-600/20 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Register Your Vehicle Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 space-y-4 transition shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-blue-600 font-semibold">
                            {v.brand}
                          </div>
                          <h3 className="text-xl font-bold text-slate-900">{v.model}</h3>
                          <div className="text-xs text-slate-500 mt-0.5">Year: {v.year}</div>
                        </div>
                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                          {v.status || "Active"}
                        </span>
                      </div>

                      <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>VIN Number:</span>
                          <span className="font-mono text-slate-800 font-semibold">{v.vin}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Vehicle Type:</span>
                          <span className="text-slate-800">{v.vehicleType || "Sedan"}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Fuel Type:</span>
                          <span className="text-slate-800">{v.fuelType || "Petrol"}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Color:</span>
                          <span className="text-slate-800">{v.color || "Standard"}</span>
                        </div>
                        {v.marketValue > 0 && (
                          <div className="flex justify-between text-slate-500">
                            <span>Market Value:</span>
                            <span className="text-slate-900 font-bold">
                              ${v.marketValue.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {v.odometerReading > 0 && (
                          <div className="flex justify-between text-slate-500">
                            <span>Odometer:</span>
                            <span className="text-slate-800">
                              {v.odometerReading.toLocaleString()} km
                            </span>
                          </div>
                        )}
                        {/* Claims Filed & Frequency Limit (Point 2) */}
                        {(() => {
                          const vehClaims = claims.filter((c) => c.vehicleId === v.id || c.vehicle?.id === v.id);
                          const claimCount = vehClaims.length;
                          const maxLimit = 3;
                          return (
                            <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-slate-100">
                              <span>Claims Filed:</span>
                              <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                                claimCount >= maxLimit
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : claimCount > 0
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "text-slate-600"
                              }`}>
                                {claimCount} / {maxLimit} max allowed
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="pt-2">
                        {(() => {
                          // Find all active policies covering this vehicle (Point 6)
                          const vehPolicies = policies.filter(
                            (p) => p.vehicleId === v.id || p.vehicle?.id === v.id
                          );
                          if (v.policies && Array.isArray(v.policies)) {
                            v.policies.forEach((vp) => {
                              if (!vehPolicies.some((p) => p.id === vp.id)) {
                                vehPolicies.push(vp);
                              }
                            });
                          }

                          const vehClaims = claims.filter((c) => c.vehicleId === v.id || c.vehicle?.id === v.id);
                          const claimCount = vehClaims.length;
                          const isClaimLimitReached = claimCount >= 3;

                          if (vehPolicies.length > 0) {
                            return (
                              <div className="space-y-2.5">
                                <div className="space-y-1.5">
                                  {vehPolicies.map((pol) => (
                                    <div
                                      key={pol.id}
                                      className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl flex items-center justify-between"
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                                        <span className="truncate font-semibold">{pol.name}</span>
                                      </div>
                                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded shrink-0">
                                        ${Number(pol.coverageAmount || 0).toLocaleString()} limit
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                <div className="grid grid-cols-1 gap-2 pt-1">
                                  <button
                                    onClick={() => openClaimModal(v.id)}
                                    disabled={isClaimLimitReached}
                                    className={`w-full text-xs font-semibold py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                                      isClaimLimitReached
                                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                        : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300"
                                    }`}
                                  >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>
                                      {isClaimLimitReached
                                        ? "Claim Limit Reached (3/3 Filed)"
                                        : "File Claim for this Vehicle"}
                                    </span>
                                  </button>

                                  {/* Point 6: Allow Getting More Than One Policy for One Vehicle */}
                                  <Link
                                    to={`/get-quote?vehicleId=${v.id}&make=${encodeURIComponent(
                                      v.brand
                                    )}&model=${encodeURIComponent(v.model)}&year=${v.year}`}
                                    className="w-full text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-2 rounded-xl transition flex items-center justify-center gap-1.5"
                                  >
                                    <Shield className="w-3.5 h-3.5" />
                                    <span>+ Add Another Policy for this Vehicle</span>
                                  </Link>
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div className="space-y-2">
                                <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-xl flex items-center justify-between">
                                  <span>No active policy</span>
                                </div>
                                <Link
                                  to={`/get-quote?vehicleId=${v.id}&make=${encodeURIComponent(
                                    v.brand
                                  )}&model=${encodeURIComponent(v.model)}&year=${v.year}`}
                                  className="w-full text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                  <span>Get Policy for this Vehicle</span>
                                </Link>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: MY POLICIES */}
          {/* ========================================================= */}
          {activeTab === "policies" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Your Insurance Policies</h2>
                  <p className="text-sm text-slate-500">
                    Review your coverage details, policy terms, and download official documents.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/get-quote")}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 self-start sm:self-auto shadow-md shadow-blue-600/20 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Explore New Policy</span>
                </button>
              </div>

              {policies.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900">No policies found</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                    You currently have no active insurance policies. Protect your vehicle against
                    unforeseen damages, collisions, and liability today.
                  </p>
                  <button
                    onClick={() => navigate("/get-quote")}
                    className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 shadow-md shadow-blue-600/20 transition"
                  >
                    View Insurance Coverage Options
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {policies.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 space-y-4 transition shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-mono uppercase font-semibold">
                              {p.type || "Comprehensive"}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">ID: {p.id}</span>
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mt-1">{p.name}</h3>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-semibold uppercase">
                            {p.status || "Active"}
                          </span>
                          <button
                            onClick={() => handleDownloadPolicy(p.id, p.name)}
                            disabled={downloadingPolicyId === p.id}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span>
                              {downloadingPolicyId === p.id ? "Downloading..." : "Download PDF"}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-500 block">Insured Vehicle:</span>
                          <span className="font-semibold text-slate-900 mt-1 block truncate">
                            {p.vehicle
                              ? `${p.vehicle.brand} ${p.vehicle.model} (${p.vehicle.year})`
                              : "Universal Policy"}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-500 block">Available Coverage:</span>
                          <span className={`font-bold text-sm mt-1 block ${
                            (p.coverageAmount || 0) > 0 ? "text-emerald-600" : "text-amber-600"
                          }`}>
                            ${Number(p.coverageAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {(p.coverageAmount || 0) > 0 ? "Remaining limit" : "Coverage exhausted"}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-500 block">Premium Rate:</span>
                          <span className="font-semibold text-slate-900 text-sm mt-1 block">
                            ${p.premiumAmount || 0} / yr
                          </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-500 block">Effective From:</span>
                          <span className="font-semibold text-slate-900 mt-1 block">
                            {p.startDate ? new Date(p.startDate).toLocaleDateString() : "Active"}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-500 block">Expires On:</span>
                          <span className="font-semibold text-slate-900 mt-1 block">
                            {p.endDate ? new Date(p.endDate).toLocaleDateString() : "Ongoing"}
                          </span>
                        </div>
                      </div>

                      {p.coverageDetails && (
                        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <strong className="text-slate-800">Coverage Summary:</strong>{" "}
                          {typeof p.coverageDetails === "object"
                            ? p.coverageDetails.description || JSON.stringify(p.coverageDetails)
                            : p.coverageDetails}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: CLAIMS */}
          {/* ========================================================= */}
          {activeTab === "claims" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Claims Management</h2>
                  <p className="text-sm text-slate-500">
                    Track existing claims and file new incidents for rapid reimbursement.
                  </p>
                </div>
                <button
                  onClick={() => openClaimModal()}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 self-start sm:self-auto shadow-md shadow-blue-600/20 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>File a Claim</span>
                </button>
              </div>

              {claims.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900">No claims filed</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                    You have no active or historical claims filed. If you ever experience an incident
                    or accident, our adjusters are available 24/7.
                  </p>
                  <button
                    onClick={() => openClaimModal()}
                    className="mt-6 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Submit an Incident Report
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {claims.map((claim) => (
                    <div
                      key={claim.id}
                      onClick={() => setViewingClaim(claim)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 space-y-4 transition shadow-sm hover:shadow-md cursor-pointer group"
                      title="Click to view full claim details"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-2.5 py-0.5 rounded font-mono uppercase font-semibold">
                              {claim.claimType || "Incident"}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">ID: {claim.id}</span>
                          </div>
                          <div className="font-semibold text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                            {claim.vehicle || "Insured Vehicle"}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {(claim.status === "approved" || claim.status === "paid") && (
                            <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 px-3 py-1 rounded-full font-bold shadow-sm">
                              Approved Settlement: {claim.amount?.startsWith("$") ? claim.amount : `$${claim.amount || "0.00"}`}
                            </span>
                          )}
                          <span
                            className={`text-xs px-3 py-1 rounded-full uppercase font-semibold border ${
                              claim.status === "approved" || claim.status === "paid"
                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                : claim.status === "denied"
                                ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                                : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            }`}
                          >
                            Status: {claim.status || "Pending"}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingClaim(claim);
                            }}
                            className="text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800/60 flex items-center gap-1 transition"
                          >
                            <span>Claim Details</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-slate-700 leading-relaxed">{claim.description}</p>

                      {/* Denial Reason Notice if Denied */}
                      {claim.status === "denied" && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wider">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span>Claim Denial Notice</span>
                          </div>
                          <div className="text-xs text-red-800 font-medium bg-red-100/70 p-3 rounded-lg border border-red-200 leading-relaxed">
                            <span className="text-red-700 text-[11px] block font-bold mb-0.5 uppercase tracking-wide">
                              Reason for Denial:
                            </span>
                            {claim.denialReason || claim.details?.denialReason || "This claim was denied by the claims adjuster based on policy exclusions or verification findings."}
                          </div>
                          {claim.adjusterNotes && (
                            <div className="text-xs text-red-700 pt-1">
                              <span className="font-semibold text-red-900">Adjuster Remarks: </span>
                              {claim.adjusterNotes}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Approved Settlement Banner if Approved / Paid (Point 4) */}
                      {(claim.status === "approved" || claim.status === "paid") && (
                        <div className="bg-gradient-to-r from-emerald-50 via-emerald-100/40 to-white dark:from-emerald-950/60 dark:via-emerald-900/30 dark:to-slate-900 border border-emerald-300 dark:border-emerald-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                <span>Insurance Settlement Approved</span>
                                <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">AUTHORIZED</span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                Your claim settlement has been reviewed and authorized for reimbursement.
                              </p>
                              {claim.adjusterNotes && (
                                <p className="text-xs text-emerald-800 dark:text-emerald-300/90 mt-1 italic bg-emerald-100/60 dark:bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-200 dark:border-emerald-800/40">
                                  Adjuster Note: "{claim.adjusterNotes}"
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col sm:items-end gap-2.5 shrink-0 w-full sm:w-auto">
                            <div className="text-left sm:text-right bg-white dark:bg-slate-950/80 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/30 shadow-sm w-full sm:w-auto">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Authorized Settlement</span>
                              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                                {claim.amount?.startsWith("$") ? claim.amount : `$${claim.amount || "0.00"}`}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDownloadSettlementLetter(claim.id)}
                              disabled={downloadingSettlementId === claim.id}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm w-full sm:w-auto"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{downloadingSettlementId === claim.id ? "Generating PDF..." : "Settlement Letter (PDF)"}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Incident Date: {claim.date}</span>
                        </div>
                        {claim.coverageAmount > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-slate-400" />
                            <span>Policy Limit: ${Number(claim.coverageAmount).toLocaleString()}</span>
                          </div>
                        )}
                        {claim.status === "pending" || claim.status === "under_review" || claim.status === "processing" ? (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {claim.rawAmount > 0
                                ? `Estimated Damage: ${claim.amount}`
                                : "Settlement: Under Adjuster Assessment"}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* Attached Incident Evidence Photos & Documents */}
                      {(() => {
                        const docs = (claim.supportingDocument || "")
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        if (docs.length === 0) return null;

                        return (
                          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                            <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                                <span>Attached Incident Evidence ({docs.length} file{docs.length > 1 ? "s" : ""})</span>
                              </span>
                              <span className="text-[10px] text-slate-400">Click to view full size</span>
                            </div>
                            <div className="flex flex-wrap gap-2.5 pt-1">
                              {docs.map((docUrl, idx) => {
                                const fullUrl = docUrl.startsWith("http") ? docUrl : `${docUrl.startsWith("/") ? "" : "/"}${docUrl}`;
                                const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(docUrl);

                                return (
                                  <a
                                    key={idx}
                                    href={fullUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl p-1.5 pr-3 text-xs text-slate-700 hover:text-blue-700 transition shadow-sm"
                                  >
                                    {isImage ? (
                                      <img
                                        src={fullUrl}
                                        alt={`Damage photo ${idx + 1}`}
                                        className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                                        <FileText className="w-5 h-5" />
                                      </div>
                                    )}
                                    <div className="flex flex-col text-left">
                                      <span className="font-medium text-slate-800 group-hover:text-blue-600 transition">
                                        {isImage ? `Damage Photo #${idx + 1}` : `Document #${idx + 1}`}
                                      </span>
                                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                        Inspect <ArrowUpRight className="w-3 h-3" />
                                      </span>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Status Tracker Timeline */}
                      {claim.timeline && claim.timeline.length > 0 && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Processing Timeline
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            {claim.timeline.map((step, idx) => (
                              <React.Fragment key={idx}>
                                <div className="flex items-center gap-2 text-xs">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      step.completed ? "bg-emerald-500" : "bg-slate-300"
                                    }`}
                                  />
                                  <span
                                    className={
                                      step.completed
                                        ? "text-slate-800 font-semibold"
                                        : "text-slate-400"
                                    }
                                  >
                                    {step.status}
                                  </span>
                                </div>
                                {idx < claim.timeline.length - 1 && (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: PROFILE */}
          {/* ========================================================= */}
          {activeTab === "profile" && (
            <div className="max-w-4xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Your Profile & Contact Information</h2>
                <p className="text-sm text-slate-500">
                  Keep your personal records up to date to ensure seamless policy processing.
                </p>
              </div>

              <form
                onSubmit={handleUpdateProfile}
                className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, firstName: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, lastName: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Email Address (Locked)
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Primary Phone
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+215 9XX XXX XXX"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Country
                    </label>
                    <input
                      type="text"
                      value={profileForm.country}
                      onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      placeholder="Addis Ababa"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Sub-City / Region
                    </label>
                    <input
                      type="text"
                      value={profileForm.subCity}
                      onChange={(e) => setProfileForm({ ...profileForm, subCity: e.target.value })}
                      placeholder="Bole / Kirkos"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">Age</label>
                    <input
                      type="number"
                      value={profileForm.age}
                      onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                      placeholder="e.g. 32"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Gender
                    </label>
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={profileForm.occupation}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, occupation: e.target.value })
                      }
                      placeholder="Engineer / Business"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.emergencyContactName}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, emergencyContactName: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={profileForm.emergencyContactPhone}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, emergencyContactPhone: e.target.value })
                      }
                      placeholder="+215 9XX XXX XXX"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-2"
                  >
                    {savingProfile ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        {/* TAB: NOTIFICATIONS CENTER */}
        {activeTab === "notifications" && (
          <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header Banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <span>Activity & Adjudication Notices</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Real-time updates regarding your claim reviews, policy documents, and account notifications.
                </p>
              </div>

              {unreadNotifCount > 0 && (
                <button
                  onClick={handleMarkAllNotificationsRead}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition shadow-sm"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark All As Read</span>
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: "all", label: "All Notices", count: notifications.length },
                { id: "unread", label: "Unread", count: unreadNotifCount },
                { id: "claim", label: "Claims", count: notifications.filter((n) => n.type === "claim").length },
                { id: "policy", label: "Policies", count: notifications.filter((n) => n.type === "policy").length },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setNotifFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                    notifFilter === f.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm"
                  }`}
                >
                  <span>{f.label}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Notifications List */}
            {(() => {
              const filtered = notifications.filter((n) => {
                if (notifFilter === "unread") return n.status === "unread";
                if (notifFilter === "claim") return n.type === "claim";
                if (notifFilter === "policy") return n.type === "policy";
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                    <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No notifications found</p>
                    <p className="text-xs text-slate-400 mt-1">You are all caught up with your latest updates.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filtered.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 rounded-2xl border transition shadow-sm flex items-start justify-between gap-4 cursor-pointer hover:border-blue-400 group ${
                        n.status === "unread"
                          ? "bg-blue-50/60 border-blue-200 ring-1 ring-blue-100"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                          n.type === "claim"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : n.type === "policy"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {n.type === "claim" ? (
                            <AlertCircle className="w-4 h-4" />
                          ) : n.type === "policy" ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                            {n.status === "unread" && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                            <span>
                              {new Date(n.sentDate).toLocaleDateString([], {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              at{" "}
                              {new Date(n.sentDate).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {n.type === "claim" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab("claims");
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm transition"
                          >
                            View Claims
                          </button>
                        )}
                        {n.type === "policy" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab("policies");
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm transition"
                          >
                            View Policies
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteNotification(n.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB: STATEMENTS & COVERAGE REPORTS */}
        {activeTab === "reports" && (
          <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header Banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span>Coverage Statements & Documents</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Official insurance verification letters, coverage schedules, and loss history statements.
                </p>
              </div>

              <button
                onClick={() => handleDownloadStatement("statement")}
                disabled={downloadingReport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition disabled:opacity-50"
              >
                {downloadingReport && downloadingStatementType === "statement" ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating Statement...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Official Statement PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Active Protection
                </span>
                <div className="text-lg font-bold text-emerald-600 mt-1 font-mono">
                  ${policies.reduce((sum, p) => sum + Number(p.coverageAmount || 0), 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Registered Fleet
                </span>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {vehicles.length} {vehicles.length === 1 ? "Vehicle" : "Vehicles"}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Enrolled Policies
                </span>
                <div className="text-lg font-bold text-blue-600 mt-1">
                  {policies.length} Active
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Claims On File
                </span>
                <div className="text-lg font-bold text-amber-600 mt-1">
                  {claims.length} Recorded
                </div>
              </div>
            </div>

            {/* Document Download Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="p-2.5 w-fit rounded-xl bg-blue-50 border border-blue-200 text-blue-600 mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Proof of Insurance Certificate</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Official state verification certificate confirming active policy liability for your registered vehicles.
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadStatement("certificate")}
                  disabled={downloadingReport}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition disabled:opacity-50"
                >
                  {downloadingReport && downloadingStatementType === "certificate" ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>Generating Certificate...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Certificate PDF</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="p-2.5 w-fit rounded-xl bg-amber-50 border border-amber-200 text-amber-600 mb-3">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Loss Run & Claims Statement</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Complete adjudication history detailing all filed claims, approved payout disbursements, and review notes.
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadStatement("loss_run")}
                  disabled={downloadingReport}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition disabled:opacity-50"
                >
                  {downloadingReport && downloadingStatementType === "loss_run" ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      <span>Generating Statement...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Claims Statement</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="p-2.5 w-fit rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 mb-3">
                    <Car className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Registered Fleet Schedule</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Summary breakdown of your {vehicles.length} registered vehicles with VIN numbers, odometer values, and active policies.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("vehicles")}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect Vehicle Fleet</span>
                </button>
              </div>
            </div>

            {/* Active Policies Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Current Enrolled Policies</h3>
                  <p className="text-xs text-slate-500">Download individual official policy documents</p>
                </div>
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
                  {policies.length} {policies.length === 1 ? "Policy" : "Policies"}
                </span>
              </div>

              {policies.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">No Active Enrolled Policies</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Once you activate a vehicle protection policy, your official certificates, declaration pages, and annual statements will be archived here.
                  </p>
                  <button
                    onClick={() => navigate("/plans")}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-md shadow-blue-600/20"
                  >
                    <span>Explore Protection Plans</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                        <th className="py-3 px-4">Policy Plan</th>
                        <th className="py-3 px-4">Coverage Limit</th>
                        <th className="py-3 px-4">Annual Premium</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {policies.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{p.name || p.type}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{p.id}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-emerald-600">
                            ${Number(p.coverageAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-mono">
                            ${Number(p.premiumAmount || 0).toLocaleString()}/yr
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {p.status || "Active"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDownloadPolicy(p.id, p.name || p.type)}
                              disabled={downloadingPolicyId === p.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-blue-700 border border-slate-200 shadow-sm transition flex items-center gap-1.5 ml-auto"
                            >
                              {downloadingPolicyId === p.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                              <span>PDF</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL 1: REGISTER NEW VEHICLE */}
      {/* ========================================================= */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Car className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Register a New Vehicle</h3>
              </div>
              <button
                onClick={() => setShowVehicleModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Brand / Make *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Toyota"
                    value={vehicleForm.brand}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RAV4 / Camry"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Year *</label>
                  <input
                    type="number"
                    required
                    min="1980"
                    max={new Date().getFullYear() + 1}
                    value={vehicleForm.year}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleForm.vehicleType}
                    onChange={(e) =>
                      setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  >
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Truck">Truck</option>
                    <option value="Coupe">Coupe</option>
                    <option value="Van">Van</option>
                    <option value="Motorcycle">Motorcycle</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={vehicleForm.fuelType}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, fuelType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  VIN (Vehicle Identification Number) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="17-character unique VIN"
                  value={vehicleForm.vin}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vin: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Color <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Silver / White"
                    value={vehicleForm.color}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Market Value ($ USD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="e.g. 25000"
                    value={vehicleForm.marketValue}
                    onChange={(e) =>
                      setVehicleForm({ ...vehicleForm, marketValue: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Odometer (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 45000"
                    value={vehicleForm.odometerReading}
                    onChange={(e) =>
                      setVehicleForm({ ...vehicleForm, odometerReading: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="commercialCheck"
                  checked={vehicleForm.isCommercial}
                  onChange={(e) =>
                    setVehicleForm({ ...vehicleForm, isCommercial: e.target.checked })
                  }
                  className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="commercialCheck" className="text-xs text-slate-600">
                  This vehicle is used for commercial or ride-hailing purposes
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVehicle}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-blue-600/20 transition"
                >
                  {submittingVehicle ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <span>Register Vehicle</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: FILE NEW CLAIM */}
      {/* ========================================================= */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Submit an Incident Claim</h3>
                  <p className="text-xs text-slate-500">
                    File a claim for verified damages on your registered vehicle
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowClaimModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
                  <Car className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-slate-900 font-semibold text-base">No Registered Vehicles Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Under insurance system policy, every incident claim must be tied to a registered vehicle in your account. Please register your vehicle before submitting a claim.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowClaimModal(false);
                    setShowVehicleModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition shadow-md shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Vehicle Now</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleFileClaim} className="space-y-4">
                {/* 1. Vehicle Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Select Registered Vehicle *
                  </label>
                  <select
                    required
                    value={claimForm.vehicleId}
                    onChange={(e) => {
                      const vId = e.target.value;
                      const vObj = vehicles.find((v) => v.id === vId);
                      const matched =
                        policies.find(
                          (p) => p.vehicleId === vId || p.vehicle?.id === vId
                        ) ||
                        vObj?.policies?.[0] ||
                        null;
                      setClaimForm({
                        ...claimForm,
                        vehicleId: vId,
                        policyId: matched?.id || "",
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  >
                    <option value="">-- Choose your registered vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.year} {v.brand} {v.model} ({v.vin ? `VIN: ${v.vin.slice(-6)}` : v.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Insurance Coverage Verification Status & Claim Frequency Limit */}
                {claimForm.vehicleId ? (
                  (() => {
                    const selectedVehicle = vehicles.find((v) => v.id === claimForm.vehicleId);
                    const vehPolicies = policies.filter(
                      (p) => p.vehicleId === claimForm.vehicleId || p.vehicle?.id === claimForm.vehicleId
                    );
                    (selectedVehicle?.policies || []).forEach((vp) => {
                      if (!vehPolicies.some((p) => p.id === vp.id)) {
                        vehPolicies.push(vp);
                      }
                    });

                    const vehClaims = claims.filter(
                      (c) => c.vehicleId === claimForm.vehicleId || c.vehicle?.id === claimForm.vehicleId
                    );
                    const claimCount = vehClaims.length;
                    const isLimitReached = claimCount >= 3;

                    if (isLimitReached) {
                      return (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-start gap-2.5 text-xs text-rose-800">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold text-rose-700">
                                Maximum Annual Claim Frequency Limit Reached ({claimCount}/3 Claims)
                              </div>
                              <div className="text-slate-600 mt-1">
                                This vehicle ({selectedVehicle?.brand} {selectedVehicle?.model}) has already filed the maximum allowed 3 claims for this annual policy period. Online claim filing is now disabled for this vehicle.
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (vehPolicies.length > 0) {
                      if (!claimForm.policyId || !vehPolicies.some((p) => p.id === claimForm.policyId)) {
                        setTimeout(() => {
                          setClaimForm((prev) => ({ ...prev, policyId: vehPolicies[0].id }));
                        }, 0);
                      }
                      const activePolicy = vehPolicies.find((p) => p.id === claimForm.policyId) || vehPolicies[0];

                      return (
                        <div className="space-y-3">
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="text-xs space-y-0.5 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-emerald-800">
                                  Active Coverage Verified: {activePolicy.name}
                                </span>
                                <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                                  Claims: {claimCount} / 3 allowed
                                </span>
                              </div>
                              <div className="text-slate-500">
                                Policy #{activePolicy.id} • Coverage Amount:{" "}
                                <span className="text-slate-900 font-medium">
                                  ${Number(activePolicy.coverageAmount || 0).toLocaleString()}
                                </span>{" "}
                                • Status:{" "}
                                <span className="text-emerald-700 font-medium">
                                  {activePolicy.status || "Active"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {vehPolicies.length > 1 && (
                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1">
                                Select Policy to Claim Against * ({vehPolicies.length} Active Policies for this Vehicle)
                              </label>
                              <select
                                value={claimForm.policyId}
                                onChange={(e) => setClaimForm({ ...claimForm, policyId: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                              >
                                {vehPolicies.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (#{p.id}) - Remaining: ${Number(p.coverageAmount || 0).toLocaleString()} ({p.status})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex items-start gap-2.5 text-xs text-amber-800">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold">Uninsured Vehicle Notice</div>
                              <div className="text-slate-600 mt-0.5">
                                This vehicle ({selectedVehicle?.brand} {selectedVehicle?.model}) is registered, but does not currently have an active insurance policy. An active policy is required before filing a claim.
                              </div>
                            </div>
                          </div>
                          <div>
                            <Link
                              to={`/get-quote?vehicleId=${claimForm.vehicleId}&make=${encodeURIComponent(
                                selectedVehicle?.brand || ""
                              )}&model=${encodeURIComponent(
                                selectedVehicle?.model || ""
                              )}&year=${selectedVehicle?.year || ""}`}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-sm"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              <span>Get Policy for this Vehicle</span>
                            </Link>
                          </div>
                        </div>
                      );
                    }
                  })()
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Select a registered vehicle above to verify active policy coverage.
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Claim Incident Type *
                    </label>
                    <select
                      value={claimForm.type}
                      onChange={(e) => setClaimForm({ ...claimForm, type: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    >
                      <option value="Collision">Collision / Accident</option>
                      <option value="Comprehensive">Comprehensive / Weather Damage</option>
                      <option value="Theft">Theft / Break-in</option>
                      <option value="Windshield">Windshield / Glass Damage</option>
                      <option value="Roadside">Roadside Assistance</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Incident Location *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bole Road, Addis Ababa"
                      value={claimForm.location}
                      onChange={(e) => setClaimForm({ ...claimForm, location: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Date of Incident *
                    </label>
                    <input
                      type="date"
                      required
                      value={claimForm.incidentDate}
                      onChange={(e) =>
                        setClaimForm({ ...claimForm, incidentDate: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Approximate Time
                    </label>
                    <input
                      type="time"
                      value={claimForm.incidentTime}
                      onChange={(e) =>
                        setClaimForm({ ...claimForm, incidentTime: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Incident Description & Details *
                  </label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Provide a clear description of what happened, damages sustained, and any third party details..."
                    value={claimForm.description}
                    onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+215 9XX XXX XXX"
                      value={claimForm.contactPhone}
                      onChange={(e) =>
                        setClaimForm({ ...claimForm, contactPhone: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Estimated Repair Cost ($ USD) (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 1500.00 (from repair estimate)"
                      value={claimForm.estimatedAmount}
                      onChange={(e) =>
                        setClaimForm({ ...claimForm, estimatedAmount: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Preferred Repair Shop (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Total Care Garage, Addis"
                      value={claimForm.customShopName}
                      onChange={(e) =>
                        setClaimForm({ ...claimForm, customShopName: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* 5. Incident Damage Evidence & Document Uploads */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                      <span>Incident Damage Photos & Documentation (Optional)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Images (PNG, JPG) or PDFs
                    </span>
                  </div>

                  {/* Dropzone / Upload button */}
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/20 rounded-xl cursor-pointer transition group">
                    <div className="flex flex-col items-center justify-center pt-2 pb-2">
                      {uploadingClaimFiles ? (
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Uploading attached evidence...</span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition mb-1" />
                          <p className="text-xs text-slate-600 group-hover:text-slate-800">
                            <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop photos
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Photos of vehicle damage, police reports, or workshop estimates
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleClaimFileUpload}
                      disabled={uploadingClaimFiles}
                      className="hidden"
                    />
                  </label>

                  {/* Previews of attached files */}
                  {claimForm.supportingDocuments && claimForm.supportingDocuments.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                        <span>Attached Files ({claimForm.supportingDocuments.length})</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {claimForm.supportingDocuments.map((docUrl, idx) => {
                          const fullUrl = docUrl.startsWith("http") ? docUrl : `${docUrl.startsWith("/") ? "" : "/"}${docUrl}`;
                          const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(docUrl);

                          return (
                            <div
                              key={idx}
                              className="relative bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center gap-2 group"
                            >
                              {isImage ? (
                                <img
                                  src={fullUrl}
                                  alt={`Evidence preview ${idx + 1}`}
                                  className="w-9 h-9 object-cover rounded-lg border border-slate-200"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="text-xs text-slate-800 block truncate font-medium">
                                  {isImage ? `Damage Photo ${idx + 1}` : `Document ${idx + 1}`}
                                </span>
                                <span className="text-[10px] text-emerald-600 font-semibold">Attached</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveClaimFile(idx)}
                                className="text-slate-400 hover:text-red-500 p-1 transition"
                                title="Remove file"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowClaimModal(false)}
                    className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  {(() => {
                    const vehClaims = claimForm.vehicleId
                      ? claims.filter((c) => c.vehicleId === claimForm.vehicleId || c.vehicle?.id === claimForm.vehicleId)
                      : [];
                    const isLimitReached = vehClaims.length >= 3;

                    return (
                      <button
                        type="submit"
                        disabled={submittingClaim || !claimForm.vehicleId || !claimForm.policyId || isLimitReached}
                        className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-amber-600/20 transition disabled:opacity-50"
                      >
                        {submittingClaim ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : isLimitReached ? (
                          <span>Claim Limit Reached (3/3)</span>
                        ) : (
                          <span>Submit Claim</span>
                        )}
                      </button>
                    );
                  })()}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: VIEW CLAIM DETAILS & SETTLEMENT */}
      {/* ========================================================= */}
      {viewingClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 text-slate-800 dark:text-slate-100 transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                      Claim Details
                    </h3>
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-bold">
                      {viewingClaim.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Incident report filed on {viewingClaim.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-3 py-1 rounded-full uppercase font-bold border ${
                    viewingClaim.status === "approved" || viewingClaim.status === "paid"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : viewingClaim.status === "denied"
                      ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                      : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  }`}
                >
                  {viewingClaim.status || "Pending"}
                </span>
                <button
                  type="button"
                  onClick={() => setViewingClaim(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Approved Settlement Banner */}
            {(viewingClaim.status === "approved" || viewingClaim.status === "paid") && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-emerald-100/40 to-white dark:from-emerald-950/60 dark:via-emerald-900/30 dark:to-slate-900 border border-emerald-300 dark:border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                      Settlement Authorized & Finalized
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      This claim has been verified and approved by the claims underwriting team.
                    </p>
                    {viewingClaim.adjusterNotes && (
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 italic">
                        Adjuster Note: "{viewingClaim.adjusterNotes}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Payout Amount</span>
                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                      {viewingClaim.amount}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadSettlementLetter(viewingClaim.id)}
                    disabled={downloadingSettlementId === viewingClaim.id}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingSettlementId === viewingClaim.id ? "Generating..." : "Settlement Letter (PDF)"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Denied Notice Banner */}
            {viewingClaim.status === "denied" && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 space-y-2">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Claim Adjudication Decision: Denied</span>
                </div>
                <div className="text-xs text-rose-800 dark:text-rose-300 font-medium bg-rose-100/70 dark:bg-rose-900/30 p-3 rounded-xl border border-rose-200 dark:border-rose-800 leading-relaxed">
                  <span className="font-bold block mb-0.5 text-rose-900 dark:text-rose-200">Reason for Denial:</span>
                  {viewingClaim.denialReason || viewingClaim.details?.denialReason || "Claim closed after review based on policy terms or verification criteria."}
                </div>
                {viewingClaim.adjusterNotes && (
                  <p className="text-xs text-rose-700 dark:text-rose-400 pt-1">
                    <span className="font-bold">Adjuster Remarks: </span>
                    {viewingClaim.adjusterNotes}
                  </p>
                )}
              </div>
            )}

            {/* Pending Assessment Notice */}
            {(viewingClaim.status === "pending" || viewingClaim.status === "processing" || viewingClaim.status === "under_review") && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Incident Claim Under Review
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Our claims adjusters are assessing your report and damage documentation. Typical resolution timeframe is 24 to 48 business hours.
                  </p>
                </div>
              </div>
            )}

            {/* Policy & Vehicle Snapshot Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Insured Vehicle
                </span>
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-600" />
                  <span>{viewingClaim.vehicle || "Insured Vehicle"}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  VIN: {viewingClaim.vehicleVin || "N/A"}
                </div>
                {viewingClaim.details?.currentMileage && (
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Odometer at Incident: <span className="font-bold">{viewingClaim.details.currentMileage} km</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Active Coverage Policy
                </span>
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>{viewingClaim.policyName || "Active Policy"}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Policy #{viewingClaim.policyId || "N/A"}
                </div>
                {viewingClaim.coverageAmount > 0 && (
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    Liability Limit: ${Number(viewingClaim.coverageAmount).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Incident Specifics */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Incident Specifics
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Incident Type</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewingClaim.claimType || "Incident"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date of Loss</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewingClaim.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Claimed Estimate</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewingClaim.amount}</span>
                </div>
                {viewingClaim.details?.location && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Location</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{viewingClaim.details.location}</span>
                  </div>
                )}
                {viewingClaim.details?.customShopName && (
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-400 block">Repair Facility</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{viewingClaim.details.customShopName}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-400 block text-xs mb-1">Incident Description</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {viewingClaim.description || "No written description provided."}
                </p>
              </div>
            </div>

            {/* Attached Evidence & Photos */}
            {(() => {
              const docString = viewingClaim.supportingDocument || viewingClaim.details?.supportingDocuments || "";
              const docs = (typeof docString === "string" ? docString : Array.isArray(docString) ? docString.join(",") : "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);

              if (docs.length === 0) return null;

              return (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                      <span>Attached Evidence & Documentation ({docs.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Click to open full file</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {docs.map((docUrl, idx) => {
                      const fullUrl = docUrl.startsWith("http") ? docUrl : `${docUrl.startsWith("/") ? "" : "/"}${docUrl}`;
                      const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(docUrl);

                      return (
                        <a
                          key={idx}
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-xl p-2 pr-3 text-xs transition shadow-2xs group cursor-pointer"
                        >
                          {isImage ? (
                            <img
                              src={fullUrl}
                              alt={`Evidence photo ${idx + 1}`}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div className="flex flex-col text-left">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition">
                              {isImage ? `Photo #${idx + 1}` : `Document #${idx + 1}`}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              Inspect <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Processing Timeline */}
            {viewingClaim.timeline && viewingClaim.timeline.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
                  Live Processing Timeline
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  {viewingClaim.timeline.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <div className="flex items-center gap-2 text-xs">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            step.completed ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                          }`}
                        />
                        <span
                          className={
                            step.completed
                              ? "text-slate-900 dark:text-white font-bold"
                              : "text-slate-400 dark:text-slate-500"
                          }
                        >
                          {step.status}
                        </span>
                      </div>
                      {idx < viewingClaim.timeline.length - 1 && (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                to={`/contact?subject=${encodeURIComponent(`Inquiry for Claim #${viewingClaim.id}`)}`}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Contact Assigned Claims Adjuster</span>
              </Link>

              <button
                type="button"
                onClick={() => setViewingClaim(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                Close Claim Details
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 text-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
              <LogOut className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Sign Out of VIMS?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to end your session? You can sign right back in anytime using your saved account credentials.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 transition"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
