"use client"
import React, { useState, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast"
import {useUser} from '@/lib/auth'
import { Timestamp } from 'firebase/firestore';

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
import { PlusCircle } from 'lucide-react';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import CalendarDatePicker from './date-picker';
import { Separator } from '@/components/ui/separator';
import QRCode from 'qrcode'
import {addNewCardTransaction} from '@/lib/hooks/billing/student-billing'
import { addStudent, addStudentToClass, changeStudentCard, changeStudentGroup, removeStudentFromClass, updateStudent } from '@/lib/hooks/students';
import { LoadingButton } from '@/components/ui/loadingButton';
import { format } from 'date-fns';
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
interface FooterProps {
  formData: Student;
  student: Student;
  form: UseFormReturn<any>; // Use the specific form type if available
  isSubmitting: boolean;
  reset: UseFormReturn<any>['reset']; // Adding reset function from useForm
}

interface openModelProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  open: boolean; // Specify the type of setOpen
  student:Student
}
const steps = [
  { label: "Step 1" },

] satisfies StepItem[]

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
const ChangeCard: React.FC<openModelProps> = ({ setOpen, open,student }) => {
    const {setStudents,teachers,classes,students,profile}=useData()
const t=useTranslations()
  const videoRef = useRef<HTMLVideoElement>(null);
  const highlightCodeOutlineRef = useRef<HTMLDivElement>(null);
  const qrScanner = useRef<QrScanner | null>(null);
  const [showingQrScanner, setShowingQrScanner] = useState(false);
const [newId,setNewId]=useState(null)
  const audioRefSuccess = useRef(null);
  const audioRefError = useRef(null);
  const processedQrCodes = useRef(new Set<string>()); // Set to track processed QR codes
  const [openAlert,setOpenAlert]=useState(false)
  const[alertText,setAlertText]=useState('')
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
    setNewId(result.data)
    stopScanner();
  };

  const stopScanner = () => {
    qrScanner.current?.stop();
    qrScanner.current = null; // Reset the qrScanner to null
    videoRef.current!.hidden = true; // Hide the video element
    processedQrCodes.current.clear(); // Clear processed QR codes
    setShowingQrScanner(false); // Update state to hide QR scanner

  };
  const handleButtonClick = async () => {
    videoRef.current!.hidden = false;
    qrScanner.current = new QrScanner(videoRef.current!, handleQrScan, {
      highlightScanRegion: true,
      overlay: highlightCodeOutlineRef.current!,
      maxScansPerSecond:0.5,
      preferredCamera:'user',
    });
    await qrScanner.current.start();
    setShowingQrScanner(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} >
 <DialogContent className="sm:max-w-[800px]">

        <DialogHeader>
          <DialogTitle>{t('Add New Card')}</DialogTitle>
          <DialogDescription>
            Add your New Card here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <div className="flex w-full flex-col gap-4">

      <Stepper initialStep={0} steps={steps} >

        {steps.map(({ label }, index) => {
          return (
            <Step key={label} label={label}>
              <div className="h-[450px] flex items-center justify-center my-4 border bg-secondary  rounded-md">
              <div className="bg-muted rounded-lg p-6 flex flex-col gap-4">
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Heads up!</AlertDialogTitle>
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
 </div>
              </div>
            </Step>
          )
        })}
        <Footer formData={student} setOpen={setOpen} student={student} newId={newId}/>

      </Stepper>

    </div>
      </DialogContent>
    </Dialog>
  )
}

const Footer: React.FC<FooterProps> = ({ formData, newId,student,setOpen}) => {
  const {
    nextStep,
    prevStep,
    resetSteps,
    isDisabledStep,
    hasCompletedAllSteps,
    isLastStep,
    isOptionalStep,
  } = useStepper()
  const generateQrCode = async (text) => {
    try {
      return await QRCode.toDataURL(text);
    } catch (err) {
      console.error(err);
      return '';
    }
  };
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const {setStudents,setClasses,students,classes,profile}=useData()
  const user = useUser()
  React.useEffect(() => {
    const fetchQrCode = async () => {
      const url = await generateQrCode(formData.id);
      setQrCodeUrl(url);
    };

    fetchQrCode();
  }, [newId]);
 const {toast}=useToast()
 const currentDate = new Date();
console.log('ahmed rolo',currentDate);

  const onSubmit = async () => {

    const newCardPayment = {
        amount: profile.NewCardFee,
        type:'New Card',
        paymentDate: currentDate,
    }
await changeStudentCard(student.id,newId,user)

await addNewCardTransaction(newCardPayment,student.id,user)
setStudents((prev: Student[]) => 
prev.map(t => t.id === student.id ? { ...t, newId:newId } : t)
);


nextStep()



toast({
  title: "Student Updated!",
  description: `The student, ${formData.name} info are updated `,
});


   setOpen(false)
  };
const t=useTranslations()
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
              <div className="text-sm text-muted-foreground">Born: {format(formData.birthdate, 'MMMM d, yyyy')}</div>
              <div className="text-sm text-muted-foreground">School: {formData.school}</div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="w-40 h-40 bg-muted rounded-md flex items-center justify-center">
            <img src={qrCodeUrl} className="w-24 h-24 text-muted-foreground" />
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
                {classItem.name}, {classItem.time}
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
          <LoadingButton size="sm"            type='submit'  onClick={()=>onSubmit()}>
            {t('Save changes')}
          </LoadingButton>
          
          </DialogClose>
               </DialogFooter>
        ) : (
          <>
            <Button
              disabled={isDisabledStep}
              onClick={prevStep}
              size="sm"
              variant="secondary"
              type='button'
            >
              {t('Prev')}
            </Button>
            <Button size="sm"         disabled={newId === null}        type={"button"}    onClick={nextStep}>
              {t('Next')}
            </Button>
    
          </>
        )}
      </div>
    </>
  )
}
export default ChangeCard;
