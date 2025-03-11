
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/pages/AuthContext";
import { useAuth } from "@/pages/AuthContext";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface Report {
  id: string;
  content: string;
  reported_by: string;
  status: string;
  created_at: string;
  reporter_username: string;
  report_type: string;
  content_id: string | null;
}

const Moderation = () => {
  const { toast } = useToast();
  const { isAuthenticated, role } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        if (!isAuthenticated || role !== 'admin') {
          toast({
            title: "Ошибка доступа",
            description: "Вы не имеете доступа к странице модерации",
            variant: "destructive",
          });
          return;
        }

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
          reporter_username: report.profiles?.username || 'Unknown User',
          report_type: report.report_type || 'content',
          content_id: report.content_id
        }));

        setReports(formattedReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить репорты",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [isAuthenticated, role, toast]);

  const handleReportAction = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: action === 'approve' ? 'approved' : 'rejected' })
        .eq('id', reportId);

      if (error) throw error;

      // Get the report that was actioned
      const report = reports.find(r => r.id === reportId);
      
      // If this was an approved report for a post or comment, we may want to take additional action
      if (action === 'approve' && report && report.content_id) {
        // For example, if it's a post report, we might hide or delete the post
        if (report.report_type === 'post') {
          const { error: contentError } = await supabase
            .from('posts')
            .update({ hidden: true })
            .eq('id', report.content_id);
            
          if (contentError) console.error('Error updating reported content:', contentError);
        }
        
        // Handle other content types as needed
        // Example for comments or other content types
      }

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

  if (!isAuthenticated || role !== 'admin') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-6">
              <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Нет доступа</h2>
              <p className="text-muted-foreground">
                У вас нет прав для просмотра этой страницы. Пожалуйста, войдите как администратор.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium">{report.content}</p>
                      <Badge variant={report.report_type === 'post' ? 'destructive' : 'outline'}>
                        {report.report_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Отправил: {report.reporter_username}</p>
                    {report.content_id && (
                      <p className="text-sm text-muted-foreground">ID контента: {report.content_id}</p>
                    )}
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
