"use client"
import { format } from "date-fns";
import QrSeach from "./Qr-search"
import * as React from "react"
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
} from "@radix-ui/react-icons"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { File } from "lucide-react"
import { useData } from "@/context/admin/fetchDataContext"
import SheetDemo from "@/app/[locale]/(home)/students/components/editStudent"
import { useTranslations } from "next-intl"
import { exportTableToExcel } from "@/components/excelExport"

export const StudentPaymentTable = () => {
  const { students, classes } = useData()
  
  const [open, setOpen] = React.useState(false)
  const [selectedStudent, setSelectedStudent] = React.useState<any>(null)
  const t = useTranslations()

  const openEditSheet = (student: any) => {
    setSelectedStudent(student)
    setOpen(true)
  }

  const getStudentClasses = (studentId: string) => {
    return classes.filter(cls => 
      cls.students.some(s => s.id === studentId)
    ).map(cls => {
      const studentInClass = cls.students.find(s => s.id === studentId)
      return {
        className: cls.name,
        group: studentInClass?.group || '',
        debt: studentInClass?.debt || 0,
        amount: studentInClass?.amount || 0,
        nextPaymentDate:studentInClass?.nextPaymentDate || null,
      }
    })
  }

  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: () => <div>{t('Student Name')}</div>,
      cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "year",
      header: () => <div>{t('Year')}</div>,
      cell: ({ row }) => <div className="capitalize">{row.getValue("year")}</div>,
    },
    {
      accessorKey: "classes",
      header: () => <div>{t('Classes')}</div>,
      cell: ({ row }) => {
        const studentClasses = row.getValue("classes") as any[]
        console.log("stdddd",studentClasses);
        
        return (
          <div>
            {studentClasses.map((cls, index) => (
              <div key={index} className="mb-2">
                <div>({cls.group})</div>
                <div>{t('Amount')}: {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "DZD",
                }).format(cls.amount)}</div>
                {cls.debt > 0 && <div>{t('Debt')}: {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "DZD",
                }).format(cls.debt)}</div>}
              {cls.nextPaymentDate!=null &&(<div >{t('next-payment-date')}:
{new Date(cls.nextPaymentDate.toDate()).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
</div>)}

              </div>
            ))}
          </div>
        )
      },
    },
   
]

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const tableData = React.useMemo(() => {
    return students.map(student => ({
      ...student,
      classes: getStudentClasses(student.id),
    }))
  }, [students, classes])

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 5,
      },
    },
  })

  const handleExport = () => {
    const exceldata = tableData.map((student: any) => ({
      [`${t('Student Name')}`]: student.name,
      [`${t('Year')}`]: student.year,
      [`${t('Classes')}`]: student.classes.map((cls: any) => 
        `${cls.className} (${cls.group}) - ${t('Amount')}: ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "DZD",
        }).format(cls.amount)}${cls.debt > 0 ? ` ${t('Debt')}: ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "DZD",
        }).format(cls.debt)}` : ''} ${t('Next Payment')}: ${cls.nextPaymentDate ? new Date(cls.nextPaymentDate).toLocaleDateString() : t('Not set')}`
      ).join(', '),
    }))
    exportTableToExcel(t('students-payments-table'), exceldata)
  }

  return (
    <Card>
      <CardHeader className="px-7">
        <CardTitle>{t('your-student-payments')}</CardTitle>
        <CardDescription>
          {t('introducing-our-dynamic-expenses-dashboard')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <div className="flex items-center justify-between">
            <Input
              placeholder={t('filter-by-student')}
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />

          <QrSeach onStudentScanned={(name) => {
        table.getColumn("name")?.setFilterValue(name);
      }} />
            <div className="flex items-center ml-auto">
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
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" className="ml-2" onClick={handleExport}>
                {t('export')} <File className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="rounded-md border mt-5">
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
                      )
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
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {t('no-results')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} {t('row-s-selected')}
            </div>
            <div className="space-x-2">
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
        </div>
      </CardContent>
      <SheetDemo open={open} setOpen={setOpen} student={selectedStudent} />
    </Card>
  )
}
