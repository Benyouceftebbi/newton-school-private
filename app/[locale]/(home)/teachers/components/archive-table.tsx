import { useCallback, useMemo, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
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
} from "@tanstack/react-table";
import { useData } from "@/context/admin/fetchDataContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { addDays, endOfMonth, format, startOfMonth } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addStudentFromAttendance, removeStudentFromAttendance } from "@/lib/hooks/calendar";
import { addPaymentTransaction } from "@/lib/hooks/billing/student-billing";
import generatePDF from './teacherReview'


export type studentAttandance = {
  id: string;
  name: string;
  status: string;
};
const getStatusIcon = (status: string) => {
 if(status === "present"){
  return <CheckIcon className="ml-5 w-5 h-5 text-green-500" />;
 }
 if(status === "Absent"){
  return <XIcon className="ml-5 w-5 h-5 text-red-500" />;
 }
 
};

const getNextFourDates = (day: string, startTime: string, endTime: string) => {
  const daysOfWeek = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  const targetDay = daysOfWeek[day];
  const dates = [];
  let currentDate = startOfMonth(new Date());
  const lastDate = endOfMonth(new Date());

  while (currentDate <= lastDate && dates.length < 4) {
    if (currentDate.getDay() === targetDay) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      dates.push(`${dateStr}-${startTime}-${endTime}`);
    }
    currentDate = addDays(currentDate, 1);
  }

  return dates;
};
const generateTableData = (classes: any[]) => {
  const tableData = [];

  classes.forEach(cls => {
    cls.groups.forEach(group => {
      // Generate the next 4 dates for the group
      const generatedDates = getNextFourDates(group.day, group.start, group.end);

      // Extract dates from the attendance records
      const attendanceDates = cls.Attendance 
        ? Object.keys(cls.Attendance) // Get all date keys from the attendance
        : [];

      // Merge generated dates and attendance dates (to avoid duplicates)
      const allDates = Array.from(new Set([...generatedDates, ...attendanceDates]));

      // Process students and attendance
      cls.students.forEach(student => {
        if (student.group === cls.group) {
          const row = {
            id:student.id,
            index: student.index,
            group: cls.group,
            name: student.name,
            classId:cls.id,
            ...allDates.reduce((acc, date) => {
              const [yearStrOnly, monthStr, dayStr] = date.split('-');
              const dateKey = `${yearStrOnly}-${monthStr}-${dayStr}`;

              const attendanceEntry = cls.Attendance?.[dateKey];


              if (attendanceEntry) {
                const isPresent = attendanceEntry.attendanceList.some(att => att.id === student.id);
                acc[date] = isPresent ? 'present' : 'Absent';
              } else {
                acc[date] = 'Absent'; // Mark as Absent if no attendance record exists for that date
              }

              return acc;
            }, {} as { [key: string]: string })
          };

          tableData.push(row);
        }
      });
    });
  });

  return tableData;
};

