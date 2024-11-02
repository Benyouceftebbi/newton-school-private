import * as React from "react"
import {
  ChevronDownIcon,
  DotsHorizontalIcon,
} from "@radix-ui/react-icons"
import { useToast } from "@/components/ui/use-toast"
import {AtandenceDataModel} from './attendance-report'
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
import SheetDemo from "./editStudent"
import { Student }  from "@/validators/auth";
import { useData } from "@/context/admin/fetchDataContext";
import { z } from "zod"
import { useTranslations } from "next-intl"
import { deleteStudent } from "@/lib/hooks/students"
import StudentForm from "./studentForm"
import StudentPaymentSheet from "./studentPaymentSheet"
import EditStudent from "./editStudent"
import ChangeCard from "./change-card"
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
import VerifyStudent from "./VerifyStudent"
import QrSeach from "./Qr-search"
import { StudentsNumber } from "./area-chart"
import { Level } from "../../settings/level/components/levels-table"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/firebase/firebase-config"
import * as XLSX from 'xlsx';


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
    const [openCardSheetAT,setOpenCardSheetAT]=React.useState(false)
    const [openCard,setOpenCard]=React.useState(false)
    const t=useTranslations()
    const {students,setStudents,classes,levels}=useData()

    
    const orderedStudents = React.useMemo(() => {
      // Ensure students is defined and is an array
      if (!students || !Array.isArray(students)) {
        return [];
      }
    
      let filteredStudents = students;
    
      if (filter === 'ثانوي') {
        // Filter students where their field is not equal to any of the given fields
        const excludedFields = ["جامعي", "متوسط", "ابتدائي", "لغات"];
        filteredStudents = students.filter((std) => !excludedFields.includes(std.field));
      } else if (filter === 'All') {
        // Show all students
        filteredStudents = students;
      }
      else{
        filteredStudents=students.filter((std)=>std.field === filter)
      }
      // Sort the filtered students array by studentIndex in ascending order
      return filteredStudents.sort((a, b) => a.studentIndex - b.studentIndex);
    }, [students, filter]);
    
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

    const openEditSheet = (student:Student) => {
      setStudent(student)
      setOpen(true); // Open the sheet after setting the level
    };
    const openCardSheet = (student:Student) => {
      setStudent(student)
      setOpenCard(true); // Open the sheet after setting the level
    };

    const openCardSheetAttandace = (student:Student) => {
      setStudent(student)
      setOpenCardSheetAT(true); // Open the sheet after setting the level
    };
    
    const getMonthAbbreviation = (monthIndex: number) => {
      const startDate = new Date(2024, 8); // September 2023 (month index 8)
      const date = new Date(startDate.getFullYear(), startDate.getMonth() + monthIndex);
      const monthAbbreviation = date.toLocaleString('en-GB', { month: "short" });
      const yearAbbreviation = date.getFullYear().toString().substr(-2);
      return `${monthAbbreviation}${yearAbbreviation}`;
    };
    const generateMonthlyPaymentColumns = (
      getMonthAbbreviation: (index: number) => string
    ): ColumnDef<any>[] => {
      return Array.from({ length: 10 }, (_, i) => {
        const monthAbbreviation = getMonthAbbreviation(i);
        return {
          accessorKey: `monthlyPayments.${monthAbbreviation}`,
          header: () => <div>{monthAbbreviation}</div>,
          cell: ({ row }: { row: any }) => {
            // Find the payment object for this month
            const payment = row.original.monthlyPayments.find(
              (p: any) => p.month === monthAbbreviation
            );
            
            // Get the status or default to "notPaid"
            const status = payment?.status;
            
            return (
              <Badge
              style={{ backgroundColor: status === 'paid' ? "#4CAF50" : "#F44336" }}
            >
     {status === 'paid' && t('paid')}
          
            </Badge>
            );
          },
        };
      });
    };
   const {toast}=useToast()
   const [openAlert,setOpenAlert]=React.useState(false)
    const columns: ColumnDef<any>[] = [
      {
        accessorKey: "student",
        header: () => <div >{t('name')}</div>,
  
        cell: ({ row }) => (
          <div className="capitalize">
             <div className="font-medium">{row.getValue("student")}</div>
          </div>
        ),
      },
      {
        accessorKey: "level",
        header: () => <div style={{ whiteSpace: 'pre-wrap' }}>{t('level')}</div>,
        cell: ({ row }) => <div>{row.original.level}</div>,
      },
      ...generateMonthlyPaymentColumns(getMonthAbbreviation),
      {
        accessorKey: "amountLeftToPay",
        header:() => <div style={{ whiteSpace: 'pre-wrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('amount-left-to-pay-0')}</div>, 
  
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("amountLeftToPay"))
    
          // Format the amount as a dollar amount
          const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "DZD",
          }).format(amount)
    
          return <div className=" font-medium">{formatted}</div>
        },
      },
      {
        accessorKey: `registrationAndInsuranceFee`,
        header: () =>  <div style={{ whiteSpace: 'pre-wrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {t('registrationAndInsuranceFee')}
      </div>,
        cell: ({ row }: { row: any }) => {
          const amount = parseFloat(row.getValue("registrationAndInsuranceFee"))
    
          // Format the amount as a dollar amount
          const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "DZD",
          }).format(amount)
   
          
          return (
            <Badge
              style={{ backgroundColor:"#4CAF50" }}
            >
     {formatted}
          
            </Badge>
          );
        },
      },
      {
        accessorKey: `feedingFee`,
        header: () => <div style={{ whiteSpace: 'pre-wrap' }}>{t('feedingFee')}</div>,
        cell: ({ row }: { row: any }) => {
          const amount = parseFloat(row.getValue("feedingFee"))
    
          // Format the amount as a dollar amount
          const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "DZD",
          }).format(amount)
   
          
          return (
            <Badge
              style={{ backgroundColor:"#4CAF50" }}
            >
     {formatted}
          
            </Badge>
          );
        },
      },
      {
        accessorKey: "discount",
        header:() => <div style={{ whiteSpace: 'pre-wrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Promotion</div>, 
  
        cell: ({ row }) => {
          const amount = 5000
    
          // Format the amount as a dollar amount
          const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "DZD",
          }).format(amount)
    
          return <div className=" font-medium">{formatted}</div>
        },
      },
   
      {
        accessorKey: 'debt',
        header: () => <div style={{ whiteSpace: 'pre-wrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>pay debt</div>,
        cell: ({ row }) => {
          const [amountToDeduct, setAmountToDeduct] = React.useState('');
    
          const handleDeduct = () => {
            const newDebt = row.original.debt - parseFloat(amountToDeduct);
    
          };
    

    
          return (
            <div>
              <input
                type="number"
                value={amountToDeduct}
                onChange={(e) => setAmountToDeduct(e.target.value)}
                placeholder="Enter amount"
                style={{ marginTop: '8px', marginRight: '8px' }}
              />
              <Button onClick={handleDeduct} style={{ marginTop: '8px' }}>
                Deduct
              </Button>
            </div>
          );
        },
      },
      {
        id: "addPayment",
        enableHiding: false,
        cell: ({ row }) => {
          const student = row.original;
    
          return (
          <StudentPaymentSheet student={student}/>
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
                  <DropdownMenuItem onClick={() => openCardSheetAttandace(student)}>
                 {t('Attandance')} </DropdownMenuItem>
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
  'Sept24', 'Oct24', 'Nov24', 'Dec24',
  'Jan25', 'Feb25', 'Mar25', 'Apr25',
  'May25', 'Jun25'
]
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
  const subjects = ['علوم تجريبية', 'تقني رياضي', 'رياضيات', 'تسيير واقتصاد ', 'لغات اجنبية ', 'اداب وفلسفة'];
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
  const assignLevelIdsToStudents = (students: Student[], levels: Level[]) => {
  const monthsOrder = [
    'Sept24', 'Oct24', 'Nov24', 'Dec24',
    'Jan25', 'Feb25', 'Mar25', 'Apr25',
    'May25', 'Jun25'
  ];
  const updatedStudents = students.map(async student => {
    const matchingLevel = levels.find(level => level.level === student.level);
    const monthlyFee = matchingLevel?.fee ? matchingLevel.fee / 10 : 0;
    const updatedMonthlyPayments = [];

    monthsOrder.forEach((month, index) => {
      updatedMonthlyPayments.push({
        status:"notPaid",
        month:month,
      });
    });

    await updateDoc(doc(db,"Students",student.id), {
      levelId: matchingLevel?.id,
      totalAmount: matchingLevel?.fee,
      monthlyPayments: updatedMonthlyPayments
    });
      return {
        ...student,
        levelId: matchingLevel ? matchingLevel.id : null,
        totalAmount:matchingLevel?.fee
      };
    });
    return updatedStudents
  };
  const processExcelFile = async () => {
    try {
      const response = await fetch('/eleve (7).xlsx');
      const arrayBuffer = await response.arrayBuffer();
      
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Process each row (skipping header)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        const lastName = row[1];
        const firstName = row[2];
        const monthsPaid = parseFloat(row[row.length - 1]); // Amount is now months paid (0-10)
        
        const fullName = `${firstName} ${lastName}`;
        
        // Find matching student
        const student = students.find(s => s.fullName === fullName);
        
        if (student && student.levelId) {
          // Find matching level
          const level = levels.find(l => l.id === student.levelId);
          
          if (level?.fee) {
            // Calculate monthly fee and total amount to reduce
            const monthlyFee = level.fee / 10; // Divide annual fee by 10 months
            const amountToReduce = monthlyFee * monthsPaid;
            const newTotalAmount = student.totalAmount - amountToReduce;
            const updatedMonthlyPayments = student.monthlyPayments.map((payment, index) => {
              if (index < monthsPaid) {
                return { ...payment, status: 'paid' };
              }
              return payment;
            });
            
            // Update student document in Firestore
            await updateDoc(doc(db, "Students", student.id), {
              totalAmount: newTotalAmount,
              amountLeftToPay: newTotalAmount,
              monthlyPayments: updatedMonthlyPayments
            });
            
            console.log(`Updated ${fullName}: Reduced ${amountToReduce} DZD for ${monthsPaid} months`);
          }
        }
      }
      
      toast({
        title: "Success",
        description: "Student payments updated from Excel file",
      });
    } catch (error) {
      console.error('Error processing Excel file:', error);
      toast({
        title: "Error",
        description: "Failed to process Excel file",
        variant: "destructive",
      });
    }
  };
  return (
    <>


<div className="max-w-md w-full">
  <StudentsNumber  students={orderedStudents} fields={subjects}/>
</div>
    <Card x-chunk="dashboard-05-chunk-3" className="mt-2 ">
    <CardHeader className="px-7">
      <CardTitle>{t('your-students')}</CardTitle>
      <CardDescription>
      {t('introducing-our-dynamic-student-dashboard-for-seamless-management-and-insightful-analysis')} 
      
      <div className="flex items-center justify-between">
       
  
      <Input
          placeholder={t('filter-student')}
          value={(table.getColumn("student")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("student")?.setFilterValue(event.target.value)
          }
          className="max-w-sm font-medium"
        />
              <QrSeach onStudentScanned={(name) => {
        table.getColumn("student")?.setFilterValue(name);
      }} />
          <div className=" ml-auto space-y-4 ">
            <StudentForm filter={filter}/>
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
        {subjects.map(subject => (
            <li key={subject} className="flex">
              <span className="text-lg font-medium">{subject}:</span>
              <span className="text-lg font-medium">{" "} {studentCounts[subject] || 0}</span> {/* Display 0 if no students found */}
            </li>
          ))}
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
      <AtandenceDataModel open={openCardSheetAT} setOpen={setOpenCardSheetAT}  student={student} classes = {classes}/>
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{t('heads-up')}</AlertDialogTitle>
      <AlertDialogDescription>
{t('are-you-sure-you-want-to-delete-student')} </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
      <AlertDialogAction className={buttonVariants({ variant: "destructive" })}   onClick={() =>{deleteStudent(student,classes), setStudents((prevStudents:any) =>
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
