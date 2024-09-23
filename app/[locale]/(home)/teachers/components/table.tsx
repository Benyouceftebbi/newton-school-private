

import * as React from "react"
import {useUser} from '@/lib/auth'

import {
  ChevronDownIcon,
  DotsHorizontalIcon,
} from "@radix-ui/react-icons"
import { useToast } from "@/components/ui/use-toast"
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
import { Button, buttonVariants } from "@/components/ui/button"
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {exportTableToExcel} from '@/components/excelExport'

import { Teacher }  from "@/validators/teacher";
import { useData } from "@/context/admin/fetchDataContext";

import { useTranslations } from "next-intl"
import { deleteTeacher } from "@/lib/hooks/teachers"
import TeacherForm from "./teacherForm"

import EditTeacher from "./editTeacher"
import {AtandenceDataModel} from './attendance-report'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import * as XLSX from 'xlsx';
type Status = 'accepted' | 'pending' | 'rejected';
export type TeacherSummary = {
  id: string;
  teacher: string;
  status: Status;
  Subject: string;
  joiningDate: string;
  salary: number;

};
interface DataTableDemoProps {
  filter: string;
}
  export const DataTableDemo: React.FC<DataTableDemoProps> = ({ filter }) => {
    const [open,setOpen]=React.useState(false)
    const [openCard, setOpenCard] = React.useState(false)
    const [openPayment,setOpenPayment]=React.useState(false)
    const t=useTranslations()
    const {teachers,setTeachers,classes,setClasses}=useData()
    const [openAlert,setOpenAlert]=React.useState(false)

    
    
    const [teacher,setTeacher]=React.useState<Teacher | null>({year:[]})
    const openEditSheet = (teacher:Teacher) => {
      setTeacher(teacher)
      setOpen(true); // Open the sheet after setting the level
    };
    const openAttendanceCard = (teacher:Teacher) => {
      setTeacher(teacher)
      setOpenCard(true); // Open the sheet after setting the level
    };

    const getMonthAbbreviation = (monthIndex: number) => {
      const startDate = new Date(2024, 8); // September 2023 (month index 8)
      const date = new Date(startDate.getFullYear(), startDate.getMonth() + monthIndex);
      const monthAbbreviation = date.toLocaleString('en-GB', { month: "short" });
      const yearAbbreviation = date.getFullYear().toString().substr(-2);
      return `${monthAbbreviation}${yearAbbreviation}`;
    };


    const {toast}=useToast()
    
    const columns: ColumnDef<any>[] = [
      {
        accessorKey: "name",
        header: () => <div >{t('teacher')}</div>,
  
        cell: ({ row }) => (
          <div className="capitalize">
             <div className="font-medium">{row.getValue("name")}</div>
          </div>
        ),
      },
      {
        accessorKey: "year",
        header: () => <div style={{ whiteSpace: 'pre-wrap' }}>{t('year')}</div>,
        cell: ({ row }) => <div>{row.getValue("year")}</div>,
      },
      {
        accessorKey: "field",
        header: () => <div>{t('field')}</div>,
        cell: ({ row }) => {
          const classes = row.original.classes || [];
          const streams = classes.flatMap((classItem: any) => classItem?.stream || []);
          const uniqueStreams = Array.from(new Set(streams)).sort();
  
          return (
            <div className="text-sm text-muted-foreground">
              {uniqueStreams.length > 0 ? uniqueStreams.join(', ') : 'No streams available'}
            </div>
          );
        }
      },
      {
        accessorKey: "phone",
        header: () => <div >{t('phone-number')}</div>,
        cell: ({ row }) => <div>{row.original.phoneNumber}</div>,
      },
      {
        accessorKey: "educational-subject",
        header: () => <div >{t('educational-subject')}</div>,
        cell: ({ row }) => <div>{row.getValue("educational-subject")}</div>,
      },
      {
        id: "classes",
        header: () => <div>{t('classes')}</div>,
        cell: ({ row }) => {
          const classes = row.original.classes;
          
      return (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
  {classes.map((classItem: any, index: number) => (
    <div key={index} style={{ maxWidth: '200px', marginBottom: '5px' }}>
      <div className="font-medium">{classItem?.subject}</div>
      {classItem?.groups?.map((cls)=>(
     <div className="text-sm text-muted-foreground">
     <div>{t(`${cls.day}`)}</div>
     <div>{`${cls.start} -> ${cls.end}`}</div>
   </div>
      ))}
 
    </div>
  ))}
</div>
      );
        }
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const teacherss = row.original;
    
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <DotsHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditSheet(teacherss)}>
                  {t('edit')} </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openAttendanceCard(teacherss)}>
                  {t('details')} </DropdownMenuItem>


                  <DropdownMenuItem onClick={() =>{setOpenAlert(true);setTeacher(teacherss)}}>
                  {t('delete')} </DropdownMenuItem>
         

              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];
    const transformArrayFields = (field: any[]) => {
      return field.join(', '); // Join array elements with a comma
    };
    
    const transformClasses = (classes: any[]) => {
      return classes.map((classItem: any, index: number) => {
        const formattedStream = classItem.stream.join(', '); 
        return `
          Day: ${classItem.day}
          Time: ${classItem.start} -> ${classItem.end}
          year:${classItem.year}
          field:${formattedStream}
        `
      }).join(' | '); // Use '|' as a separator between classes
    };
  const handleExport = () => {
    const formattedTeachers = teachers.map(({name,birthdate,phoneNumber,classes,year,groupUIDs,teacher,id, ...rest }) => ({
      name,birthdate,phoneNumber,
      year: transformArrayFields(year), 
      ...rest,
      classes:transformClasses(classes)
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(formattedTeachers);
    worksheet['!cols'] = [
      { wch: 20 },  // Width for the "name" column
      { wch: 25 },  // Width for the "birthdate" column (wider)
      { wch: 20 },  // Width for the "birthplace" column
      { wch: 20 },  // Width for the "school" column
      { wch: 20 },  // Width for the "field" column
      { wch: 100 }   // Width for the "classes" column
    ];
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'teachers');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, 'teachers_data.xlsx');
  };
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const user = useUser()

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
    
  const table = useReactTable({
    data:teachers,
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
        pageIndex: 0, //custom initial page index
        pageSize: 50, //custom default page size
      },
    },
  })
  const deleteTeacherAndClasses = async (teacher: any, classes: any) => {
    try {

      const classesToDelete = classes.filter((classData: any) => classData.teacherUID === teacher.id);
  
      // Delete the teacher and associated classes
      await deleteTeacher(teacher.id, classesToDelete,user);
  
      // Update the state by removing the deleted classes and teacher
      setClasses((prevClasses: any) =>
        prevClasses.filter((classData: any) => !classesToDelete.some((toDelete: any) => toDelete.id === classData.id))
      );
      setTeachers((prevTeachers: any) =>
        prevTeachers.filter((t: any) => t.id !== teacher.id)
      );
  
      // Show a toast notification after successful deletion
      toast({
        title: "Teacher Deleted!",
        description: `The teacher, ${teacher.name}, has been deleted along with their associated classes.`,
      });
    } catch (error) {
      console.error("Error deleting teacher and classes:", error);
      toast({
        title: "Error",
        description: "There was an error deleting the teacher and their classes.",
      });
    }
  };
  return (
    <>



    <Card x-chunk="dashboard-05-chunk-3" className="mt-2 ">
    <CardHeader className="px-7">
      <CardTitle>{t('your-teachers')}</CardTitle>
      <CardDescription>
      {t('introducing-our-dynamic-teacher-dashboard-for-seamless-management-and-insightful-analysis')} 
      
      <div className="flex items-center justify-between">
       
    
    <Input
          placeholder={t('filter-teacher')}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm mt-4"
        />
          <div className=" ml-auto space-y-4 ">
            <TeacherForm/>
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
                    {t(column.id)}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" className="ml-2"  
        
    onClick={handleExport}>
       {t('export')} <File className="ml-2 h-4 w-4" />
      </Button>
    </div>
 
    </div>
      </CardDescription>
    </CardHeader>
    <CardContent>     

 
    <ScrollArea style={{ width: 'calc(100vw - 170px)'}}>
        <Table id="teachers-table">
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
                  {t('no-results')} </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
        </ScrollArea>
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
            {t('previous')} </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t('next')} </Button>
        </div>
      </div>
      <EditTeacher open={open} setOpen={setOpen}  teacher={teacher}/>
      <AtandenceDataModel open={openCard} setOpen={setOpenCard}  teacher={teacher}/>
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{t('heads-up')}</AlertDialogTitle>
      <AlertDialogDescription>
{t('are-you-sure-you-want-to-delete-student')} </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
      <AlertDialogAction className={buttonVariants({ variant: "destructive" })}  onClick={() =>deleteTeacherAndClasses(teacher,classes)}> 
        
        
        {t('Delete')}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
    </CardContent>
  </Card>


  </>
  )
}