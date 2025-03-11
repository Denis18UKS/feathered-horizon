
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/pages/AuthContext";
import { LiquidButton } from "@/components/ui/liquid-button";

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showBlockedAlert, setShowBlockedAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use Supabase login from AuthContext instead of server call
      const { data, error } = await login(email, password);

      if (error) {
        if (error.message.includes("blocked") || error.message.includes("banned")) {
          setShowBlockedAlert(true);
        } else {
          toast({
            title: "Ошибка входа",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        setShowSuccessAlert(true);
        toast({
          title: "Успешный вход",
          description: "Добро пожаловать!",
        });

        // Redirect based on user role
        if (data?.user?.user_metadata?.role === "admin") {
          navigate("/admin/users");
        } else {
          navigate("/profile");
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      toast({
        title: "Ошибка",
        description: err.message || "Произошла ошибка при входе",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSupport = () => {
    window.location.href = "https://vk.com/dkarpov2003";
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Вход</CardTitle>
          <CardDescription>Войдите в свой аккаунт IT-BIRD</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Почта</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <LiquidButton 
              text="Войти"
              width={300}
              height={50}
              color1="#36DFE7"
              color2="#8F17E1"
              color3="#BF09E6"
              textColor="#FFFFFF"
              className="w-full mt-4"
              onClick={handleLogin}
            />
          </form>
        </CardContent>
      </Card>

      {showBlockedAlert && (
        <Alert variant="destructive" className="fixed top-4 right-4 w-96">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Аккаунт заблокирован</AlertTitle>
          <AlertDescription className="mt-2">
            <p>Обратитесь в техподдержку для решения проблемы.</p>
            <div className="mt-4 flex space-x-4">
              <Button onClick={handleContactSupport} variant="secondary">
                Обратиться
              </Button>
              <Button onClick={() => setShowBlockedAlert(false)} variant="outline">
                Закрыть
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {showSuccessAlert && (
        <Alert className="fixed top-4 right-4 w-96">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Вход успешен</AlertTitle>
          <AlertDescription>
            Перенаправление в ваш профиль...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Login;
