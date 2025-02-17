import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { jwtDecode as jwt_decode } from "jwt-decode";

interface User {
    id: number;
    username: string;
    github_username: string;
    avatar: string | null;
    skills: string | null;
    friendshipStatus: "none" | "pending" | "accepted" | "declined"; // Статус дружбы
}

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(""); // Поиск
    const [filterNoSkills, setFilterNoSkills] = useState(false); // Фильтрация по навыкам
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const fetchUsers = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                toast({
                    title: "Ошибка",
                    description: "Токен не найден, необходима авторизация",
                    variant: "destructive",
                });
                navigate("/login");
                return;
            }

            try {
                const response = await fetch("http://localhost:5000/users", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const data = await response.json();
                    toast({
                        title: "Ошибка",
                        description: data.message || "Ошибка при получении пользователей",
                        variant: "destructive",
                    });
                    setUsers([]);
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                const decodedToken: any = jwt_decode(token);
                const currentUserId = decodedToken.id;

                setUsers(data.filter((user: User) => user.id !== currentUserId));
                setLoading(false);
            } catch (error) {
                toast({
                    title: "Ошибка",
                    description: "Ошибка при загрузке пользователей",
                    variant: "destructive",
                });
                setUsers([]);
                setLoading(false);
            }
        };

        fetchUsers();
    }, [navigate, toast]);

    // Фильтрация пользователей по поисковому запросу и навыкам
    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.skills && user.skills.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesSkillsFilter = filterNoSkills ? user.skills !== null && user.skills.trim() !== "" : true;

        return matchesSearch && matchesSkillsFilter;
    });

    const openProfile = (username: string) => {
        navigate(`/users/${username}`);
    };

    const addFriend = async (userId: number) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:5000/add-friend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ friendId: userId }),
            });

            if (!response.ok) {
                const data = await response.json();
                toast({
                    title: "Ошибка",
                    description: data.message || "Не удалось добавить в друзья",
                    variant: "destructive",
                });
                return;
            }

            // Обновляем статус пользователя на "pending" в локальном состоянии
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === userId ? { ...user, friendshipStatus: "pending" } : user
                )
            );

            toast({
                title: "Успех",
                description: "Заявка в друзья отправлена",
            });
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Ошибка при добавлении в друзья",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-4">
                <input
                    type="text"
                    className="px-4 py-2 border rounded-lg w-full"
                    placeholder="Поиск пользователей..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} // Обновление поиска
                />
            </div>

            <div className="mb-4">
                <Button
                    variant={filterNoSkills ? "default" : "outline"}
                    onClick={() => setFilterNoSkills(!filterNoSkills)}
                >
                    {filterNoSkills ? "Показывать пользователей с навыками" : "Исключить пользователей без навыков"}
                </Button>
            </div>

            {loading ? (
                <p className="text-muted-foreground text-center py-8">Загрузка пользователей...</p>
            ) : filteredUsers.length > 0 ? (
                <div className="flex flex-col space-y-4">
                    {filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center p-4 bg-white dark:bg-gray-800 shadow rounded-lg"
                        >
                            <img
                                src={user.avatar ? `http://localhost:5000${user.avatar}` : "/images/default-avatar.png"}
                                alt={user.username}
                                className="w-12 h-12 rounded-full object-cover mr-4"
                            />
                            <div className="flex-1">
                                <p className="text-lg font-semibold truncate">{user.username}</p>
                                <p className="text-sm text-muted-foreground truncate">{user.skills || "Нет навыков"}</p>
                            </div>
                            <Button variant="outline" onClick={() => openProfile(user.username)}>
                                Профиль
                            </Button>
                            {/* Кнопка добавления в друзья */}
                            {user.friendshipStatus === "none" && (
                                <Button variant="default" className="ml-2" onClick={() => addFriend(user.id)}>
                                    Добавить в друзья
                                </Button>
                            )}
                            {user.friendshipStatus === "pending" && (
                                <p className="ml-2 text-sm text-muted-foreground">Заявка отправлена</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p>Пользователи не найдены</p>
                </div>
            )}
        </div>
    );
};

export default Users;
