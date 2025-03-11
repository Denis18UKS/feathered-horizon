
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  username: string;
  email: string;
  ip_address: string | null;
  location: string | null;
  created_at: string;
  last_login: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const isMobile = useIsMobile();
  const { isAuthenticated, role } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAuthenticated || role !== 'admin') {
        toast({
          title: "Доступ запрещен",
          description: "У вас нет прав для просмотра этой страницы",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setUsers(data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить пользователей",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAuthenticated, role]);

  const columns = [
    {
      accessorKey: "username",
      header: "Имя пользователя",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    ...(!isMobile ? [
      {
        accessorKey: "ip_address",
        header: "IP адрес",
        cell: ({ row }: { row: any }) => row.original.ip_address || "Не указан"
      },
      {
        accessorKey: "location",
        header: "Местоположение",
        cell: ({ row }: { row: any }) => row.original.location || "Не указано"
      },
      {
        accessorKey: "created_at",
        header: "Дата регистрации",
        cell: ({ row }: { row: any }) => new Date(row.original.created_at).toLocaleDateString()
      },
      {
        accessorKey: "last_login",
        header: "Последний вход",
        cell: ({ row }: { row: any }) => new Date(row.original.last_login).toLocaleDateString()
      },
    ] : []),
  ];

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || role !== 'admin') {
    return (
      <div className="container mx-auto py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Доступ запрещен</h2>
        <p>У вас нет прав для просмотра этой страницы.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="container mx-auto py-4 md:py-8">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="text-xs md:text-sm"
          >
            Предыдущая
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="text-xs md:text-sm"
          >
            Следующая
          </Button>
        </div>
      </div>
    </div>
  );
}
