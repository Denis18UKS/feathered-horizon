
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface Answer {
  id: string;
  answer: string;
  user_id: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

interface Forum {
  id: string;
  title: string;
  question: string;
  created_at: string;
  user_id: string;
}

const Answers = () => {
  const { id } = useParams<{ id: string }>();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [forum, setForum] = useState<Forum | null>(null);
  const [newAnswer, setNewAnswer] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchForum();
    fetchAnswers();
  }, [id]);

  const fetchForum = async () => {
    try {
      const { data, error } = await supabase
        .from("forums")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) setForum(data);
    } catch (error: any) {
      console.error("Error fetching forum:", error.message);
    }
  };

  const fetchAnswers = async () => {
    try {
      const { data, error } = await supabase
        .from("answers")
        .select(`
          id, 
          answer, 
          user_id, 
          created_at,
          profiles:user_id(username)
        `)
        .eq("forum_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Transform the data to ensure it matches our Answer type
      const formattedAnswers = data.map(item => {
        // Check if profiles exists and is not an error
        const profileData = typeof item.profiles === 'object' && !('error' in item.profiles) 
          ? item.profiles 
          : { username: 'Unknown User' };
        
        return {
          ...item,
          profiles: profileData
        };
      });
      
      setAnswers(formattedAnswers as Answer[]);
    } catch (error: any) {
      console.error("Error fetching answers:", error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;

    try {
      const { data, error } = await supabase
        .from("answers")
        .insert([
          {
            forum_id: id,
            answer: newAnswer.trim(),
            user_id: user?.id,
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        // Create a new answer object with profile information
        const newAnswerWithProfile = {
          ...data[0],
          profiles: { username: user?.email?.split('@')[0] || 'User' }
        };
        
        setAnswers([...answers, newAnswerWithProfile] as Answer[]);
        setNewAnswer("");
        toast({
          title: "Ответ добавлен",
          description: "Ваш ответ успешно добавлен.",
        });
      }
    } catch (error: any) {
      console.error("Error adding answer:", error.message);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {forum && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">{forum.title}</CardTitle>
            <div className="text-sm text-gray-500">{format(new Date(forum.created_at), 'dd.MM.yyyy HH:mm')}</div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{forum.question}</p>
          </CardContent>
        </Card>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Ответы ({answers.length})</h2>
        {answers.length > 0 ? (
          answers.map((answer) => (
            <Card key={answer.id} className="mb-4">
              <CardContent className="pt-6">
                <div className="flex items-start mb-2">
                  <Avatar className="mr-3 h-8 w-8">
                    <AvatarFallback>{answer.profiles.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{answer.profiles.username}</div>
                    <div className="text-xs text-gray-500 mb-2">
                      {format(new Date(answer.created_at), 'dd.MM.yyyy HH:mm')}
                    </div>
                  </div>
                </div>
                <p className="whitespace-pre-wrap">{answer.answer}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-500">Пока нет ответов. Станьте первым!</p>
        )}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Напишите ваш ответ..."
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            className="min-h-[120px]"
            required
          />
          <Button type="submit">Отправить ответ</Button>
        </form>
      ) : (
        <div className="bg-gray-50 p-4 rounded border text-center">
          <p className="text-gray-500">Войдите, чтобы оставить ответ</p>
        </div>
      )}
    </div>
  );
};

export default Answers;
