import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";

interface Answer {
  id: number;
  created_at: string;
  answer: string;
  forum_id: number;
  user_id: string;
  profiles: {
    username: string;
    avatar: string | null;
  } | null;
}

const Answers = () => {
  const { id } = useParams<{ id: string }>();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [forumTitle, setForumTitle] = useState('');
  const { toast } = useToast();
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!id) {
      console.error("Forum ID is missing.");
      return;
    }

    const fetchAnswers = async () => {
      try {
        const { data, error } = await supabase
          .from('answers')
          .select(`
            id,
            created_at,
            answer,
            forum_id,
            user_id,
            profiles (
              username,
              avatar
            )
          `)
          .eq('forum_id', id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching answers:", error);
        }

        if (data) {
          setAnswers(data as Answer[]);
        }
      } catch (error) {
        console.error("Error fetching answers:", error);
      }
    };

    const fetchForumTitle = async () => {
      try {
        const { data, error } = await supabase
          .from('forums')
          .select('title')
          .eq('id', id)
          .single();

        if (error) {
          console.error("Error fetching forum title:", error);
        }

        if (data) {
          setForumTitle(data.title);
        }
      } catch (error) {
        console.error("Error fetching forum title:", error);
      }
    };

    fetchAnswers();
    fetchForumTitle();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAnswer.trim()) {
      toast({
        title: "Ошибка",
        description: "Ответ не может быть пустым.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы, чтобы оставить ответ.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('answers')
        .insert([
          {
            answer: newAnswer,
            forum_id: id,
            user_id: user.id,
          },
        ])
        .select(`
          id,
          created_at,
          answer,
          forum_id,
          user_id,
          profiles (
            username,
            avatar
          )
        `)
        .single();

      if (error) {
        console.error("Error submitting answer:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось отправить ответ.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setAnswers([data as Answer, ...answers]);
        setNewAnswer('');
        toast({
          title: "Успех",
          description: "Ответ успешно отправлен.",
        });
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить ответ.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{forumTitle}</CardTitle>
          <CardDescription>Ответы на вопрос</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="answer">Ваш ответ</Label>
              <Textarea
                id="answer"
                placeholder="Напишите свой ответ..."
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Отправить ответ
            </Button>
          </form>

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-3">Все ответы:</h3>
            {answers.map((item) => (
              <div key={item.id} className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-center mb-2">
                  <Avatar className="h-6 w-6 mr-2">
                    {item.profiles && item.profiles.avatar ? (
                      <AvatarImage src={item.profiles.avatar} alt={item.profiles?.username || 'User'} />
                    ) : (
                      <AvatarFallback>{item.profiles?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-sm font-medium">{item.profiles?.username || 'Пользователь'}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {format(new Date(item.created_at), 'dd.MM.yyyy HH:mm')}
                  </span>
                </div>
                <p className="text-gray-700">{item.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Answers;
