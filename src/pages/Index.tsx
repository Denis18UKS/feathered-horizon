import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LiquidButton } from "@/components/ui/liquid-button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  link: string | null;
  created_at: string;
}

const Index = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClick = () => {
    if (isAuthenticated) {
      navigate("/profile");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <section className="py-12 md:py-20 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          IT-BIRD - Сообщество IT-специалистов
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl">
          Присоединяйтесь к нашему сообществу, чтобы общаться с единомышленниками,
          делиться опытом и находить новые возможности в IT-сфере.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <LiquidButton
            text="Присоединиться"
            onClick={handleJoinClick}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          />
          <Button variant="outline" onClick={() => navigate("/forum")}>
            Перейти на форум
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Возможности платформы</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-2">Общение</h3>
              <p>
                Общайтесь с другими IT-специалистами, обменивайтесь опытом и
                находите новых друзей по интересам.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-2">Форум</h3>
              <p>
                Задавайте вопросы, делитесь знаниями и получайте помощь от
                сообщества на нашем форуме.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-2">Хакатоны</h3>
              <p>
                Участвуйте в хакатонах, соревнуйтесь с другими разработчиками и
                выигрывайте призы.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* News Section */}
      <section className="py-12 md:py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Последние новости</h2>
        {isLoading ? (
          <p className="text-center">Загрузка новостей...</p>
        ) : news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {news.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                {item.image_url && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="mb-4">{item.description}</p>
                  {item.link && (
                    <Button
                      variant="link"
                      className="p-0"
                      onClick={() => window.open(item.link!, "_blank")}
                    >
                      Подробнее
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center">Нет доступных новостей</p>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Готовы присоединиться?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Станьте частью нашего сообщества IT-специалистов уже сегодня и
          откройте для себя новые возможности.
        </p>
        <LiquidButton
          text="Зарегистрироваться"
          onClick={() => navigate("/register")}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
        />
      </section>
    </div>
  );
};

export default Index;
