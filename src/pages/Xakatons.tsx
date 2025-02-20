import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Hackathon {
    id: number;
    title: string;
    description: string;
    image: string;
    link: string; // Добавлено поле ссылки на страницу хакатона
}

const HackathonsPage: React.FC = () => {
    const [hackathons, setHackathons] = useState<Hackathon[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHackathons = async () => {
        try {
            const response = await axios.get("http://localhost:5000/hackathons");
            const data = response.data;
    
            if (!data || !data.html) {
                throw new Error("Некорректные данные с сервера");
            }
    
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.html, 'text/html');
    
            const hackathonElements = doc.querySelectorAll('.js-feed-post');
            const hackathonsArray: Hackathon[] = Array.from(hackathonElements).map((el) => {
                const titleEl = el.querySelector('.js-feed-post-title') as HTMLElement;
                const descEl = el.querySelector('.js-feed-post-descr') as HTMLElement;
                const imageEl = el.querySelector('.t-feed__post-bgimg') as HTMLElement;
                const linkEl = el.querySelector('.js-feed-post-title a') as HTMLAnchorElement;
                
                return {
                    id: Number(el.getAttribute('data-post-uid')) || 0,
                    title: titleEl ? titleEl.innerText : "Без названия",
                    description: descEl ? descEl.innerText : "Описание отсутствует",
                    image: imageEl?.style.backgroundImage
                        ? imageEl.style.backgroundImage.slice(5, -2)
                        : "",
                    link: linkEl ? linkEl.href : "#" // Добавляем ссылку
                };
            });
    
            setHackathons(hackathonsArray);
        } catch (err) {
            setError("Ошибка при загрузке хакатонов. Попробуйте позже.");
            console.error("Ошибка парсинга:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHackathons();
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Список хакатонов</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hackathons.map((hackathon) => (
                    <Card key={hackathon.id} className="w-full">
                        <CardHeader>
                            <CardTitle>{hackathon.title}</CardTitle>
                            {hackathon.image && (
                                <img
                                    src={hackathon.image}
                                    alt={hackathon.title}
                                    className="w-full h-48 object-cover rounded-md"
                                />
                            )}
                        </CardHeader>
                        <CardContent>
                            <p>{hackathon.description}</p>
                        </CardContent>
                        <a href={hackathon.link} target="_blank" rel="noopener noreferrer">
                            <Button className="mt-4" variant="outline">
                                Подробнее
                            </Button>
                        </a>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default HackathonsPage;
