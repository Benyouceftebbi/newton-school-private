'use client'

import { Button } from "@/components/ui/button";
import { arrayUnion } from "firebase/firestore";

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
import { addPaymentTransaction } from "@/lib/hooks/billing/student-billing";
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
  "monthlypayment",
  'debt',
  'paymentDate',
  'amount',
  'nextPaymentDate',
];


type Transaction = {
  amount: number;
  paymentDate: Date;
  monthlypayment: number;
  nextPaymentDate: Date | null;
  debt:number
};

type FormKeys =
  | 'amount'
  | 'paymentDate'
  | 'student'
  | 'level'
  | 'field'
  | 'school'
  | 'monthlypayment'
  | 'debt'
  | 'nextPaymentDate'

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
console.log(months);

  return months;
}


const orderedMonths = [
  'Sep', 'Oct', 'Nov', 'Dec',
  'Jan', 'Feb', 'Mar', 'Apr',
  'May', 'Jun', 'Jul','Aug'
];
export default function StudentPaymentForm() {
  const { toast } = useToast();
  const {students,classes,setInvoices,setStudents,setAnalytics,invoices}=useData()
console.log('classes',classes[0]?.groups.amount);



  
  const [status, setstatus] = useState(false);
  const [openTypeofpayment, setOpenTypeofpayment] = useState(false);
  const [studentModal,setStudentModal]=React.useState(false)
  const [paymentPlanModal,setPaymentPlanModal]=React.useState(false)
  const[printBill,setPrintBill]=useState(false)

  
  const [filesToUpload, setFilesToUpload] = useState<FileUploadProgress[]>([]);
  const form = useForm<any>({
    //resolver: zodResolver(studentPaymentSchema),
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
  console.log('studentValue',studentValue);
  

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
        case "nextPaymentDate":
          return (
            <CalendarDatePicker
              {...field}
              date={getValues("nextPaymentDate")}
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
          const classss = selectedStudent.classesUIDs.flatMap((clsUID) => {
            return classes
              .filter((clss) => clsUID.id === clss.id)
              .flatMap((cls) => cls.groups.filter((grp) => grp.group === clsUID.group));
          });
          form.setValue('filtredclasses',classss)
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

        case "amount":

            return (<Input {...field}  onChange={event => field.onChange(+event.target.value)}/>)

       
        

        case "paymentPlan":
          return (
            <Combobox
            {...field}
            open={paymentPlanModal}
            setOpen={setPaymentPlanModal}
            placeHolder={t('payment-plan')}
            options={paymentPlans}
            value={getValues("paymentPlan")?.name}
            onSelected={(selectedValue) => {
              console.log("value",selectedValue);
              
              const paymentPlan = paymentPlans?.find(
                (plan:any) => plan.value === selectedValue
              );
              console.log("payment",paymentPlans);
              if (paymentPlan) {
                form.setValue(fieldName, paymentPlan)
                form.setValue("amount",paymentPlan.price)
                
                const newDate = parsePaymentPlan(paymentPlan.period, getValues("student").nextPaymentDate);
                if(newDate){
                  form.setValue("nextPaymentDate",newDate)

                }
              }
            }}
          />

          )
          case "nextPaymentDate":
            return (<Input {...field} value={field.value?.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} readOnly/>)
          
                      default:
        return <Input {...field} readOnly />;
    }
  };
  function generateBillIfNeeded(months: any, data: StudentPaymentFormValues) {
    if (printBill) {
      console.log(data.paymentDate);
      
      const statusArray: string[] = orderedMonths.map((month) => {
        const monthData = months[month];
  
        return monthData?.status === 'Paid' ? t('paid') : ' ';
      });
  
      generateBill(
        {
          student: data.student.student,
          level: data.level,
          amount: data.amount,
          monthlypayment:data.monthlypayment,
          paymentDate:format(data.paymentDate, 'dd/MM/yyyy'),
        
        },
        "qwdwqdqwd",
        [
          t('student'),
          t('level'),
          t('amount'),
          t('amount-left-to-pay'),
          t('paymentDate'),
          t('status'),
        ],
        {
          amount: t("Amount"),
          from: t('From:'),
          shippingAddress: t('shipping-address'),
          billedTo: t('billed-to'),
          subtotal: t('Subtotal:'),
          totalTax: t('total-tax-0'),
          totalAmount: t('total-amount-3'),
          invoice: t('invoice'),
        },
        statusArray
      );
    }
  }
  
  
  async function onSubmit(data: any) {
    console.log('data.id',data.id)
    console.log('data.amount',data.amount);
    console.log('data.monthlypayment',data.monthlypayment);

    console.log('+',data.monthlypayment-data.amount);
    console.log('zakmao', data.amount+data.monthlypayment);
    
    const transactionData: Transaction = {
      amount: data.amount,
      paymentDate: data.paymentDate,
      debt: data.debt - data.amount,
      monthlypayment: data.monthlypayment,
      nextPaymentDate: data.nextPaymentDate,
      
    };
  
    // Create the `transaction` array and add the transaction data to it
    const transactionArray = [transactionData];
  
    // Save the data with the `transaction` array
  await addPaymentTransaction(transactionData,data.id);
  await updateStudentFinance(transactionData.paymentDate,transactionData.nextPaymentDate,transactionData.debt,data.id);

    // Handle file uploads and update the UI accordingly
   /* const uploaded = await uploadFilesAndLinkToCollection(
      "Billing/payments/Invoices",
      transactionId,
      filesToUpload
    );
  
    
  */
    // Generate the bill if needed
  
    setInvoices((prev: any) => [
      {
        ...data,
        transactionArray
      },
      ...prev,
    ]);
    toast({
      title: t('changes-applied-0'),
      description: t('changes-applied-successfully'),
    });
    reset();



    const billHtml = `
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          width: 21cm;
          height: 29.7cm;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .bill-container {
          padding: 10px;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
      
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 48px;
        }
        .logo-container {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .logo-container img {
          border-radius: 50%;
          width: 120px;
          height: 120px;
          object-fit: cover;
        }
        h2 {
          font-size: 48px;
          font-weight: 700;
        }
        .bill-item {
          margin-bottom: 32px;
          font-size: 36px;
        }
        .bill-item label {
          font-weight: bold;
        }
        .total {
          font-size: 60px;
          font-weight: 700;
        }
        .footer {
          margin-top: 64px;
          text-align: center;
          font-size: 36px;
          color: #6c757d;
        }
      </style>
    </head>
    <body>
      <div class="bill-container">
        <div class="header">
          <div class="logo-container">
            <img src="/placeholder.svg" alt="School Logo" />
            <h2>School Name</h2>
          </div>
          <div style="font-size: 36px; color: #6c757d;"></div>
        </div>
        <div style="display: grid; gap: 24px;">
          <div class="bill-item">
            <label>Nom:</label>
            <span>${data.name}</span>
          </div>
          <div class="bill-item">
          <label>Montant mensuel:</label>
          <span>${data.monthlypayment}</span>
        </div>
         
          <div class="bill-item">
            <label>Date:</label>
            <span>${format(new Date(), "dd-MM-yyyy")}</span>
            </div>
        </div>
        <hr style="margin: 48px 0;" />

        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span class="total">Total:</span>
          <span class="total">DZD ${data.amount}</span>
        </div>
        <div class="bill-item">
        <label>Prochain paiement:</label>
        <span>${format(data.nextPaymentDate,"dd-mm-yyyy")}</span>
      </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
        <span class="total">Debt:</span>
        <span class="total">DZD ${data.debt}</span>
      </div>
        <div class="footer">
          Merci!
        </div>
      </div>
    </body>
    </html>
    `;

  const printWindow = window.open('', '_blank');

  if (printWindow) {
    // Write the HTML to the new tab
    printWindow.document.open();
    printWindow.document.write(billHtml);
    printWindow.document.close();

    // Wait for the document to be fully written
    printWindow.onload = function() {
      printWindow.focus(); // Focus on the new tab
      printWindow.print(); // Trigger print dialog
    };
  }
  }
  

  const handleChangeExpense = (index:number, newPrice:number) => {
    const newPrices = [...getValues('expenses')]; // Get the current prices array
    newPrices[index].amount = newPrice; // Update the price at the specified index
    setValue('expenses', newPrices); // Set the updated prices array in the form
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
      <TableHead>Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>

                {filtredclasses.map((option,index) => (
        
        
                    <TableRow key={index}>
                    <TableCell className="font-semibold">
                 
              <Input

                defaultValue={`${option.day},${option.start}-${option.end}`}
                readOnly
              />
 
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
               placeholder={t('enter-price')}
               type="number"
               value={option.amount}
              readOnly
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