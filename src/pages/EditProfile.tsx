import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LiquidButton } from "@/components/ui/liquid-button";

const EditProfile = () => {
  const [avatar, setAvatar] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Пользователь не авторизован!");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Ошибка при загрузке профиля");
        }

        const data = await response.json();
        const user = data.user;

        setEmail(user.email || "");
        setUsername(user.username || "");
        setGithubUsername(user.github_username || "");
        setSkills(user.skills || "");
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Ошибка", description: "Не удалось сохранить профиль, пользователь не авторизован" });
      return;
    }

    const formData = new FormData();
    formData.append("avatar", avatar as Blob);
    formData.append("username", username);
    formData.append("github_username", githubUsername);
    formData.append("skills", skills);
    formData.append("email", email);

    try {
      const response = await fetch("http://localhost:5000/profile/update", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Ошибка при сохранении профиля");
      }

      toast({ title: "Успех", description: "Профиль обновлён" });
      navigate("/profile");
    } catch (error) {
      toast({ title: "Ошибка", description: error.message });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        toast({ title: "Ошибка", description: "Пожалуйста, выберите изображение" });
        return;
      }
      setAvatar(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Редактирование профиля</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Аватар */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Аватар</Label>
              <div className="flex items-center space-x-4">
                <input 
                  type="file" 
                  onChange={handleAvatarChange} 
                  accept="image/*" // Ограничение на выбор изображений
                />
                {avatar && (
                  <img
                    src={URL.createObjectURL(avatar)}
                    alt="Аватар"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary/20"
                  />
                )}
              </div>
            </div>

            {/* Email (нельзя редактировать) */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Email</Label>
              <Input value={email} disabled className="bg-gray-100 cursor-not-allowed" />
            </div>

            {/* Имя пользователя */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Имя пользователя</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите ваше имя пользователя"
              />
            </div>

            {/* GitHub Username */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold">GitHub Username</Label>
              <Input
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="Введите ваш GitHub Username"
              />
            </div>

            {/* Навыки */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Навыки</Label>
              <Input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Введите ваши навыки"
              />
            </div>

            {error && <p className="text-red-500">{error}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Кнопки */}
      <div className="flex space-x-4">
        <LiquidButton
          text="Сохранить"
          color1="#9b87f5"
          color2="#6E59A5"
          color3="#8F17E1"
          width={200}
          height={50}
          onClick={handleSave}
        />
        <Button variant="outline" onClick={() => navigate("/profile")}>
          Отменить
        </Button>
      </div>
    </div>
  );
};

export default EditProfile;
