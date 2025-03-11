import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gitHubUsername, setGitHubUsername] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          github_username: gitHubUsername || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccessAlert(true);
        toast({
          title: "Успешная регистрация",
          description: "Теперь вы можете войти в свой аккаунт",
        });

        if (gitHubUsername) {
          await fetchAndSaveRepositories(gitHubUsername);
        }

        setTimeout(() => {
          setShowSuccessAlert(false);
          navigate("/login");
        }, 3000);
      } else {
        toast({
          title: "Ошибка",
          description: data.message,
          variant: "destructive",
        });
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

  const fetchAndSaveRepositories = async (githubUsername: string) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("Token not found, authorization required");
        return;
      }

      const response = await fetch(`http://localhost:5000/repositories/${githubUsername}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Error fetching repositories:", data.message);
        return;
      }

      const repositories = await response.json();

      const saveResponse = await fetch("http://localhost:5000/repositories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          githubUsername,
          repositories,
        }),
      });

      if (!saveResponse.ok) {
        const data = await saveResponse.json();
        console.error("Error saving repositories:", data.message);
      } else {
        console.log("Repositories saved successfully");
      }
    } catch (error) {
      console.error("Error in fetchAndSaveRepositories:", error);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Регистрация</CardTitle>
          <CardDescription>Создайте новый аккаунт IT-BIRD</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
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
              <Label htmlFor="github">GitHub Username</Label>
              <Input
                id="github"
                value={gitHubUsername}
                onChange={(e) => setGitHubUsername(e.target.value)}
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
              Зарегистрироваться
            </Button>
          </form>
        </CardContent>
      </Card>

      {showSuccessAlert && (
        <Alert className="fixed top-4 right-4 w-96">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Регистрация успешна</AlertTitle>
          <AlertDescription>
            Теперь вы можете войти в свой аккаунт
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Register;