export const ArchiveDataTable = ({teacher}) => {
  const {students,classes,setClasses,setStudents,teachers}=useData()
  const teacherClasses = useMemo(() => classes.filter((cls) => cls.teacherUID === teacher.id), [classes, teacher.id]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const dates = useMemo(() => {
    const allDates = selectedGroup
      ? Array.from(new Set(
          teacherClasses
            .filter(group => group.group === selectedGroup)
            .flatMap(cls => 
              cls.groups.flatMap(group => {
                const generatedDates = getNextFourDates(group.day, group.start, group.end);
                const attendanceDates = cls.Attendance 
                  ? Object.keys(cls.Attendance) // Extract dates from the Attendance subcollection
                  : [];
                return [...generatedDates, ...attendanceDates]; // Merge generated and attendance dates
              })
            )
        ))
      : Array.from(new Set(
          teacherClasses.flatMap(cls => 
            cls.groups.flatMap(group => {
              const generatedDates = getNextFourDates(group.day, group.start, group.end);
              const attendanceDates = cls.Attendance 
                ? Object.keys(cls.Attendance) // Extract dates from the Attendance subcollection
                : [];
              return [...generatedDates, ...attendanceDates]; // Merge generated and attendance dates
            })
          )
        ));
  
    // Sort dates chronologically
    return allDates.sort((a, b) => {
      const dateA = new Date(a.split('-')[0]);
      const dateB = new Date(b.split('-')[0]);
      return dateA.getTime() - dateB.getTime();
    });
  }, [teacherClasses, selectedGroup]);
  const generateColumns = (dates: string[]): ColumnDef<any>[] => {
    const baseColumns: ColumnDef<any>[] = [
      {
        accessorKey: "index",
        header: () => <div>Index</div>,
        cell: ({ row }) => <div>{row.getValue("index")}</div>,
      },
      {
        accessorKey: "name",
        header: () => <div>Student Name</div>,
        cell: ({ row }) => <div>{row.getValue("name")}</div>,
      },
      {
        accessorKey: "group",
        header: () => <div>Group</div>,
        cell: ({ row }) => <div>{row.getValue("group")}</div>,
      },
  
      ...dates.map(date => ({
        accessorKey: date,
        header: () => <div>{date}</div>,
        cell: ({ row }) => {
          const [year, month, day] = date.split('-');
          const formattedDate = `${year}-${month}-${day}`;
          const currentStatus = row.getValue(date);
          console.log("status",currentStatus);
          
          const student=row.original
          const handleChange = async (event: string) => {
            const newStatus = event;
           const cls=classes.find(c=>c.id===row.original.classId);
            if(event==="present" && currentStatus==='Absent'){
              await addStudent({index:student.index,id:student.id,name:student.name,group:student.group,status:currentStatus},row.original.classId,formattedDate,{...cls,start:new Date(),end:new Date(),attendanceId:formattedDate,classId:cls.id})
            
            }
             if(event==="Absent" && currentStatus==='present'){
              await removeStudent({index:student.index,id:student.id,name:student.name,group:student.group,status:currentStatus},row.original.classId,formattedDate,{...cls,start:new Date(),end:new Date(),attendanceId:formattedDate,classId:cls.id})

            }
          };
          return (
            <Select
            onValueChange={handleChange}
            value={currentStatus}
                >
                  <SelectTrigger            className="ml-5 w-20 border rounded p-1">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent            className="ml-5 w-20 border rounded p-1">
  
                      <SelectItem  value="present"> <CheckIcon className="ml-5 w-5 h-5 text-green-500" /></SelectItem>
                      <SelectItem  value="Absent">          <XIcon className="ml-5 w-5 h-5 text-red-500" /></SelectItem>
  
                  </SelectContent>
                </Select>
          );
        },
      }))
    ];
  
    return baseColumns;
  };
  const data = useMemo(() => generateTableData(teacherClasses), [teacherClasses,classes]);
  const columns = useMemo(() => generateColumns(dates), [dates,selectedGroup,classes]);
  const filteredData = useMemo(() => 
    selectedGroup ? data.filter(item => item.group === selectedGroup) : data, 
    [data, selectedGroup,classes]
  );


  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: filteredData,
    columns:columns,
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
        pageSize: 3,
      },
    },
  });
  const headerGroups = useMemo(() => table.getHeaderGroups(), [table,selectedGroup,classes]);

  // Memoize the rows
  const rows = useMemo(() => table.getRowModel().rows, [table,selectedGroup,classes]);
  const t=useTranslations()
  const handleTabClick = (value: string | number) => {
    if (value === 'All') {
      setSelectedGroup(null); // Show all data if "All" is selected
    } else {
      setSelectedGroup(value as string); // Filter data based on the selected group
    }
    table.resetColumnFilters();
  };
  const removeStudent= async (student,classId,attendanceId,selectedEvent) => {
    try {
      if(selectedEvent.paymentType==='monthly'){
        const updatedStudents=selectedEvent.students.map((std)=>std.id===student.id?{...std, sessionsLeft: std.sessionsLeft>0 ? std.sessionsLeft + 1:std.sessionsLeft }:std)
        await removeStudentFromAttendance(student,classId,attendanceId,updatedStudents)
      }else{
        await removeStudentFromAttendance(student,classId,attendanceId,undefined)
        // await addPayment()
      }
  
  
      
      setClasses((prevClasses) => prevClasses.map((cls) => {
        // Check if this is the class we want to update
        if (cls.id === selectedEvent.classId) {
          // Find the attendance record for the selected event
          const attendance = cls.Attendance?.[selectedEvent.attendanceId];
  
            
          // Remove the student from the attendance list
          if (attendance) {
            attendance.attendanceList = attendance.attendanceList.filter((std) => std.id !== student.id);
          }
      
          // Return the updated class with the modified attendanceList
          return {
            ...cls,
            attendanceList: attendance ? attendance.attendanceList : cls.attendanceList
          };
        }
      
        // Return the class as is if it's not the one we want to update
        return cls;
      }));
      setAttendance((prevClasses) => prevClasses.map((std) => std.id === student.id?{...std,status:'absent'}:std))
      
    } catch (error) {
    }
  
  }
  const addStudent= async (student,classId,attendanceId,selectedEvent) => {
    try {
 
      
      if(selectedEvent.paymentType==='monthly'){
        const updatedStudents=selectedEvent.students.map((std)=>std.id===student.id?{...std, sessionsLeft: std.sessionsLeft>0 ? std.sessionsLeft - 1:std.sessionsLeft }:std)
        await addStudentFromAttendance(
          { ...student, status: "present" }, // First argument, student with status
          classId,                           // Second argument, classId
          attendanceId,                       // Third argument, attendanceId
          updatedStudents,                    // Fourth argument, updatedStudents
          {                                   // Fifth argument, attendance object
            id: selectedEvent.attendanceId,
            start: selectedEvent.start,
            end: selectedEvent.end,
            group: selectedEvent.group
          }
        );
      
      setClasses((prevClasses) => {
        // Find the class to update
        const updatedClasses = [...prevClasses];
        const classToUpdate = updatedClasses.find((cls) => cls.id === selectedEvent.classId);
      
        if (classToUpdate) {
          // Find or create the attendance record
          let attendance = classToUpdate.Attendance?.[selectedEvent.attendanceId];
      
          if (!attendance) {
            // Create a new attendance record if it doesn't exist
            attendance = {
              attendanceList: [{ ...student, status: "present" }],
              id: selectedEvent.attendanceId,
              start: selectedEvent.start, 
              end: selectedEvent.end,
              group: selectedEvent.group};
          } else {
            // Add the student to the attendance list if attendance exists
            attendance.attendanceList = [
              ...attendance.attendanceList,
              { ...student, status: "present" }
            ];
          }
      
          // Update the students list for the class
          classToUpdate.students = classToUpdate.students.map((std) =>
            std.id === student?.id
              ? { ...std, sessionsLeft: std.sessionsLeft > 0 ? std.sessionsLeft - 1 : std.sessionsLeft }
              : std
          );
      
          // Update the attendance object in the class
          classToUpdate.Attendance = {
            ...classToUpdate.Attendance,
            [selectedEvent.attendanceId]: attendance,
          };
        }
      
        return updatedClasses;
      });
      setStudents((prev) =>
        prev.map((std) => {
          if (std.id === student.id) {
            return {
              ...std,
              classes: std.classes.map((cls) =>
                cls.id === selectedEvent.classId
                  ? {
                      ...cls,
                      sessionsLeft: cls.sessionsLeft > 0 ? cls.sessionsLeft - 1 : cls.sessionsLeft,
                    }
                  : cls
              ),
            };
          }
          return std; // Return the student unchanged if no match
        })
      );
     
    }else{
      await addStudentFromAttendance({...student,status:"present",isPaid:true},classId,attendanceId,undefined,{  
        id: selectedEvent.attendanceId,
        start: selectedEvent.start,
        end: selectedEvent.end,
        group: selectedEvent.group
      })
      
      setClasses((prevClasses) => {
        // Find the class to update
        const updatedClasses = [...prevClasses];
        const classToUpdate = updatedClasses.find((cls) => cls.id === selectedEvent.classId);
      
        if (classToUpdate) {
          // Find or create the attendance record
          let attendance = classToUpdate.Attendance?.[selectedEvent.attendanceId];
      
          if (!attendance) {
            // Create a new attendance record if it doesn't exist
            attendance = {
              attendanceList: [{ ...student, status: "present",isPaid:true }],
              id: selectedEvent.attendanceId,
              start: selectedEvent.start, 
              end: selectedEvent.end,
              group: selectedEvent.group};
          } else {
            // Add the student to the attendance list if attendance exists
            attendance.attendanceList = [
              ...attendance.attendanceList,
              { ...student, status: "present",isPaid:true }
            ];
          }
      
          classToUpdate.Attendance = {
            ...classToUpdate.Attendance,
            [selectedEvent.attendanceId]: attendance,
          };
        }
      
        return updatedClasses;
      });

      await addPaymentTransaction({paymentDate:new Date(),amount:student.amount},student.id)
    }
    } catch (error) {
    }
  
  }
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Archive Attendance</h1>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <Popover>
            <PopoverTrigger asChild></PopoverTrigger>
            <PopoverContent className="p-0"></PopoverContent>
          </Popover>
        </div>
      </div>
      <Separator className="my-8" />
      <div>
      <Tabs defaultValue={"All"}>
              <div className="flex items-center">
                <TabsList>
                <TabsTrigger   value={"All"} onClick={() =>   handleTabClick('All')}>
                      Tout
                    </TabsTrigger>
                    {teacher.classes!= null &&(teacher.classes.map((group,index) => (
                    <TabsTrigger key={index} value={index} onClick={() =>  handleTabClick(group.group)  }>
                     {group.group}
                    </TabsTrigger>
                  )))}
                </TabsList>
              </div>
              {/*  */}
            </Tabs>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">List</h2>
          {/* <Input
          placeholder="filter"
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm "
        /> */}
          <Button variant="outline" className="flex items-center gap-2 hover:bg-muted/50 transition-colors" onClick={()=>generatePDF({teacher:teacher.name,group:'',subject:'',year:''},filteredData,dates)}>
            <DownloadIcon className="w-5 h-5" />
            Export
          </Button>
        </div>
        <Table>
      <TableHeader>
        {headerGroups.map(headerGroup => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rows.map(row => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map(cell => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
      </div>
      <div className="py-4">
  <div className="flex flex-col space-y-2">
  <div className="text-sm">
      <strong>payment type: </strong>
      {teacher.paymentType}
    </div>
    <div className="text-sm">
      <strong>{t('Amount')}: </strong>
      {teacher.amount}
    </div>
    <div className="text-sm">
      <strong>{t('Reimbursement')}: </strong>
      { teacherClasses.reimbursements?.length ? (
        <ul>
          { teacherClasses.reimbursements.map((item, index) => (
            <li key={index}>{JSON.stringify(item)}</li>
          ))}
        </ul>
      ) : (
        <span>{t('No reimbursement data')}</span>
      )}
    </div>
    <div className="text-sm">
      <strong>{t('Advance')}: </strong>
      {teacher.advancePayment?.length ? (
        <ul>
          {teacher.advancePayment.map((item, index) => (
            <li key={index}>{JSON.stringify(item)}</li>
          ))}
        </ul>
      ) : (
        <span>{t('No advance data')}</span>
      )}
    </div>
  </div>
  </div>
    </div>
  );
};


function CheckIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function DownloadIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function XIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}