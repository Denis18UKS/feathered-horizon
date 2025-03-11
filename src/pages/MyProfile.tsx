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

const MyProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [filteredRepositories, setFilteredRepositories] = useState<Repository[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [graphData, setGraphData] = useState<any[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>("");

  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"files" | "commits" | null>(null);

  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [friendRequests, setFriendRequests] = useState<User[]>([]);

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
        setGraphData(data.graph || []);
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

  const fetchCommits = async (repoName: string, branch: string | null = "main") => {
    setActiveSection("commits");
    setSelectedRepo(repoName);
    setSelectedBranch(branch);

    try {
      const response = await fetch(
        `https://api.github.com/repos/${user?.github_username}/${repoName}/commits?sha=${branch}`
      );
      const data = await response.json();

      const sortedCommits = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime())
        : [];
      setCommits(sortedCommits);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить коммиты",
        variant: "destructive",
      });
    }

    try {
      const branchesResponse = await fetch(
        `https://api.github.com/repos/${user?.github_username}/${repoName}/branches`
      );
      const branchesData = await branchesResponse.json();
      setBranches(branchesData.map((branch: any) => branch.name));
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить ветки",
        variant: "destructive",
      });
    }

    setTimeout(() => {
      const commitsSection = document.getElementById("commits-section");
      if (commitsSection) {
        commitsSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 300);
  };

  const fetchFiles = async (repoName: string, path: string = "") => {
    setActiveSection("files");

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

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast({
        title: "Успех",
        description: `Файл ${fileName} загружен`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скачать файл",
        variant: "destructive",
      });
    }
  };

  const handleFolderClick = (repoName: string, path: string) => {
    fetchFiles(repoName, path);
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
              onClick={() => navigate("/profile/edit")}
            />
          </div>

          <Button variant="outline" onClick={() => navigate("/friend-requests")}>
            Заявки в друзья
          </Button>
        </CardHeader>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Репозитории</CardTitle>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            className="w-full p-2 mt-2 border rounded"
            placeholder="Поиск по репозиториям..."
          />
        </CardHeader>
        <CardContent>
          {filteredRepositories.length === 0 ? (
            <p className="text-muted-foreground">Нет доступных репозиториев</p>
          ) : (
            <ul className="space-y-4">
              {filteredRepositories.map((repo) => (
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
                    <Button size="sm" onClick={() => fetchCommits(repo.name)}>
                      Коммиты
                    </Button>
                    <Button size="sm" onClick={() => fetchFiles(repo.name)}>
                      Файлы
                    </Button>
                    <Button size="sm" onClick={() => handleDownload(repo.name)} disabled={downloadLoading}>
                      {downloadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Скачать"}
                    </Button>
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
            <div className="overflow-x-auto whitespace-nowrap flex space-x-2 mt-2 pb-2">
              {branches.map((branch) => (
                <Button
                  key={branch}
                  size="sm"
                  variant={selectedBranch === branch ? "default" : "outline"}
                  onClick={() => fetchCommits(selectedRepo, branch)}
                >
                  {branch}
                </Button>
              ))}
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
        <Card>
          <CardHeader>
            <CardTitle>Файлы в {selectedRepo}</CardTitle>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <p className="text-muted-foreground">Файлы отсутствуют</p>
            ) : (
              <ul className="space-y-3">
                {files.map((file) => (
                  <li key={file.sha} className="flex justify-between items-center border-b pb-2">
                    {file.type === "file" ? (
                      <a
                        href={file.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {file.name}
                      </a>
                    ) : (
                      <button className="text-primary hover:underline" onClick={() => handleFolderClick(selectedRepo, file.path)}>
                        📁 {file.name}
                      </button>
                    )}
                    {file.type === "file" && (
                      <Button size="sm" onClick={() => handleDownloadFile(file.download_url || "", file.name)}>
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

      <div className="flex justify-end">
        <Button onClick={scrollToTop} variant="outline">
          Наверх
        </Button>
      </div>
    </div>
  );
};

export default MyProfile;

