
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
import UserProfilePage from "./pages/UsersProfiles";
import Xakatons from "./pages/Xakatons";
import FriendRequests from "./pages/FriendRequests";
import Forum from "./pages/Forum";
import Answers from './pages/Answers';
import AdminUsers from './pages/AdminUsers';
import Moderation from './pages/admin/Moderation';
import Statistics from './pages/admin/Statistics';
import { AuthProvider } from "@/pages/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

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
              <div className="min-h-screen flex w-full flex-col md:flex-row">
                <AppSidebar />
                <div className="flex-1 flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-1 p-2 md:p-4 overflow-auto">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/profile" element={<MyProfile />} />
                      <Route path="/profile/edit" element={<EditProfile />} />
                      <Route path="/chats" element={<Chats />} />
                      <Route path="/chats/:chatId" element={<Chats />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/users-profiles/:userId" element={<UserProfilePage />} />
                      <Route path="/xakatons" element={<Xakatons />} />
                      <Route path="/friend-requests" element={<FriendRequests />} />
                      <Route path="/forum" element={<Forum />} />
                      <Route path="/forums/:id/answers" element={<Answers />} />
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route path="/admin/moderation" element={<Moderation />} />
                      <Route path="/admin/statistics" element={<Statistics />} />
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
