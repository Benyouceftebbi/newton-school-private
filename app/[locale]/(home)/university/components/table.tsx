import * as React from "react"
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
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {exportTableToExcel} from '@/components/excelExport'
import { Student }  from "@/validators/auth";
import { useData } from "@/context/admin/fetchDataContext";
import { useTranslations } from "next-intl"
import { deleteStudent } from "@/lib/hooks/students"
import StudentForm from "../../students/components/studentForm"

import EditStudent from "../../students/components/editStudent"
import ChangeCard from "../../students/components/change-card"
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
import VerifyStudent from "../../students/components/VerifyStudent"
import QrSeach from "../../students/components/Qr-search"
type Status = 'accepted' | 'pending' | 'rejected';
export type StudentSummary = {
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
    const [openCard,setOpenCard]=React.useState(false)
    const t=useTranslations()
    const {students,setStudents,classes}=useData()
    const orderedStudents = React.useMemo(() => {
      // Ensure students is defined and is an array
      if (!students || !Array.isArray(students)) {
        return [];
      }
    const orders=students.filter((std)=>std.field==="جامعي")
      // Sort the students array by studentIndex in ascending order
      return orders.sort((a, b) => a.studentIndex - b.studentIndex);
    }, [students]);
    const [student,setStudent]=React.useState<Student>({  
      id: '123456',
      level: 'Intermediate',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      address: '123 Main St',
      city: 'Anytown',
      state: 'State',
      postalCode: '12345',
      country: 'Country',
      parentFullName: 'Jane Doe',
      parentFirstName: 'Jane',
      parentLastName: 'Doe',
      parentEmail: 'jane.doe@example.com',
      parentPhone: '123-456-7890',
      parentId: '654321',
      emergencyContactName: 'Emergency Contact',
      emergencyContactPhone: '987-654-3210',
      medicalConditions: null,
      status: 'Active',
      joiningDate: new Date(),
      registrationStatus: 'Registered',
      startDate: new Date(),
      lastPaymentDate: new Date(),
      nextPaymentDate: new Date(),
      totalAmount: 1000,
      amountLeftToPay: 500,
      class: "S",
      registrationAndInsuranceFee:"Paid",
      feedingFee:"Paid",
      classesUIDs:[]
    })
      // Define your table and set up filtering
  React.useEffect(() => {
         
    if (filter === "All") {
      table.resetColumnFilters()
    } else {
      table.getColumn("level")?.setFilterValue(filter);
    } 
  }, [filter]); 
    const openEditSheet = (student:Student) => {
      setStudent(student)
      setOpen(true); // Open the sheet after setting the level
    };
    const openCardSheet = (student:Student) => {
      setStudent(student)
      setOpenCard(true); // Open the sheet after setting the level
    };


   const {toast}=useToast()
   const [openAlert,setOpenAlert]=React.useState(false)
    const columns: ColumnDef<any>[] = [
    //   {
    //     accessorKey: "index",
    //     header: () => <div >Index</div>,
     
    //     cell: ({ row,table}) => {
    //      (table.getSortedRowModel()?.flatRows?.findIndex((flatRow) => flatRow.id === row.id) || 0) + 1
    //    return (
    //     <div className="capitalize" style={{ width: '10px' }}>
    //     <div className="font-medium">{row.original.studentIndex}</div>
    //  </div>
    //    )

      
    //      }
    //   },
      {
        accessorKey: "name",
        header: () => <div >{t('name')}</div>,
  
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
        header: () => <div >{t('field')}</div>,
        cell: ({ row }) => <div>{row.getValue("field")}</div>,
      },
      {
        accessorKey: "phone",
        header: () => <div >{t('Phone')}</div>,
        cell: ({ row }) => <div>{row.original.phoneNumber}</div>,
      },
      {
        accessorKey: "school",
        header: () => <div >{t('school')}</div>,
        cell: ({ row }) => <div>{row.getValue("school")}</div>,
      },
      {
        id: "classes",
        header: () => <div>{t('Classes')}</div>,
        cell: ({ row }) => {
          const classesuid = row.original.classes;

          
          return (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {classesuid.map((classItem: any, index: number) => (
                <div key={index} style={{ maxWidth: '200px', marginBottom: '5px' }}>
                  <div className="font-medium">{classItem.subject}</div>
                  <div className="text-sm ">
                    {classItem.name},{classItem.time}
                  </div>
                  <div className="text-sm ">
                    index: {classItem.index},group: {classItem.group}
                  </div>
                </div>
              ))}
              
            </div>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const student = row.original;
    
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <DotsHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditSheet(student)}>
                  {t('edit')} </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openCardSheet(student)}>
                 {t('New Card')} </DropdownMenuItem>
                 <DropdownMenuItem onClick={() =>{setOpenAlert(true);setStudent(student)}}>
          {t('delete')} </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];


  const handleExport = () => {
  

    
const orderedMonths = [
  'Sept23', 'Oct23', 'Nov23', 'Dec23',
  'Jan24', 'Feb24', 'Mar24', 'Apr24',
  'May24', 'Jun24', 'Jul24','Aug24'
];
    const exceldata=students.map((student:any)=>({[`${t('Name')}`]:student.student,
    [`${t('level')}`]:student.level,
    [`${t('class')}`]:student.class,
    [`${t('status')}`]:t(student.status),
    [`${t('joining-date-0')}`]:student.joiningDate,
    ...orderedMonths.reduce((acc: Record<string, string>, month: string) => {
      const monthStatus = student.monthlyPayments23_24[month]?.status;
      acc[`${month}`] = t(monthStatus);
      return acc;
    }, {}),
    [t('registrationAndInsuranceFee')]:t(student.registrationAndInsuranceFee),
    [t('feedingFee')]:t(student.feedingFee),
    [`${t('amount-left')}`]: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "DZD",
    }).format(student.amountLeftToPay),
    [`${t('total-amount-0')}`]: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "DZD",
    }).format(student.totalAmount),

    }))
    exportTableToExcel(t('students-table'),exceldata);
  };
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
    
  const table = useReactTable({
    data:orderedStudents,
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
        pageSize: 25, //custom default page size
      },
      sorting: [{ id: 'index', desc:true }], // Sort by 'index' column in ascending order by default
    },
  })
  const subjects = ['متوسط', 'علوم تجريبية', 'تقني رياضي', 'رياضيات', 'تسيير واقتصاد ', 'لغات اجنبية ', 'اداب وفلسفة'];
  const countStudentsByStream = React.useCallback(() => {
    // Initialize counts for each subject
    const counts = subjects.reduce((acc, subject) => {
      acc[subject] = 0;
      return acc;
    }, {});

    // Count students in each stream
    orderedStudents.forEach(student => {
      if (counts[student.field] !== undefined) {
        counts[student.field] += 1;
      }
    });

    return counts;
  }, [orderedStudents]);
  const studentCounts = countStudentsByStream(students, subjects);
  return (
    <>



    <Card x-chunk="dashboard-05-chunk-3" className="mt-2 ">
    <CardHeader className="px-7">
      <CardTitle>{t('your-students')}</CardTitle>
      <CardDescription>
      {t('introducing-our-dynamic-student-dashboard-for-seamless-management-and-insightful-analysis')} 
      
      <div className="flex items-center justify-between">
       
  
      <Input
          placeholder={t('filter-student')}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm font-medium"
        />
              <QrSeach onStudentScanned={(name) => {
        table.getColumn("name")?.setFilterValue(name);
      }} />
          <div className=" ml-auto space-y-4 ">
            <StudentForm/>
            <VerifyStudent/>
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
        <Table id="students-table">
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
        <div className="flex-1 text-sm ">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} {t('row-s-selected')}
          <div className="mt-2">
        <h3 className="text-lg font-medium">Students Count</h3>
        <ul>
       
            <li key={"متوسط"} className="flex">
              <span className="text-lg font-medium">{"متوسط"}:</span>
              <span className="text-lg font-medium">{" "} {orderedStudents.length || 0}</span> {/* Display 0 if no students found */}
            </li>
   
        </ul>
      </div>
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
      <EditStudent open={open} setOpen={setOpen}  student={student}/>
      <ChangeCard open={openCard} setOpen={setOpenCard}  student={student}/>
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{t('heads-up')}</AlertDialogTitle>
      <AlertDialogDescription>
{t('are-you-sure-you-want-to-delete-student')} </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
      <AlertDialogAction className={buttonVariants({ variant: "destructive" })}  onClick={async() =>{await deleteStudent(student,classes); setStudents((prevStudents:any) =>
      prevStudents.filter((std:any) => std.id !== student.id)

    


    )
    toast({
      title: "Student Deleted!",
      description: `The student, ${student.name} Has been Deleted`,
    });
    }}> 
        
        
        {t('Delete')}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
    </CardContent>
  </Card>


  </>
  )
}