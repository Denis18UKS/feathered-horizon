
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Типы данных для состояния контекста
interface AuthContextType {
    isAuthenticated: boolean;
    role: string | undefined;
    setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
    login: (email: string, password: string) => Promise<{ error: any | null, data: any | null }>;
    register: (email: string, password: string, username: string, githubUsername: string | null) => Promise<{ error: any | null, data: any | null }>;
    logout: () => Promise<void>;
}

// Контекст
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер контекста
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [role, setRole] = useState<string | undefined>(undefined);

    // Логика входа
    const login = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (!error && data.user) {
            // Получаем роль пользователя из метаданных или из профиля
            const userRole = data.user.user_metadata?.role || 'user';
            
            setIsAuthenticated(true);
            setRole(userRole);
            
            return { data, error: null };
        }
        
        return { data: null, error };
    };

    // Регистрация нового пользователя
    const register = async (email: string, password: string, username: string, githubUsername: string | null) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    github_username: githubUsername || '',
                    role: 'user',
                }
            }
        });

        if (!error && data.user) {
            // Создаем запись в таблице profiles
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: data.user.id,
                        username,
                        github_username: githubUsername || '',
                        email,
                    }
                ]);

            if (profileError) {
                return { data: null, error: profileError };
            }

            return { data, error: null };
        }
        
        return { data: null, error };
    };

    // Логика выхода
    const logout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setRole(undefined);
    };

    // Проверка состояния авторизации при монтировании компонента
    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            
            if (data.session) {
                setIsAuthenticated(true);
                
                // Получаем роль из метаданных пользователя
                const userRole = data.session.user.user_metadata?.role || 'user';
                setRole(userRole);
            }
        };

        checkSession();

        // Слушаем изменения в состоянии авторизации
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    setIsAuthenticated(true);
                    const userRole = session.user.user_metadata?.role || 'user';
                    setRole(userRole);
                } else if (event === 'SIGNED_OUT') {
                    setIsAuthenticated(false);
                    setRole(undefined);
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            role, 
            setIsAuthenticated, 
            login, 
            register,
            logout 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Хук для использования контекста
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
