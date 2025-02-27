
import { Home, User, MessageSquare, Users, MessageCircle, Award, Settings, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useAuth } from "@/pages/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppSidebar() {
  const { isAuthenticated, role, logout } = useAuth();
  const isMobile = useIsMobile();

  const publicItems = [
    { title: "Главная", url: "/", icon: Home },
    { title: "IT-Хакатоны", url: "/xakatons", icon: Award },
  ];

  const authItems = [
    { title: "Мой Профиль", url: "/profile", icon: User },
    { title: "Чаты", url: "/chats", icon: MessageSquare },
    { title: "Пользователи", url: "/users", icon: Users },
    { title: "Форум", url: "/forum", icon: MessageCircle },
  ];

  const adminItems = [
    { title: "Управление пользователями", url: "/admin/users", icon: Users },
    { title: "Модерация контента", url: "/admin/moderation", icon: Settings },
    { title: "Статистика", url: "/admin/statistics", icon: Settings },
  ];

  return (
    <Sidebar className={`border-r border-gray-200 ${isMobile ? 'bg-background' : ''}`}>
      <SidebarContent>
        <div className="p-4 md:p-6">
          <h1 className="text-2xl font-bold text-primary">IT-BIRD</h1>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {publicItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url} className="flex items-center gap-3 px-2 py-2">
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {!isAuthenticated ? (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/register" className="flex items-center gap-3 px-2 py-2">
                        <User className="w-5 h-5" />
                        <span className="text-sm">Регистрация</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/login" className="flex items-center gap-3 px-2 py-2">
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm">Вход</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              ) : (
                <>
                  {authItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link to={item.url} className="flex items-center gap-3 px-2 py-2">
                          <item.icon className="w-5 h-5" />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                  {role === "admin" && (
                    <>
                      <SidebarGroupLabel>Администрирование</SidebarGroupLabel>
                      {adminItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <Link to={item.url} className="flex items-center gap-3 px-2 py-2">
                              <item.icon className="w-5 h-5" />
                              <span className="text-sm">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </>
                  )}

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={logout}
                      className="flex items-center gap-3 px-2 py-2 w-full text-left text-red-500 hover:text-red-600"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-sm">Выйти</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
