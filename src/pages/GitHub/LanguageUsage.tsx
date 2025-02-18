import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LanguageUsageData {
    [key: string]: number; // Указываем, что каждый язык — это число (количество строк кода)
}

const LanguageUsage = () => {
    const { repoName } = useParams();
    const [languages, setLanguages] = useState<LanguageUsageData>({}); // Типизация для languages
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const response = await fetch(`https://api.github.com/repos/${repoName}/languages`);
                const data: LanguageUsageData = await response.json(); // Указываем тип данных для ответа
                setLanguages(data);
            } catch (error) {
                console.error('Ошибка загрузки языков', error);
            } finally {
                setLoading(false);
            }
        };

        if (repoName) {
            fetchLanguages();
        }
    }, [repoName]);

    if (loading) {
        return <p>Загрузка...</p>;
    }

    const totalLines = Object.values(languages).reduce((acc, lines) => acc + lines, 0);

    const languagePercentages = Object.entries(languages).map(([language, lines]) => ({
        language,
        percentage: ((lines / totalLines) * 100).toFixed(2), // Здесь lines уже гарантированно число
    }));

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Использование языков в репозитории {repoName}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {languagePercentages.map((lang, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <p>{lang.language}</p>
                                <div className="w-full h-2 bg-gray-300">
                                    <div
                                        className="h-2 bg-primary"
                                        style={{ width: `${lang.percentage}%` }}
                                    />
                                </div>
                                <p>{lang.percentage}%</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default LanguageUsage;
