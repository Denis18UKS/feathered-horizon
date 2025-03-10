
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { BadgeCheck, X } from "lucide-react";
import { format } from 'date-fns';
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
    avatar: string;
  };
}

const FriendRequests = () => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFriendRequests();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchFriendRequests = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("friends")
        .select(`
          id, 
          user_id, 
          friend_id, 
          status, 
          created_at,
          profiles:user_id(username, avatar)
        `)
        .eq("friend_id", user?.id)
        .eq("status", "pending");

      if (error) throw error;
      
      // Transform the data to ensure it matches our FriendRequest type
      const formattedRequests = data.map(item => {
        // Check if profiles exists and is not an error
        const profileData = typeof item.profiles === 'object' && !('error' in item.profiles) 
          ? item.profiles 
          : { username: 'Unknown User', avatar: '' };
        
        return {
          ...item,
          profiles: profileData
        };
      });
      
      setRequests(formattedRequests as FriendRequest[]);
    } catch (error: any) {
      console.error("Error fetching friend requests:", error.message);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить заявки в друзья",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .update({ status: "accepted" })
        .eq("id", id);

      if (error) throw error;

      // Also create a reciprocal friendship
      const friendRequest = requests.find(req => req.id === id);
      if (friendRequest) {
        const { error: reciprocalError } = await supabase
          .from("friends")
          .insert([
            {
              user_id: user?.id,
              friend_id: friendRequest.user_id,
              status: "accepted"
            }
          ]);

        if (reciprocalError) throw reciprocalError;
      }

      setRequests(requests.filter(req => req.id !== id));
      toast({
        title: "Заявка принята",
        description: "Вы успешно добавили пользователя в друзья",
      });
    } catch (error: any) {
      console.error("Error accepting friend request:", error.message);
      toast({
        title: "Ошибка",
        description: "Не удалось принять заявку",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;

      setRequests(requests.filter(req => req.id !== id));
      toast({
        title: "Заявка отклонена",
        description: "Вы отклонили заявку в друзья",
      });
    } catch (error: any) {
      console.error("Error rejecting friend request:", error.message);
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить заявку",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Загрузка заявок в друзья...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Войдите, чтобы просмотреть заявки в друзья</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Заявки в друзья</h1>

      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-4">
                      {request.profiles.avatar ? (
                        <AvatarImage src={request.profiles.avatar} alt={request.profiles.username} />
                      ) : (
                        <AvatarFallback>{request.profiles.username.charAt(0).toUpperCase()}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.profiles.username}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(request.created_at), 'dd.MM.yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptRequest(request.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <BadgeCheck className="h-4 w-4 mr-1" />
                      Принять
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Отклонить
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 border rounded-lg bg-gray-50">
          <p className="text-gray-500">У вас нет новых заявок в друзья</p>
        </div>
      )}
    </div>
  );
};

export default FriendRequests;
