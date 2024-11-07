

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { useForm } from "react-hook-form";
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
import { uploadFilesAndLinkToCollection } from "@/context/admin/hooks/useUploadFiles";
import { getMonthInfo } from "@/lib/hooks/billing/teacherPayment";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox"
import { downloadInvoice, generateBill } from "@/app/[locale]/(home)/billing/components/studentPayment/components/generateInvoice"
import { format } from "date-fns";
const fieldNames: string[] = [
  'student',
  'parent',
  'level',
  'class',
  "amountLeftToPay",
  'paymentPlan',
  'paymentAmount',
  'nextPaymentDate',
  'paymentTitle',
  'paymentDate',
  'fromWho',
  'typeofTransaction',
  'status',
  'description',

];


type FormKeys =
  | 'paymentTitle'
  | 'paymentAmount'
  | 'paymentDate'
  | 'typeofTransaction'
  | 'fromWho'
  | 'student'
  |'description'
  | 'parent'
  | 'level'
  | 'class'
  | 'paymentPlan'
  |  "amountLeftToPay"
  |  'nextPaymentDate'
  | 'status';

type StudentPaymentFormValues = z.infer<typeof studentPaymentSchema>;
function addMonthsToDate(date: Date, monthsToAdd: number): Date {
  const newDate = new Date(date.getTime()); // Create a copy of the original date
  newDate.setMonth(newDate.getMonth() + monthsToAdd); // Add months to the date
  return newDate;
}

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
  'Sept24', 'Oct24', 'Nov24', 'Dec24',
  'Jan25', 'Feb25', 'Mar25', 'Apr25',
  'May25', 'Jun25', 'Jul25','Aug25'
];
export default function StudentPaymentForm() {
  const { toast } = useToast();
  const {students,levels,setInvoices,setStudents,setAnalytics}=useData()
  const [status, setstatus] = useState(false);
  const [openTypeofpayment, setOpenTypeofpayment] = useState(false);
  const [studentModal,setStudentModal]=React.useState(false)
  const [paymentPlanModal,setPaymentPlanModal]=React.useState(false)
  const[printBill,setPrintBill]=useState(false)

  const [filesToUpload, setFilesToUpload] = useState<FileUploadProgress[]>([]);
  const form = useForm<StudentPaymentFormValues>({
    resolver: zodResolver(studentPaymentSchema),
  });
  const { reset, formState, setValue, getValues,watch } = form;
  const { isSubmitting } = formState;
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
  const watchlevel=watch('level')
const paymentPlans = React.useMemo(() => {
  const studentValue = form.getValues("level");
  
  if (studentValue) {
    const selectedLevel = levels.find((level:any) => level.level === studentValue);

    if (selectedLevel) {      
      return selectedLevel.prices.map((price:any)=>({...price,label:price.name,value:price.name}));
    }
  }
  return [];
}, [form,levels,watchlevel]);
const onSelected=(selectedStudent:any)=>{
  form.setValue("class",selectedStudent.class)
  form.setValue("parent",{name:selectedStudent.parentFullName,id:selectedStudent.parentId})
  form.setValue("level",selectedStudent.level)
  form.setValue("amountLeftToPay",selectedStudent.amountLeftToPay)
}
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
                const selectedStudent = students.find((student:any) => student.value === selectedValue);
          
                
                if (selectedStudent) {
                  const { value, label, ...rest } = selectedStudent; 
                  const updatedStudent:any = { ...rest };
                  onSelected(updatedStudent); 
                  form.setValue(fieldName, {value:selectedStudent.value,label:selectedStudent.label,id:selectedStudent.id,student:selectedStudent.student,nextPaymentDate:selectedStudent.nextPaymentDate}); 
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
      case "typeofTransaction":
        return (
          <Combobox
            {...field}
            open={openTypeofpayment}
            setOpen={setOpenTypeofpayment}
            placeHolder={t("typeofTransaction")}
            options={typeofTransaction}
            value={getValues("typeofTransaction")}
            onSelected={(selectedValue) => {
 
              form.setValue(fieldName, selectedValue);
            }}
          />
        );
        
        case "paymentAmount":
            return (<Input {...field} onChange={event => field.onChange(+event.target.value)}/>)

        case "parent" :
          return (<Input {...field}  value={getValues("parent")?.name} readOnly/>)
          
        case "level" :
          return (<Input {...field}  value={getValues("level")} readOnly/>)

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
                form.setValue("paymentAmount",paymentPlan.price)
                
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
            case "class":
              return <Input {...field}  value={getValues("class")}/>;
                      default:
        return <Input {...field} />;
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
          parent: data.parent.name,
          paymentAmount: data.paymentAmount,
          amountLeftToPay:data.amountLeftToPay,
          paymentDate:format(data.paymentDate, 'dd/MM/yyyy'),
          status: t(data.status),
          fromWho: data.fromWho,
        },
        "qwdwqdqwd",
        [
          t('student'),
          t('level'),
          t('parent'),
          t('amount'),
          t('amount-left-to-pay'),
          t('paymentDate'),
          t('status'),
          t('fromWho'),
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
    async function onSubmit(data: StudentPaymentFormValues) {
      const monthAbbreviations = getMonthAbbreviationsInRange(
        getValues("student").nextPaymentDate,
        data.nextPaymentDate
      );
      const month = getMonthInfo(data.paymentDate);
    
      let months: Record<string, MonthData>;
      let billGenerated = false;
      const transactionId = await addPaymentTransaction(
        { ...data, documents: [] },
        monthAbbreviations
      );
      const uploaded = await uploadFilesAndLinkToCollection(
        "Billing/payments/Invoices",
        transactionId,
        filesToUpload
      );
      setInvoices((prev: StudentPaymentFormValues[]) => [
        {
          ...data,
          id: transactionId,
          invoice: transactionId,
          value: transactionId,
          label: transactionId,
          documents: uploaded,
        },
        ...prev,
      ]);
    
      setStudents((prevStudents: any) => {
        const updatedStudents = prevStudents.map((student: any) => {
          if (student.id === data.student.id) {
            const updatedStudent = {
              ...student,
              nextPaymentDate: data.nextPaymentDate,
              amountLeftToPay: data.amountLeftToPay - data.paymentAmount,
              monthly_payments: { ...student.monthly_payments }, // Ensure a new object is created for immutability
            };
            
            // Update status for each month
            monthAbbreviations.forEach((month) => {
              updatedStudent.monthly_payments[month].status = 'Paid';
            });
    
            console.log("Updated student:", updatedStudent);
            if (!billGenerated) {
              generateBillIfNeeded(updatedStudent.monthly_payments, data);
              billGenerated = true; // Update variable
            }
            return updatedStudent;
          }
          return student;
        });  
        return updatedStudents;
      });
      setAnalytics((prevState: any) => ({
        data: {
          ...prevState.data,
          [month.abbreviation]: {
            ...prevState.data[month.abbreviation],
            income: prevState.data[month.abbreviation].income + data.paymentAmount,
          },
        },
        totalIncome: prevState.totalIncome + data.paymentAmount,
      }));

    toast({
      title: t('changes-applied-0'),
      description: t('changes-applied-successfully'),
    });
  console.log(data);
            reset(); 
  }

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