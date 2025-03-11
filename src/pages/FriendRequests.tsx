
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { supabase } from "./AuthContext";

interface FriendRequest {
    id: string;
    sender_id: string;
    receiver_id: string;
    status: string;
    created_at: string;
    sender: {
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

    useEffect(() => {
        const fetchFriendRequests = async () => {
            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user) {
                    setError("Вы не авторизованы. Пожалуйста, войдите в систему.");
                    setIsLoading(false);
                    return;
                }

                // Get friend requests sent to the current user
                const { data, error } = await supabase
                    .from('friend_requests')
                    .select(`
                        id,
                        sender_id,
                        receiver_id,
                        status,
                        created_at,
                        sender:profiles!sender_id (username, avatar)
                    `)
                    .eq('receiver_id', user.id)
                    .eq('status', 'pending');

                if (error) throw error;

                if (data) {
                    const formattedRequests = data.map(request => ({
                        id: request.id,
                        sender_id: request.sender_id,
                        receiver_id: request.receiver_id,
                        status: request.status,
                        created_at: request.created_at,
                        sender: {
                            username: request.sender?.username || 'Unknown User',
                            avatar: request.sender?.avatar || null,
                        }
                    }));

                    setFriendRequests(formattedRequests);
                }
            } catch (error) {
                console.error("Ошибка загрузки заявок:", error);
                setError("Не удалось загрузить заявки в друзья. Попробуйте позже.");
                toast({
                    title: "Ошибка",
                    description: "Не удалось загрузить заявки",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchFriendRequests();
    }, [toast]);

    const handleAcceptRequest = async (requestId: string) => {
        try {
            // Update the request status
            const { error } = await supabase
                .from('friend_requests')
                .update({ status: 'accepted' })
                .eq('id', requestId);

            if (error) throw error;

            // Update local state
            setFriendRequests(prev => prev.filter(req => req.id !== requestId));
            
            toast({
                title: "Заявка принята",
                description: "Вы стали друзьями!",
                variant: "default",
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
            // Update the request status
            const { error } = await supabase
                .from('friend_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId);

            if (error) throw error;

            // Update local state
            setFriendRequests(prev => prev.filter(req => req.id !== requestId));
            
            toast({
                title: "Заявка отклонена",
                description: "Вы отклонили заявку на дружбу.",
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
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Загрузка заявок...</p>
                </div>
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
                                    <div className="flex items-center">
                                        <span>{request.sender.username}</span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button size="sm" variant="default" onClick={() => handleAcceptRequest(request.id)}>
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
