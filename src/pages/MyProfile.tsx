import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LiquidButton } from "@/components/ui/liquid-button";
import { Loader2 } from "lucide-react";

interface Repository {
  name: string;
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
}

const MyProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"commits" | "files">();
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

  const fetchCommits = async (repoName: string) => {
    setModalType("commits");
    setModalOpen(true);
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
  };

  const fetchFiles = async (repoName: string) => {
    setModalType("files");
    setModalOpen(true);
    setSelectedRepo(repoName);

    try {
      const response = await fetch(
        `https://api.github.com/repos/${user?.github_username}/${repoName}/contents`
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
    }
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
        </CardHeader>
        <CardContent>
          {repositories.length > 0 ? (
            <div className="grid gap-4">
              {repositories.map((repo) => (
                <div key={repo.name} className="flex items-center justify-between p-4 rounded-lg border">
                  <span className="font-medium">{repo.name}</span>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => fetchCommits(repo.name)}>
                      Коммиты
                    </Button>
                    <Button variant="outline" onClick={() => fetchFiles(repo.name)}>
                      Файлы
                    </Button>
                    <Button variant="outline" onClick={() => handleDownload(repo.name)}>
                      Скачать
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalType === "commits" ? "Коммиты" : "Файлы"} - {selectedRepo}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {modalType === "commits" && (
              <div className="space-y-4">
                {commits.map((commit, index) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <p className="font-medium">{commit.commit.author.name}</p>
                    <p className="text-muted-foreground">{commit.commit.message}</p>
                  </div>
                ))}
              </div>
            )}
            {modalType === "files" && (
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.sha} className="p-4 rounded-lg border flex justify-between items-center">
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{file.type}</p>
                    </div>
                    {file.type === 'file' && file.download_url && (
                      <Button variant="outline" asChild>
                        <a href={file.download_url} target="_blank" rel="noopener noreferrer">
                          Скачать
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyProfile;