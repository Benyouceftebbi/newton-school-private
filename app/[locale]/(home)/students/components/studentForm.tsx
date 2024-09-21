"use client"
import React, {  useState, useRef, useEffect, useMemo} from 'react';
import { Timestamp } from 'firebase/firestore';
import {useUser} from '@/lib/auth'
import { z } from 'zod';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import {
  Step,
  Stepper,
  useStepper,
  type StepItem,
} from "@/components/stepper"
import { Button } from "@/components/ui/button"
import {Camera} from "react-camera-pro";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PlusCircle, ScanIcon, Upload } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Student, StudentSchema } from '@/validators/auth';
import { useFieldArray, useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import CalendarDatePicker from './date-picker';
import { Separator } from '@/components/ui/separator';
import QRCode from 'qrcode'
import { LoadingButton } from '@/components/ui/loadingButton';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { UseFormReturn } from 'react-hook-form';
import { useData } from '@/context/admin/fetchDataContext';
import QrScanner from "qr-scanner";
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
import { useTranslations } from 'next-intl';
import { addStudent } from '@/lib/hooks/students';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card,CardContent,CardHeader, CardTitle, } from '@/components/ui/card';
import { addDays, differenceInDays, endOfDay, format, getDay, isAfter, isBefore, startOfDay } from 'date-fns';
interface FooterProps {
  formData: Student;
  form: UseFormReturn<any>; // Use the specific form type if available
  isSubmitting: boolean;
  reset: UseFormReturn<any>['reset']; // Adding reset function from useForm
}

const currentDate = new Date();

const subjects =['متوسط','علوم تجريبية', 'تقني رياضي', 'رياضيات', 'تسيير واقتصاد ', 'لغات اجنبية ', 'اداب وفلسفة']
const classess = [
  "تحضيري",
  "رياضيات",
  "علوم",
  "فيزياء",
  "فلسفة",
  "العربية",
  "الإنجليزية",
  "الفرنسية",
  "اسبانية",
  "المانية",
  "ايطالية",
  "محاسبة",
  "هندسة مدنية",
  "هندسة ميكانيكية",
  "هندسة الطرائق",
  "الهندسة الكهربائية",
  "قانون",
  "اقتصاد",
  "العلوم الاسلامية",
  "تاريخ وجغرافيا",
  "Math",
  "Algebre",
  "Analyse",
  "Physique",
  "Chimie",
  "Gestion",
  "Informatique"

];
const steps: StepItem[] = [
  { label: "Step 1" },
  { label: "Step 2" },
  { label: "Step 3" },
  { label: "Step 4" },
];

const years=[
  "تحضيري",
  "لغات",
  "1AP",
"2AP",
"3AP",
"4AP",
"5AP",
  "1AM",
  "2AM",
  "3AM",
  "4AM",
  "1AS",
  "2AS",
  "3AS",
"L1",
"L2",
"L3",
"M1",

]
const isFirestoreId = (id) => {
  // Check if id is a string and has a length of 20 characters
  if (typeof id !== 'string' || id.length !== 20) {
    return false;
  }

  // Regular expression to match Firestore-like IDs: 20 characters of a-z, A-Z, 0-9
  const firestoreIdRegex = /^[a-zA-Z0-9]{20}$/;

  // Test the id against the regular expression
  return firestoreIdRegex.test(id);
};
interface Session {
  day: string;
  start: string;
  end: string;
}
const convertSessionToDate = (session: Session, startDate: Date, endDate: Date): Date[] => {
  const sessionDayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(session.day);
  const sessionDates: Date[] = [];

  let currentDate = new Date(startDate);

  // Move currentDate to the first session day on or after startDate
  while (currentDate.getDay() !== sessionDayIndex) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Add sessions within the range
  while (currentDate <= endDate) {
    const [hours, minutes] = session.start.split(':').map(Number);
    const sessionDate = new Date(currentDate);
    sessionDate.setHours(hours, minutes);

    // Include the session if it is on or after the startDate
    if (sessionDate >= startDate) {
      sessionDates.push(sessionDate);
    }

    // Move to the next week
    currentDate.setDate(currentDate.getDate() + 7);
  }

  // Check if the nextPaymentDate is on a session day
  const [endHours, endMinutes] = session.start.split(':').map(Number);
  let paymentDate = new Date(endDate);
  paymentDate.setHours(endHours, endMinutes);

  if (paymentDate.getDay() === sessionDayIndex && paymentDate <= endDate) {
    sessionDates.push(paymentDate);
  }

  // Check if the first session date has passed the current time
  if (sessionDates.length > 0) {
    const firstSessionDate = sessionDates[0];
    const now = new Date();
    
    if (now > firstSessionDate) {
      // Include the first session if the current time is past the session time
      sessionDates.shift();
    }
  }

  return sessionDates;
};

