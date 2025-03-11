
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
import { supabase } from "./AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { formatDistance } from "date-fns";
import { ru } from "date-fns/locale";

interface User {
  id: string;
  username: string;
  email: string;
  ip_address: string;
  location: string;
  created_at: string;
  last_login: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');

        if (error) {
          throw error;
        }

        // Transform data to match the User interface
        const formattedUsers = data.map(user => ({
          id: user.id,
          username: user.username || 'No Username',
          email: user.email || 'No Email',
          ip_address: user.ip_address || 'Unknown',
          location: user.location || 'Unknown',
          created_at: user.created_at || new Date().toISOString(),
          last_login: user.last_login || 'Never'
        }));

        setUsers(formattedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить пользователей",
          variant: "destructive"
        });
      }
    };

    fetchUsers();
  }, [toast]);

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
      },
      {
        accessorKey: "location",
        header: "Местоположение",
      },
      {
        accessorKey: "created_at",
        header: "Дата регистрации",
      },
      {
        accessorKey: "last_login",
        header: "Последний вход",
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
