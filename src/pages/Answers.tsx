
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useParams } from 'react-router-dom';
import { supabase } from './AuthContext';

interface Answer {
  id: string;
  answer: string;
  created_at: string;
  user: string; 
  user_id: string;
}

interface Forum {
  id: string;
  title: string;
  description: string;
}

const Answers = () => {
    const { id } = useParams<{ id: string }>();
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [forum, setForum] = useState<Forum | null>(null);
    const [newAnswer, setNewAnswer] = useState('');
    const [showAddAnswerModal, setShowAddAnswerModal] = useState(false);
    const { toast } = useToast();

    // Загрузка вопроса и ответов с сервера
    useEffect(() => {
        const fetchForumAndAnswers = async () => {
            if (!id) return;

            try {
                // Fetch the forum post
                const { data: forumData, error: forumError } = await supabase
                    .from('forums')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (forumError) throw forumError;
                setForum(forumData);

                // Fetch answers with user information
                const { data: answersData, error: answersError } = await supabase
                    .from('answers')
                    .select(`
                        id,
                        answer,
                        created_at,
                        user_id,
                        profiles:user_id (username)
                    `)
                    .eq('forum_id', id);

                if (answersError) throw answersError;

                // Format answers with username
                const formattedAnswers = answersData.map(item => ({
                    id: item.id,
                    answer: item.answer,
                    created_at: item.created_at,
                    user: item.profiles?.username || 'Unknown User',
                    user_id: item.user_id
                }));

                setAnswers(formattedAnswers);
            } catch (error) {
                console.error('Ошибка при загрузке данных:', error);
                toast({ 
                    title: "Ошибка", 
                    description: "Не удалось загрузить ответы.", 
                    variant: "destructive" 
                });
            }
        };

        fetchForumAndAnswers();
    }, [id, toast]);

    // Добавление ответа
    const addAnswer = async () => {
        if (!newAnswer.trim()) {
            toast({ 
                title: "Ошибка", 
                description: "Ответ не может быть пустым.", 
                variant: "destructive" 
            });
            return;
        }

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                toast({ 
                    title: "Ошибка", 
                    description: "Вы не авторизованы.", 
                    variant: "destructive" 
                });
                return;
            }

            // Insert answer
            const { data, error } = await supabase
                .from('answers')
                .insert([
                    {
                        forum_id: id,
                        user_id: user.id,
                        answer: newAnswer
                    }
                ])
                .select(`
                    id,
                    answer,
                    created_at,
                    user_id,
                    profiles:user_id (username)
                `);

            if (error) throw error;

            if (data && data.length > 0) {
                const newAnswerData = {
                    id: data[0].id,
                    answer: data[0].answer,
                    created_at: data[0].created_at,
                    user: data[0].profiles?.username || user.email?.split('@')[0] || 'Unknown User',
                    user_id: data[0].user_id
                };
                
                setAnswers([...answers, newAnswerData]);
                setNewAnswer('');
                setShowAddAnswerModal(false);
                
                toast({ 
                    title: "Успех", 
                    description: "Ответ успешно добавлен" 
                });
            }
        } catch (error) {
            console.error('Ошибка при добавлении ответа:', error);
            toast({ 
                title: "Ошибка", 
                description: "Не удалось добавить ответ.", 
                variant: "destructive" 
            });
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-6">
                {forum ? forum.title : 'Ответы на вопрос'}
            </h2>
            
            {forum && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Вопрос</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{forum.description}</p>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {answers.length > 0 ? (
                    answers.map((answer) => (
                        <Card key={answer.id} className="w-full">
                            <CardHeader>
                                <CardTitle>Ответ</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p>{answer.answer}</p>
                                <p className="text-sm text-gray-500">Автор: {answer.user}</p>
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
