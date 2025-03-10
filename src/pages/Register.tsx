
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from './AuthContext';
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gitHubUsername, setGitHubUsername] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signup } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Register with Supabase
      await signup(email, password, username);
      
      // If GitHub username provided, update profile
      if (gitHubUsername) {
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData && userData.user) {
          // Update the user's GitHub username in the profiles table
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ github_username: gitHubUsername })
            .eq('id', userData.user.id);
          
          if (updateError) {
            console.error("Error updating GitHub username:", updateError);
          }
        }
      }

      setShowSuccessAlert(true);
      toast({
        title: "Успешная регистрация",
        description: "Теперь вы можете войти в свой аккаунт",
      });

      setTimeout(() => {
        setShowSuccessAlert(false);
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Ошибка",
        description: err.message || "Ошибка при регистрации",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Регистрация..." : "Зарегистрироваться"}
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
