
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistance } from "date-fns";
import { ru } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { LiquidButton } from "@/components/ui/liquid-button";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";

interface Post {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  user: string;
  created_at: string;
  link?: string;
}

const fetchNews = async (): Promise<Post[]> => {
  try {
    const response = await fetch("http://localhost:5000/news");
    if (!response.ok) {
      throw new Error("Failed to fetch news");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
};

const fetchPosts = async (): Promise<Post[]> => {
  try {
    const response = await fetch("http://localhost:5000/posts");
    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
};

const Index = () => {
  const [showMoreNews, setShowMoreNews] = useState(false);
  const [showMorePosts, setShowMorePosts] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [newsForm, setNewsForm] = useState({
    title: "",
    description: "",
    image_url: "",
    link: "",
    file: null as File | null,
  });

  const [postForm, setPostForm] = useState({
    title: "",
    description: "",
    image_url: "",
    file: null as File | null,
  });

  const { 
    data: news = [], 
    isLoading: newsLoading,
    error: newsError,
    refetch: refetchNews
  } = useQuery({
    queryKey: ['news'],
    queryFn: fetchNews,
    retry: 1,
  });

  const {
    data: posts = [],
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    retry: 1,
  });

  const submitNewsForm = async () => {
    if (!newsForm.title || !newsForm.description || !newsForm.link) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", newsForm.title);
    formData.append("description", newsForm.description);
    formData.append("link", newsForm.link);
    if (newsForm.file) {
      formData.append("file", newsForm.file);
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/news", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Новость успешно добавлена",
        });
        setNewsForm({ title: "", description: "", image_url: "", link: "", file: null });
        refetchNews(); // Обновляем данные
      } else {
        const errorData = await response.json();
        toast({
          title: "Ошибка",
          description: errorData.message || "Ошибка добавления новости",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting news:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить новость",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitPostForm = async () => {
    if (!postForm.title || !postForm.description) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", postForm.title);
    formData.append("description", postForm.description);
    if (postForm.file) {
      formData.append("file", postForm.file);
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/posts", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Пост успешно добавлен",
        });
        setPostForm({ title: "", description: "", image_url: "", file: null });
        refetchPosts(); // Обновляем данные
      } else {
        const errorData = await response.json();
        toast({
          title: "Ошибка",
          description: errorData.message || "Ошибка добавления поста",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить пост",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderCards = (items: Post[], showMore: boolean, type: "news" | "posts") => {
    // Проверяем, что items является массивом и не пуст
    if (!Array.isArray(items) || items.length === 0) {
      return (
        <p className="text-muted-foreground text-center py-8">
          {type === "news" ? "Нет новостей" : "Нет постов"}
        </p>
      );
    }

    const visibleItems = showMore ? items : items.slice(0, 3);

    return visibleItems.map((item) => (
      <Card key={item.id} className="w-full">
        <CardHeader>
          <CardTitle>{item.title}</CardTitle>
          {item.image_url && item.image_url !== "null" && (
            <img
              src={`http://localhost:5000${item.image_url}`}
              alt={item.title}
              className="w-full h-48 object-cover rounded-md"
            />
          )}
        </CardHeader>
        <CardContent>
          <CardDescription>{item.description}</CardDescription>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <span>Автор: {item.user}</span> <br />
            {format(new Date(item.created_at), "dd MMMM yyyy, HH:mm", { locale: ru })}
            <span className="mx-2">•</span>
            <span>
              {formatDistance(new Date(item.created_at), new Date(), {
                addSuffix: true,
                locale: ru,
              })}
            </span>
          </div>

          {item.link && (
            <Button
              variant="outline"
              asChild
              className="relative overflow-hidden transition-all duration-500 before:absolute before:inset-0 before:translate-x-[60%] before:bg-primary/10 before:transition-transform hover:before:translate-x-[-60%] before:rounded-full"
            >
              <a href={item.link} target="_blank" rel="noopener noreferrer">
                Подробнее
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
    ));
  };

  // Отображение состояния загрузки, ошибок и данных в секциях
  const renderSection = (
    title: string, 
    items: Post[], 
    isLoading: boolean, 
    error: unknown, 
    showMore: boolean, 
    setShowMore: React.Dispatch<React.SetStateAction<boolean>>, 
    dialogTitle: string,
    dialogDesc: string,
    formFields: JSX.Element,
    submitForm: () => Promise<void>,
    type: "news" | "posts"
  ) => (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">{title}</h2>
        <Dialog>
          <DialogTrigger asChild>
            <LiquidButton
              text={`+ Добавить ${type === "news" ? "новость" : "пост"}`}
              color1="#9b87f5"
              color2="#6E59A5"
              color3="#8F17E1"
              width={200}
              height={50}
            />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>
                {dialogDesc}
              </DialogDescription>
            </DialogHeader>
            {formFields}
            <DialogFooter>
              <Button onClick={submitForm} disabled={loading}>
                {loading ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8" />
          <p>Ошибка загрузки данных. Попробуйте позже.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {renderCards(items, showMore, type)}
          </div>
          {Array.isArray(items) && items.length > 3 && (
            <div className="text-center mt-6">
              <LiquidButton
                text={showMore ? "Скрыть" : "Показать больше"}
                color1="#9b87f5"
                color2="#6E59A5"
                color3="#8F17E1"
                width={180}
                height={40}
                onClick={() => setShowMore(!showMore)}
              />
            </div>
          )}
        </>
      )}
    </section>
  );

  const newsFormFields = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Название</Label>
        <Input
          id="title"
          value={newsForm.title}
          onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          value={newsForm.description}
          onChange={(e) => setNewsForm({ ...newsForm, description: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="link">Ссылка</Label>
        <Input
          id="link"
          value={newsForm.link}
          onChange={(e) => setNewsForm({ ...newsForm, link: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="file">Изображение</Label>
        <Input
          id="file"
          type="file"
          accept="image/*"
          onChange={(e) => setNewsForm({ ...newsForm, file: e.target.files?.[0] || null })}
        />
      </div>
    </div>
  );

  const postFormFields = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="post-title">Название</Label>
        <Input
          id="post-title"
          value={postForm.title}
          onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="post-description">Описание</Label>
        <Textarea
          id="post-description"
          value={postForm.description}
          onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="post-file">Изображение</Label>
        <Input
          id="post-file"
          type="file"
          accept="image/*"
          onChange={(e) => setPostForm({ ...postForm, file: e.target.files?.[0] || null })}
        />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {renderSection(
          "Новости",
          news,
          newsLoading,
          newsError,
          showMoreNews,
          setShowMoreNews,
          "Добавить новость",
          "Заполните форму для добавления новой новости",
          newsFormFields,
          submitNewsForm,
          "news"
        )}

        {renderSection(
          "Посты",
          posts,
          postsLoading,
          postsError,
          showMorePosts,
          setShowMorePosts,
          "Добавить пост",
          "Заполните форму для добавления нового поста",
          postFormFields,
          submitPostForm,
          "posts"
        )}
      </div>
    </div>
  );
};

export default Index;
