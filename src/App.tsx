// App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import Header from "./components/Header";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import Login from "./pages/Login";
import MyProfile from "./pages/MyProfile";
import EditProfile from "./pages/EditProfile";
import Chats from "./pages/Chats";
import Users from "./pages/Users";
import Branches from './pages/GitHub/Branches';
import ActivityGraph from './pages/GitHub/ActivityGraph';
import LanguageUsage from './pages/GitHub/LanguageUsage';
import { AuthProvider } from "@/pages/AuthContext";  // Импорт контекста

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <SidebarProvider>
              <div className="min-h-screen flex w-full">
                <AppSidebar />
                <div className="flex-1">
                  <Header />
                  <main className="p-4">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/login" element={<Login />} /> {/* Без передачи setIsAuthenticated */}
                      <Route path="/profile" element={<MyProfile />} />
                      <Route path="/profile/edit" element={<EditProfile />} />
                      <Route path="/chats" element={<Chats />} />
                      <Route path="/chats/:chatId" element={<Chats />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/repo/:repoName/branches" element={<Branches />} />
                      <Route path="/repo/:repoName/activity" element={<ActivityGraph />} />
                      <Route path="/repo/:repoName/languages" element={<LanguageUsage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
