import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

interface FriendRequest {
    id: number;
    user_id: number;
    friend_id: number;
    status: string;
    created_at: string;
    friend: {
        username: string;
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
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("Нет токена!");
                setIsLoading(false);
                setError("Вы не авторизованы. Пожалуйста, войдите в систему.");
                return;
            }

            try {
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                console.log("Ваш user_id:", decodedToken.id);
                const currentUserId = decodedToken.id;

                const response = await fetch("http://localhost:5000/friend-requests", {
                    headers: { "Authorization": `Bearer ${token}` },
                });

                if (response.status === 500) {
                    setError("Функция друзей временно недоступна. Обратитесь к администратору.");
                    setIsLoading(false);
                    return;
                }

                if (!response.ok) throw new Error(`Ошибка: ${response.status}`);

                const data = await response.json();
                console.log("Ответ сервера:", data);

                if (!Array.isArray(data)) {
                    throw new Error("Неверная структура данных");
                }

                const formattedRequests = data
                    .filter(req => req.user_id !== currentUserId)
                    .map((req, index) => ({
                        id: index,
                        user_id: req.user_id,
                        friend_id: req.friend_id,
                        status: req.status,
                        created_at: req.created_at || "",
                        friend: {
                            username: req.user_name || req.friend_name,
                        },
                    }));

                setFriendRequests(formattedRequests);
                setIsLoading(false);
            } catch (error) {
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

            setFriendRequests(prev => prev.filter(req => req.user_id !== friendId));
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

            setFriendRequests(prev => prev.filter(req => req.user_id !== friendId));
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
                                <li key={request.id} className="flex items-center justify-between border-b pb-2">
                                    <span>{request.friend.username}</span>
                                    <div className="flex space-x-2">
                                        <Button size="sm" variant="default" onClick={() => handleAcceptRequest(request.user_id)}>
                                            Принять
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleRejectRequest(request.user_id)}>
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
