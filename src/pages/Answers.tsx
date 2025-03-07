import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useParams } from 'react-router-dom';

const Answers = () => {
    const { id } = useParams<{ id: string }>(); // Получаем ID вопроса из URL
    const [answers, setAnswers] = useState([]);
    const [newAnswer, setNewAnswer] = useState('');
    const [showAddAnswerModal, setShowAddAnswerModal] = useState(false);
    const { toast } = useToast();

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    // Загрузка ответов с сервера
    const fetchAnswers = async () => {
        try {
            const response = await fetch(`http://localhost:5000/forums/${id}/answers`);
            if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
            const data = await response.json();
            setAnswers(data);
        } catch (error) {
            console.error('Ошибка при загрузке ответов:', error);
            toast({ title: "Ошибка", description: "Не удалось загрузить ответы.", variant: "destructive" });
        }
    };

    useEffect(() => {
        fetchAnswers();
    }, [id]);

    // Добавление ответа
    const addAnswer = async () => {
        if (!newAnswer.trim()) {
            toast({ title: "Ошибка", description: "Ответ не может быть пустым.", variant: "destructive" });
            return;
        }

        if (!token || !userId) {
            toast({ title: "Ошибка", description: "Вы не авторизованы.", variant: "destructive" });
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/forums/${id}/answers`, {
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

            if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

            const newAnswerFromDB = await response.json();
            setAnswers((prev) => [...prev, newAnswerFromDB]);
            setNewAnswer('');
            setShowAddAnswerModal(false);
        } catch (error) {
            console.error('Ошибка при добавлении ответа:', error);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-6">Ответы на вопрос</h2>

            <div className="grid gap-4">
                {answers.length > 0 ? (
                    answers.map((answer) => (
                        <Card key={answer.id} className="w-full">
                            <CardHeader>
                                <CardTitle>Ответ</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p>{answer.answer}</p>
                                <p className="text-sm text-gray-500">Автор: {answer.user || "Неизвестный"}</p>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <p>Ответов пока нет.</p>
                )}
            </div>
        </div>
    );
};

export default Answers;
