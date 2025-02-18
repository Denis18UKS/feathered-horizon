// ActivityGraph.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ActivityGraph = () => {
    const { repoName } = useParams();
    const [commits, setCommits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCommits = async () => {
            try {
                const response = await fetch(`https://api.github.com/repos/${repoName}/commits`);
                const data = await response.json();
                setCommits(data);
            } catch (error) {
                console.error('Ошибка загрузки коммитов', error);
            } finally {
                setLoading(false);
            }
        };

        if (repoName) {
            fetchCommits();
        }
    }, [repoName]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const commitDates = commits.map(commit => commit.commit.author.date);
    const commitCount = commitDates.reduce((acc: any, date: string) => {
        const day = date.split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
    }, {});

    const labels = Object.keys(commitCount);
    const data = {
        labels,
        datasets: [
            {
                label: 'Коммиты по дням',
                data: Object.values(commitCount),
                borderColor: 'rgba(75,192,192,1)',
                tension: 0.1,
            },
        ],
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="w-full">
                <h2 className="text-xl font-medium">График активности</h2>
                <Line data={data} />
            </div>
        </div>
    );
};

export default ActivityGraph;
