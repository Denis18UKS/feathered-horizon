
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
  // Моковые данные для графика
  const data = {
    labels: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь'],
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
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Статистика роста пользователей'
      }
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Статистика</h1>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Рост пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            <Line data={data} options={options} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Всего пользователей</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">1,234</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Активных сегодня</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">156</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Новых за неделю</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">45</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
