import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { LiquidButton } from "@/components/ui/liquid-button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

const EditProfile = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setUsername(data.username || "");
        setLocation(data.location || "");
        setSkills(data.skills || "");
        setGithubUsername(data.github_username || "");
        setAvatarUrl(data.avatar || null);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error.message);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить профиль",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Ошибка",
          description: "Размер файла не должен превышать 2MB",
          variant: "destructive",
        });
        return;
      }
      setAvatar(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatar) return avatarUrl;

    try {
      const fileExt = avatar.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatar);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      console.error("Error uploading avatar:", error.message);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить аватар",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Upload avatar if changed
      const newAvatarUrl = await uploadAvatar();

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          location,
          skills,
          github_username: githubUsername,
          avatar: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "Профиль обновлен",
        description: "Ваш профиль успешно обновлен",
      });

      navigate("/profile");
    } catch (error: any) {
      console.error("Error updating profile:", error.message);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Загрузка профиля...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Редактирование профиля</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-24 w-24 mb-4">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={username} />
                ) : (
                  <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <Label htmlFor="avatar" className="cursor-pointer inline-block px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                  Изменить аватар
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>

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
              <Label htmlFor="location">Местоположение</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Например: Москва, Россия"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="githubUsername">GitHub Username</Label>
              <Input
                id="githubUsername"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="Ваш username на GitHub"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Навыки</Label>
              <Textarea
                id="skills"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Например: JavaScript, React, Node.js"
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/profile")}
              >
                Отмена
              </Button>
              <LiquidButton 
                text="Сохранить изменения" 
                onClick={handleSubmit} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfile;
