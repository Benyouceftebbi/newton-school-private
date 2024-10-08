"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import QrSeach from "./Qr-search"
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
} from "@radix-ui/react-icons";
import {
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { File } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useData } from "@/context/admin/fetchDataContext";
import EditStudentPaymentForm from "./editStudentPaymentForm";
import { useTranslations } from "next-intl";
import { exportTableToExcel } from "@/components/excelExport";
import { format } from "date-fns";
import { downloadInvoice } from "./generateInvoice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Status = "paid" | "not paid" | "rejected";

export const TransactionDataTableDemo = () => {
  const { students, invoices, profile } = useData();
  const [invoice, setInvoice] = React.useState<any>(null);
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);
  console.log('ffff', invoices);

  const openEditSheet = (student: any) => {
    setInvoice(student);
    setOpen(true);
  };

  const getStatusColor = React.useCallback((status: Status) => {
    switch (status) {
      case "paid":
        return "#2ECC71"; // Green for accepted
      case "not paid":
        return "#F1C40F"; // Yellow for pending
      case "rejected":
        return "#E74C3C"; // Red for rejected
      default:
        return "#FFFFFF"; // Default to white for unknown status
    }
  }, []);

  const handleExport = () => {
    const exceldata = transactionsData.map((transaction) => ({
      [`${t("student")}`]: transaction.student.student,
      [`${t("payment-date")}`]: format(new Date(transaction.paymentDate), "dd/MM/yyyy"),
      [`${t("amount")}`]: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "DZD",
      }).format(transaction.amount),
      [`${t("transaction-type")}`]: transaction.transactionType,
    }));
    exportTableToExcel(t("students-payments-transactions-table"), exceldata);
  };

  const transactionsData = useMemo(() => {
    if (!Array.isArray(invoices)) {
      return [];
    }

    return invoices.flatMap((invoice: any) =>
      (Array.isArray(invoice?.transaction) ? invoice.transaction : []).map((trans: any) => ({
        ...invoice,
        ...trans,
        transactionType: trans.group || trans.type ||'Registration Fee'
      }))
    ).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [invoices]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const handlePrint = (data) => {
    const isRegistrationFee = !data.filtredclasses.some(cls => cls.group);
    const billHtml = profile.ticketLanguage === 'ar' ? `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>وصل استلام</title>
        <style>
            @page {
                size: A4;
                margin: 0;
            }
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
                direction: rtl;
                height: 100%;
            }
            .receipt {
                position: relative;
                width: 100%;
                height: 100vh;
                background-color: white;
                border: 1px solid #ddd;
                padding: 20px;
                box-sizing: border-box;
            }
            .header {
                text-align: center;
                margin-bottom: 10px;
            }
            .title {
                font-size: 50px;
                font-weight: bold;
                margin: 0;
            }
            .subtitle {
                font-size: 40px;
                margin: 5px 0;
            }
            .content {
                text-align: right;
                font-size: 36px;
                margin-bottom: 20px;
            }
            .row {
                margin-bottom: 8px;
            }
            .amount {
                border: 3px solid black;
                padding: 25px;
                text-align: center;
                font-weight: bold;
                font-size: 48px;
                margin: 20px 0;
            }
            table {
                width: 100%;
                margin-bottom: 20px;
                border-collapse: collapse;
                font-size: 26px;
            }
            th, td {
                border: 2px solid #ddd;
                padding: 20px;
                text-align: center;
            }
            th {
                background-color: #f4f4f4;
                font-weight: bold;
            }
            .footer {
                border-top: 2px solid #ddd;
                padding-top: 25px;
                font-size: 36px;
                text-align: center;
                position: absolute;
                bottom: 0;
                width: calc(100% - 40px);
            }
            .thank-you {
                font-size: 42px;
                margin-top: 10px;
            }
        </style>
    </head>
    <body>
        <div class="receipt">
            <div>                                 
                <div class="header">
                    <h1 class="title">${profile.schoolName}</h1>
                    <p class="subtitle">2024/2025</p>
                    <p class="subtitle"><strong>وصل استلام</strong></p>
                </div>
                <div class="content">
                    <div class="row">
                        <span>${format(new Date(), "dd-MM-yyyy")}</span>
                    </div>
                    <div class="row">الاسم و اللقب: ${data.student.student}</div>
                    ${isRegistrationFee ? `
                    ${data.filtredclasses.map(clss => `
                    <div class="amount">المبلغ: ${clss.amountPaid}</div>
                    <div class="row">حقوق التسجيل</div>
                    `).join('')}
                    ` : `
                    <div class="amount">المبلغ: ${data.filtredclasses.reduce((total, cls) => total + cls.amountPaid, 0)}</div>
                    <table>
                        <thead>
                            <tr>
                                <th>المجموعة</th>
                                <th>المادة</th>
                                <th>الدين المتبقي</th>
                                <th>الجلسات المتبقية</th>
                                <th>المبلغ المدفوع</th>
                                <th>تاريخ الدفع التالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.filtredclasses.map(cls => `
                                <tr>
                                    <td>${cls.group}</td>
                                    <td>${cls.subject}</td>
                                    <td>${Math.abs(cls.debt - cls.amountPaid)}</td>
                                    <td>${cls.sessionsLeft}</td>
                                    <td>${cls.amountPaid}</td>
                                    <td>${format(new Date(cls.nextPaymentDate), "dd-MM-yyyy")}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    `}
                </div>
            </div>
            <div class="footer">
                <p><strong>يرجى الاحتفاظ بالوصل</strong></p>
                <div class="thank-you">شكراً لكم</div>
            </div>
        </div>
    </body>
    </html>
    ` : `
    <!DOCTYPE html>
    <html lang="fr" dir="ltr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reçu de Paiement</title>
        <style>
            @page {
                size: A4;
                margin: 0;
            }
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
                direction: ltr;
                height: 100%;
            }
            .receipt {
                position: relative;
                width: 100%;
                height: 100vh;
                background-color: white;
                border: 1px solid #ddd;
                padding: 20px;
                box-sizing: border-box;
            }
            .header {
                text-align: center;
                margin-bottom: 10px;
            }
            .title {
                font-size: 50px;
                font-weight: bold;
                margin: 0;
            }
            .subtitle {
                font-size: 40px;
                margin: 5px 0;
            }
            .content {
                text-align: left;
                font-size: 36px;
                margin-bottom: 20px;
            }
            .row {
                margin-bottom: 8px;
            }
            .amount {
                border: 3px solid black;
                padding: 25px;
                text-align: center;
                font-weight: bold;
                font-size: 48px;
                margin: 20px 0;
            }
            table {
                width: 100%;
                margin-bottom: 20px;
                border-collapse: collapse;
                font-size: 26px;
            }
            th, td {
                border: 2px solid #ddd;
                padding: 20px;
                text-align: center;
            }
            th {
                background-color: #f4f4f4;
                font-weight: bold;
            }
            .footer {
                border-top: 2px solid #ddd;
                padding-top: 25px;
                font-size: 36px;
                text-align: center;
                position: absolute;
                bottom: 0;
                width: calc(100% - 40px);
            }
            .thank-you {
                font-size: 42px;
                margin-top: 10px;
            }
        </style>
    </head>
    <body>
        <div class="receipt">
            <div>
                <div class="header">
                    <h1 class="title">${profile.schoolName}</h1>
                    <p class="subtitle">2024/2025</p>
                    <p class="subtitle"><strong>Reçu de Paiement</strong></p>
                </div>
                    <div class="content">
                    <div class="row">
                        <span>${format(new Date(), "dd-MM-yyyy")}</span>
                    </div>
                    <div class="row">Nom et Prénom: ${data.student.student}</div>
                    ${isRegistrationFee ? `
                    ${data.filtredclasses.map(clss => `
                    <div class="amount">Montant: ${clss.amountPaid}</div>
                    <div class="row">Frais d'inscription</div>
                    `).join('')}
                    ` : `
                    <div class="amount">Montant: ${data.filtredclasses.reduce((total, cls) => total + cls.amountPaid, 0)}</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Groupe</th>
                                <th>Matière</th>
                                <th>Dette Restante</th>
                                <th>Séances Restantes</th>
                                <th>Montant Payé</th>
                                <th>Prochaine Date de Paiement</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.filtredclasses.map(cls => `
                                <tr>
                                    <td>${cls.group}</td>
                                    <td>${cls.subject}</td>
                                    <td>${Math.abs(cls.debt - cls.amountPaid)}</td>
                                    <td>${cls.sessionsLeft}</td>
                                    <td>${cls.amountPaid}</td>
                                   <td>${format(new Date(cls.nextPaymentDate), "dd-MM-yyyy")}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    `}
                </div>
            </div>
            <div class="footer">
                <p><strong>Veuillez conserver le reçu</strong></p>
                <div class="thank-you">Merci</div>
            </div>
        </div>
    </body>
    </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(billHtml);
      printWindow.document.close();
      printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
      };
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      id: "student",
      header: "Student",
      accessorFn: (row) => row?.student?.student,
      cell: ({ getValue }) => <div className="font-medium">{getValue()}</div>,
    },
    {
      header: "Payment Day",
      accessorFn: (row) => row?.paymentDate,
      cell: ({ getValue }) => (
        <div className="capitalize hidden sm:table-cell">
          {(getValue() as Date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </div>
      ),
    },
    {
      header: "Amount Paid",
      accessorFn: (row) => row?.amount,
      cell: ({ getValue }) => {
        const formattedAmount = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "DZD",
        }).format(getValue());
        return <div className="font-medium">{formattedAmount}</div>;
      },
    },
    {
      id: "transactionType",
      header: "Transaction Type",
      accessorFn: (row) => row.transactionType,
      cell: ({ getValue }) => (
        <div className="font-medium">
          {getValue()}
        </div>
      ),
    },
    {
      id: "actions",
      header: "action",
      enableHiding: false,
      cell: ({ row }) => {
        const invoice = row.original;
        
        const data = {
          student: { student: row.original.student.student },
          filtredclasses: [{
            amountPaid: row.original.amount,
            group: invoice.group,
            subject: row.original.subject,
            debt: row.original.debt,
            sessionsLeft: row.original.sessionsLeft,
            nextPaymentDate: row.original.nextPaymentDate
          }]
        };
        console.log("jjkkjl;;;;;;", data);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("open-menu")}</span>
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handlePrint(data)}
              >
                {t("print-bill")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  console.log("hjjkkjjkkhbkj", transactionsData);
  
  const table = useReactTable({
    data: transactionsData,
    columns,
    state: {
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: React.useCallback((row) => row?.id, []),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  const uniqueTransactionTypes = useMemo(() => {
    const types = new Set(transactionsData.map(transaction => transaction.transactionType));
    return ['All', ...Array.from(types)];
  }, [transactionsData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("students-payments-transactions-table")}</CardTitle>
        <CardDescription>
          {t("students-payments-transactions-table-description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="flex items-center py-4">
          <Input
            placeholder={t('filter-by-student')}
            value={(table.getColumn("student")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("student")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Select
            onValueChange={(value) =>
              table.getColumn("transactionType")?.setFilterValue(value === 'All' ? '' : value)
            }
          >
            <SelectTrigger className="w-[180px] ml-2">
              <SelectValue placeholder={t('filter-by-transaction-type')} />
            </SelectTrigger>
            <SelectContent>
              {uniqueTransactionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <QrSeach onStudentScanned={(name) => {
            table.getColumn("student")?.setFilterValue(name);
          }} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                {t('columns')} <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="ml-2" onClick={handleExport}>
            {t('export')} <File className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {t("no-results-found")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <div className="flex items-center justify-between py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} {t('row-s-selected')}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {t('previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {t('next')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};