function calculateAmountDue(
  startDate: Date, 
  nextPaymentDate: Date, 
  enrollmentDate: Date, 
  sessionDates: Session[], 
  monthlyAmount: number,
  sessionsPerMonth:number,
): { totalDue: number; numberOfSessionsLeft: number } {
  // Adjust start date if enrollment date is before the start date
  const effectiveStartDate = isBefore(enrollmentDate, startDate) ? startDate : enrollmentDate;


  const convertedSessionDates = sessionDates.flatMap(session => convertSessionToDate(session, effectiveStartDate, nextPaymentDate));

  
  // Filter sessions between effective start date and next payment date
  const sessionsLeft = convertedSessionDates.filter(date => 
      isAfter(date, effectiveStartDate) && isBefore(date, nextPaymentDate) || date.toDateString() === effectiveStartDate.toDateString()
  ).length;



  const sessionRate = monthlyAmount / sessionsPerMonth;

  

  const totalDue = sessionRate * sessionsLeft;

  return { totalDue, numberOfSessionsLeft: sessionsLeft };
}
const generateFirestoreId = (students: { id: string }[]) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  const generateId = () => {
    let result = '';
    for (let i = 0; i < 20; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  let newId = generateId();

  // Check if the generated ID already exists in the students array
  const existingIds = students.map(student => student.id);
  while (existingIds.includes(newId)) {
    newId = generateId(); // Generate a new ID if the current one exists
  }

  return newId;
};

type StudentSchemaType = z.infer<typeof StudentSchema> & {id:string };

export default function StudentForm({filter}) {
  const camera = useRef<null | { takePhoto: () => string }>(null);
  const {setStudents,teachers,classes,students,profile}=useData()
  const t=useTranslations()
  const form = useForm<any>({
    resolver: zodResolver(StudentSchema),
    defaultValues:{
      id:null,
      studentIndex: students.length + 1,
      classes:[],
      classesUIDs:[],
      actionTrack:[]
      
    }
  });

  const { reset,formState, setValue, getValues,control,watch} = form;
  const { isSubmitting } = formState;
  const { fields, append:appendClass,remove:removeClass, } = useFieldArray({
    control: form.control,
    name: "classes",

  });
  const handleGroupChange = (index: number, field: 'name' | 'id' | 'subject' | 'group' | "amount", value: string | number, classess) => {
    const classes = [...getValues('classes')];
    const classesUids = getValues('classesUIDs') ? [...getValues('classesUIDs')] : [];
  
    if (field === 'subject') {
      console.log("Updating subject:", value);
      classes[index] = {   ...classes[index],id: '', name: '', subject: value, group: '', cs: classes[index].cs };
    } else if (field === 'name') {
      console.log("Updating name:", value);
      classes[index] = {   ...classes[index],id: '', name: value, subject: classes[index].subject, group: '', cs: classes[index].cs };
    } else if (field === 'amount') {

      classes[index] = {  ...classes[index], id: classes[index].id, name: classes[index].name, subject: classes[index].subject, group: classes[index].group, cs: classes[index].cs,amount:value,debt:value};
    } else if (field === 'group') {
      const selectedClassId = classess.find((cls) => cls.id === value);
      if (!selectedClassId) {
        console.error("Selected class not found.");
        return;
      }
  
if(selectedClassId.paymentType==='monthly'){
  const a=calculateAmountDue(selectedClassId.startDate, selectedClassId?.nextPaymentDate, new Date(), selectedClassId?.groups, selectedClassId.amount,selectedClassId.numberOfSessions)
  const updatedClass = {
    ...classes[index],
    group: selectedClassId.group,
    groups: selectedClassId.groups,
    id: selectedClassId.id,
    index: selectedClassId.students.length + 1,
    cs: classes[index].cs,
    sessionsLeft: 0,
    amount:selectedClassId.active? a.totalDue : selectedClassId.amount,
    debt: selectedClassId.active? a.totalDue : selectedClassId.amount,
    ...(selectedClassId.active && { nextPaymentDate: selectedClassId?.nextPaymentDate }),
    sessionsToStudy: selectedClassId.active? a.numberOfSessionsLeft :selectedClassId.numberOfSessions,
  };
  const updatedClassUIDs = classesUids[index] || {};
  updatedClassUIDs.id = selectedClassId.id;
  updatedClassUIDs.group = selectedClassId.group;

  classes[index] = updatedClass;
  classesUids[index] = updatedClassUIDs;
}else{
  const updatedClass = {
    ...classes[index],
    group: selectedClassId.group,
    groups: selectedClassId.groups,
    id: selectedClassId.id,
    index: selectedClassId.students.length + 1,
    cs: classes[index].cs,
    sessionsLeft: 0,
    amount:selectedClassId.amount,
    debt:0,
    ...(selectedClassId.active && { nextPaymentDate: selectedClassId?.nextPaymentDate }),
    sessionsToStudy: 0,
  };
  const updatedClassUIDs = classesUids[index] || {};
  updatedClassUIDs.id = selectedClassId.id;
  updatedClassUIDs.group = selectedClassId.group;

  classes[index] = updatedClass;
  classesUids[index] = updatedClassUIDs;
}

    } else {
      console.log("Updating other field:", field, value);
      classes[index] = {         ...classes[index],id: classes[index].id, name: classes[index].name, subject: classes[index].subject, group: classes[index].group, cs: value,amount:classes[index].amount,debt:classes[index].debt};
    }
  
    setValue(`classes`, classes);
    setValue(`classesUIDs`, classesUids);
  };
  const videoRef = useRef<HTMLVideoElement>(null);
  const highlightCodeOutlineRef = useRef<HTMLDivElement>(null);
  const qrScanner = useRef<QrScanner | null>(null);
  const [showingQrScanner, setShowingQrScanner] = useState(false);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [currentClass, setCurrentClass] = useState<String| any>();
  const [currentClasses, setCurrentClasses] = useState<String| any[]>();
  const audioRefSuccess = useRef(null);
  const audioRefError = useRef(null);
  const processedQrCodes = useRef(new Set<string>()); // Set to track processed QR codes
  const [openAlert,setOpenAlert]=useState(false)
  const[alertText,setAlertText]=useState('')
  const [open, setOpen] = React.useState(false)
  const handleQrScan = (result) => {
     
    if (!isFirestoreId(result.data)) {//less than 20
      setAlertText("Invalid Qr Code");
      setOpenAlert(true);
      audioRefError.current?.play();
      return;
    }
    
    const parsedData = students.find((student) =>  result.data === student.id || result.data=== student.newId);

    
    if (parsedData!=undefined) {
      setAlertText("Qr code already used");
      setOpenAlert(true);
      audioRefError.current?.play();
      return;
    }


    setValue("id",result.data)
    audioRefSuccess.current?.play();
    stopScanner();
  };

  const stopScanner = () => {
    qrScanner.current?.stop();
    qrScanner.current = null; // Reset the qrScanner to null
    videoRef.current!.hidden = true; // Hide the video element
    processedQrCodes.current.clear(); // Clear processed QR codes
    setShowingQrScanner(false); // Update state to hide QR scanner
    setStudentData(null); // Clear student data
    setCurrentClass(undefined)
    setCurrentClasses(undefined)


  };
  const handleButtonClick = async () => {
    videoRef.current!.hidden = false;
    qrScanner.current = new QrScanner(videoRef.current!, handleQrScan, {
      highlightScanRegion: true,
      overlay: highlightCodeOutlineRef.current!,
      maxScansPerSecond:1,
      preferredCamera:'user'
    });
    await qrScanner.current.start();
    setShowingQrScanner(true);
  };

  const calculatedAmount = useMemo(() => {
    const amounts = watch("classes");
    if (!Array.isArray(amounts)) return 0; // Handle cases where "fields" is not an array
    return fields.reduce((acc, field) => acc + field.amount, 0)
  }, [watch("classes")]);
  const [scannedCode, setScannedCode] = useState<string>('');




  React.useEffect(() => {
    if (scannedCode) {
   
      
      onQrScannedInput(scannedCode);
    
    }
  }, [scannedCode]);
  const onQrScannedInput=(id)=>{
   
    
    const parsedData = students.find((student) =>  id === student.id || id=== student.newId);

    
    if (parsedData!=undefined) {
      setAlertText("Qr code already used");
      setOpenAlert(true);
      audioRefError.current?.play();
      return;
    }


    setValue("id",id)
    audioRefSuccess.current?.play();

    
  }

  const fileInputRef = useRef(null)


  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setValue('photo', reader.result)
      }
      reader.readAsDataURL(file)
    }
  }
  return (
    <Dialog >
      <DialogTrigger asChild className='mr-3'>
        <Button onClick={()=>{       form.setValue('classes',[]);reset()}}>{t('Add student')}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1300px]">
      <Form {...form} >
      <form >
        <DialogHeader>
          <DialogTitle>{t('Add student')}</DialogTitle>
          <DialogDescription>
            {t('Add your Student here. Click save when you are done.')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex w-full flex-col gap-4">

      <Stepper initialStep={filter==="تحضيري"?1:0} steps={steps} >

        {steps.map(({ label }, index) => {
          return (
            <Step key={label} label={label}>
              <div className="h-[450px] flex items-center justify-center my-4 border bg-secondary  rounded-md">
              {index === 0 ? (
 

 <div className="bg-muted rounded-lg p-6 flex flex-col gap-4">
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{t('heads-up')}</AlertDialogTitle>
      <AlertDialogDescription>
 {alertText}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
      <AlertDialogAction>{t('Continue')}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
      <audio id="qr-scan-sound-success"  ref={audioRefSuccess}  src="/success.mp3" ></audio>
      
      <audio id="qr-scan-sound-error"  ref={audioRefError}  src="/error.mp3" ></audio>
   <div className="aspect-square bg-background rounded-md overflow-hidden relative h-[300px]">
     <video hidden={!showingQrScanner} ref={videoRef} className="absolute inset-0 w-full h-full object-cover"></video>

   </div>
   {showingQrScanner ? (
   
       <button
     onClick={stopScanner}
         className="mt-4 text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800"
       >
         {t('Stop QR Scanner')}
       </button>

   ) : (
     <button
     onClick={handleButtonClick}
     type='button'
     className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
   >
     {t('Start QR Scanner')}
   </button>
   )}
  {/** <div className="bg-muted rounded-lg p-6 flex flex-col items-center justify-center gap-4">
      <Card className="w-full max-w-md mx-auto">
 <CardHeader>
   <CardTitle className="text-2xl font-bold text-center">QR Code Scanner</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
   <div className="relative">
   <Input
     type="text"
     value={scannedCode}
     onChange={(e) => {setScannedCode(e.target.value)}}
     placeholder="Scan QR code here"
     autoFocus
   />
     <ScanIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
   </div>

   <div className="flex justify-center">
     
   </div>
   
 </CardContent>
</Card>
  
 </div>**/}
 </div>


) : index === 1 ? (
  <div className="grid gap-4 py-4">

    <FormField
                  
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">{t('Name')}</FormLabel>
                      <FormControl><Input id="name"  className="col-span-3"  {...field}/></FormControl>

                      
                    </FormItem>
                  )}
                />


    <FormField
              control={control}
              name="birthdate"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('Birthdate')}</FormLabel>
                  <FormControl>  
                    <CalendarDatePicker
            {...field}
            date={getValues("birthdate")}
            className="col-span-3"
            setDate={(selectedValue) => {
              if (selectedValue === undefined) {
                // Handle undefined case if needed
              } else {
                form.setValue('birthdate', selectedValue);
              }
            }}
          /></FormControl>
                  
                </FormItem>
              )}
            />


    <FormField
              control={control}
              name="birthplace"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('Birthplace')}</FormLabel>
                  <FormControl><Input id="birthplace" className="col-span-3" {...field} /></FormControl>
                  
                </FormItem>
              )}
            />
   

    <FormField
              control={control}
              name="school"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('School')}</FormLabel>
                  <FormControl><Input id="school" className="col-span-3" {...field} /></FormControl>
                  
                </FormItem>
              )}
            />
 

 <FormField
  control={control}
  name="year"
  render={({ field }) => (
    <FormItem className="grid grid-cols-4 items-center gap-4">
      <FormLabel className="text-right">{t("Year")}</FormLabel>
      <FormControl>
      <Select
   onValueChange={(e) => {
    // Call the onChange handler with the new value
    field.onChange(e);

    // Check the value of 'year' and update 'field' if needed
    if (["1AM", "2AM", "3AM", "4AM"].includes(e)) {
      setValue("field", "متوسط");
    }
    if(["L1","L2","L3","M1"].includes(e)) {
  setValue("field", "جامعي");
}    
 if(["1AP","2AP","3AP","4AP","5AP"].includes(e)) {
  setValue("field", "ابتدائي");
}
if(["لغات"].includes(e)) {
  setValue("field", "لغات");
}
if(["تحضيري"].includes(e)) {
  setValue("field", "تحضيري");
}

  }}
   defaultValue={field.value}
              >
                                 <SelectTrigger
                              id={`year`}
                              aria-label={`Select year`}
                            >
                              <SelectValue placeholder={"select year"} />
                            </SelectTrigger>
            <SelectContent>
 
            {years.map((year) => (
                              <SelectItem key={year} value={year}   >
                                {year}
                              </SelectItem>
                            ))}
           
                          </SelectContent>
              </Select>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>


{!["تحضيري","لغات","1AP","2AP","3AP","4AP","5AP","1AM","2AM","3AM","4AM","L1","L2","L3","M1"].includes(watch('year')) && (<FormField
  control={control}
  name="field"
  render={({ field }) => (
    <FormItem className="grid grid-cols-4 items-center gap-4">
      <FormLabel className="text-right">{t('field')}</FormLabel>
      <FormControl>
      <Select
   onValueChange={field.onChange}
   defaultValue={field.value}
              >
                                 <SelectTrigger
                              id={`subject`}
                              aria-label={`Select subject`}
                            >
                              <SelectValue placeholder={"select subject"} />
                            </SelectTrigger>
            <SelectContent>
 
            {subjects.map((subject) => (
                              <SelectItem key={subject} value={subject}   >
                                {subject}
                              </SelectItem>
                            ))}
           
                          </SelectContent>
              </Select>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>)}
  

    <FormField
              control={control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('Phone Number')}</FormLabel>
                  <FormControl><Input id="phoneNumber" className="col-span-3" {...field} /></FormControl>
                  
                </FormItem>
              )}
            />
    
  </div>

) : index === 2 ? (
  <div className="flex flex-col items-center gap-4 py-4">

 {!watch('photo') ? (
        <div className="w-[300px] items-center justify-center flex flex-col">
          
          <Camera ref={camera} aspectRatio={16/9} errorMessages={{noCameraAccessible:"no Cemera"}}  facingMode='environment' />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (camera.current) {
                  setValue('photo', camera.current.takePhoto())
                } else {
                  console.error('Camera reference is null')
                }
              }}
              variant="secondary"
              type='button'
            >
              {t('Take photo')}
            </Button>
            <Button
              onClick={() => fileInputRef.current.click()}
              variant="secondary"
              type='button'
            >
              <Upload className="mr-2 h-4 w-4" />
              {t('Upload photo')}
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      ) : (
        <>
        <img src={watch('photo')} alt="Captured photo" className='w-[300px] h-auto object-cover rounded-lg' />
        <div className="flex gap-2">
          <Button onClick={() => setValue('photo', null)} variant="secondary" type='button'>
            {t('Retake photo')}
          </Button>
          <Button
            onClick={() => fileInputRef.current.click()}
            variant="secondary"
            type='button'
          >
            <Upload className="mr-2 h-4 w-4" />
            {t('Upload different photo')}
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </>
      )}


