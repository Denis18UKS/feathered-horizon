
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/pages/AuthContext";

interface Report {
  id: string;
  content: string;
  reported_by: string;
  status: string;
  created_at: string;
  reporter_username: string;
}

const Moderation = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select(`
            *,
            profiles:reported_by (username)
          `)
          .eq('status', 'pending');

        if (error) throw error;

        const formattedReports = data.map(report => ({
          id: report.id,
          content: report.content,
          reported_by: report.reported_by,
          status: report.status,
          created_at: report.created_at,
          reporter_username: report.profiles?.username || 'Unknown User'
        }));

        setReports(formattedReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleReportAction = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: action === 'approve' ? 'approved' : 'rejected' })
        .eq('id', reportId);

      if (error) throw error;

      setReports(reports.filter(report => report.id !== reportId));
      
      toast({
        title: "Успешно",
        description: `Репорт ${action === 'approve' ? 'одобрен' : 'отклонен'}`,
      });
    } catch (error) {
      console.error('Error updating report:', error);
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
            {loading ? (
              <p className="text-center text-muted-foreground">Загрузка репортов...</p>
            ) : reports.length > 0 ? (
              <div className="space-y-4">
                {reports.map(report => (
                  <div key={report.id} className="p-4 border rounded-lg">
                    <p className="font-medium">{report.content}</p>
                    <p className="text-sm text-muted-foreground">Отправил: {report.reporter_username}</p>
                    <div className="mt-2 space-x-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleReportAction(report.id, 'approve')}
                      >
                        Одобрить
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReportAction(report.id, 'reject')}
                      >
                        Отклонить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Репортов пока нет</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Moderation;
