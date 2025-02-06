import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { LiquidButton } from "@/components/ui/liquid-button";
import { format } from "date-fns"; // Импортируем только format
import { ru } from "date-fns/locale";

interface User {
    id: number;
    username: string;
    avatar: string;
}

interface Message {
    id: number;
    chat_id: number;
    user_id: number;
    message: string;
    created_at: string;
    username: string;
    read: boolean;
}

interface DecodedToken {
    id: number;
    username: string;
    // другие поля, которые могут быть в токене
}

const Chats = () => {
    const { chatId } = useParams<{ chatId: string }>();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUser, setCurrentUser] = useState<DecodedToken | null>(null); // Corrected type here
    const [unreadMessagesCount, setUnreadMessagesCount] = useState<{ [key: number]: number }>({});
    const [showScrollButton, setShowScrollButton] = useState(false);
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const decodedToken = jwtDecode<DecodedToken>(token); // Type the decoded token
                setCurrentUser(decodedToken);

                const response = await fetch('http://localhost:5000/users', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const usersData = await response.json();
                setUsers(usersData.filter((user: User) => user.id !== decodedToken.id));
                setFilteredUsers(usersData.filter((user: User) => user.id !== decodedToken.id));
            } catch (error) {
                console.error("Ошибка загрузки пользователей:", error);
                navigate('/login');
            }
        };

        fetchUsers();
    }, [navigate]);

    useEffect(() => {
        if (!chatId) return;

        const fetchMessages = async () => {
            const token = localStorage.getItem("token");
            try {
                const response = await fetch(`http://localhost:5000/messages/${chatId}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const messagesData = await response.json();
                setMessages(messagesData);
                setUnreadMessagesCount(prev => ({ ...prev, [Number(chatId)]: 0 }));
            } catch (error) {
                console.error("Ошибка загрузки сообщений:", error);
            }
        };

        fetchMessages();
    }, [chatId]);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');

        socket.onmessage = (event) => {
            const notification = JSON.parse(event.data);

            if (notification.type === 'NEW_MESSAGE') {
                const message = notification.data;
                if (message.chat_id !== Number(chatId)) {
                    toast(`Новое сообщение от ${message.username || 'Неизвестный'}`);
                    setUnreadMessagesCount(prev => ({
                        ...prev,
                        [message.chat_id]: (prev[message.chat_id] || 0) + 1
                    }));
                } else {
                    setMessages(prev => [...prev, message]);
                    setShowScrollButton(true);
                }
            }
        };

        return () => socket.close();
    }, [chatId]);

    const selectChat = (user: User) => {
        if (selectedUser?.id === user.id) return;

        setSelectedUser(user);
        setMessages([]);
        setUnreadMessagesCount(prev => ({ ...prev, [user.id]: 0 }));

        const token = localStorage.getItem("token");
        if (!token) return;

        fetch('http://localhost:5000/chats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ userId2: user.id }),
        })
            .then(response => response.json())
            .then(chatData => {
                if (chatData.id) {
                    navigate(`/chats/${chatData.id}`);
                }
            })
            .catch(err => console.error("Ошибка при создании чата", err));
    };

    const sendMessage = async () => {
        if (newMessage.trim() === '') return;

        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`http://localhost:5000/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ chatId, message: newMessage, username: currentUser?.username }),
            });

            if (response.ok) {
                const sentMessage: Message = {
                    id: Date.now(),
                    chat_id: Number(chatId),
                    user_id: currentUser!.id,
                    message: newMessage,
                    created_at: new Date().toISOString(),
                    username: currentUser!.username,
                    read: true
                };

                setMessages(prev => [...prev, sentMessage]);
                setNewMessage('');
                scrollToBottom();
            } else {
                throw new Error('Ошибка при отправке сообщения');
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        setFilteredUsers(users.filter((user: User) => user.username.toLowerCase().includes(query)));
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const getAvatarUrl = (avatar: string) => {
        return avatar ? `http://localhost:5000${avatar}` : '/images/default-avatar.png';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString("ru-RU", { // Используем toLocaleString
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };


    if (!currentUser) return <div>Загрузка...</div>;

    return (
        <div className="container mx-auto px-4 py-8"> {/* Контейнер для центрирования */}
            <ToastContainer />
            <div className="flex space-x-8"> {/* Flexbox для расположения рядом */}
                <aside className="w-1/4 user-list"> {/* Ширина 1/4 для списка пользователей */}
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Пользователи</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                type="text"
                                placeholder="Поиск..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full mb-4"
                            />
                            <ul className="space-y-2">
                                {filteredUsers.map(user => (
                                    <li key={user.id} onClick={() => selectChat(user)} className={`p-2 rounded cursor-pointer flex items-center space-x-2 ${selectedUser?.id === user.id ? 'bg-primary/10' : ''}`}>
                                        <img src={getAvatarUrl(user.avatar)} alt="avatar" className="w-8 h-8 rounded-full" />
                                        <p>{user.username}</p>
                                        {unreadMessagesCount[user.id] > 0 && <span className="notification-badge bg-red-500 text-white rounded-full px-2 py-1 text-xs">{unreadMessagesCount[user.id]}</span>}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </aside>

                <main className="w-3/4 chat-box">
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>{selectedUser ? selectedUser.username : 'Выберите пользователя'}</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[500px] overflow-y-auto space-y-4">
                            {messages.map(message => (
                                <div key={message.id} className={`w-full mb-4 rounded-lg p-3 ${message.user_id === currentUser?.id ? 'bg-blue-100 ml-auto text-right' : 'bg-gray-100 mr-auto text-left'}`}> {/* Стилизация под ВК */}
                                    <div className="text-sm text-gray-500">
                                        {message.username}
                                    </div>
                                    <div className="break-all"> {/* Для переноса длинных слов */}
                                        {message.message}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {formatDate(message.created_at)} {/* Форматированная дата */}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </CardContent>
                        {selectedUser && (
                            <CardFooter className="flex items-center space-x-2">
                                <Input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Введите сообщение..." className="w-full" />
                                <Button onClick={sendMessage}>Отправить</Button>
                            </CardFooter>
                        )}
                    </Card>
                </main>
            </div>
        </div>
    );
};

export default Chats;