</div>
) : (
  <div className="w-full h-full">
     <ScrollArea className="h-[400px]">
    <Table>
      <TableCaption>        <Button type='button' size="sm" variant="ghost" className="gap-1 w-full"  onClick={()=>appendClass({id:'',name:'',subject:'',group:'',cs:'false',amount:0})}>
                      <PlusCircle className="h-3.5 w-3.5" />
                      {t('add group')}</Button></TableCaption>
      <TableHeader>
        <TableRow>
        <TableHead>{t('Subject')}</TableHead>
          <TableHead>{t("Name")}</TableHead>
          <TableHead>{t("group")}</TableHead>
          <TableHead>{t('Time')}</TableHead>
          <TableHead>{t('CS')}</TableHead>
          <TableHead>{t('Amount')}</TableHead>
          <TableHead>{t('Action')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((invoice,index) => (
          <TableRow key={invoice.id}>
                        <TableCell className="font-medium"> 
              <Select  value={invoice.subject} onValueChange={(value)=>handleGroupChange(index,'subject',value)}>
      <SelectTrigger className="">
        <SelectValue placeholder="Select a Subject" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
        <SelectLabel>{t('Subjects')}</SelectLabel>
                    {classess.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
        </SelectGroup>
      </SelectContent>
    </Select></TableCell>
            <TableCell className="font-medium"> 
              <Select  value={invoice.name} onValueChange={(value)=>handleGroupChange(index,'name',value)}>
      <SelectTrigger className="">
        <SelectValue placeholder="Select a Group" />
      </SelectTrigger>
      <SelectContent>
  {invoice.subject ? (
    <SelectGroup>
      <SelectLabel>{t('Groups')}</SelectLabel>
      {Array.from(
        new Set(
          classes
            .filter(
              cls =>
                cls.subject === invoice.subject &&
              (watch('year') === 'لغات' || cls.year === watch('year'))&&
                cls.stream.some(streamm => streamm.includes(watch('field')))
            )
            .map(cls => cls.teacherName) // Map to teacherName to get a list of names
        )
      ).map(name => (
        <SelectItem key={name} value={name}>
          {name}
        </SelectItem>
      ))}
    </SelectGroup>
  ) : (
    <p className="text-sm text-muted-foreground">Select Subject first</p>
  )}
</SelectContent>

    </Select></TableCell>
           
           
           
      <TableCell> 
            <Select 
              value={classes.find(type => type.id === watch(`classes.${index}.id`))?.id}
                onValueChange={(value) => {handleGroupChange(index, 'group', value,classes)
                }}
              >
                    <SelectTrigger >
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                        {invoice.subject && invoice.name ? (
                            <SelectGroup>
                                <SelectLabel>{t('groups')}</SelectLabel>
                                    {classes.filter(cls => 
                                      cls.subject === invoice.subject && 
                                      (watch('year') === 'لغات' || cls.year === watch('year')) && 
                                      cls.teacherName === invoice.name
                                    ).map((groupp, index) => (
                                      <SelectItem key={groupp.id} value={groupp.id}>
                                        {groupp.group}
                                      </SelectItem>
                                    ))}
                              </SelectGroup>
                              ) : (
                                <p className="text-sm text-muted-foreground">Select Subject and name first</p>
                              )}
                      </SelectContent>
              </Select>
        </TableCell>


        <TableCell>
  {classes.find(cls => cls.id === watch(`classes.${index}.id`))?.groups.map((group, idx) => (
      <Input
      key={idx} 
        type="text"
        value={`${t(group.day)}, ${group.start} - ${group.end}`}
        readOnly
        className="col-span-3"
      />

  ))}
</TableCell>
    


<TableCell className="font-medium"> 
              <Select value={invoice.cs} onValueChange={(value)=>handleGroupChange(index,'cs',value)}>
      <SelectTrigger className="">
        <SelectValue placeholder="Select a cs" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
        <SelectLabel>cs</SelectLabel>
        <SelectItem  value={"no"}>
                        No
                      </SelectItem>
        <SelectItem  value={"teacher"}>
                        Teacher
                      </SelectItem>
                      <SelectItem  value={"rectorate"}>
                        Rectorate
                      </SelectItem>
                      <SelectItem  value={"orphan"}>
                        Orphan
                      </SelectItem>
                      <SelectItem  value={"civil status"}>
                        Civil Status
                      </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select></TableCell>


    <TableCell className="font-medium">

  <Input
    type="number"
    value={invoice?.amount}
    onChange={(e) => handleGroupChange(index, 'amount', +e.target.value)}
    className="col-span-3 w-24 mb-2"
  />

</TableCell>

    <TableCell>   
       <Button  type="button" variant="destructive" onClick={()=>removeClass(index)}>{t('remove')}</Button></TableCell>

          </TableRow>
        ))}
      </TableBody>
    </Table>
    </ScrollArea>
</div>
)}
              </div>
            </Step>
          )
        })}


