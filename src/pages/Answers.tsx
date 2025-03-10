
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './AuthContext';

interface Answer {
  id: string;
  answer: string;
  user_id: string;
  created_at: string;
  profiles?: {
    username: string;
  };
}

const Answers = () => {
    const { id } = useParams<{ id: string }>();
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [newAnswer, setNewAnswer] = useState('');
    const [showAddAnswerModal, setShowAddAnswerModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { isAuthenticated, user } = useAuth();

    // Load answers from Supabase
    const fetchAnswers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('answers')
                .select(`
                    id,
                    answer,
                    user_id,
                    created_at,
                    profiles:user_id(username)
                `)
                .eq('forum_id', id)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            setAnswers(data || []);
        } catch (error) {
            console.error('Error loading answers:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось загрузить ответы.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchAnswers();
        }
    }, [id]);

    // Add a new answer
    const addAnswer = async () => {
        if (!newAnswer.trim()) {
            toast({
                title: "Ошибка",
                description: "Ответ не может быть пустым.",
                variant: "destructive"
            });
            return;
        }

        if (!isAuthenticated || !user) {
            toast({
                title: "Ошибка",
                description: "Вы не авторизованы.",
                variant: "destructive"
            });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('answers')
                .insert({
                    forum_id: id,
                    answer: newAnswer,
                    user_id: user.id
                })
                .select(`
                    id,
                    answer,
                    user_id,
                    created_at,
                    profiles:user_id(username)
                `);

            if (error) {
                throw error;
            }

            if (data) {
                setAnswers([data[0], ...answers]);
                setNewAnswer('');
                setShowAddAnswerModal(false);
                toast({
                    title: "Успех",
                    description: "Ваш ответ успешно добавлен.",
                });
            }
        } catch (error) {
            console.error('Error adding answer:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось добавить ответ.",
                variant: "destructive"
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

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
                                <p className="text-sm text-gray-500">Автор: {answer.profiles?.username || "Неизвестный"}</p>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <p>Ответов пока нет.</p>
                )}
            </div>

            <Button className="mt-6" onClick={() => setShowAddAnswerModal(true)}>Добавить ответ</Button>

            {/* Модальное окно для добавления ответа */}
            <Dialog open={showAddAnswerModal} onOpenChange={setShowAddAnswerModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Добавить ответ</DialogTitle>
                    </DialogHeader>
                    <Textarea value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} required />
                    <DialogFooter>
                        <Button onClick={addAnswer}>Отправить</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Answers;
