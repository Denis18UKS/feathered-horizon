import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LiquidButton } from "@/components/ui/liquid-button";
import { Loader2 } from "lucide-react";

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

const MyProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [filteredRepositories, setFilteredRepositories] = useState<Repository[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"commits" | "files" | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [graphData, setGraphData] = useState<any[]>([]);
  const [branches, setBranches] = useState<string[]>([]); // Состояние для веток
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null); // Состояние для выбранной ветки
  const navigate = useNavigate();
  const { toast } = useToast();

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
        const response = await fetch("http://localhost:5000/profile", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Ошибка при загрузке профиля");

        const data = await response.json();
        setUser(data.user);
        setRepositories(data.repositories || []);
        setFilteredRepositories(data.repositories || []);
        setGraphData(data.graph || []); // Загружаем данные для графика активности
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные профиля",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const handleEditProfile = () => {
    navigate("/profile/edit");
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchTerm(searchValue);

    const filteredRepos = repositories.filter((repo) =>
      repo.name.toLowerCase().includes(searchValue)
    );
    setFilteredRepositories(filteredRepos);
  };

  const fetchCommits = async (repoName: string) => {
    setActiveSection("commits");
    setSelectedRepo(repoName);

    try {
      const response = await fetch(
        `https://api.github.com/repos/${user?.github_username}/${repoName}/commits`
      );
      const data = await response.json();
      setCommits(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить коммиты",
        variant: "destructive",
      });
    }

    // Загружаем ветки для выбранного репозитория
    try {
      const branchesResponse = await fetch(
        `https://api.github.com/repos/${user?.github_username}/${repoName}/branches`
      );
      const branchesData = await branchesResponse.json();
      setBranches(branchesData.map((branch: any) => branch.name)); // Извлекаем имена веток
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить ветки",
        variant: "destructive",
      });
    }

    // Прокрутка страницы к секции с коммитами
    setTimeout(() => {
      const commitsSection = document.getElementById("commits-section");
      if (commitsSection) {
        commitsSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 300); // Небольшая задержка, чтобы элементы успели загрузиться
  };


  const fetchFiles = async (repoName: string, path: string = "") => {
    setActiveSection("files");
    setSelectedRepo(repoName);

    try {
      const response = await fetch(
        `https://api.github.com/repos/${user?.github_username}/${repoName}/contents/${path}`
      );
      const data = await response.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить файлы",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (repoName: string) => {
    setDownloadLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/github/repos/${user?.github_username}/${repoName}/download`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${repoName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast({
        title: "Успех",
        description: "Репозиторий успешно скачан",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скачать репозиторий",
        variant: "destructive",
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleFolderClick = (repoName: string, path: string) => {
    fetchFiles(repoName, path);
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
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
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
          <div className="flex space-x-4">
            <LiquidButton
              text="Редактировать профиль"
              color1="#9b87f5"
              color2="#6E59A5"
              color3="#8F17E1"
              width={200}
              height={50}
              onClick={handleEditProfile}
            />
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Репозитории</CardTitle>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Поиск репозиториев"
            className="w-full mt-2 p-2 border border-gray-300 rounded-md"
          />
        </CardHeader>
        <CardContent>
          {filteredRepositories.length > 0 ? (
            <div className="grid gap-4">
              {filteredRepositories.map((repo) => (
                <div key={repo.name} className="flex items-center justify-between p-4 rounded-lg border">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-500 hover:underline"
                  >
                    {repo.name}
                  </a>

                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => fetchCommits(repo.name)}>
                      Коммиты
                    </Button>
                    <Button variant="outline" onClick={() => fetchFiles(repo.name)}>
                      Файлы
                    </Button>
                    <Button variant="outline" onClick={() => handleDownload(repo.name)}>
                      {downloadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Скачать"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Нет репозиториев</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>График активности</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {graphData.map((item, index) => (
              <div key={index}>
                <p>Дата: {item.date}</p>
                <p>Активность: {item.activity}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {activeSection === "commits" && (
        <Card id="commits-section">
          <CardHeader>
            <CardTitle>Коммиты репозитория {selectedRepo}</CardTitle>

            {/* Выпадающий список веток */}
            {branches.length > 0 && (
              <div className="mt-4">
                <select
                  value={selectedBranch || ""}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Выберите ветку</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {commits.length > 0 ? (
              <ul>
                {commits.map((commit, index) => (
                  <li key={index} className="py-2 border-b">
                    <p>{commit.commit.author.name}: {commit.commit.message}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Нет коммитов для отображения</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeSection === "files" && (
        <Card>
          <CardHeader>
            <CardTitle>Файлы репозитория {selectedRepo}</CardTitle>
          </CardHeader>
          <CardContent>
            {files.length > 0 ? (
              <ul>
                {files.map((file) => (
                  <li key={file.sha} className="py-2 border-b">
                    {file.type === "file" ? (
                      <a
                        href={file.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {file.name}
                      </a>
                    ) : (
                      <button
                        onClick={() => handleFolderClick(selectedRepo, file.path)}
                        className="text-blue-500 hover:underline"
                      >
                        {file.name} (папка)
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Нет файлов для отображения</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyProfile;
