
import React from "react";
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

  // Моковые данные для графика
  const data = {
    labels: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь'].map(
      month => isMobile ? month.slice(0, 3) : month
    ),
    datasets: [
      {
        label: 'Новые пользователи',
        data: [12, 19, 3, 5, 2, 3],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: isMobile ? 12 : 14
          }
        }
      },
      title: {
        display: true,
        text: 'Статистика роста пользователей',
        font: {
          size: isMobile ? 14 : 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: isMobile ? 10 : 12
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: isMobile ? 10 : 12
          }
        }
      }
    }
  };

  return (
    <div className="container mx-auto py-4 md:py-8 px-2 md:px-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Статистика</h1>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Всего пользователей</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-4xl font-bold">1,234</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Активных сегодня</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-4xl font-bold">156</p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Новых за неделю</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-4xl font-bold">45</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
