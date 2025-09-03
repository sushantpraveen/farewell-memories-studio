
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CollageProvider } from "./context/CollageContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
// import CreateGroup from "./pages/CreateGroup";
import AdminOrders from "./pages/AdminOrders";
import GridBoard from "./components/GridBoard";
import JoinGroup from "./pages/JoinGroup";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CollageProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/create-group" element={
                <ProtectedRoute>
                  <GridBoard />
                </ProtectedRoute>
              } />
              <Route path="/join/:groupId" element={
                // <ProtectedRoute>
                  <JoinGroup />
                // </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute requiresLeader>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/editor" element={
                <ProtectedRoute requiresLeader>
                  <Editor />
                </ProtectedRoute>
              } />
              <Route path="/editor/:groupId" element={
                <ProtectedRoute>
                  <Editor />
                </ProtectedRoute>
              } />
              <Route path="/checkout/:groupId" element={
                  <Checkout />
              } />
               <Route path="/admin/order" element={
                <ProtectedRoute requiresAdmin>
                  <AdminOrders />
                </ProtectedRoute>
            } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CollageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
