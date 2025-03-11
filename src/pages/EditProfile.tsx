
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LiquidButton } from "@/components/ui/liquid-button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { v4 as uuidv4 } from 'uuid';

const EditProfile = () => {
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setError("Пользователь не авторизован!");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setEmail(data.email || "");
          setUsername(data.username || "");
          setGithubUsername(data.github_username || "");
          setSkills(data.skills || "");
          setAvatarUrl(data.avatar || null);
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const uploadAvatar = async () => {
    if (!avatar || !user) {
      return null;
    }

    const fileExt = avatar.name.split('.').pop();
    const fileName = `${user.id}-${uuidv4()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatar);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Ошибка", description: "Не удалось сохранить профиль, пользователь не авторизован" });
      return;
    }

    setLoading(true);
    try {
      let newAvatarUrl = avatarUrl;

      if (avatar) {
        newAvatarUrl = await uploadAvatar();
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          github_username: githubUsername,
          skills,
          avatar: newAvatarUrl,
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({ title: "Успех", description: "Профиль обновлён" });
      navigate("/profile");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ title: "Ошибка", description: error.message });
    } finally {
      setLoading(false);
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
                  accept="image/*"
                />
                {avatar ? (
                  <img
                    src={URL.createObjectURL(avatar)}
                    alt="Аватар"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Аватар"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : null}
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
