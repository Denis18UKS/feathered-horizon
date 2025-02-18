// Branches.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Branches = () => {
    const { repoName } = useParams();
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await fetch(`https://api.github.com/repos/${repoName}/branches`);
                const data = await response.json();
                setBranches(data);
            } catch (error) {
                console.error('Ошибка загрузки веток', error);
            } finally {
                setLoading(false);
            }
        };

        if (repoName) {
            fetchBranches();
        }
    }, [repoName]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Ветки репозитория {repoName}</CardTitle>
                </CardHeader>
                <CardContent>
                    {branches.length > 0 ? (
                        <div className="space-y-4">
                            {branches.map((branch, index) => (
                                <div key={index} className="p-4 rounded-lg border">
                                    <p className="font-medium">{branch.name}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Нет веток в этом репозитории</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Branches;
