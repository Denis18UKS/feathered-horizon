import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Item {
    id: number;
    title: string;
    description: string;
    user: string;
    status: string;
    created_at: string;
    image_url?: string | null;
}

const ModerationPage: React.FC = () => {
    const [news, setNews] = useState<Item[]>([]);
    const [posts, setPosts] = useState<Item[]>([]);
    const [newsPage, setNewsPage] = useState(1);
    const [postsPage, setPostsPage] = useState(1);
    const { toast } = useToast();

    const itemsPerPage = 6; // Количество элементов на странице (новости/посты)

    useEffect(() => {
        // Загрузка новостей
        fetch("http://localhost:5000/admin/news", {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
            .then(response => response.json())
            .then(data => {
                setNews(Array.isArray(data) ? data : []);
            })
            .catch(error => {
                toast({
                    title: "Ошибка",
                    description: "Произошла ошибка при загрузке новостей. Попробуйте позже.",
                    variant: "destructive",
                });
            });

        // Загрузка постов
        fetch("http://localhost:5000/admin/posts", {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
            .then(response => response.json())
            .then(data => {
                setPosts(Array.isArray(data) ? data : []);
            })
            .catch(error => {
                toast({
                    title: "Ошибка",
                    description: "Произошла ошибка при загрузке постов. Попробуйте позже.",
                    variant: "destructive",
                });
            });
    }, [toast]);

    const handleDelete = async (id: number, type: 'news' | 'posts') => {
        try {
            const response = await fetch(`http://localhost:5000/admin/${type}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении');
            }

            if (type === "news") {
                const data = await fetch("http://localhost:5000/admin/news", {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                }).then(response => response.json());
                setNews(data);
                toast({
                    title: "Успех",
                    description: "Новость успешно удалена",
                });
            } else {
                const data = await fetch("http://localhost:5000/admin/posts", {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                }).then(response => response.json());
                setPosts(data);
                toast({
                    title: "Успех",
                    description: "Пост успешно удалён",
                });
            }
        } catch (error) {
            console.error("Ошибка при удалении:", error);
            toast({
                title: "Ошибка",
                description: "Произошла ошибка при удалении. Попробуйте снова.",
                variant: "destructive",
            });
        }
    };

    const handleStatusChange = async (id: number, type: 'news' | 'posts', status: string) => {
        try {
            const response = await fetch(`http://localhost:5000/admin/${type}/${id}/status`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                throw new Error('Ошибка при изменении статуса');
            }

            if (type === "news") {
                setNews((prevNews) =>
                    prevNews.map((item) =>
                        item.id === id ? { ...item, status } : item
                    )
                );
            } else {
                setPosts((prevPosts) =>
                    prevPosts.map((item) =>
                        item.id === id ? { ...item, status } : item
                    )
                );
            }
        } catch (error) {
            console.error("Ошибка при изменении статуса:", error);
            toast({
                title: "Ошибка",
                description: "Произошла ошибка при изменении статуса. Попробуйте снова.",
                variant: "destructive",
            });
        }
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', options);
    };

    const renderModerationCards = (items: Item[], type: 'news' | 'posts') => {
        if (!Array.isArray(items) || items.length === 0) {
            return <p className="text-muted-foreground text-center py-4">{type === 'news' ? 'Нет новостей для модерации' : 'Нет постов для модерации'}</p>;
        }

        return items.map((item) => (
            <div className="card-item" key={item.id}>
                <Card className="mb-4 max-w-xs mx-auto">
                    {item.image_url && item.image_url !== "null" ? (
                        <img
                            src={`http://localhost:5000${item.image_url}`}
                            alt={item.title}
                            className="rounded-md mb-4 w-full max-w-[100%] h-auto mx-auto"
                        />
                    ) : (
                        <div className="no-image">Нет изображения</div>
                    )}
                    <CardHeader>
                        <CardTitle>{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p><strong>Автор:</strong> {item.user}</p>
                        <p><strong>Статус:</strong> {item.status}</p>
                        <p><strong>Дата создания:</strong> {formatDate(item.created_at)}</p>
                    </CardContent>
                    <CardFooter>
                        {item.status === "ожидание" && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => handleStatusChange(item.id, type, "принят")}
                                >
                                    Принять
                                </Button>
                                <Button
                                    variant="outline"
                                    color="red"
                                    onClick={() => handleStatusChange(item.id, type, "отклонен")}
                                >
                                    Отклонить
                                </Button>
                            </>
                        )}
                        {item.status !== "ожидание" && (
                            <Button
                                variant="destructive"
                                onClick={() => handleDelete(item.id, type)}
                            >
                                Удалить
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        ));
    };

    const handlePaginationChange = (direction: 'next' | 'prev', type: 'news' | 'posts') => {
        if (type === 'news') {
            if (direction === 'next') {
                setNewsPage(prevPage => prevPage + 1);
            } else {
                setNewsPage(prevPage => Math.max(prevPage - 1, 1));
            }
        } else {
            if (direction === 'next') {
                setPostsPage(prevPage => prevPage + 1);
            } else {
                setPostsPage(prevPage => Math.max(prevPage - 1, 1));
            }
        }
    };

    // Вычисление среза новостей и постов для пагинации
    const newsToDisplay = news.slice((newsPage - 1) * itemsPerPage, newsPage * itemsPerPage);
    const postsToDisplay = posts.slice((postsPage - 1) * itemsPerPage, postsPage * itemsPerPage);

    return (
        <div>
            <main>
                <section className="moderation-section">
                    <h2>Модерация новостей</h2>
                    <div className="cards-container flex flex-wrap gap-4">
                        {renderModerationCards(newsToDisplay, "news")}
                    </div>
                    <div className="pagination">
                        <Button onClick={() => handlePaginationChange('prev', 'news')} disabled={newsPage === 1}>Предыдущая</Button>
                        <Button onClick={() => handlePaginationChange('next', 'news')} disabled={newsToDisplay.length < itemsPerPage}>Следующая</Button>
                    </div>
                </section>

                <section className="moderation-section">
                    <h2>Модерация постов</h2>
                    <div className="cards-container flex flex-wrap gap-4">
                        {renderModerationCards(postsToDisplay, "posts")}
                    </div>
                    <div className="pagination">
                        <Button onClick={() => handlePaginationChange('prev', 'posts')} disabled={postsPage === 1}>Предыдущая</Button>
                        <Button onClick={() => handlePaginationChange('next', 'posts')} disabled={postsToDisplay.length < itemsPerPage}>Следующая</Button>
                    </div>
                </section>
            </main>

            <footer className="footer">
                <p>&copy; 2025</p>
            </footer>
        </div>
    );
};

export default ModerationPage;
