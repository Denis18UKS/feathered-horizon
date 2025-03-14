import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronUp } from "lucide-react";

interface Repository {
    name: string;
    html_url: string;
}

interface User {
    username: string;
    skills: string;
    avatar: string | null;
    github_username: string;
}

interface Commit {
    commit: {
        author: {
            name: string;
            date: string;
        };
        message: string;
    };
}

interface FileInfo {
    name: string;
    type: string;
    sha: string;
    download_url?: string;
    path: string;
}

const UserProfilePage = () => {
    const { username } = useParams();
    const [user, setUser] = useState<User | null>(null);
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [commits, setCommits] = useState<Commit[]>([]);
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<"files" | "commits" | null>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [branches, setBranches] = useState<string[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
    const [currentPath, setCurrentPath] = useState<string>("");
    const [pathHistory, setPathHistory] = useState<string[]>([]);

    const { toast } = useToast();
    const sectionsRef = useRef<HTMLDivElement>(null);

    // Функция для отслеживания прокрутки страницы
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollButton(true);
            } else {
                setShowScrollButton(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setLoading(false);
                toast({
                    title: "Ошибка",
                    description: "Требуется авторизация",
                    variant: "destructive",
                });
                return;
            }

            try {
                const response = await fetch(`http://localhost:5000/users/${username}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error("Ошибка при загрузке данных пользователя");

                const data = await response.json();
                setUser(data.user);
                setRepositories(data.repositories || []);
            } catch (error) {
                console.error("Ошибка загрузки данных:", error);
                toast({
                    title: "Ошибка",
                    description: "Не удалось загрузить данные пользователя",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [username]);

    const fetchBranches = async (repoName: string) => {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${user?.github_username}/${repoName}/branches`
            );
            const data = await response.json();
            setBranches(Array.isArray(data) ? data.map((branch: any) => branch.name) : []);
            return data;
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось загрузить ветки",
                variant: "destructive",
            });
            return [];
        }
    };

    const fetchCommits = async (repoName: string, branch: string | null = "main") => {
        setActiveSection("commits");
        setSelectedRepo(repoName);
        setSelectedBranch(branch);

        try {
            // Загружаем ветки, если еще не загружены
            if (branches.length === 0) {
                const branchesData = await fetchBranches(repoName);
                if (branchesData.length > 0 && !branch) {
                    branch = branchesData[0].name;
                    setSelectedBranch(branch);
                }
            }

            const response = await fetch(
                `https://api.github.com/repos/${user?.github_username}/${repoName}/commits?sha=${branch}`
            );
            const data = await response.json();
            setCommits(Array.isArray(data) ? data : []);

            // Прокручиваем к секции коммитов
            setTimeout(() => {
                const commitsSection = document.getElementById("commits-section");
                if (commitsSection) {
                    commitsSection.scrollIntoView({ behavior: "smooth" });
                }
            }, 300);

        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось загрузить коммиты",
                variant: "destructive",
            });
        }
    };

    const fetchFiles = async (repoName: string, path: string = "", branch: string | null = "main") => {
        setActiveSection("files");
        setSelectedRepo(repoName);
        setCurrentPath(path);

        if (branch) {
            setSelectedBranch(branch);
        }

        try {
            // Загружаем ветки, если еще не загружены
            if (branches.length === 0) {
                await fetchBranches(repoName);
            }

            // Строим путь для API
            const apiPath = path ? `${path}` : '';
            const branchParam = branch ? `?ref=${branch}` : '';

            const response = await fetch(
                `https://api.github.com/repos/${user?.github_username}/${repoName}/contents/${apiPath}${branchParam}`
            );
            const data = await response.json();
            setFiles(Array.isArray(data) ? data : []);

            // Прокручиваем к секции файлов
            setTimeout(() => {
                const filesSection = document.getElementById("files-section");
                if (filesSection) {
                    filesSection.scrollIntoView({ behavior: "smooth" });
                }
            }, 300);

        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось загрузить файлы",
                variant: "destructive",
            });
        }
    };

    const navigateToFolder = (repoName: string, path: string) => {
        // Добавляем текущий путь в историю
        setPathHistory(prev => [...prev, currentPath]);
        fetchFiles(repoName, path, selectedBranch);
    };

    const navigateBack = () => {
        if (pathHistory.length > 0) {
            const previousPath = pathHistory[pathHistory.length - 1];
            // Удаляем последний элемент из истории
            setPathHistory(prev => prev.slice(0, prev.length - 1));
            fetchFiles(selectedRepo!, previousPath, selectedBranch);
        } else {
            // Возвращаемся на корневой уровень
            fetchFiles(selectedRepo!, "", selectedBranch);
        }
    };

    const handleDownload = async (url: string, fileName?: string) => {
        try {
            // Если передано имя файла - скачиваем отдельный файл
            if (fileName) {
                const response = await fetch(url);
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                toast({
                    title: "Успех",
                    description: `Файл ${fileName} успешно скачан`,
                });
            } else {
                // Иначе скачиваем весь репозиторий
                const response = await fetch(`http://localhost:5000/github/repos/${user?.github_username}/${url}/download`);
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `${url}.zip`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                toast({
                    title: "Успех",
                    description: "Репозиторий успешно скачан",
                });
            }
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось скачать файл",
                variant: "destructive",
            });
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Ошибка загрузки данных пользователя</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8" ref={sectionsRef}>
            <Card className="w-full">
                <CardHeader className="flex flex-row items-center">
                    <div className="flex items-center space-x-4">
                        <img
                            src={user.avatar ? `http://localhost:5000${user.avatar}` : "/placeholder.svg"}
                            alt={`${user.username}'s avatar`}
                            className="w-24 h-24 rounded-full object-cover border-2 border-primary/20"
                        />
                        <div>
                            <CardTitle className="text-2xl">{user.username}</CardTitle>
                            <p className="text-muted-foreground mt-1">{user.skills || "Навыки не указаны"}</p>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Репозитории</CardTitle>
                </CardHeader>
                <CardContent>
                    {repositories.length === 0 ? (
                        <p className="text-muted-foreground">Нет доступных репозиториев</p>
                    ) : (
                        <ul className="space-y-4">
                            {repositories.map(repo => (
                                <li key={repo.name} className="flex justify-between items-center border-b pb-2">
                                    <a
                                        href={repo.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        {repo.name}
                                    </a>
                                    <div className="flex space-x-2">
                                        <Button size="sm" onClick={() => fetchCommits(repo.name)}>Коммиты</Button>
                                        <Button size="sm" onClick={() => fetchFiles(repo.name)}>Файлы</Button>
                                        <Button size="sm" onClick={() => handleDownload(repo.name)}>Скачать</Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {activeSection === "commits" && selectedRepo && (
                <Card id="commits-section">
                    <CardHeader>
                        <CardTitle>Коммиты в {selectedRepo}</CardTitle>
                        <div className="mt-2 mb-2">
                            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                                {branches.slice(0, 5).map((branch) => (
                                    <Button
                                        key={branch}
                                        size="sm"
                                        variant={selectedBranch === branch ? "default" : "outline"}
                                        onClick={() => fetchCommits(selectedRepo, branch)}
                                    >
                                        {branch}
                                    </Button>
                                ))}
                                {branches.length > 5 && (
                                    <div className="relative">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => document.getElementById('branch-dropdown').classList.toggle('hidden')}
                                        >
                                            + Еще {branches.length - 5}
                                        </Button>
                                        <div id="branch-dropdown" className="hidden absolute z-10 mt-1 bg-white rounded-md shadow-lg max-h-40 overflow-y-auto border">
                                            {branches.slice(5).map((branch) => (
                                                <button
                                                    key={branch}
                                                    className={`block w-full text-left px-4 py-2 text-sm ${selectedBranch === branch ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
                                                    onClick={() => {
                                                        fetchCommits(selectedRepo, branch);
                                                        document.getElementById('branch-dropdown').classList.add('hidden');
                                                    }}
                                                >
                                                    {branch}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {commits.length === 0 ? (
                            <p className="text-muted-foreground">Коммиты отсутствуют</p>
                        ) : (
                            <ul className="space-y-3">
                                {commits.map((commit, index) => (
                                    <li key={index} className="border-b pb-2">
                                        <p className="font-semibold">{commit.commit.author.name}</p>
                                        <p className="text-muted-foreground text-sm">{commit.commit.message}</p>
                                        <p className="text-xs text-gray-500">{new Date(commit.commit.author.date).toLocaleString()}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeSection === "files" && selectedRepo && (
                <Card id="files-section">
                    <CardHeader>
                        <CardTitle>Файлы в {selectedRepo}</CardTitle>
                        <div className="mt-2 mb-2">
                            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                                {branches.slice(0, 5).map((branch) => (
                                    <Button
                                        key={branch}
                                        size="sm"
                                        variant={selectedBranch === branch ? "default" : "outline"}
                                        onClick={() => fetchFiles(selectedRepo, currentPath, branch)}
                                    >
                                        {branch}
                                    </Button>
                                ))}
                                {branches.length > 5 && (
                                    <div className="relative">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => document.getElementById('file-branch-dropdown').classList.toggle('hidden')}
                                        >
                                            + Еще {branches.length - 5}
                                        </Button>
                                        <div id="file-branch-dropdown" className="hidden absolute z-10 mt-1 bg-white rounded-md shadow-lg max-h-40 overflow-y-auto border">
                                            {branches.slice(5).map((branch) => (
                                                <button
                                                    key={branch}
                                                    className={`block w-full text-left px-4 py-2 text-sm ${selectedBranch === branch ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
                                                    onClick={() => {
                                                        fetchFiles(selectedRepo, currentPath, branch);
                                                        document.getElementById('file-branch-dropdown').classList.add('hidden');
                                                    }}
                                                >
                                                    {branch}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={navigateBack}
                                disabled={pathHistory.length === 0 && !currentPath}
                            >
                                Назад
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Текущий путь: {currentPath || '/'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {files.length === 0 ? (
                            <p className="text-muted-foreground">Файлы отсутствуют</p>
                        ) : (
                            <ul className="space-y-3">
                                {files.map(file => (
                                    <li key={file.sha} className="flex justify-between items-center border-b pb-2">
                                        {file.type === "file" ? (
                                            <a
                                                href={file.download_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline"
                                            >
                                                📄 {file.name}
                                            </a>
                                        ) : (
                                            <button
                                                className="text-primary hover:underline flex items-center"
                                                onClick={() => navigateToFolder(selectedRepo, file.path)}
                                            >
                                                📁 {file.name}
                                            </button>
                                        )}
                                        {file.type === "file" && (
                                            <Button size="sm" onClick={() => handleDownload(file.download_url || "", file.name)}>
                                                Скачать
                                            </Button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            )}

            {showScrollButton && (
                <Button
                    className="fixed bottom-8 right-8 rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
                    onClick={scrollToTop}
                >
                    <ChevronUp className="h-6 w-6" />
                </Button>
            )}
        </div>
    );
};

export default UserProfilePage;