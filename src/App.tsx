import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Index from "./pages/Index";
import Wiki from "./pages/Wiki";
import SmartAudit from "./pages/SmartAudit";
import ROI from "./pages/ROI";
import SettingsPage from "./pages/SettingsPage";
import ExtensionDownload from "./pages/ExtensionDownload";
import SendHistory from "./pages/SendHistory";
import LiveEvents from "./pages/LiveEvents";
import HelpUsGrow from "./pages/HelpUsGrow";
import NotFound from "./pages/NotFound";
import SpeedFlash from "./components/SpeedFlash";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SpeedFlash />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/wiki" element={<ProtectedRoute><Wiki /></ProtectedRoute>} />
            <Route path="/smart-audit" element={<ProtectedRoute><SmartAudit /></ProtectedRoute>} />
            <Route path="/roi" element={<ProtectedRoute><ROI /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/extension" element={<ProtectedRoute><ExtensionDownload /></ProtectedRoute>} />
            <Route path="/send-history" element={<ProtectedRoute><SendHistory /></ProtectedRoute>} />
            <Route path="/live-events" element={<ProtectedRoute><LiveEvents /></ProtectedRoute>} />
            <Route path="/help-us-grow" element={<ProtectedRoute><HelpUsGrow /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
