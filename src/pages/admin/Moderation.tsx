
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const Moderation = () => {
  const { toast } = useToast();

  const handleReportAction = async (reportId: number, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`http://localhost:5000/admin/reports/${reportId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: `Репорт ${action === 'approve' ? 'одобрен' : 'отклонен'}`,
        });
      } else {
        throw new Error('Ошибка при обработке репорта');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обработать репорт",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Модерация контента</h1>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Репорты пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Здесь будут отображаться репорты от пользователей, требующие модерации
            </p>
            {/* В будущем здесь будет список репортов */}
            <div className="text-center text-muted-foreground">
              Репортов пока нет
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Moderation;
