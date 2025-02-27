import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface FriendRequest {
    id: number;
    user_id: number;
    friend_id: number;
    status: string;
    created_at: string;
    friend: {
        username: string;
        avatar: string | null;
    };
}

const FriendRequests = () => {
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFriendRequests = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("Нет токена!");
                return;
            }

            try {
                const decodedToken = JSON.parse(atob(token.split('.')[1])); // Декодируем JWT
                console.log("Ваш user_id:", decodedToken.user_id);

                const response = await fetch("http://localhost:5000/friend-requests", {
                    headers: { "Authorization": `Bearer ${token}` },
                });

                if (!response.ok) throw new Error(`Ошибка: ${response.status}`);

                const data = await response.json();
                console.log("Ответ сервера:", data);

                if (!Array.isArray(data)) {
                    throw new Error("Неверная структура данных");
                }

                // Формируем список заявок
                const formattedRequests = data.map((req, index) => ({
                    id: index,
                    user_id: req.user_id,
                    friend_id: req.friend_id,
                    status: req.status,
                    created_at: req.created_at || "",
                    friend: {
                        username: req.friend_name,
                        avatar: req.avatar || null,
                    },
                }));

                setFriendRequests(formattedRequests);
            } catch (error) {
                console.error("Ошибка загрузки заявок:", error);
                toast({
                    title: "Ошибка",
                    description: "Не удалось загрузить заявки",
                    variant: "destructive",
                });
            }
        };

        fetchFriendRequests();
    }, [toast]);

    const handleAcceptRequest = async (friendId: number) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`http://localhost:5000/friend-requests/accept/${friendId}`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` },
            });

            if (!response.ok) throw new Error(`Ошибка принятия: ${response.status}`);

            setFriendRequests(friendRequests.filter(req => req.friend_id !== friendId));
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

    const handleRejectRequest = async (friendId: number) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`http://localhost:5000/friend-requests/reject/${friendId}`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` },
            });

            if (!response.ok) throw new Error(`Ошибка отклонения: ${response.status}`);

            setFriendRequests(friendRequests.filter(req => req.friend_id !== friendId));
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
                                <li key={request.friend_id} className="flex items-center justify-between border-b pb-2">
                                    <div className="flex items-center space-x-4">
                                        <img
                                            src={request.friend.avatar ? `http://localhost:5000${request.friend.avatar}` : "/placeholder.svg"}
                                            alt={request.friend.username}
                                            className="w-12 h-12 rounded-full object-cover border border-gray-300"
                                        />
                                        <span>{request.friend.username}</span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button size="sm" variant="default" onClick={() => handleAcceptRequest(request.friend_id)}>
                                            Принять
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleRejectRequest(request.friend_id)}>
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
