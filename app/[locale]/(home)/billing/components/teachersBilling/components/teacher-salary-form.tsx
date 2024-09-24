
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {ResetIcon } from "@radix-ui/react-icons";
import { Input } from "@/components/ui/input";
import { useFieldArray, useForm } from "react-hook-form";
import { teacherPaymentRegistrationSchema } from "@/validators/teacherSalarySchema";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState} from "react";
import { useToast } from "@/components/ui/use-toast";
import CalendarDatePicker from "@/app/[locale]/(home)/students/components/date-picker";
import { ScrollArea} from "@/components/ui/scroll-area";
import ImageUpload from "@/app/[locale]/(home)/students/components/uploadFile";
import Combobox from "@/components/ui/comboBox";
import { LoadingButton } from "@/components/ui/loadingButton";
import { z } from "zod";
import { useData } from "@/context/admin/fetchDataContext";
import { addTeacherSalary, getMonthInfo } from "@/lib/hooks/billing/teacherPayment";
import { uploadFilesAndLinkToCollection } from "@/context/admin/hooks/useUploadFiles";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox"
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addWeeks, differenceInWeeks, endOfMonth, format, startOfMonth } from "date-fns";
import { downloadInvoice } from "./generateInvoice";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Timestamp, updateDoc } from "firebase/firestore";
import ReactToPrint from "react-to-print";

const fieldNames = [
    "teacher",
    "paymentType",
    "date",



];
type FormKeys = "salaryTitle" | "salaryAmount" | "salaryDate" | "typeofTransaction" | "monthOfSalary" | "fromWho"|"status";
 
