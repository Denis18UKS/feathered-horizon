
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/pages/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

interface FriendRequest {
  id: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  sender_profile?: {
    id: string;
    username: string;
    avatar: string | null;
  } | null;
}

const FriendRequests = () => {
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from("friends")
            .select(`
              id,
              created_at,
              friend_id,
              user_id,
              status,
              profiles:friend_id (
                id,
                username,
                avatar
              )
            `)
            .eq("user_id", user.id)
            .eq("status", "pending");

          if (error) {
            console.error("Error fetching friend requests:", error);
          }

          if (data) {
            // Transform the data to match our FriendRequest interface
            const transformedData = data.map(item => ({
              id: item.id,
              created_at: item.created_at,
              sender_id: item.friend_id,
              receiver_id: user.id,
              status: item.status,
              sender_profile: item.profiles
            }));
            
            setFriendRequests(transformedData);
          }
        } catch (error) {
          console.error("Error fetching friend requests:", error);
        }
      }
    };

    fetchFriendRequests();
  }, [user]);

  const handleAccept = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (error) {
        console.error("Error accepting friend request:", error);
      } else {
        setFriendRequests(friendRequests.filter((request) => request.id !== requestId));
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) {
        console.error("Error rejecting friend request:", error);
      } else {
        setFriendRequests(friendRequests.filter((request) => request.id !== requestId));
      }
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Запросы в друзья</CardTitle>
          <CardDescription>Здесь вы можете принимать или отклонять запросы в друзья</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {friendRequests.length === 0 ? (
            <div>Нет входящих запросов в друзья.</div>
          ) : (
            friendRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    {request.sender_profile && request.sender_profile.avatar ? (
                      <AvatarImage src={request.sender_profile.avatar} alt={request.sender_profile?.username || 'User'} />
                    ) : (
                      <AvatarFallback>{request.sender_profile?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.sender_profile?.username || 'Пользователь'}</p>
                    <p className="text-xs text-gray-500">{format(new Date(request.created_at), 'dd.MM.yyyy')}</p>
                  </div>
                </div>
                <div>
                  <Button size="sm" onClick={() => handleAccept(request.id)} className="mr-2">
                    Принять
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReject(request.id)}>
                    Отклонить
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FriendRequests;
