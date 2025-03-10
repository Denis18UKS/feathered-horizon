
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  profiles: {
    username: string;
    avatar: string | null;
  };
}

const FriendRequests = () => {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchFriendRequests = async () => {
      if (!isAuthenticated || !user) {
        setError("Вы не авторизованы. Пожалуйста, войдите в систему.");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('friends')
          .select(`
            id, 
            user_id, 
            friend_id, 
            status, 
            created_at,
            profiles:user_id(username, avatar)
          `)
          .eq('friend_id', user.id)
          .eq('status', 'pending');

        if (error) {
          throw error;
        }

        setFriendRequests(data || []);
        setIsLoading(false);
      } catch (error: any) {
        console.error("Ошибка загрузки заявок:", error);
        setError("Не удалось загрузить заявки в друзья. Попробуйте позже.");
        setIsLoading(false);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить заявки",
          variant: "destructive",
        });
      }
    };

    fetchFriendRequests();
  }, [isAuthenticated, user]);

  const handleAcceptRequest = async (requestId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      // Remove the accepted request from the list
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast({
        title: "Заявка принята",
        description: "Вы стали друзьями!",
      });
    } catch (error) {
      console.error("Ошибка принятия заявки:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось принять заявку",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      // Remove the rejected request from the list
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast({
        title: "Заявка отклонена",
        description: "Вы отклонили заявку на дружбу",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Ошибка отклонения заявки:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить заявку",
        variant: "destructive",
      });
    }
  };

  const goBackToProfile = () => {
    navigate("/profile");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Заявки в друзья</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={goBackToProfile}>Назад в профиль</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Заявки в друзья</CardTitle>
        </CardHeader>
        <CardContent>
          {friendRequests.length === 0 ? (
            <p className="text-muted-foreground">Нет заявок</p>
          ) : (
            <ul className="space-y-4">
              {friendRequests.map((request) => (
                <li key={request.id} className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    {request.profiles.avatar && (
                      <img
                        src={request.profiles.avatar}
                        alt={`${request.profiles.username} avatar`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <span>{request.profiles.username}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="default" onClick={() => handleAcceptRequest(request.id, request.user_id)}>
                      Принять
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRejectRequest(request.id)}>
                      Отклонить
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Button onClick={goBackToProfile} className="mt-4">Назад в профиль</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FriendRequests;
