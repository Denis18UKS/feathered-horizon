
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/pages/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showBlockedAlert, setShowBlockedAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showNotConfirmedAlert, setShowNotConfirmedAlert] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email, password);
      
      setShowSuccessAlert(true);
      toast({
        title: "Успешный вход",
        description: "Добро пожаловать!",
      });
      
      // Navigation will be handled by the auth state change listener in AuthContext
    } catch (err: any) {
      console.error(err);
      
      if (err.message?.includes("blocked")) {
        setShowBlockedAlert(true);
      } else if (err.message?.includes("Email not confirmed")) {
        setShowNotConfirmedAlert(true);
        toast({
          title: "Почта не подтверждена",
          description: "Пожалуйста, проверьте почту и подтвердите ваш email",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ошибка",
          description: err.message || "Ошибка при входе",
          variant: "destructive",
        });
      }
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
            <Button type="submit" className="w-full">
              Войти
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => navigate("/register")}>
            Нет аккаунта? Зарегистрироваться
          </Button>
        </CardFooter>
      </Card>

      {showNotConfirmedAlert && (
        <Alert className="fixed top-4 right-4 w-96 bg-amber-50 border-amber-200">
          <Mail className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Подтвердите вашу почту</AlertTitle>
          <AlertDescription className="mt-2 text-amber-700">
            <p>Вам необходимо подтвердить вашу почту, перейдя по ссылке в письме. Проверьте ваш почтовый ящик.</p>
            <div className="mt-4 flex space-x-4">
              <Button onClick={() => setShowNotConfirmedAlert(false)} variant="outline" className="border-amber-300">
                Понятно
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
