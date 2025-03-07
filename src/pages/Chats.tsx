
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
import { Paperclip, X, Image, File } from "lucide-react";

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
    file_url?: string;
    file_type?: string;
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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isFilePanelOpen, setIsFilePanelOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
                console.log("Полученные друзья:", friends);

                setUsers(friends);
                setFilteredUsers(friends);
            } catch (error) {
                console.error("Ошибка загрузки друзей:", error);
                navigate('/login');
            }
        };

        fetchFriends();
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
                setTimeout(() => scrollToBottom(), 100);
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            // Проверяем размер файла (10MB максимум)
            if (file.size > 10 * 1024 * 1024) {
                toast.error("Файл слишком большой. Максимальный размер 10MB");
                return;
            }
            setSelectedFile(file);
        }
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const toggleFilePanel = () => {
        setIsFilePanelOpen(!isFilePanelOpen);
        if (!isFilePanelOpen && fileInputRef.current) {
            setTimeout(() => {
                fileInputRef.current?.click();
            }, 100);
        }
    };

    const sendMessage = async () => {
        if ((newMessage.trim() === '' && !selectedFile)) return;

        const token = localStorage.getItem("token");
        try {
            const formData = new FormData();
            formData.append('chatId', chatId || '');
            formData.append('message', newMessage);
            formData.append('username', currentUser?.username || '');
            
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            const response = await fetch(`http://localhost:5000/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                const sentMessage = await response.json();
                setMessages(prev => [...prev, sentMessage]);
                setNewMessage('');
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                setIsFilePanelOpen(false);
                scrollToBottom();
            } else {
                throw new Error('Ошибка при отправке сообщения');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            toast.error("Не удалось отправить сообщение");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
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
        return new Date(dateString).toLocaleDateString("ru-RU", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const isImage = (fileUrl: string) => {
        const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        return extensions.some(ext => fileUrl.toLowerCase().endsWith(ext));
    };

    const getFileNameFromUrl = (fileUrl: string) => {
        return fileUrl.split('/').pop() || 'файл';
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
                                <div key={message.id} className={`w-full mb-4 rounded-lg p-3 ${message.user_id === currentUser?.id ? 'bg-blue-100 ml-auto text-right' : 'bg-gray-100 mr-auto text-left'}`}>
                                    <div className="text-sm text-gray-500">{message.username}</div>
                                    
                                    {message.message && <div className="break-all mb-2">{message.message}</div>}
                                    
                                    {message.file_url && (
                                        isImage(message.file_url) ? (
                                            <div className="mt-2">
                                                <img 
                                                    src={`http://localhost:5000${message.file_url}`} 
                                                    alt="Изображение" 
                                                    className="max-w-full max-h-[300px] rounded-lg"
                                                    onClick={() => window.open(`http://localhost:5000${message.file_url}`, '_blank')}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="mt-2">
                                                <a 
                                                    href={`http://localhost:5000${message.file_url}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center space-x-2 p-2 bg-gray-200 rounded-md hover:bg-gray-300 text-blue-600"
                                                >
                                                    <File size={16} />
                                                    <span>{getFileNameFromUrl(message.file_url)}</span>
                                                </a>
                                            </div>
                                        )
                                    )}
                                    
                                    <div className="text-xs text-gray-500 mt-1">{formatDate(message.created_at)}</div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </CardContent>
                        {selectedUser && (
                            <>
                                {selectedFile && (
                                    <div className="px-4 py-2 bg-gray-100 m-4 rounded-md flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            {isImage(selectedFile.name) ? <Image size={16} /> : <File size={16} />}
                                            <span className="text-sm">{selectedFile.name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={removeSelectedFile}>
                                            <X size={16} />
                                        </Button>
                                    </div>
                                )}
                                <CardFooter className="flex items-center space-x-2">
                                    <Input 
                                        type="text" 
                                        value={newMessage} 
                                        onChange={(e) => setNewMessage(e.target.value)} 
                                        onKeyDown={handleKeyDown} 
                                        placeholder="Введите сообщение..." 
                                        className="w-full"
                                    />
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="flex-shrink-0"
                                        onClick={toggleFilePanel}
                                    >
                                        <Paperclip size={18} />
                                    </Button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileSelect} 
                                        className="hidden" 
                                    />
                                    <Button onClick={sendMessage} className="flex-shrink-0">Отправить</Button>
                                </CardFooter>
                            </>
                        )}
                    </Card>
                </main>
            </div>
        </div>
    );
};

export default Chats;
