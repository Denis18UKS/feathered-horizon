import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState } from "react";
import { AppSidebar } from "./components/AppSidebar";
import Header from "./components/Header";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import Login from "./pages/Login";
import MyProfile from "./pages/MyProfile";
import EditProfile from "./pages/EditProfile";
import Chats from "./pages/Chats";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<string | undefined>(undefined);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRole(undefined);
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <AppSidebar
                isAuthenticated={isAuthenticated}
                role={role}
                onLogout={handleLogout}
              />
              <div className="flex-1">
                <Header />
                <main className="p-4">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
                    <Route path="/profile" element={<MyProfile />} />
                    <Route path="/profile/edit" element={<EditProfile />} />
                    <Route path="/chats" element={<Chats />} />
                    <Route path="/chats/:chatId" element={<Chats />} />


                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;