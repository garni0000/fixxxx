import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PronosToday from "./pages/PronosToday";
import PronosYesterday from "./pages/PronosYesterday";
import PronosBeforeYesterday from "./pages/PronosBeforeYesterday";
import PronoDetail from "./pages/PronoDetail";
import Account from "./pages/Account";
import Referral from "./pages/Referral";
import Pricing from "./pages/Pricing";
import Admin from "./pages/Admin";
import Combos from "./pages/Combos";
import ComboDetail from "./pages/ComboDetail";
import PaymentCallback from "./pages/PaymentCallback";
import Download from "./pages/Download";
import NotFound from "./pages/NotFound";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pronos/today" element={<PronosToday />} />
          <Route path="/pronos/yesterday" element={<PronosYesterday />} />
          <Route path="/pronos/before-yesterday" element={<PronosBeforeYesterday />} />
          <Route path="/pronos/:id" element={<PronoDetail />} />
          <Route path="/combos" element={<Combos />} />
          <Route path="/combos/:id" element={<ComboDetail />} />
          <Route path="/account" element={<Account />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/payment/callback" element={<PaymentCallback />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/download" element={<Download />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
