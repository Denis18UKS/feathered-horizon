
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/pages/AuthContext";

const Forum = () => {
    const [questions, setQuestions] = useState([]);
    const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
    const [showAnswersModal, setShowAnswersModal] = useState(false);
    const [showAddAnswerModal, setShowAddAnswerModal] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
    const [answers, setAnswers] = useState([]);
    const [newQuestion, setNewQuestion] = useState({ title: '', description: '' });
    const [newAnswer, setNewAnswer] = useState('');
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();
    const token = localStorage.getItem('token');

    // Получаем userId напрямую из хранилища или декодируем из токена
    let userId = localStorage.getItem('userId');
    
    // Функция для декодирования токена и получения userId
    const getUserIdFromToken = () => {
        if (!token) return null;
        
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const decoded = JSON.parse(jsonPayload);
            return decoded.id ? decoded.id.toString() : null;
        } catch (error) {
            console.error('Ошибка при декодировании токена:', error);
            return null;
        }
    };
    
    // Если userId не найден в localStorage, пытаемся получить его из токена
    if (!userId && token) {
        userId = getUserIdFromToken();
        if (userId) {
            localStorage.setItem('userId', userId);
        }
    }
    
    const navigate = useNavigate();
    
    // Загрузка вопросов с сервера
    const fetchQuestions = async () => {
        try {
            const response = await fetch('http://localhost:5000/forums');
            if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
            const data = await response.json();
            setQuestions(data);
        } catch (error) {
            console.error('Ошибка при загрузке вопросов:', error);
            toast({ title: "Ошибка", description: "Не удалось загрузить вопросы.", variant: "destructive" });
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    // Добавление нового вопроса
    const addQuestion = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newQuestion.title.trim() || !newQuestion.description.trim()) {
            toast({ title: "Ошибка", description: "Заполните все поля.", variant: "destructive" });
            return;
        }

        // Проверяем авторизацию
        if (!isAuthenticated) {
            toast({ title: "Ошибка", description: "Вы не авторизованы.", variant: "destructive" });
            return;
        }

        // Проверяем наличие токена
        if (!token) {
            toast({ title: "Ошибка", description: "Токен авторизации отсутствует.", variant: "destructive" });
            return;
        }

        // Проверяем наличие userId
        if (!userId) {
            const newUserId = getUserIdFromToken();
            if (!newUserId) {
                toast({ title: "Ошибка", description: "Не удалось определить ID пользователя.", variant: "destructive" });
                return;
            }
            userId = newUserId;
            localStorage.setItem('userId', userId);
        }

        try {
            const response = await fetch('http://localhost:5000/forums', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: newQuestion.title,
                    description: newQuestion.description,
                    user_id: userId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Ошибка HTTP: ${response.status}`);
            }

            const newQuestionFromDB = await response.json();
            setQuestions((prev) => [...prev, newQuestionFromDB]);
            setShowAddQuestionModal(false);
            setNewQuestion({ title: '', description: '' });
            toast({
                title: "Успешно",
                description: "Вопрос успешно создан",
            });
        } catch (error) {
            console.error('Ошибка при добавлении вопроса:', error);
            toast({ 
                title: "Ошибка", 
                description: error.message || "Не удалось создать вопрос", 
                variant: "destructive" 
            });
        }
    };

    // Закрытие вопроса
    const handleCloseQuestion = async (questionId: number) => {
        if (!isAuthenticated) {
            toast({ title: "Ошибка", description: "Вы не авторизованы.", variant: "destructive" });
            return;
        }

        if (!token) {
            toast({ title: "Ошибка", description: "Токен авторизации отсутствует.", variant: "destructive" });
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/forums/${questionId}/close`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Ошибка HTTP: ${response.status}`);
            }

            setQuestions(prev => 
                prev.map(q => 
                    q.id === questionId 
                        ? { ...q, status: 'решён' } 
                        : q
                )
            );

            toast({
                title: "Успешно",
                description: "Вопрос закрыт",
            });
        } catch (error) {
            console.error('Ошибка при закрытии вопроса:', error);
            toast({ 
                title: "Ошибка", 
                description: error.message || "Не удалось закрыть вопрос", 
                variant: "destructive" 
            });
        }
    };

    // Загрузка ответов к вопросу
    const fetchAnswers = async (questionId: number) => {
        try {
            const response = await fetch(`http://localhost:5000/forums/${questionId}/answers`);
            if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
            const data = await response.json();
            setAnswers(data);
            setShowAnswersModal(true);
        } catch (error) {
            console.error('Ошибка при загрузке ответов:', error);
        }
    };

    // Добавление ответа
    const addAnswer = async () => {
        if (!newAnswer.trim()) {
            toast({ title: "Ошибка", description: "Ответ не может быть пустым.", variant: "destructive" });
            return;
        }

        // Проверяем авторизацию
        if (!isAuthenticated) {
            toast({ title: "Ошибка", description: "Вы не авторизованы.", variant: "destructive" });
            return;
        }

        // Проверяем наличие токена
        if (!token) {
            toast({ title: "Ошибка", description: "Токен авторизации отсутствует.", variant: "destructive" });
            return;
        }

        // Проверяем наличие userId
        if (!userId) {
            const newUserId = getUserIdFromToken();
            if (!newUserId) {
                toast({ title: "Ошибка", description: "Не удалось определить ID пользователя.", variant: "destructive" });
                return;
            }
            userId = newUserId;
            localStorage.setItem('userId', userId);
        }

        if (selectedQuestion === null) {
            console.error('Ошибка: Не выбран вопрос.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/forums/${selectedQuestion}/answers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    answer: newAnswer,
                    user_id: userId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Ошибка HTTP: ${response.status}`);
            }

            const newAnswerFromDB = await response.json();
            setAnswers((prev) => [...prev, newAnswerFromDB]);
            setNewAnswer('');
            setShowAddAnswerModal(false);
            toast({
                title: "Успешно",
                description: "Ответ успешно добавлен",
            });
        } catch (error) {
            console.error('Ошибка при добавлении ответа:', error);
            toast({ 
                title: "Ошибка", 
                description: error.message || "Не удалось добавить ответ", 
                variant: "destructive" 
            });
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-8">
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold">Форум</h2>
                        <Button variant="outline" onClick={() => setShowAddQuestionModal(true)}>+ Задать вопрос</Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {questions.map((q) => (
                            <Card key={q.id} className={`w-full ${q.status === 'решён' ? 'bg-green-100' : ''}`}>
                                <CardHeader>
                                    <CardTitle>{q.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>{q.description}</CardDescription>
                                    <p><strong>Пользователь:</strong> {q.user || 'Не указан'}</p>
                                    <p><strong>Дата:</strong> {new Date(q.created_at).toLocaleDateString()}</p>
                                    <p><strong>Статус:</strong> {q.status}</p>
                                </CardContent>
                                <CardFooter className="flex gap-2">
                                    <Button onClick={() => navigate(`/forums/${q.id}/answers`)}>
                                        Посмотреть ответы
                                    </Button>
                                    {q.status !== 'решён' && (
                                        String(userId) === String(q.user_id) ? (
                                            <Button 
                                                variant="outline"
                                                onClick={() => handleCloseQuestion(q.id)}
                                            >
                                                Закрыть вопрос
                                            </Button>
                                        ) : (
                                            <Button onClick={() => { setSelectedQuestion(q.id); setShowAddAnswerModal(true); }}>
                                                Ответить
                                            </Button>
                                        )
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>

            {/* Модальное окно для добавления вопроса */}
            <Dialog open={showAddQuestionModal} onOpenChange={setShowAddQuestionModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Задать вопрос</DialogTitle>
                        <DialogDescription>Заполните форму для создания нового вопроса</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={addQuestion}>
                        <Label>Тема</Label>
                        <Input value={newQuestion.title} onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })} required />
                        <Label>Описание</Label>
                        <Textarea value={newQuestion.description} onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })} required />
                        <DialogFooter>
                            <Button type="submit">Отправить</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Модальное окно для добавления ответа */}
            <Dialog open={showAddAnswerModal} onOpenChange={setShowAddAnswerModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Добавить ответ</DialogTitle>
                        <DialogDescription>Введите ваш ответ на вопрос</DialogDescription>
                    </DialogHeader>
                    <Textarea value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} required />
                    <DialogFooter>
                        <Button onClick={addAnswer}>Ответить</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Модальное окно для отображения ответов */}
            <Dialog open={showAnswersModal} onOpenChange={setShowAnswersModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ответы</DialogTitle>
                        <DialogDescription>Список всех ответов на вопрос</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {answers.length > 0 ? (
                            answers.map((answer) => (
                                <div key={answer.id} className="border p-2 rounded">
                                    <p>{answer.answer}</p>
                                    <p className="text-sm text-gray-500">Автор: {answer.user || "Неизвестный"}</p>
                                </div>
                            ))
                        ) : (
                            <p>Ответов пока нет.</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowAnswersModal(false)}>Закрыть</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Forum;
