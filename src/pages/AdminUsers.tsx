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

interface User {
  id: string;
  username: string;
  email: string;
  isBlocked: "активен" | "заблокирован"; // Добавим это поле
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5000/admin/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await fetch(`http://localhost:5000/users/${userId}/block`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchUsers();
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  const handleUnBlockUser = async (userId: string) => {
    try {
      await fetch(`http://localhost:5000/users/${userId}/unblock`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchUsers();
    } catch (error) {
      console.error("Error unblocking user:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await fetch(`http://localhost:5000/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const columns = [
    {
      accessorKey: "username",
      header: "Имя пользователя",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "actions",
      header: "Действия",
      cell: ({ row }: { row: { original: User } }) => (
        <div className="flex space-x-2">
          {row.original.isBlocked === "активен" ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBlockUser(row.original.id)}
            >
              Заблокировать
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-green-500 text-white hover:bg-green-600" // Зеленая кнопка для "Разблокировать"
              onClick={() => handleUnBlockUser(row.original.id)}
            >
              Разблокировать
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDeleteUser(row.original.id)}
          >
            Удалить
          </Button>
        </div>
      ),
    },
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
