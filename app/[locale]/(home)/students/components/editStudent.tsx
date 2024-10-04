"use client"
import React, { useState, useRef,useMemo } from 'react';
import { useToast } from "@/components/ui/use-toast"

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
import { PlusCircle, Upload } from 'lucide-react';
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
import { addStudent, addStudentToClass, changeStudentGroup, getStudentCount, removeStudentFromClass, updateStudent, updateStudentPicture } from '@/lib/hooks/students';
import { LoadingButton } from '@/components/ui/loadingButton';
import { format, isAfter, isBefore } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { UseFormReturn } from 'react-hook-form';
import { useData } from '@/context/admin/fetchDataContext';
import { useTranslations } from 'next-intl';
import { ScrollArea } from '@/components/ui/scroll-area';
import {useUser} from '@/lib/auth'
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
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
const subjects =['علوم تجريبية', 'تقني رياضي', 'رياضيات', 'تسيير واقتصاد ', 'لغات اجنبية ', 'اداب وفلسفة']
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
interface Session {
  day: string;
  start: string;
  end: string;
}
const convertSessionToDate = (session: Session, startDate: Date, endDate: Date): Date[] => {
  const sessionDayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(session.day);
  const sessionDates: Date[] = [];

  let currentDate = new Date(startDate);

  // Include startDate if it falls on the session day
  if (currentDate.getDay() === sessionDayIndex) {
    const [hours, minutes] = session.start.split(':').map(Number);
    const sessionDate = new Date(currentDate);
    sessionDate.setHours(hours, minutes, 0, 0); // Set seconds and milliseconds to 00
    sessionDates.push(sessionDate); // Add startDate session
  }

  // Move currentDate to the first session day after the startDate if necessary
  while (currentDate.getDay() !== sessionDayIndex) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Add sessions within the range from startDate to endDate
  while (currentDate <= endDate) {
    const [hours, minutes] = session.start.split(':').map(Number);
    const sessionDate = new Date(currentDate);
    sessionDate.setHours(hours, minutes, 0, 0); // Set seconds and milliseconds to 00

    // Include the session if it's after the first already included sessionDate
    if (sessionDate > startDate) {
      sessionDates.push(sessionDate);
    }

    // Move to the next week
    currentDate.setDate(currentDate.getDate() + 7);
  }

  // Handle nextPaymentDate separately
  const [endHours, endMinutes] = session.start.split(':').map(Number);
  let paymentDate = new Date(endDate);
  paymentDate.setHours(endHours, endMinutes, 0, 0); // Set seconds and milliseconds to 00

  // Only add paymentDate if it's on the session day and not already in the list
  const lastSessionDate = sessionDates[sessionDates.length - 1];
  if (paymentDate.getDay() === sessionDayIndex && (!lastSessionDate || lastSessionDate.getTime() !== paymentDate.getTime())) {
    sessionDates.push(paymentDate);
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

  const convertedSessionDates = sessionDates.flatMap(session => convertSessionToDate(session, startDate, nextPaymentDate));
  


  
  // Filter sessions between effective start date and next payment date
  const sessionsLeft = convertedSessionDates.filter(date => 
      isAfter(date, effectiveStartDate) && isBefore(date, nextPaymentDate) || date.toDateString() === effectiveStartDate.toDateString()
  ).length;
  console.log("Date", convertedSessionDates);

  const sessionRate = monthlyAmount / sessionsPerMonth;

  

  const totalDue = sessionRate * sessionsLeft;

  return { totalDue, numberOfSessionsLeft: sessionsLeft };
}
const EditStudent: React.FC<openModelProps> = ({ setOpen, open,student }) => {
  const camera = useRef<null | { takePhoto: () => string }>(null);
  const {setStudents,teachers,classes,students}=useData()
  const t=useTranslations()
  const form = useForm<Student>({
    //resolver: zodResolver(StudentSchema),
    defaultValues:student
  });
  const { reset,formState, setValue, getValues,control,watch} = form;
  const { isSubmitting } = formState;
  const { fields, append:appendClass,remove:removeClass, } = useFieldArray({
    control: form.control,
    name: "classes",

  });
  React.useEffect(() => {
    // you can do async server request and fill up form student.classesUIDs
 
      reset({...student});
  }, [reset,student]);
  const getClassId = (subject:string, name:string,day:string,start:string,end:string)  => {
    const selectedClass = classes.find((cls: { subject: string; year: any; groups: any[]; teacherName: string; }) => cls.subject === subject && cls.year=== watch('year') &&   cls.groups.some((group: { stream: string | any[]; }) => group.stream.includes(watch('field'))) && cls.teacherName === name )
    const selectedGroup=selectedClass.groups.find( (grp: { day: string; start: string; end: string; })=> grp.day === day && grp.start === start && grp.end===end)
    
    return selectedClass ? {id:selectedClass.id,index:selectedClass.students?selectedClass.students.length+1:1,group:selectedGroup.group}: {id:"",index:0,group:""};
  };
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
  const calculatedAmount = useMemo(() => {
    const amounts = watch("classes");
    if (!Array.isArray(amounts)) return 0; // Handle cases where "fields" is not an array
    return fields.reduce((acc, field) => acc + field.amount, 0)
  }, [watch("classes")]);
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
  const updateStudentAddedAtAndSave = async (classes, studentsOfSchool) => {
    // Loop through each class
    for (const cls of classes) {
      let studentsUpdated = false;
  
      // Loop through students within each class
      cls.students.forEach(student => {
        if (!student.addedAt) {
          // Find the corresponding student in the 'studentsOfSchool' array
          const matchingStudent = studentsOfSchool.find(schoolStudent => schoolStudent.id === student.id);
  
          if (matchingStudent) {
            // Add the 'addedAt' field with 'lastPaymentDate'
            student.addedAt = matchingStudent.lastPaymentDate;
            studentsUpdated = true;
          }
        }
      });
  
      // If any student was updated, proceed to update the Firestore document
      if (studentsUpdated) {
        try {
          await updateDoc(doc(db,"Groups",cls.id), { students: cls.students });
          console.log(`Updated students for class ID: ${cls.id}`);
        } catch (error) {
          console.error(`Error updating class ID: ${cls.id}`, error);
        }
      }
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen} >
 <DialogContent className="sm:max-w-[1300px]">
      <Form {...form} >
      <form >
        <DialogHeader>
          <DialogTitle>{t('Add student')}</DialogTitle>
          <DialogDescription>
            Add your Student here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        {/* <Button onClick={()=>updateStudentAddedAtAndSave(classes,students)} type='button'>
          EDITSTUDENTS
        </Button> */}
        <div className="flex w-full flex-col gap-4">

      <Stepper initialStep={0} steps={steps} >

        {steps.map(({ label }, index) => {
          return (
            <Step key={label} label={label}>
              <div className="h-[450px] flex items-center justify-center my-4 border bg-secondary  rounded-md">
              {index === 0 ? (
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
) : index === 1 ? (
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
      <TableCaption>        <Button type='button' size="sm" variant="ghost" className="gap-1 w-full"  onClick={()=>appendClass({id:'',name:'',subject:'',group:'',cs:'false',amount:0,addedAt:new Date()})}>
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
        <SelectItem  value={"false"}>
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
              <span className="text-sm font-semibold">Montant Total des Classes:</span> {/* Title before the input */}
              <Input
        type="text"
        value={calculatedAmount + ' DA'}
        className="col-span-3 w-24"
        readOnly
      />
            </div>
    

<Footer formData={getValues()} form={form} isSubmitting={isSubmitting} reset={reset} student={student} setOpen={setOpen} calculatedAmount={calculatedAmount} />

</Stepper>

</div>
</form>
</Form>
</DialogContent>
</Dialog>

  )
}

const Footer: React.FC<FooterProps> = ({ formData, form, isSubmitting,reset,student,setOpen,calculatedAmount}) => {
  const user = useUser()

  const {
    nextStep,
    prevStep,
    resetSteps,
    isDisabledStep,
    hasCompletedAllSteps,
    isLastStep,
    isOptionalStep,
  } = useStepper()
  const generateQrCode = async (text: string | QRCode.QRCodeSegment[]) => {
    try {
      return await QRCode.toDataURL(text);
    } catch (err) {
      console.error(err);
      return '';
    }
  };
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const {setStudents,setClasses,students,classes}=useData()
  React.useEffect(() => {
    const fetchQrCode = async () => {
      const url = await generateQrCode(formData.id);
      setQrCodeUrl(url);
    };

    fetchQrCode();
  }, [formData.id]);
 
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

     
  }
  function compareClasses(dataClasses: Class[], studentClasses: Class[]): UpdateResult {
    const result: UpdateResult = {
      added: [],
      removed: [],
      updated: []
    };
  
    // Create maps for quick lookup by class ID
    const dataClassMap = new Map<string, Class>(dataClasses.map(cls => [cls.id, cls]));
    const studentClassMap = new Map<string, Class>(studentClasses.map(cls => [cls.id, cls]));
  
    // Find added and updated classes
    for (const newClass of dataClasses) {
      const existingClass = studentClassMap.get(newClass.id);
  
      if (!existingClass) {
        // Class is in new data but not in student's current classes, so it's added
        result.added.push(newClass);
      } else if (existingClass.cs !== newClass.cs) {
        // Class exists in both, but the `cs` value has changed
        result.updated.push(newClass);
      }
    }
  
    // Find removed classes
    for (const oldClass of studentClasses) {
      if (!dataClassMap.has(oldClass.id)) {
        // Class is in student's current classes but not in new data, so it's removed
        result.removed.push(oldClass);
      }
    }
  
    return result;
  }
  async function processStudentChanges(result: { added: any; removed: any; updated: any; },data: { classesUIDs: any; }) {
    const { added, removed, updated } = result;
    // Add students to classes
    if (added && Array.isArray(added)) {
      for (const cls of added) {
        const { group, id,  name,cs,active,amount,debt,sessionsLeft,sessionsToStudy,addedAt} = cls;
        const studentCount = await getStudentCount(id);
        const index = studentCount ;
   
          setClasses((prevClasses: any[]) => 
            prevClasses.map((cls: { id: any; students: any; }) =>
        cls.id === id ? {
          ...cls,
          students: [...cls.students, { group, id,cs, 
            index:index, 
            name, 
            year:student.year,
            sessionsLeft:sessionsLeft,
            amount:amount,
            debt:debt,
            ...(active && { nextPaymentDate: cls?.nextPaymentDate }),
            sessionsToStudy:sessionsToStudy,
            addedAt:addedAt}]
        } : cls
      )
    );
  
    setStudents((prevStudents: any[]) => 
      prevStudents.map((std: { id: any; classesUIDs: any; classes: any; }) =>
  std.id === student.id ? {
    ...std,
    classesUIDs: [...std.classesUIDs, { id:id,group:group }],
    classes:[...std.classes,{...cls,index:index}]
  } : std
  )
  );  
  await addStudentToClass({ group:cls.group, id:student.id,cs:cls.cs, 
    index:index, 
    name:student.name, 
    year:student.year,
    sessionsLeft:sessionsLeft,
    amount:amount,
    debt:debt,
    ...(active && { nextPaymentDate: cls?.nextPaymentDate }),
    sessionsToStudy:sessionsToStudy,
    addedAt:cls.addedAt},cls.id,student.id,user)
        

        
        }



    }
  
    // Remove students from classes
    if (removed && Array.isArray(removed)) {
      for (const cls of removed) {
        const { group, id,  name,cs,active,amount,debt,sessionsLeft,sessionsToStudy,index} = cls;
        console.log("removed",cls);
        
await removeStudentFromClass({ group:cls.group, id:student.id,cs:cls.cs, 
  index:index, 
  name:student.name, 
  year:student.year,
  sessionsLeft:sessionsLeft,
  amount:amount,
  debt:debt,
  ...(active && { nextPaymentDate: cls?.nextPaymentDate }),
  sessionsToStudy:sessionsToStudy,addedAt:cls.addedAt},student.id,cls.id,user)


       setClasses((prevClasses: any[]) => 
          prevClasses.map((cls: { id: any; students: any[]; }) =>
      cls.id === id ? {
        ...cls,
        students: cls.students.filter((std: { id: any; }) => std.id !== student.id)
      } : cls
    )
  );

  setStudents((prevStudents: any[]) => 
    prevStudents.map((std: { id: any; classesUIDs: any[]; classes: any[]; }) =>
std.id === student.id ? {
  ...std,
  classesUIDs:std.classesUIDs.filter((cls: { id: any; }) => cls.id !== id),
  classes:std.classes.filter((cls: { id: any; }) => cls.id !== id),
} : std
))

        }
      }

         // Change groups for specific students
    if (updated && Array.isArray(updated)) {
      for (const { id,group,cs,amount } of updated) {
 
   const classToUpdate = classes.find((cls: { id: any; }) => cls.id === id);


   const updatedStudents = classToUpdate.students.map((std: { id: any; }) =>
    std.id === student.id
      ? { ...std, cs:cs,amount:amount }  // Update the student with the new group
      : std
  );

  await changeStudentGroup(id,student.id,updatedStudents,data.classesUIDs,user)
        setClasses((prevClasses: any[]) =>
          prevClasses.map((cls: { id: any; students: any[]; }) =>
            cls.id === id? {
              ...cls,
              students: cls.students.map((std: { id: any; }) =>
                std.id === student.id? { ...std, cs:cs} : std
              )
            } : cls
          )
        );
  
        setStudents((prevStudents: any[]) =>
          prevStudents.map((std: { id: any; }) =>
            std.id === student.id ? {...data} : std
          )
        );
      }
    }
    }
  
 
    const {toast}=useToast()
    const t=useTranslations()
const onSubmit = async (data: Student) => {

 const result=compareClasses(data.classes,student.classes)
  console.log("sdsdds",result);
  
 await processStudentChanges(result,data)
const StudentInfoToUpdate = {
  monthlypayment: calculatedAmount,
  name: data.name,
  year: data.year,
  birthdate: data.birthdate,
  phoneNumber: data.phoneNumber,
  field:data.field,
  birthplace:data.birthplace,
  school:data.school
};

if(student.photo != formData.photo){
  await updateStudentPicture(student.id,formData.photo,user)
}
// Update the teacher in Firestore
await updateStudent(StudentInfoToUpdate,student.id,user);
setStudents((prev: Student[]) => 
prev.map(t => t.id === student.id ? { ...t, ...StudentInfoToUpdate } : t)
);
nextStep()



toast({
  title: "Student Updated!",
  description: `The student, ${data.name} info are updated `,
});


  setOpen(false)
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
             <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
           <Button
           disabled={isDisabledStep}
           onClick={prevStep}
           size="sm"
           variant="secondary"
           type='button'
         >
           {t('Prev')}
         </Button>
                 <DialogFooter>
                     <DialogClose asChild>
          <LoadingButton size="sm"           disabled={isSubmitting} type='submit'  onClick={form.handleSubmit(onSubmit)}>
            {t('Save changes')}
          </LoadingButton>
          
          </DialogClose>
               </DialogFooter>
               </div>
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
            <Button size="sm"            type={"button"}    onClick={nextStep}>
              {t("Next")}
            </Button>
    
          </>
        )}
      </div>
    </>
  )
}
export default EditStudent;
