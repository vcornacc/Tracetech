import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DataProvider } from "@/hooks/useData";
import { AppLayout } from "@/components/AppLayout";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "./pages/Dashboard";
import Materials from "./pages/Materials";
import MaterialDetail from "./pages/MaterialDetail";
import BomRisk from "./pages/BomRisk";
import Simulation from "./pages/Simulation";
import ECUInventory from "./pages/ECUInventory";
import ECUDetail from "./pages/ECUDetail";
import DecisionEngine from "./pages/DecisionEngine";
import FinancialEngine from "./pages/FinancialEngine";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import HaaSReadiness from "./pages/HaaSReadiness";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();
const AUTH_DISABLED = true;

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (AUTH_DISABLED) return <AppLayout>{children}</AppLayout>;
  return <AppLayout>{children}</AppLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AuthProvider>
            <DataProvider>
              <Routes>
                <Route path="/auth" element={<Navigate to="/" replace />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/materials" element={<ProtectedRoute><Materials /></ProtectedRoute>} />
                <Route path="/materials/:name" element={<ProtectedRoute><MaterialDetail /></ProtectedRoute>} />
                <Route path="/bom" element={<ProtectedRoute><BomRisk /></ProtectedRoute>} />
                <Route path="/simulation" element={<ProtectedRoute><Simulation /></ProtectedRoute>} />
                <Route path="/ecu" element={<ProtectedRoute><ECUInventory /></ProtectedRoute>} />
                <Route path="/ecu/:id" element={<ProtectedRoute><ECUDetail /></ProtectedRoute>} />
                <Route path="/decision-engine" element={<ProtectedRoute><DecisionEngine /></ProtectedRoute>} />
                <Route path="/financial" element={<ProtectedRoute><FinancialEngine /></ProtectedRoute>} />
                <Route path="/executive" element={<ProtectedRoute><ExecutiveDashboard /></ProtectedRoute>} />
                <Route path="/haas" element={<ProtectedRoute><HaaSReadiness /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DataProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
