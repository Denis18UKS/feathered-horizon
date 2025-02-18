import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Hackathon {
    id: number;
    title: string;
    description: string;
    image: string;
}

const HackathonsPage: React.FC = () => {
    const [hackathons, setHackathons] = useState<Hackathon[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHackathons = async () => {
        try {
            const response = await axios.get("http://localhost:5000/hackathons");
            setHackathons(response.data.hackathons);
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
                        <Button className="mt-4" variant="outline">
                            Подробнее
                        </Button>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default HackathonsPage;
