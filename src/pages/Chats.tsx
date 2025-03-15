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
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface User {
    id: number;
    username: string;
    avatar: string;
    isFriend: boolean;  // Допустим, есть такая метка
}

interface Message {
    id: number;
    chat_id: number;
    user_id: number;
    message: string;
    created_at: string;
    username: string;
    read: boolean;
    media?: string; // Добавлено для медиафайлов
}


interface DecodedToken {
    id: number;
    username: string;
}

const Chats = () => {
    const { chatId } = useParams<{ chatId: string }>();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUser, setCurrentUser] = useState<DecodedToken | null>(null);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState<{ [key: number]: number }>({});
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [mediaFile, setMediaFile] = useState<File | null>(null);

    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const fetchFriends = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const decodedToken = jwtDecode<DecodedToken>(token);
                setCurrentUser(decodedToken);

                const response = await fetch('http://localhost:5000/friends', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                const friends = await response.json();
                console.log("Полученные друзья:", friends); // ✅ Проверяем, что сервер действительно их возвращает

                setUsers(friends);
                setFilteredUsers(friends);
            } catch (error) {
                console.error("Ошибка загрузки друзей:", error);
                navigate('/login');
            }
        };


        fetchFriends();
    }, [navigate]);

    const deleteMessage = async (messageId: number) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const confirmed = window.confirm("Вы уверены, что хотите удалить данное сообщение?");
        if (!confirmed) return;

        try {
            const response = await fetch(`http://localhost:5000/messages/${messageId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
            } else {
                throw new Error('Ошибка при удалении сообщения');
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    };


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
                if (message.user_id !== currentUser?.id) {
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
            }
        };

        return () => socket.close();
    }, [chatId, currentUser?.id]);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setMediaFile(e.target.files[0]);
        }
    };

    const sendMessage = async () => {
        if (newMessage.trim() === '' && !mediaFile) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        const payload: any = {
            chatId: Number(chatId), // Убедитесь, что это число
            message: newMessage.trim() // Убираем лишние пробелы
        };

        // Если есть медиафайл
        if (mediaFile) {
            const formData = new FormData();
            formData.append('chatId', String(chatId)); // Преобразуем в строку
            formData.append('message', newMessage.trim());
            formData.append('media', mediaFile);

            try {
                const response = await fetch(`http://localhost:5000/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (!response.ok) throw new Error('Ошибка при отправке сообщения');
                const sentMessage = await response.json();
                setMessages(prev => [...prev, sentMessage]);
                setNewMessage(''); // Очищаем поле ввода
                setMediaFile(null); // Очищаем файл
                scrollToBottom();
            } catch (error) {
                console.error('Ошибка:', error);
            }
        } else {
            // Без медиафайла, просто текст
            try {
                const response = await fetch(`http://localhost:5000/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('Ошибка при отправке сообщения');
                const sentMessage = await response.json();
                setMessages(prev => [...prev, sentMessage]);
                setNewMessage(''); // Очищаем поле ввода
                scrollToBottom();
            } catch (error) {
                console.error('Ошибка:', error);
            }
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
        return format(new Date(dateString), "d MMMM yyyy HH:mm", { locale: ru });
    };



    if (!currentUser) return <div>Загрузка...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <ToastContainer />
            <div className="flex space-x-8">
                <aside className="w-1/4 user-list">
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Список друзей</CardTitle>
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
                                {filteredUsers.length === 0 ? (
                                    <li className="p-2 text-center">Нет друзей</li>
                                ) : (
                                    filteredUsers.map(user => (
                                        <li
                                            key={user.id}
                                            onClick={() => selectChat(user)}
                                            className={`p-2 rounded cursor-pointer flex items-center space-x-2 ${selectedUser?.id === user.id ? 'bg-primary/10' : ''}`}
                                        >
                                            <img src={getAvatarUrl(user.avatar)} alt="avatar" className="w-8 h-8 rounded-full" />
                                            <p>{user.username}</p>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </CardContent>
                    </Card>
                </aside>

                <main className="w-3/4 chat-box">
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>{selectedUser ? selectedUser.username : 'Выберите чат'}</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[500px] overflow-y-auto space-y-4">
                            {messages.map(message => (
                                <div
                                    key={message.id}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        if (message.user_id === currentUser?.id) {
                                            deleteMessage(message.id);
                                        }
                                    }}
                                    className={`w-full mb-4 rounded-lg p-3 ${message.user_id === currentUser?.id ? 'bg-blue-100 ml-auto text-right' : 'bg-gray-100 mr-auto text-left'}`}
                                >
                                    <div className="text-sm text-gray-500">{message.username}</div>
                                    <div className="break-all">{message.message}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {formatDate(message.created_at)}
                                    </div>

                                </div>
                            ))}

                            <div ref={messagesEndRef} />
                        </CardContent>
                        {selectedUser && (
                            <CardFooter className="flex items-center space-x-2">
                                <Input type="file" onChange={handleFileChange} />
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
