import { useEffect } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";

import PublicLayout from "./layouts/PublicLayout";
import Main from "./components/landing/Main";
import Plans from "./pages/Plans";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import VerifyEmail from "./pages/VerifyEmail";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dasheboard";
import GetQuote from "./pages/GetQuote";
import AdminDashboard from "./pages/AdminDashboard";
import useAuthStore from "./store/authStore";

const queryClient = new QueryClient();

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />

      <BrowserRouter>
        <Routes>
          {/* Public Pages with Header and Footer */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Main />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
          </Route>

          {/* Standalone Public Quote Flow */}
          <Route path="/get-quote" element={<GetQuote />} />
          <Route path="/quote" element={<Navigate to="/get-quote" replace />} />
          <Route path="/plan" element={<Navigate to="/plans" replace />} />

          {/* Authentication Pages (Clean dedicated layout) */}
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Authenticated Dashboard Pages (Footer is strictly hidden) */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Legacy Capitalized URL Support */}
          <Route
            path="/Dashboard"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