<div className="flex items-center space-x-2">
<span className="text-sm font-semibold">Registration Fee:</span> {/* Title before the input */}

<Input
        type="text"
        value={profile.RegistrationFee +' DA'}
        className="col-span-3 w-24"
        readOnly
      />
              <span className="text-sm font-semibold">Montant Total des Classes:</span> {/* Title before the input */}
              <Input
        type="text"
        value={calculatedAmount + ' DA'}
        className="col-span-3 w-24"
        readOnly
      />
            </div>
        <Footer formData={getValues()} form={form} isSubmitting={isSubmitting} reset={reset} calculatedAmount={calculatedAmount}/>

      </Stepper>

    </div>
    </form>
    </Form>
      </DialogContent>
    </Dialog>
  )
}

const Footer: React.FC<FooterProps> = ({ formData, form, isSubmitting,reset, calculatedAmount}) => {
  const user = useUser()

  const {
    nextStep,
    prevStep,
    resetSteps,
    isDisabledStep,
    hasCompletedAllSteps,
    isLastStep,
    isOptionalStep,
    currentStep
  } = useStepper()
  const [qr,setQr]=useState<string>()
  const generateQrCode=(data:string)=>{
      QRCode.toDataURL(data).then(setQr)

  }
  async function generateStudentCard() {
    
 
      const element = document.getElementById('printable-content');
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
    
      let position = 0;
    
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save('download.pdf');
      form.setValue('classes',[])
      reset({  id:'0',
        studentIndex: students.length + 1,
        classes:[],
        classesUIDs:[]})

      setQr('')
     
  }
  const {setStudents,setClasses,students,classes,profile}=useData()
  const {toast}=useToast()
  const onSubmit = async (data: StudentSchemaType) => {
    try {
      const id = data.id === null ? generateFirestoreId(students) : data.id;
  
      // Prepare the student object
      const newStudent = {
        ...data,
        id,
        studentIndex: students.length + 1,
        debt: calculatedAmount,
        monthlypayment: calculatedAmount,
        lastPaymentDate: Timestamp.fromDate(currentDate),
        nextPaymentDate: Timestamp.fromDate(new Date(new Date().setMonth(new Date().getMonth() + 1))),
        registrationAndInsuranceFee: 'notPaid',
        totalAmount: calculatedAmount,
        value: data.name,
        label: data.name,
        student: data.name
      };
  
      // Add student to database and fetch newData
      const newData = await addStudent(newStudent, user);
  
      // Generate QR code
      generateQrCode(id);
  
      // Update state for students
      setStudents(prev => [
        ...prev,
        {
          ...newStudent,
          classes: data.classes.map(cls => {
            const classUpdate = newData.classUpdates.find(update => update.classID === cls.id);
            return classUpdate ? { ...cls, index: classUpdate.newIndex } : cls;
          })
        }
      ]);
  
      // Update state for classes
      setClasses(prev => prev.map(cls => {
        const matchingClass = newData.classUpdates.find(sls => sls.classID === cls.id);
  
        if (matchingClass) {
          const updatedStudent = {
            id,
            name: data.name,
            index: matchingClass.newIndex,
            year: data.year,
            group: cls.group,
            cs: matchingClass.cs,
            sessionsLeft: matchingClass.numberOfSessions,
            amount: matchingClass.amount,
            debt: matchingClass.debt,
            ...(matchingClass.active && { nextPaymentDate: matchingClass.nextPaymentDate }),
            sessionsToStudy: matchingClass.numberOfSessionsLeft
          };
  
          return {
            ...cls,
            students: [...cls.students, updatedStudent]
          };
        }
  
        return cls;
      }));
  
      // Proceed to the next step
      nextStep();
  
      // Show success toast
      toast({
        title: "Student Added!",
        description: `The student, ${data.name} added successfully`,
      });
  
      // Print the bill
      printBill(data.name, profile.RegistrationFee);
  
    } catch (error) {
      console.error("Error adding student:", error);
    }
  };
  
  // Function to print bill
  const printBill = (studentName: string, fee: number) => {
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
              <img src="${profile.photo}" alt="School Logo" />
              <h2>${profile.schoolName}</h2>
            </div>
          </div>
          <div class="bill-item">
            <label>Nom:</label> <span>${studentName}</span>
          </div>
          <div class="bill-item">
            <label>Frais d'inscription:</label> <span>DZD ${fee}</span>
          </div>
          <hr style="margin: 48px 0;" />
          <div style="display: flex; justify-content: space-between;">
            <span class="total">Total:</span>
            <span class="total">DZD ${fee}</span>
          </div>
          <div class="footer">Merci!</div>
        </div>
      </body>
      </html>
    `;
  
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(billHtml);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      };
    }
  };


  return (
    <>
      {hasCompletedAllSteps && (
       <div className="h-[450px] flex items-center justify-center my-4 border bg-secondary  rounded-md flex-col" id='printable-content'>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col items-center gap-4">
            <img src={formData.photo} width={100} height={100} alt="Student" className="rounded-full" />
            <div className="grid gap-1 text-center">
              <div className="text-xl font-semibold">{formData.name}</div>
              <div className="text-muted-foreground">{formData.year}</div>
              {/* <div className="text-sm text-muted-foreground">Born: {format(formData?.birthdate, 'MMMM d, yyyy')}</div> */}
              <div className="text-sm text-muted-foreground">School: {formData.school}</div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="w-40 h-40 bg-muted rounded-md flex items-center justify-center">
            <img src={qr} className="w-24 h-24 text-muted-foreground" />
            </div>
          </div>
        </div>
        <Separator className="my-2" />
        
        <div className='w-full px-5'>
      <h3 className="text-lg font-semibold">Classes</h3>
      <div className="gap-3 mt-2 grid grid-cols-3 justify-center">
        {formData.classes.map((classItem:any, index:number) => (
          <div key={index} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{classItem.subject}</div>
              <div className="text-sm text-muted-foreground">
                {classItem.name}, {classItem.group}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
       
        </div>
      )}
      <div className="w-full flex justify-end gap-2">
        {hasCompletedAllSteps ? (
                 <DialogFooter>
                     <DialogClose asChild>
          <Button size="sm"            type='button'  onClick={()=>generateStudentCard()}>
            Download
          </Button>
          
          </DialogClose>
               </DialogFooter>
        ) : (
          <>
            <Button
              disabled={currentStep.label==='Step 2'?true:isDisabledStep}
              onClick={prevStep}
              size="sm"
              variant="secondary"
              type='button'
            >
              Prev
            </Button>
            {isLastStep?(        <LoadingButton size="sm"    loading={isSubmitting}        type={'button'}   onClick={form.handleSubmit(onSubmit)}>
              Finish
            </LoadingButton>):(        <Button size="sm"   
            disabled={formData.id === null}   
                 type={"button"}    onClick={nextStep}>
              {isLastStep ? "Finish" : isOptionalStep ? "Skip" : "Next"}
            </Button>)}
    
          </>
        )}
      </div>
    </>
  )
}
