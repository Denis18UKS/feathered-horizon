
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

// Types for auth context
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  role: string | undefined;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | undefined>(undefined);
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return;
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setIsAuthenticated(true);
        
        // Check for user role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.session.user.id)
          .single();
        
        if (!roleError && roleData) {
          setRole(roleData.role);
          localStorage.setItem('role', roleData.role);
        }
      }
    };
    
    checkSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsAuthenticated(!!newSession);
        
        if (newSession) {
          // Update user's last login time
          supabase
            .from('profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', newSession.user.id)
            .then(({ error }) => {
              if (error) console.error('Error updating last login:', error);
            });
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Login function
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('userId', data.user.id);
        
        // Get user role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();
        
        if (!roleError && roleData) {
          setRole(roleData.role);
          localStorage.setItem('role', roleData.role);
        }
        
        toast({
          title: "Вход выполнен",
          description: "Вы успешно вошли в систему.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Ошибка входа",
        description: error.message || "Не удалось войти в систему.",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  // Signup function
  const signup = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        setUser(data.user);
        toast({
          title: "Регистрация выполнена",
          description: "Вы успешно зарегистрировались.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Не удалось зарегистрироваться.",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setIsAuthenticated(false);
      setRole(undefined);
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      
      toast({
        title: "Выход выполнен",
        description: "Вы вышли из системы.",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка выхода",
        description: error.message || "Не удалось выйти из системы.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user,
      role, 
      setIsAuthenticated,
      login,
      signup,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