const applyPayment = (totalAdvancePayment, paymentAmount) => {
  if (totalAdvancePayment > 0) {
    // If payment exceeds totalAdvancePayment
    if (paymentAmount >= totalAdvancePayment) {
      paymentAmount -= totalAdvancePayment; // Reduce paymentAmount by totalAdvancePayment
      totalAdvancePayment = 0; // Set totalAdvancePayment to 0
    } else {
      totalAdvancePayment -= paymentAmount; // Reduce totalAdvancePayment by paymentAmount
      paymentAmount = 0; // Set paymentAmount to 0 as it's fully consumed
    }
  }

  return { totalAdvancePayment, paymentAmount };
};



  interface FileUploadProgress {
    file: File;
    name: string;
    source:any;
  }
  const getGroupsByTeacher = (classes, teacherId) => {
    const today ='2024-09-07'; // Get today's date in 'yyyy-mm-dd' format
  
    return classes
      .filter(cls => {
        if (cls.teacherUID !== teacherId) {
          return false;
        }
  
        if (cls.paymentType === 'monthly') {

       
          return cls.active === true && new Date(cls.nextPaymentDate) < new Date();
        } else if (cls.paymentType === 'session') {
          // For session-based payment, check if any attendance date matches today's date
          return Object.keys(cls.Attendance || {}).some(attendanceDate => attendanceDate === today);
        }
  
        return false;
      })
      .map(cls => {
        // Calculate total amount for students
        let totalAmount = 0;
      
        // If it's session-based, use today's attendance to calculate the total amount
        if (cls.paymentType === 'session') {
          const todayAttendance = cls.Attendance ? cls.Attendance[today] : {};
          const attendanceList = todayAttendance.attendanceList || [];
      
          // Calculate total amount based on attendance
          totalAmount = attendanceList.reduce((acc, std) => {
            // Assuming std.amount refers to the student's payment amount for the session
            const studentAmount = std.amount || 0;
            return acc + studentAmount;
          }, 0);
        } else {
          // For non-session-based (e.g., monthly), calculate total amount based on the number of lessons studied
          totalAmount = cls.students.reduce((acc, std) => {
            const studiedLessons = std.sessionsToStudy - std.sessionsLeft;
            const studentAmount = studiedLessons * (std.amount / cls.numberOfSessions);
            return acc + studentAmount;
          }, 0);
        }
      
        return {
          ...cls,
          groupcode: cls.group,
          amount: cls.amount,
          totalAmount: totalAmount,
          students: cls.students,
          studentsLength:cls.paymentType === 'session' ? cls.Attendance[today].attendanceList.length:cls.students.length,
          todayAttendance: cls.paymentType === 'session' ? cls.Attendance[today] || null : null, // Include today's attendance if session-based
        };
      });
  };
  const getReimbursementByTeacher = (classes, teacherId) => {
    const currentDate = new Date();
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
  
    let totalReimbursement = 0;
  
    // Filter classes by teacherId
    const filteredClasses = classes.filter(c => c.teacherUID === teacherId);
  
    filteredClasses.forEach(c => {
      if (c.reimbursements && Array.isArray(c.reimbursements)) {
        // Filter reimbursements by date
        c.reimbursements.forEach(reimbursement => {
          const reimbursementDate = reimbursement.date.toDate(); // Convert Firestore timestamp to JS Date
          if (reimbursementDate >= start && reimbursementDate <= end) {
            totalReimbursement += reimbursement.amount;
          }
        });
      }
    });
  
    return totalReimbursement;
  };
  const getAdvancedPaymentByTeacher = (teacher) => {
    const currentDate = new Date();
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
  
    let totalAdvance = 0;

      if (teacher.advancePayment&& Array.isArray(teacher.advancePayment)) {
        // Filter reimbursements by date
        teacher.advancePayment.forEach(advance => {
          const advanceDate = new Date(advance.date.toDate()); // Convert Firestore timestamp to JS Date
          if (advanceDate >= start && advanceDate <= end) {
            console.log(advance.amount);
            
            totalAdvance += advance.amount;
          }
        });
      }

      
    return totalAdvance;
  };
  const calculateSalary = (paymentType, teacher, expenses) => {
    switch (paymentType) {
      case "salaryAmount":
        return teacher.amount;

      case "hourly":
        const weeks = differenceInWeeks(new Date(), new Date(teacher.salaryDate.toDate()));
        return weeks * teacher.amount * expenses.length;
      case "percentage":       
        return expenses.reduce(
          (total, expense) => total + (expense.totalAmount) * teacher.amount/100,
          0
        );

      default:
        return 0;
    }
  };
  const ReceiptPrint = React.forwardRef((props, ref) => {
    const { receipt,profile } = props;
  
    if (receipt.teacher) {
      return (
        <Card className="mb-6" ref={ref}>
          <CardHeader>
            <CardTitle>Modèle de Reçu de Salaire</CardTitle>
          </CardHeader>
          <CardContent id="print-section">
            <h3 className="text-lg font-semibold mb-2">Informations de l'Employé :</h3>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Nom de l'Employé :</TableCell>
                  <TableCell>{receipt.teacher.teacherName}</TableCell>
                  <TableCell className="font-medium">Département :</TableCell>
                  <TableCell>{receipt.teacher.year.join(', ')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ID de l'Employé :</TableCell>
                  <TableCell>{receipt.teacher.name}</TableCell>
                  <TableCell className="font-medium">Date d'Émission :</TableCell>
                  <TableCell>{format(receipt.date,"dd-MM-yyyy")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Niveau de l'Employé :</TableCell>
                  <TableCell>{receipt.teacher.year.join(', ')}</TableCell>
                  <TableCell className="font-medium">Mois de Paiement :</TableCell>
                  <TableCell>{receipt.month}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
  
            <h3 className="text-lg font-semibold mt-4 mb-2">Informations de l'Employeur :</h3>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Nom de l'Employeur :</TableCell>
                  <TableCell>{profile.schoolName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Adresse :</TableCell>
                  <TableCell>{profile.schoolAddress}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Informations de Contact :</TableCell>
                  <TableCell>{profile.schoolContact}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
  
            <h3 className="text-lg font-semibold mt-4 mb-2">Gains et Déductions :</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Nombre d'Étudiants</TableHead>
                  <TableHead>Taux</TableHead>
                  <TableHead>Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.expenses.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.groupcode}</TableCell>
                    <TableCell>{item.studentsLength}</TableCell>
                    <TableCell>{receipt.teacher.amount}%</TableCell>
                    <TableCell>DZD{item.totalAmount * receipt.teacher.amount / 100}</TableCell>
                  </TableRow>
                ))}
  
                <TableRow>
                  <TableCell colSpan={3}>Salaire Brut :</TableCell>
                  <TableCell>DZD{receipt.grossSalary}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="font-bold">Les Avances :</TableCell>
                  <TableCell className="font-bold">DZD{receipt?.advancePayment?.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="font-bold">Salaire Net :</TableCell>
                  <TableCell className="font-bold">DZD{receipt.netSalary.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    } else {
      return null;
    }
  });
export default function PaymentForm() {
  const { toast } = useToast();
  const {setTeachersSalary} = useData()
  const {teachers,setAnalytics,classes,setTeachers,setClasses,analytics,profile}= useData()
  const[printBill,setPrintBill]=useState(false)

  const [filesToUpload, setFilesToUpload] = useState<FileUploadProgress[]>([]);
  const t=useTranslations()
  const Typeofpayments = [
    {
      value: "Salary",
      label: t('salary'),
    },
    {
      value: "Other",
      label: t("other"),
    },
    
  ];

  const MonthOfYear = [
    {
      value: "January",
      label: t('january'),
    },
    {
      value: "February",
      label: t('february'),
    },
    {
      value: "March",
      label: t('march'),
    },
    {
      value: "April",
      label: t('april'),
    },
    {
      value: "May",
      label: t('may'),
    },
    {
      value: "June",
      label: "June",
    },
    {
      value: "July",
      label: t('july'),
    },
    {
      value: "August",
      label: t('august'),
    },
    {
      value: "September",
      label: t('september'),
    },
    {
      value: "October",
      label: t('october'),
    },
    {
      value: "November",
      label: t('november'),
    },
    {
      value: "December",
      label: t('december'),
    },
  ];
    
  const Salarystatus =[
    
    {
      value:"paid"  ,
      label: t('paid'),
    },
    {
      value:"notPaid"  ,
      label: t('not-paid'),
    },
  ]
  const [status, setstatus] = useState(false);
const [monthModal,setMonthModal]=useState(false)
const [teacherModal,setTeacherModal]=useState(false)

  const [openTypeofpayment, setOpenTypeofpayment] = useState(false);
  const form = useForm<any>({

    defaultValues:{expenses:[],date:new Date(),month:format(new Date(), 'MMMM')}
  });
  const { reset, formState, setValue, getValues,control,register,watch, } = form;
  const { isSubmitting,} = formState;
  const { fields:expenses, append:appendExpense,remove:removeExpense, } = useFieldArray({
    control: form.control,
    name: "expenses",

  });


  const renderInput = (fieldName:string, field:any) => {
    switch (fieldName) {
      case "date":
        return (
          <CalendarDatePicker
            {...field}
            date={getValues("date")}
            setDate={(selectedValue) => {
              if (selectedValue === undefined) {
                // Handle undefined case if needed
              } else {
                form.setValue(fieldName, selectedValue);
              }
            }}
          />
        );

      case "month": 
      return (
        <Combobox
        {...field}
        open={monthModal}
        setOpen={setMonthModal}
        placeHolder={t('month')}
        options={MonthOfYear}
        value={getValues("month")}
        onSelected={(selectedValue) => {
          form.setValue(fieldName, selectedValue);
        }} 
      />
      );

      case "status":
        return (
          <Combobox
            {...field}
            open={status}
            setOpen={setstatus}
            placeHolder={t("status")}
            options={Salarystatus}
            value={getValues("status")}
            onSelected={(selectedValue) => {
              form.setValue(fieldName, selectedValue);
            }} // Set the value based on the form's current value for the field
          />
        );
        case "teacher":
          return (
            <Combobox
              {...field}
                open={teacherModal}
                setOpen={setTeacherModal}
              placeHolder={t('teacher')}
              options={teachers}
              value={getValues("teacher")?.name}
              onSelected={(selectedValue) => {
                const selectedTeacher = teachers.find(
                    (teacher:any) => teacher.id === selectedValue
                  );
               if(selectedTeacher){
                const result = getGroupsByTeacher(classes, selectedValue);
                console.log("teaacherrrr",result);
            
            
                const reimbursement=getReimbursementByTeacher(classes,selectedValue)
                const advancePayment=getAdvancedPaymentByTeacher(selectedTeacher)
                form.setValue('advancePayment',selectedTeacher.totalAdvancePayment)
                form.setValue('reimbursement',reimbursement)
                form.setValue('expenses',result)
                form.setValue(fieldName, {...selectedTeacher,name:selectedTeacher?.value,id:selectedTeacher?.id,teacherName:selectedTeacher.name})
                const amount=calculateSalary(selectedTeacher?.paymentType,selectedTeacher,result)
                const resultsalary = applyPayment(selectedTeacher.totalAdvancePayment,amount);
                form.setValue("grossSalary",amount)
                form.setValue("netSalary",resultsalary.paymentAmount)
                form.setValue("amount",amount)
 
            }
          
              }} // Set the value based on the form's current value for the field
            />
          );
        
      case "typeofTransaction":
        return (
          <Combobox
            {...field}
            open={openTypeofpayment}
            setOpen={setOpenTypeofpayment}
            placeHolder={t('typeofpayment')}
            options={Typeofpayments}
            value={getValues("typeofTransaction")}
            onSelected={(selectedValue) => {
              form.setValue(fieldName, selectedValue);
            }}
          />
        );
        case "paymentType":
          return(
          
              <Select
              onValueChange={field.onChange}
              value={field.value}
              >
                <SelectTrigger
                  id={`schoolType`}
                  aria-label={`Select School Type`}
                >
                  <SelectValue placeholder={t('select-school-type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Salaire</SelectItem>
                  <SelectItem value="advance">Avance</SelectItem>
                </SelectContent>
              </Select>
 
          )
        case "grossSalary":
            return (<Input {...field} readOnly />);
          case "reimbursement":
                return (<Input {...field} readOnly/>);
                case "advancePayment"|| "netSalary":
                  return (<Input {...field} readOnly/>);
                  case "amount":
                    return (<Input {...field} onChange={event => field.onChange(+event.target.value)}/>)
      default:
        return <Input {...field} />;
    }
  };

  const reactToPrintRef = React.useRef();
  async function onSubmit(data: any) {
    try {
      const month = getMonthInfo(data.date);
  
      // Add Teacher Salary
      const teacherId = await addTeacherSalary({ ...data, documents: [] });
  
      // Upload files and link them to the collection
      const uploaded = await uploadFilesAndLinkToCollection("Billing/payouts/TeachersTransactions", teacherId, filesToUpload);
  
      // Update Teacher's Salary State
      setTeachersSalary((prev: any[]) => [
        {
          ...data,
          id: teacherId,
          teacher: data.teacher,
          documents: [],
          value: teacherId,
          label: teacherId,
        },
        ...prev,
      ]);
  
      // If payment type is 'Salary', handle the salary-specific logic
      if (data.paymentType === 'salary') {
        data.expenses.forEach((exp) => {
          // Update Teacher's classes with the new payment date
          setTeachers((tchList) =>
            tchList.map((tch) =>
              tch.id === data.teacher.id
                ? {
                    ...tch,
                    classes: tch.classes.map((cls) =>
                      cls.id === exp.id
                        ? { ...cls, nextPaymentDate: addWeeks(exp.nextPaymentDate, 3) }
                        : cls
                    ),
                  }
                : tch
            )
          );
  
          // Update the specific class with the new payment date
          setClasses((clsList) =>
            clsList.map((cls) =>
              cls.id === exp.id
                ? { ...cls, nextPaymentDate: addWeeks(exp.nextPaymentDate, 3) }
                : cls
            )
          );
        });
  
        // Update the teacher's total advance payment
        setTeachers((prevTeach) =>
          prevTeach.map((tch) =>
            tch.id === data.teacher.id
              ? { ...tch, totalAdvancePayment: applyPayment(data.totalAdvancePayment-data.amount).paymentAmount }
              : tch
          )
        );
  
        // Print the bill if requested

          reactToPrintRef.current.handlePrint();
     
      } else {
        // If payment type is not 'Salary', handle other payment types
        setTeachers((prevTeachers) =>
          prevTeachers.map((teacher) =>
            teacher.id === data.teacher.id
              ? {
                  ...teacher,
                  advancePayment: [
                    ...(teacher.advancePayment || []),
                    { amount: data.amount, date: data.date },
                  ],
                  totalAdvancePayment: teacher.totalAdvancePayment + data.amount,
                }
              : teacher
          )
        );
  
        // Update Analytics Data
        const updatedAnalytics = { ...analytics };
        const monthIndex = updatedAnalytics.data.findIndex((m: any) => m.month === month.fullName);
  
        if (monthIndex !== -1) {
          updatedAnalytics.data[monthIndex].expenses += data.amount;
        }
  
        setAnalytics((prevState: any) => ({
          ...prevState,
          data: updatedAnalytics.data,
          totalExpenses: prevState.totalExpenses + data.amount,
        }));
  

      }
              // Show success toast
              toast({
                title: t('teacher-salary-added'),
                description: t('teacher-salary-added-successfully'),
              });
        
              // Reset form
              reset({
                paymentType: "",
                expenses: [],
                date: new Date(),
                month: format(new Date(), 'MMMM'),
              });
    } catch (error) {
      console.error("Error processing submission:", error);
      // Handle any errors that might occur
    }
  }
          const componentRef = React.useRef(null);

          const onBeforeGetContentResolve = React.useRef(null);
        
          const [text, setText] = React.useState("old boring text")
        
          React.useEffect(() => {
            if (
              text === "New, Updated Text!" &&
              typeof onBeforeGetContentResolve.current === "function"
            ) {
              onBeforeGetContentResolve.current();
            }
          }, [onBeforeGetContentResolve.current, text]);
        
          const reactToPrintContent = React.useCallback(() => {
            return componentRef.current;
          }, [componentRef.current]);
        
          const reactToPrintTrigger = React.useCallback(() => {
            // NOTE: could just as easily return <SomeComponent />. Do NOT pass an `onClick` prop
            // to the root node of the returned component as it will be overwritten.
        
            // Bad: the `onClick` here will be overwritten by `react-to-print`
            // return <button onClick={() => alert('This will not work')}>Print this out!</button>;
        
            // Good
            return <button>Print using a Functional Component</button>;
          }, []);
        
        
  return (
    <Card className="overflow-hidden" x-chunk="dashboard-05-chunk-4">
            <div>
            <ReactToPrint
        ref={reactToPrintRef}
        content={reactToPrintContent}
        documentTitle="AwesomeFileName"
        removeAfterPrint
      />
      <div style={{display:'none'}}>
        <ReceiptPrint ref={componentRef} receipt={getValues()} profile={profile}/>
        </div>
    </div>
      <CardHeader className="flex flex-row items-start bg-muted/50">
        <div className="grid gap-0.5">
          <CardTitle className="group flex items-center gap-2 text-lg">
            {t('create-teacher-bill')} </CardTitle>
          <CardDescription></CardDescription>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1"
            onClick={() =>      reset({paymentType:"",expenses:[],date:new Date(),month:format(new Date(), 'MMMM')})}
          >
            <ResetIcon className="h-3.5 w-3.5" />
            <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
              {t('reset-details')} </span>
          </Button>
        </div>
      </CardHeader>
      <ScrollArea
        className="overflow-auto pt-6 text-sm"
        style={{ maxHeight: "600px" }}
      >
        <CardContent>
          <Form {...form}>
            <form>
              {fieldNames.map((fieldName, index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={fieldName as FormKeys}
                  render={({ field }) => (
                    <FormItem style={{ marginBottom: 15 }}>
                      <FormLabel>{t(fieldName)}</FormLabel>
                      <FormControl>{renderInput(fieldName, field)}</FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
                  {watch('paymentType')==='salary'&&(

<>
<FormField
            control={control}
            name="expenses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>les classes</FormLabel>

                <Table>
  <TableHeader>
    <TableRow>
      <TableHead>group</TableHead>
      <TableHead>number of student</TableHead>
     <TableHead>Type de salaire</TableHead>
      {getValues("teacher")?.paymentType==='percentage' && (<TableHead>percentage</TableHead>)}
      {getValues("teacher")?.paymentType==='percentage' && (<TableHead>Amount per group</TableHead>)}
    </TableRow>
  </TableHeader>
  <TableBody>

                {expenses.map((option,index) => (
        
        
                    <TableRow key={index}>
                    <TableCell className="font-semibold">
                 
              <Input

                value={option.group}
                readOnly
              />
 
            </TableCell>
            <TableCell>
      
      <Input
       placeholder={t('enter-price')}
       type="number"
       value={option.studentsLength}
      readOnly
      />

    </TableCell>
    <TableCell className="font-semibold">
                 
                 <Input
   
                   value={getValues("teacher")?.paymentType}
                   readOnly
                 />
    
               </TableCell>
            <TableCell>
            {getValues("teacher")?.paymentType==='percentage' && (   
      <Input
       placeholder={t('enter-price')}
       type="number"
       value={getValues("teacher")?.amount}
      readOnly
      />)}

    </TableCell>
    <TableCell>
            {getValues("teacher")?.paymentType==='percentage' && (   
      <Input
       placeholder={t('enter-price')}
       type="number"
       value={option.totalAmount*getValues("teacher")?.amount/100}
      readOnly
      />)}

    </TableCell>
      </TableRow>
    

                ))}
         
         </TableBody>
         <TableFooter>
        {/* <TableRow>
          <TableCell >Total</TableCell>
          <TableCell colSpan={3}>DZD{totalAmount}</TableCell>
        </TableRow> */}
      </TableFooter>
</Table>
                <FormMessage />
              </FormItem>
            )}
          />
<FormField
        
        control={form.control}
        name={"month"}
        render={({ field }) => (
          <FormItem style={{ marginBottom: 15 }}>
            <FormLabel>{t("monthOfSalary")}</FormLabel>
            <FormControl>{renderInput("month", field)}</FormControl>

            <FormMessage />
          </FormItem>
        )}
      />
        <FormField
        
        control={form.control}
        name={"grossSalary" as FormKeys}
        render={({ field }) => (
          <FormItem style={{ marginBottom: 15 }}>
            <FormLabel>Salaire Brute</FormLabel>
            <FormControl>{renderInput("grossSalary", field)}</FormControl>

            <FormMessage />
          </FormItem>
        )}
      />

                  <FormField
        
        control={form.control}
        name={"advancePayment" as FormKeys}
        render={({ field }) => (
          <FormItem style={{ marginBottom: 15 }}>
            <FormLabel>les Avances</FormLabel>
            <FormControl>{renderInput("advancePayment", field)}</FormControl>

            <FormMessage />
          </FormItem>
        )}
      />
                      <FormField
        
        control={form.control}
        name={"netSalary" as FormKeys}
        render={({ field }) => (
          <FormItem style={{ marginBottom: 15 }}>
            <FormLabel>salaire Net</FormLabel>
            <FormControl>{renderInput("netSalary", field)}</FormControl>

            <FormMessage />
          </FormItem>
        )}
      />
</>
                  )}    
                   {watch('paymentType')==='advance'&&(
<>
<FormField
        
        control={form.control}
        name={"month"}
        render={({ field }) => (
          <FormItem style={{ marginBottom: 15 }}>
            <FormLabel>{t("monthOfSalary")}</FormLabel>
            <FormControl>{renderInput("month", field)}</FormControl>

            <FormMessage />
          </FormItem>
        )}
      />
        <FormField
        control={form.control}
        name={"amount" as FormKeys}
        render={({ field }) => (
          <FormItem style={{ marginBottom: 15 }}>
            <FormLabel>Avance</FormLabel>
            <FormControl>{renderInput("amount", field)}</FormControl>

            <FormMessage />
          </FormItem>
        )}
      />
</>
)}   

  
            </form>
          </Form>
          <div className="flex items-center space-x-2 mb-3">
      <Checkbox id="terms" checked={printBill} onClick={()=>setPrintBill(!printBill)}/>
      <label
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
       {t('print-paiment-bill')} 
       </label>
    </div>
          <ImageUpload filesToUpload={filesToUpload} setFilesToUpload={setFilesToUpload}/>

        </CardContent>
      </ScrollArea>
      <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
        <div className="flex gap-2">
          <LoadingButton
            loading={isSubmitting}
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
          >
            {t('submit')} </LoadingButton>
        </div>
      </CardFooter>
    </Card>
  );
}
