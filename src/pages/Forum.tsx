import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/pages/AuthContext";

const Forum = () => {
    const [questions, setQuestions] = useState([]);
    const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
    const [newQuestion, setNewQuestion] = useState({ title: '', description: '' });
    const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null); // Исправлено
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();

    // Извлекаем ID пользователя из JWT токена
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId') || 
                  (token ? JSON.parse(atob(token.split('.')[1])).id : null);
    
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
        
        // Сохраняем userId в localStorage если есть токен
        if (token && !localStorage.getItem('userId')) {
            try {
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                if (decodedToken.id) {
                    localStorage.setItem('userId', decodedToken.id.toString());
                    console.info('Ваш user_id:', decodedToken.id);
                }
            } catch (error) {
                console.error('Ошибка при декодировании токена:', error);
            }
        }
    }, [token]);

    // Добавление нового вопроса
    const addQuestion = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newQuestion.title.trim() || !newQuestion.description.trim()) {
            toast({ title: "Ошибка", description: "Заполните все поля.", variant: "destructive" });
            return;
        }

        // Проверяем авторизацию через контекст
        if (!isAuthenticated || !token) {
            toast({ title: "Ошибка", description: "Вы не авторизованы.", variant: "destructive" });
            return;
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

            if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

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
                description: "Не удалось создать вопрос", 
                variant: "destructive" 
            });
        }
    };

    // Закрытие вопроса
    const handleCloseQuestion = async (questionId: number) => {
        if (!isAuthenticated || !token) {
            toast({ title: "Ошибка", description: "Вы не авторизованы.", variant: "destructive" });
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/forums/${questionId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'решён' }), // Передаем статус
            });

            if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

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
                description: "Не удалось закрыть вопрос", 
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
                                        Number(userId) === Number(q.user_id) ? (
                                            <Button 
                                                variant="outline"
                                                onClick={() => handleCloseQuestion(q.id)}
                                            >
                                                Закрыть вопрос
                                            </Button>
                                        ) : (
                                            <Button onClick={() => { setSelectedQuestion(q.id); /* действие для ответа */ }}>
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
                        <div className="flex justify-end">
                            <Button type="submit">Отправить</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Forum;