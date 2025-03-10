import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/pages/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

const FriendRequests = () => {
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from("friend_requests")
            .select(`
              id,
              created_at,
              profiles:sender_id (
                id,
                username,
                avatar
              )
            `)
            .eq("receiver_id", user.id)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Error fetching friend requests:", error);
          }

          if (data) {
            setFriendRequests(data);
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
        .from("friend_requests")
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
        .from("friend_requests")
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
                    {request.profiles && request.profiles.avatar ? (
                      <AvatarImage src={request.profiles.avatar} alt={request.profiles?.username || 'User'} />
                    ) : (
                      <AvatarFallback>{request.profiles?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.profiles?.username || 'Пользователь'}</p>
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
