'use client'

import { Button } from "@/components/ui/button";
import { arrayUnion, getDoc, updateDoc } from "firebase/firestore";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from "@/components/ui/table"
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
import {useFieldArray, useForm } from "react-hook-form";
import { studentPaymentSchema } from "@/validators/studentPaymentSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState} from "react";
import { useToast } from "@/components/ui/use-toast";
import CalendarDatePicker from "@/app/[locale]/(home)/students/components/date-picker";
import { ScrollArea} from "@/components/ui/scroll-area";
import ImageUpload from "@/app/[locale]/(home)/students/components/uploadFile";
import Combobox from "@/components/ui/comboBox";
import { LoadingButton } from "@/components/ui/loadingButton";
import { date, z } from "zod";
import { useData } from "@/context/admin/fetchDataContext";
import { updateSessionLeft } from "@/lib/hooks/billing/student-billing";
import {updateStudentFinance}  from '@/lib/hooks/students';
import { uploadFilesAndLinkToCollection } from "@/context/admin/hooks/useUploadFiles";
import { getMonthInfo } from "@/lib/hooks/billing/teacherPayment";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox"
import { downloadInvoice, generateBill } from "@/app/[locale]/(home)/billing/components/studentPayment/components/generateInvoice"
import { format } from "date-fns";
import { PlusCircle } from "lucide-react";




const fieldNames: string[] = [
  'student',
  'level',
  'field',
  'school',

  'paymentDate',

];


type Transaction = {
  amount: number;
  subject: string;
  group : string;
  debt: number;
  paymentDate: Date;
  monthlypayment: number;
  nextPaymentDate: Date;
};

type FormKeys =
  | 'paymentDate'
  | 'student'
  | 'level'
  | 'field'
  | 'school'
  | 'monthlypayment'


type StudentPaymentFormValues = z.infer<any>;
function addMonthsToDate(date: Date, monthsToAdd: number): Date {
  const newDate = new Date(date.getTime()); // Create a copy of the original date
  newDate.setMonth(newDate.getMonth() + monthsToAdd); // Add months to the date
  return newDate;
}

const currentDate = new Date();
function parsePaymentPlan(paymentPlan: string, startDate: Date): Date | null {
  const match = paymentPlan.match(/(\d+)\s+months?/i); // Match the number of months in the string
  if (match) {
    const months = parseInt(match[1]); // Extract and parse the number of months
    return addMonthsToDate(startDate, months); // Add months to the startDate and return the new date
  }
  return null; // Return null if the paymentPlan string does not match the expected format
}

interface FileUploadProgress {
  file: File;
  name: string;
  source:any;
}
type MonthData = {
  status: string;
  month: string;
};


function getMonthAbbreviationsInRange(startDate:Date, endDate:Date) {
  const months = [];
  const dateFormat:any = { month: 'short', year: '2-digit' };
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
      const monthYear = currentDate.toLocaleDateString('en-GB', dateFormat);
      const [monthAbbreviation, year] = monthYear.split(' ');
      const monthYearAbbreviation = `${monthAbbreviation}${year}`;
      months.push(monthYearAbbreviation);
      currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Remove the last month
  if (months.length > 0) {
      months.pop();
  }


  return months;
}



