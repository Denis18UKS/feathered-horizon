import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/pages/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

const MyProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{
    username: string;
    email: string;
    avatar: string | null;
    location: string | null;
    skills: string | null;
    github_username: string | null;
    last_login: string;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (error) {
            console.error("Error fetching profile:", error);
          }

          if (data) {
            setProfile({
              username: data.username,
              email: data.email,
              avatar: data.avatar,
              location: data.location,
              skills: data.skills,
              github_username: data.github_username,
              last_login: data.last_login,
            });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const navigateToEditProfile = () => {
    navigate("/profile/edit");
  };

  if (!profile) {
    return <div className="container mx-auto p-4">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Мой профиль</CardTitle>
          <CardDescription>Информация о вашем аккаунте</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24">
              {profile.avatar ? (
                <AvatarImage src={profile.avatar} alt={profile.username} />
              ) : (
                <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <div className="text-lg font-semibold mt-2">{profile.username}</div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Email:</div>
            <div>{profile.email}</div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Местоположение:</div>
            <div>{profile.location || "Не указано"}</div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Навыки:</div>
            <div>{profile.skills || "Не указаны"}</div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">GitHub:</div>
            <div>{profile.github_username || "Не указан"}</div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Последний вход:</div>
            <div>{format(new Date(profile.last_login), 'dd.MM.yyyy HH:mm')}</div>
          </div>
          <Button onClick={navigateToEditProfile} className="w-full">
            Редактировать профиль
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyProfile;
