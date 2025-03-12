import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistance } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { LiquidButton } from "@/components/ui/liquid-button";
import { format } from "date-fns";

interface Post {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  user: string;
  created_at: string;
  link?: string;
}

const Index = () => {
  const [news, setNews] = useState<Post[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
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

  useEffect(() => {
    fetch("http://localhost:5000/news")
      .then((response) => response.json())
      .then(setNews)
      .catch((error) => {
        console.error("Error loading news:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить новости. Попробуйте позже.",
          variant: "destructive",
        });
      });

    fetch("http://localhost:5000/posts")
      .then((response) => response.json())
      .then(setPosts)
      .catch((error) => {
        console.error("Error loading posts:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить посты. Попробуйте позже.",
          variant: "destructive",
        });
      });
  }, []);

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
        const newsData = await fetch("http://localhost:5000/news").then((res) => res.json());
        setNews(newsData);
      } else {
        toast({
          title: "Ошибка",
          description: "Ошибка авторизации. Пожалуйста, войдите в систему.",
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
        const postsData = await fetch("http://localhost:5000/posts").then((res) => res.json());
        setPosts(postsData);
      } else {
        toast({
          title: "Ошибка",
          description: "Ошибка при добавлении поста",
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
    if (items.length === 0) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Новости</h2>
            <Dialog>
              <DialogTrigger asChild>
                <LiquidButton
                  text="+ Добавить новость"
                  color1="#9b87f5"
                  color2="#6E59A5"
                  color3="#8F17E1"
                  width={200}
                  height={50}
                />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить новость</DialogTitle>
                  <DialogDescription>
                    Заполните форму для добавления новой новости
                  </DialogDescription>
                </DialogHeader>
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
                <DialogFooter>
                  <Button onClick={submitNewsForm} disabled={loading}>
                    {loading ? "Сохранение..." : "Сохранить"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {renderCards(news, showMoreNews, "news")}
          </div>
          {news.length > 3 && (
            <div className="text-center mt-6">
              <LiquidButton
                text={showMoreNews ? "Скрыть" : "Показать больше"}
                color1="#9b87f5"
                color2="#6E59A5"
                color3="#8F17E1"
                width={180}
                height={40}
                onClick={() => setShowMoreNews(!showMoreNews)}
              />
            </div>
          )}
        </section>

        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Посты</h2>
            <Dialog>
              <DialogTrigger asChild>
                <LiquidButton
                  text="+ Добавить пост"
                  color1="#9b87f5"
                  color2="#6E59A5"
                  color3="#8F17E1"
                  width={200}
                  height={50}
                />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить пост</DialogTitle>
                  <DialogDescription>
                    Заполните форму для добавления нового поста
                  </DialogDescription>
                </DialogHeader>
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
                <DialogFooter>
                  <Button onClick={submitPostForm} disabled={loading}>
                    {loading ? "Сохранение..." : "Сохранить"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {renderCards(posts, showMorePosts, "posts")}
          </div>
          {posts.length > 3 && (
            <div className="text-center mt-6">
              <LiquidButton
                text={showMorePosts ? "Скрыть" : "Показать больше"}
                color1="#9b87f5"
                color2="#6E59A5"
                color3="#8F17E1"
                width={180}
                height={40}
                onClick={() => setShowMorePosts(!showMorePosts)}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Index;