export default function StudentPaymentForm() {
  const { toast } = useToast();
  const {students,classes,setInvoices,setStudents,setAnalytics,invoices,setClasses,profile}=useData()




  
  const [status, setstatus] = useState(false);
  const [openTypeofpayment, setOpenTypeofpayment] = useState(false);
  const [studentModal,setStudentModal]=React.useState(false)
  const [paymentPlanModal,setPaymentPlanModal]=React.useState(false)
  const[printBill,setPrintBill]=useState(false)

  
  const [filesToUpload, setFilesToUpload] = useState<FileUploadProgress[]>([]);
  const form = useForm<any>({
defaultValues:{
  paymentDate:new Date()
}
  });
  const { reset, formState, setValue, getValues,watch,control,register } = form;
  const { isSubmitting } = formState;
  const { fields:filtredclasses, append:appendExpense,remove:removeExpense, } = useFieldArray({
    control: form.control,
    name: "filtredclasses",

  });
const t=useTranslations()
  const typeofTransaction = [
    {
      value: "CreditCard",
      label: t('credit-card'),
    },
    {
    value: "Cash",
    label: t('cash'),
      },
   
  ];
  
  const studentPaymentStatus =[
    
    {
      value:"paid"  ,
      label: t('paid'),
    },
    {
      value:"notPaid"  ,
      label: t('not-paid'),
    },
  ]



const watchStudent = watch('student');

const levelAndClassOptions = React.useMemo(() => {
  const selectedStudent = students.find((student: any) => student.value === watchStudent?.value);
  
  
  if (selectedStudent) {
    return {
      year: selectedStudent.year,
      field: selectedStudent.field,
      school: selectedStudent.school,

    };
  }
  
  return { year: '', field: '' ,school:''};
}, [watchStudent, students]);



  
  

const watchlevel=watch('year')
const paymentPlans = React.useMemo(() => {
const studentValue = form.getValues("year");

  

}, [form,classes,watchlevel]);
const onSelected = (selectedStudent: any) => {
  form.setValue("class", selectedStudent.class);
  form.setValue("level", selectedStudent.level);
  form.setValue("monthlypayment", selectedStudent.monthlypayment);
  form.setValue("debt",selectedStudent.debt);
  form.setValue("year", selectedStudent.year);
  form.setValue("field", selectedStudent.field);
  form.setValue("school", selectedStudent.school);
  
  form.setValue("student", {
    value: selectedStudent.name,
    label: selectedStudent.name,
    id: selectedStudent.id, // Ensure this is set
    student: selectedStudent.student,
    nextPaymentDate: selectedStudent.nextPaymentDate,
  });
  form.setValue("name",selectedStudent.student)
  form.setValue("id",selectedStudent.id);
  const studentClassesUIDs = selectedStudent.classesUIDs || [];
  const selectedClasses = classes.filter((classItem: any) => studentClassesUIDs.includes(classItem.id));
  form.setValue("classes", selectedClasses);
};








  const renderInput = (fieldName:string, field:any) => {
    switch (fieldName) {
      case "paymentDate":
        return (
          <CalendarDatePicker
            {...field}
            date={getValues("paymentDate")}
            setDate={(selectedValue) => {
              if (selectedValue === undefined) {
                // Handle undefined case if needed
              } else {
                form.setValue(fieldName, selectedValue);
              }
            }}
          />
        );
       
          case "student":
            return (
              <Combobox
      {...field}
      open={studentModal}
      setOpen={setStudentModal}
      placeHolder={t('student')}
      options={students}
      value={getValues("student")?.student}
      onSelected={(selectedValue) => {
        const selectedStudent = students.find((student: any) => student.value === selectedValue);
        console.log("dwqdqwdwq",selectedStudent,selectedValue,students);
        
        if (selectedStudent) {
          const { value, label, ...rest } = selectedStudent;
          const updatedStudent: any = { ...rest };
          onSelected(updatedStudent); // Added to handle the selected student
          form.setValue(fieldName, {
            value: selectedStudent.name,
            label: selectedStudent.name,
            id: selectedStudent.id,
            student: selectedStudent.student,
            nextPaymentDate: selectedStudent.nextPaymentDate,


          });
   
          const classss =selectedStudent.classes
          .map((clsUID) => {
            // Find the corresponding class in the `classes` array
            return {
                ...clsUID,
              };
           
          })
          .filter((clsUID) => clsUID !== undefined); // Filter out undefined values
          form.setValue('filtredclasses',classss)
          form.setValue('initialClasses',classss)
  


          
        }
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
            options={studentPaymentStatus}
            value={getValues("status")}
            onSelected={(selectedValue) => {
              form.setValue(fieldName, selectedValue);
            }} // Set the value based on the form's current value for the field
          />
        );
        

   
          case "level":
            return <Input {...field} value={levelAndClassOptions.year} readOnly  />;
          
          case "field":
            return <Input {...field} value={levelAndClassOptions.field} readOnly />;


            case "classes":
              return (
                <Input 
                  {...field} 
                  value={classes.map((classItem: any) => `${classItem.subject} (${classItem.teacherName})`).join(', ')} 
                  readOnly 
                />
              );
            


            
        
         case "school":
          return <Input {...field} value={levelAndClassOptions.school} readOnly />;

        
       
        

        
        
         
                      default:
        return <Input {...field} readOnly />;
    }
  };

    
  async function onSubmit(data: any) {
    try {
      // Iterate over each filtered class and process the payment
      for (const item of data.filtredclasses) {
        // Prepare the transaction data
        const updatedStudents = await updateSessionLeft(item.id, data.student, item);
  
        setClasses((prev) =>
          prev.map((cls) =>
            cls.id === item.id ? { ...cls, students: updatedStudents } : cls
          )
        );
  
        setStudents((prevStudents: any[]) =>
          prevStudents.map((std: { id: any; classes: any }) =>
            std.id === data.student.id
              ? {
                  ...std,
                  classes: std.classes.map((cls) =>
                    cls.id === item.id
                      ? {
                          ...cls,
                          sessionsLeft: item.sessionsLeft,
                          sessionsToStudy: item.sessionsToStudy,
                        }
                      : cls
                  ),
                }
              : std
          )
        );
      }
  
      // Notify the user of success
      toast({
        title: t('changes-applied-0'),
        description: t('changes-applied-successfully'),
      });
  
      // Reset the form
      reset();
  
    } catch (error) {
      console.error('Error processing payments: ', error);
      // Handle the error if needed
    }
  };

  return (
    <Card className="overflow-hidden" x-chunk="dashboard-05-chunk-4">
    <CardHeader className="flex flex-row items-start bg-muted/50">
      <div className="grid gap-0.5">
        <CardTitle className="group flex items-center gap-2 text-lg">
          {t('create-payment')} </CardTitle>
        <CardDescription></CardDescription>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1"
          onClick={() => reset()}
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
        <Form {...form}
        >

          
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

  
  <FormField
            control={control}
            name="filtredclasses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('payment-methods')}</FormLabel>
                <FormDescription>{t('add-how-parents-are-going-to-pay')}</FormDescription>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Group</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Sessions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
  
                {filtredclasses.map((option,index) => (
        
        
                    <TableRow key={index}>
                    <TableCell className="font-semibold">
                 
                    <Input defaultValue={option.group} readOnly />

  
            </TableCell>
                                <TableCell>
                        
                        <Input
                        placeholder={t('enter-price')}
                        value={option.subject}
                        readOnly
                        />
  
                        </TableCell>
                                <TableCell>
                        
            <Input
      placeholder={t('enter-sessions-left')}
      value={watch(`filtredclasses.${index}.sessionsLeft`)}

      onChange={(event) => {
        const newSessionsLeft = +event.target.value || 0;
        const initialSessions=watch(`initialClasses.${index}.sessionsLeft`)
        const initialSessionsToStudy = watch(`initialClasses.${index}.sessionsToStudy`)
        // Updating the correct student within the selected class
        form.setValue(`filtredclasses.${index}.sessionsLeft`, newSessionsLeft);
        form.setValue(`filtredclasses.${index}.sessionsToStudy`, initialSessionsToStudy - (newSessionsLeft - initialSessions) );
        
  
  
        
  
        // Calling field.onChange with updated classes array
      }
    }
    />
  
                                </TableCell>
                                <TableCell>
  
  
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
