import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LoginProps {
  setIsAuthenticated: (value: boolean) => void;
}

const Login = ({ setIsAuthenticated }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showBlockedAlert, setShowBlockedAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [timer, setTimer] = useState(3);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("role", data.user.role);

        setShowSuccessAlert(true);
        toast({
          title: "Успешный вход",
          description: "Добро пожаловать!",
        });

        const countdown = setInterval(() => {
          setTimer((prevTimer) => {
            if (prevTimer === 1) {
              clearInterval(countdown);
              setIsAuthenticated(true);
              if (data.user.role === "admin") {
                navigate("/admin/users");
              } else {
                navigate("/profile");
              }
            }
            return prevTimer - 1;
          });
        }, 1000);
      } else {
        if (data.message === "Ваш аккаунт заблокирован!") {
          setShowBlockedAlert(true);
        } else {
          toast({
            title: "Ошибка",
            description: data.message,
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Ошибка",
        description: "Ошибка при отправке данных на сервер",
        variant: "destructive",
      });
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
            Через {timer} секунд вас перенаправит в ваш профиль.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Login;