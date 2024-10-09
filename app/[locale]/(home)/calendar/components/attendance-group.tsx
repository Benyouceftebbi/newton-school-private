"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input";
import { useData } from "@/context/admin/fetchDataContext";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { addStudentFromAttendance, removeStudentFromAttendance } from "@/lib/hooks/calendar";
import React from "react";
import { arrayRemove, doc, updateDoc } from "firebase/firestore";
import { addPaymentTransaction } from "@/lib/hooks/billing/student-billing";
import { addPayment } from "@/lib/hooks/billing/otherPayments";
import { format } from "date-fns";
import { db } from "@/firebase/firebase-config";
import generatePDF from './teacherReview'



interface DailyAttandenceDataTableProps {
  selectedEvent?: any | null;
  selectedClasss?:any
}


export const DailyAttandenceDataTable: React.FC<DailyAttandenceDataTableProps> = ({ selectedEvent}) => {
 const t =useTranslations()
const {students,classes,setClasses,setStudents}=useData()
const [attendance, setAttendance] = useState(() => {
  const updatedAttendanceList = [...selectedEvent.attendanceList];
  if(selectedEvent.paymentType==='monthly'){
    selectedEvent.students.forEach(student => {
      const isStudentInAttendance = updatedAttendanceList.some(attendanceEntry => attendanceEntry.id === student.id);

      if (!isStudentInAttendance) {
        if (student.addedAt && new Date(student.addedAt.toDate()) < new Date(selectedEvent.start)) {
          updatedAttendanceList.push({
            id: student.id,
            name: student.name,
            group: selectedEvent.group,  // Assuming group is available in selectedEvent
            status: "absent",
            index: student.index,  // Add the new index (length + 1)
          });
        } 
        
      }
    });
  }else{
    selectedEvent.students.forEach(student => {
      const isStudentInAttendance = updatedAttendanceList.some(attendanceEntry => attendanceEntry.id === student.id);
  
      // If the student is not in attendance list, add them with status "absent"
      if (!isStudentInAttendance) {
        if (student.addedAt && new Date(student.addedAt.toDate()) < new Date(selectedEvent.start)) {
        updatedAttendanceList.push({
          id: student.id,
          name: student.name,
          group: selectedEvent.group,  // Assuming group is available in selectedEvent
          status: "absent",
          isPaid:false,
          amount:student.amount,
          index: student.index,  // Add the new index (length + 1)
        });
      }
      }
    });
  }
  // Loop through each student in selectedEvent.students


  return updatedAttendanceList;
});




const removeStudent= async (student,classId,attendanceId) => {
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
const addStudent= async (student,classId,attendanceId) => {
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
    setAttendance((prevClasses) => prevClasses.map((std) => std.id === student.id?{...std,status:'present'}:std))
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
    setAttendance((prevClasses) => prevClasses.map((std) => std.id === student.id?{...std,status:'present',isPaid:true}:std))
    await addPaymentTransaction({paymentDate:new Date(),amount:student.amount},student.id)
  }
  } catch (error) {
  }

}
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "index",
      header: () => <div>Index</div>,
      cell: ({ row }) => <div className="lowercase hidden sm:table-cell">{row.getValue("index")}</div>,
    },
    {
      accessorKey: "name",
      header: () => <div>Student Name</div>,
      cell: ({ row }) => (
        <div className="capitalize">
          <div className="font-medium">{row.getValue("name")}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: () => <div>Status</div>,
      cell: ({ row }) => <div>{getStatusIcon(row.getValue("status"))}</div>,
    },
    ...(selectedEvent.paymentType === 'session' 
      ? [{
          accessorKey: "isPaid",
          header: () => <div>Paye</div>,
          cell: ({ row }) => <div>{row.getValue("isPaid") ? "Paye" : "Non Paye"}</div>,
        }]
      : []
    ),
    {
      id: "remove",
      enableHiding: false,
      cell: ({ row }) => {
        const student = row.original
        return (
          <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="link" className={row.original.status==='present'?"text-red-500":"text-green-500"}>{row.original.status==='present'?"Remove":"Add"}</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className={row.original.status==='present'?buttonVariants({ variant: "destructive" }):buttonVariants({ variant: "default"})} onClick={()=>row.original.status==='present'?removeStudent(student,selectedEvent.classId,selectedEvent.attendanceId):addStudent(student,selectedEvent.classId,selectedEvent.attendanceId)}>{row.original.status==='present'?"Remove":"Add"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        );
      },
    },

  ];
  const getStatusIcon = (status) => {
    if (status === "present") {
      return <CheckIcon className="ml-5 w-5 h-5 text-green-500" />;
    } else if (status === "absent") {
      return <XIcon className="ml-5 w-5 h-5 text-red-500" />;
    } else {
      return null; // Handle other cases if necessary
    }
  };
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const table = useReactTable({
    data:attendance,
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
  const removeExtraClass = async (selectedEvent: any) => {
    try {
      // Reference the document in Firestore
      const classDoc = doc(db, "Groups", selectedEvent.classId);
  
      // Prepare the object to remove
      const classToRemove = {
        start: selectedEvent.startClass,
        end: selectedEvent.endClass,
        room: selectedEvent.room,
        startTime: selectedEvent.startTime,
        endTime: selectedEvent.endTime,
        day: format(new Date(selectedEvent.start), 'EEEE'),
        isPaid:selectedEvent.isPaid
      };
  
      // Update the Firestore document, removing the specified class
      await updateDoc(classDoc, {
        extraClasses: arrayRemove(classToRemove)
      });
      setClasses((prev) => 
        prev.map(cls => 
          cls.id === selectedEvent.classId
            ? {
                ...cls,
                extraClasses: cls.extraClasses.filter(cs => cs.startTime !== selectedEvent.startTime)
              }
            : cls
        )
      );
      console.log('Class removed successfully');
    } catch (error) {
      console.error('Error removing class:', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{selectedEvent.teacher}</h1>
            <p className="text-muted-foreground">{selectedEvent.year}</p>
            <p className="text-muted-foreground">{selectedEvent.subject}</p>
          </div>
        </div>
              <div>
                
              </div>
        <Button variant="outline" className="ml-2"  
        
        onClick={() => generatePDF(selectedEvent, attendance)}>
           {t('export')}
          </Button> 
        <div className="text-muted-foreground">
        {selectedEvent.extra && (<Button variant="destructive" className="ml-2" onClick={() => removeExtraClass(selectedEvent)}>Retirer la classe</Button>)} 
        </div>
      </div>

      <div className="bg-card p-4 rounded-lg shadow-md transition-shadow hover:shadow-lg">
        <Separator className="my-8" />
        <div className="overflow-auto" style={{ maxHeight: '400px' }}>
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
        </div>
      </div>
    </div>
  );
};

function CalendarDaysIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M8 4V3h2v1h4V3h2v1h5v18H3V4h5zM7 8h10v2H7V8zm0 4h10v2H7v-2zm0 4h10v2H7v-2z" />
    </svg>
  );
}


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

export default DailyAttandenceDataTable;