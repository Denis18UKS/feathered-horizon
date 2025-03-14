import React, { useEffect, useState } from "react"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useIsMobile } from "@/hooks/use-mobile";

// Регистрация необходимых компонентов Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Statistics = () => {
  const isMobile = useIsMobile();
  const [stats, setStats] = useState({
    newUsers: [],  // Данные для графика
    labels: [],    // Метки для оси X
    totalUsers: 1234
  });

  const [filter, setFilter] = useState("day");  // Хук состояния для фильтра
  const [monthFilter, setMonthFilter] = useState("2024-12");  // Хук для фильтра по месяцу

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`http://localhost:5000/admin/statistics?filter=${filter}&month=${monthFilter}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats({
            newUsers: data.newUsers,  // Обновляем данные для графика
            labels: data.labels,      // Обновляем метки
            totalUsers: data.totalUsers,
          });
        } else {
          console.error("Ошибка при получении статистики.");
        }
      } catch (error) {
        console.error("Ошибка при запросе статистики:", error);
      }
    };

    fetchStats();
  }, [filter, monthFilter]);  // Повторный запрос при изменении фильтра или месяца

  const formatDateForFilter = (dateString, filter) => {
    const date = new Date(dateString);
    switch (filter) {
      case 'day':
        return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'numeric', day: 'numeric' });
      case 'month':
        return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' });
      default:
        return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'numeric', day: 'numeric' });
    }
  };

  const filterValidLabels = (labels) => {
    return labels.filter(label => {
      const date = new Date(label);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
      return monthYear >= "2024-12" && monthYear <= "2025-03";  // Отфильтровываем по датам с декабря 2024 по март 2025
    });
  };

  const data = {
    labels: filterValidLabels(stats.labels).map((label) => formatDateForFilter(label, filter)),
    datasets: [
      {
        label: 'Новые пользователи',
        data: stats.newUsers,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,  // Указываем явный тип, который ожидает Chart.js
        labels: {
          font: {
            size: isMobile ? 12 : 14,
          },
        },
      },
      title: {
        display: true,
        text: 'Статистика роста пользователей',
        font: {
          size: isMobile ? 14 : 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: isMobile ? 10 : 12,
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: isMobile ? 10 : 12,
          },
          autoSkip: true, // Для предотвращения наложения меток
        },
      },
    },
  };

  return (
    <div className="container mx-auto py-4 md:py-8 px-2 md:px-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Статистика</h1>
      
      <div className="mb-4">
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)} 
          className="border px-4 py-2 rounded-md"
        >
          <option value="day">По дням</option>
          <option value="month">По месяцам</option>
        </select>
      </div>

      <div className="mb-4">
        <select 
          value={monthFilter} 
          onChange={(e) => setMonthFilter(e.target.value)} 
          className="border px-4 py-2 rounded-md"
        >
          <option value="2024-12">Декабрь 2024</option>
          <option value="2025-01">Январь 2025</option>
          <option value="2025-02">Февраль 2025</option>
          <option value="2025-03">Март 2025</option>
        </select>
      </div>

      <div className="grid gap-4 md:gap-6">
        <Card className="w-full overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Рост пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] md:h-[400px]">
              <Line data={data} options={options} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Всего пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-4xl font-bold">{stats.totalUsers}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
