"use client"
import React, { useMemo,useCallback } from 'react';
import {useUser} from '@/lib/auth'
import {
  ChevronDownIcon,
} from "@radix-ui/react-icons"
import { useToast } from "@/components/ui/use-toast"
import { useTranslations } from "next-intl"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown, Key, PlusCircle, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Teacher, TeacherSchema } from '@/validators/teacher';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import CalendarDatePicker from '../../students/components/date-picker';

import { activateStudents, addGroup, addNewClasses, addTeacher, removeGroupFromDoc, updateClassGroup, updateTeacher } from '@/lib/hooks/teachers';
import { LoadingButton } from '@/components/ui/loadingButton';

import { UseFormReturn } from 'react-hook-form';

import { useData } from "@/context/admin/fetchDataContext";

import { generateTimeOptions } from '../../settings/components/open-days-table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parse, isBefore, isAfter, isEqual, addWeeks, startOfWeek, endOfWeek, getDay, setHours, setMinutes, addHours, addMonths, eachDayOfInterval } from 'date-fns';
import { Label } from '@/components/ui/label';
const parseTime = (timeString) => parse(timeString, 'HH:mm', new Date());
interface FooterProps {
  formData: Teacher;
  teacher:any;
  form: UseFormReturn<any>; // Use the specific form type if available
  isSubmitting: boolean;
  reset: UseFormReturn<any>['reset']; // Adding reset function from useForm
}




const steps = [
  { label: "Step 1" },
  { label: "Step 2" },

] satisfies StepItem[]
interface openModelProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  open: boolean; // Specify the type of setOpen
  teacher:any
}
const paymentTypeOptions = {
  monthly: "salaryAmount",
  percentage: "percentage",
  hourly: "hourly"
};
const EditTeacher: React.FC<openModelProps> = ({ setOpen, open,teacher }) => {
  const t=useTranslations()
  const timeOptions = generateTimeOptions("07:00","22:00", 30);
  const form = useForm<any>({
    defaultValues:{
      year:[]
    }
   
  });
  const { reset,formState, setValue, getValues,control,watch} = form;
  const { isSubmitting } = formState;
  const { fields, append:appendClass,remove:removeClass, } = useFieldArray({
    control: form.control,
    name: "classes",

  });
  React.useEffect(() => {
    // you can do async server request and fill up form

      reset(teacher);

      
  }, [reset,teacher]); 


const middleSchoolYears = ["1AM", "2AM", "3AM", "4AM"];
const highSchoolYears = ["1AS", "2AS", "3AS"];
const universitySchoolYears=["L1","L2","L3","M1"]
const priarySchoolYears=["1AP","2AP","3AP","4AP","5AP"]
const languageSchoolYears=["A1","A2","B1","B2","C1","C2"]
const {profile}=useData()
// const checkRoomAvailability = useCallback((newGroup: Group, allRooms: string[]): string[] => {
//   const { day, start, end, classId, room: newGroupRoom } = newGroup;
//   // Check if any of the required fields are missing
//   if (!day || !start || !end) {
//     return [];
//   }

//   const newGroupStart = truncateToMinutes(parseTime(start));
//   const newGroupEnd = truncateToMinutes(parseTime(end));

//   // Filter rooms based on time availability
//   const availableRooms = allRooms.filter((room) => {
//     return !classes.some((classItem) =>
//       classItem.groups.some((group) => {
//         const groupStart = truncateToMinutes(parseTime(group.start));
//         const groupEnd = truncateToMinutes(parseTime(group.end));

//         const isOverlapping = group.day === day &&
//           group.room === room &&
//           ((isBefore(newGroupStart, groupEnd) && isAfter(newGroupEnd, groupStart)) ||
//            isEqual(newGroupStart, groupStart) || 
//            isEqual(newGroupEnd, groupEnd) ||
//            (isBefore(newGroupStart, groupEnd) && isEqual(newGroupEnd, groupEnd))
//           );

//         // Exclude the room if it is overlapping
//         return isOverlapping;
//       })
//     );
//   });

//   // Include the specified room if classId exists
//   if (classId && allRooms.includes(newGroupRoom)) {
//     return [...availableRooms, newGroupRoom];
//   }

//   // Return only the available rooms
//   return availableRooms;
// }, [watch("classes")]);

const subjects = [
  "Select Option",
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

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const addSession = (groupIndex: number) => {
    const newGroups = [...getValues('classes')]
    newGroups[groupIndex].groups.push({
      day: '',
      start: '',
      end: '',
      room: '',
    })
    form.setValue(`classes`,newGroups)
  }

  const updateSessionField = (groupIndex: number, sessionIndex: number, field: keyof Session, value: any) => {
    const newGroups = [...getValues('classes')]
    newGroups[groupIndex].groups[sessionIndex] = {
      ...newGroups[groupIndex].groups[sessionIndex],
      [field]: value
    }
   form.setValue('classes',newGroups) }

  const toggleField = (groupIndex: number,field: string,) => {
    const newGroups = [...getValues('classes')]
    
    const currentFields = newGroups[groupIndex].stream
    const updatedFields = currentFields.includes(field)
      ? currentFields.filter(f => f !== field)
      : [...currentFields, field]
    newGroups[groupIndex].stream = updatedFields
    console.log(newGroups);
    
   form.setValue(`classes`,newGroups)
  }
  const removeSession = (groupIndex: number, sessionIndex: number) => {
    const newGroups = [...getValues('classes')]
    newGroups[groupIndex].groups.splice(sessionIndex, 1)
    form.setValue('classes',newGroups)
  }
  const [schoolType, setSchoolType] = React.useState('');

  React.useEffect(() => {
    if(teacher.year){
      const year = teacher.year;


      if (JSON.stringify(middleSchoolYears) === JSON.stringify(year)) {
        setSchoolType('متوسط');
      } else if (JSON.stringify(highSchoolYears) === JSON.stringify(year)) {
        setSchoolType('high');
      } else if (JSON.stringify(universitySchoolYears) === JSON.stringify(year)) {
        setSchoolType('جامعي');
      } else if (JSON.stringify(priarySchoolYears) === JSON.stringify(year)) {
        setSchoolType('ابتدائي');
      } else if (JSON.stringify(languageSchoolYears) === JSON.stringify(year)) {
        setSchoolType('لغات');
      } else if (JSON.stringify(["تحضيري"]) === JSON.stringify(year)) {
        setSchoolType('تحضيري');
      } else {
        setSchoolType(''); // Default to empty or any other value you prefer
      }
    }
   
  }, [middleSchoolYears, highSchoolYears, universitySchoolYears, priarySchoolYears, languageSchoolYears,teacher]);
  
const handleSchoolTypeChange = (type) => {
  setSchoolType(type);

  let years;
  if (type === "متوسط") {
    years = middleSchoolYears;
  } else if (type === 'high') {
    years = highSchoolYears;
  } else if (type === "جامعي") {
    years = universitySchoolYears;
  }
 else if (type === "ابتدائي") {
  years = priarySchoolYears;
}
else if (type === "لغات") {
  years = languageSchoolYears;

}else if (type ===  "تحضيري") {
  years = [ "تحضيري"];
  
}
  if (years) {
    setValue('year', years);
  }
};





const [isOn, setIsOn] = React.useState(false); // Initialize with form value

  // Watch the started field to keep `isOn` in sync with form state
  

  const handleToggle = () => {
  
   setIsOn(prevState => !prevState);
   setValue('active', isOn);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[1400px]">
      <Form {...form} >
      <form >
        <DialogHeader>
          <DialogTitle>{t('edit-teacher')}</DialogTitle>
          <DialogDescription>
          {t('edit-your-teacher-here-click-save-when-youre-done')}
          </DialogDescription>
        </DialogHeader>

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
                      <FormLabel className="text-right">{t('name')}</FormLabel>
                      <FormControl><Input id="name"  className="col-span-3"  {...field}/></FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />


    <FormField
              control={control}
              name="birthdate"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('birth-date')}</FormLabel>
                  <FormControl>  
                    <CalendarDatePicker
            {...field}
            date={getValues("birthdate")}
            className="col-span-3"
            setDate={(selectedValue:any) => {
              if (selectedValue === undefined) {
                // Handle undefined case if needed
              } else {
                form.setValue('birthdate', selectedValue);
              }
            }}
          /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


    
   

<FormField
        control={control}
        name="year"
        render={({ field }) => (
          <FormItem className="grid grid-cols-4 items-center gap-4">
            <FormLabel className="text-right">{t('school-type')}</FormLabel>
            <FormControl>
              <Select
                onValueChange={(value) => handleSchoolTypeChange(value)}
                defaultValue={schoolType}
              >
                <SelectTrigger
                  id={`schoolType`}
                  aria-label={`Select School Type`}
                >
                  <SelectValue placeholder={t('select-school-type')} />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value= "تحضيري">{t('preSchool')}</SelectItem>
                <SelectItem value="ابتدائي">{t('primary')}</SelectItem>
                  <SelectItem value="متوسط">{t('middle-school')}</SelectItem>
                  <SelectItem value="high">{t('hight-school')}</SelectItem>
                  <SelectItem value="جامعي">{t('University')}</SelectItem>
                  <SelectItem value="لغات">{t('languages')}</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />


<FormField
  control={control}
  name="educational-subject"
  render={({ field }) => (
    <FormItem className="grid grid-cols-4 items-center gap-4">
      <FormLabel className="text-right">{t('educational-subject')}</FormLabel>
      <FormControl>
      <Select
   onValueChange={field.onChange}
   defaultValue={field.value}
              >
                                 <SelectTrigger
                              id={`subject`}
                              aria-label={`Select subject`}
                            >
                              <SelectValue placeholder={t('select-subject')} />
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
/>
    


  

    <FormField
              control={control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">{t('phone-number')}</FormLabel>
                  <FormControl><Input id="phoneNumber" className="col-span-3" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
<FormField
        control={control}
        name="paymentType"
        render={({ field }) => (
          <FormItem className="grid grid-cols-4 items-center gap-4">
            <FormLabel className="text-right">type de salaire</FormLabel>
            <FormControl>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <SelectTrigger
                  id={`paymentType`}
                  aria-label={`Select payment Type`}
                >
                  <SelectValue placeholder='type de salaire' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Salaire fixe</SelectItem>
                  <SelectItem value="percentage">Pourcentage</SelectItem>
                  <SelectItem value="hourly">
                  par séance</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

<FormField
  control={control}
  name={'amount'}
  render={({ field }) => {
    const paymentType:any=watch("paymentType");

    const label = paymentTypeOptions[paymentType] ;

    return (
      <FormItem className="grid grid-cols-4 items-center gap-4">
        <FormLabel className="text-right">{label}</FormLabel>
        <FormControl>
        <Input
  type="number"

  {...field}
  onChange={event => {
    const value = event.target.value;
    field.onChange(parseFloat(value)); // Convert to float
  }}
/>
        </FormControl>
        <FormMessage />
      </FormItem>
    );
  }}
/>;


    
  </div>

) : (
  <div className="w-full h-full">
    <ScrollArea className="h-[400px] w-full pr-4">
      {fields.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-xl font-bold">{group.name}</h3>
            <div>
              <FormField
                control={form.control}
                key={groupIndex}
                name={`classes.${groupIndex}.group`} // Use groupIndex to map fields correctly
                render={({ field }) => (
                  <FormItem className="w-32">
                    <FormLabel htmlFor={`group-code-${groupIndex}`} className="text-sm font-medium">Group Code:</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div>
                    <FormField
      control={form.control}
      name={`classes.${groupIndex}.paymentType`}
      render={({ field }) => (
        <FormItem className="w-[120px]">
          <FormLabel htmlFor={`group-code-${groupIndex}`} className="text-sm font-medium">type de payment:</FormLabel>
          <FormControl>
            <Select
     onValueChange={field.onChange}
     defaultValue={field.value}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Payment type" />
              </SelectTrigger>
              <SelectContent>
              {['monthly','session'].map((type) => (
                  <SelectItem key={type} value={type}>{t(type)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
        </FormItem>
      )}
    />
                    </div>
                    {watch(`classes.${groupIndex}.paymentType`) === 'monthly' && schoolType !== "تحضيري" && (
    <FormField
      control={form.control}
      name={`classes.${groupIndex}.numberOfSessions`}
      render={({ field }) => (
        <FormItem className="w-24">
          <FormLabel htmlFor={`group-code-${groupIndex}`} className="text-sm font-medium">
            Nombre de séances par mois:
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              id={`group-code-${groupIndex}`}  // Ensure ID matches label
              type="number"
              placeholder="Sessions"
              min={1}  // Only allow positive numbers
              onChange={event => field.onChange(+event.target.value)}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )}
  
                    <div>
                    <FormField
      control={form.control}
      name={`classes.${groupIndex}.amount`}
      render={({ field }) => (
        <FormItem className="w-24">
          <FormLabel htmlFor={`group-code-${groupIndex}`} className="text-sm font-medium">Montant:</FormLabel>
          <FormControl>
            <Input
              {...field}
              type="number"
              placeholder="Amount"
              onChange={event => field.onChange(+event.target.value)}
            />
          </FormControl>
        </FormItem>
      )}
    />
                    </div>
    {schoolType==="high" && (<div className="flex flex-col">
  
                    <Label htmlFor={`group-code-${groupIndex}`} className="text-sm font-medium">spécialité:</Label>
                    <DropdownMenu >
                              <DropdownMenuTrigger asChild       className="w-24">
                              <Button variant="outline" className="w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
    {/* {group.stream.length > 0 ? group.stream.join(', ') : 'Select Field'} */}
    <ChevronDown className="ml-2 h-4 w-4" />
  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56">
                              {['علوم تجريبية', 'تقني رياضي', 'رياضيات', 'تسيير واقتصاد ', 'لغات اجنبية ', 'اداب وفلسفة'].map((field) => (
                                         <DropdownMenuItem
                                         key={field}
                                         value={field}
                                         className={`flex items-center ${group.stream?.includes(field) ? 'selected' : ''}`}
                                         onClick={() =>toggleField(groupIndex,field) } 
                                         
                                       >
                                         <span className="mr-2"> { t(`${field}`)}</span>
                                         {group.stream?.includes(field) && <CheckIcon className="h-4 w-4 text-green-500" />}
                                       </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                    </div>)}
                    <div className="flex">
                    <FormField
      control={form.control}
      name={`classes.${groupIndex}.year`}
      render={({ field }) => (
        <FormItem className="w-[100px]">
          <FormLabel htmlFor={`group-code-${groupIndex}`} className="text-sm font-medium">Annee:</FormLabel>
          <FormControl>
            <Select
        onValueChange={field.onChange}
        defaultValue={field.value}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {watch("year").map((yearOption) => (
                  <SelectItem key={yearOption} value={yearOption}>{yearOption}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
        </FormItem>
      )}
    />
  
                    </div>
     
        <FormField
      control={form.control}
      name={`classes.${groupIndex}.active`}
      render={({ field }) => (
        <FormItem className="w-[100px]">
          <FormLabel htmlFor={`group-code-${groupIndex}`} className="text-sm font-medium">Active:</FormLabel>
          <FormControl>
          <Button 
                    type="button"
          onClick={()=>setValue(`classes.${groupIndex}.active`,!watch(`classes.${groupIndex}.active`))} 
          className={` ${watch(`classes.${groupIndex}.active`) ? 'bg-green-500' : 'bg-red-500'} text-white`}
        >
          {watch(`classes.${groupIndex}.active`) ? 'Turn Off' : 'Turn On'}
        </Button>
          </FormControl>
        </FormItem>
      )}
    />
        
                   {watch(`classes.${groupIndex}.active`)&&(
                    <FormField
                    control={form.control}
                    name={`classes.${groupIndex}.startDate`}
                    render={({ field }) => (
                      <FormItem className="w-[100px]">
                        <FormLabel htmlFor={`group-code-${groupIndex}`} className="text-sm font-medium">{t('start date')}:</FormLabel>
                        <FormControl>
                        <CalendarDatePicker
                            {...field}
                            date={getValues(`classes.${groupIndex}.startDate`)}
                            setDate={(selectedValue) => {
                              if (selectedValue === undefined) {
                                // Handle undefined case if needed
                              } else {
  
                                const startDate = selectedValue;
                                  const nextMonthDate = addMonths(startDate, 1);  // Get the date one month later
                              const nextPaymentDate = new Date(nextMonthDate.setDate(startDate.getDate()));  // Set the next month with the same day (e.g., 15th)
      
      // Update the form field with the selected start date and calculated next payment date
                     form.setValue(`classes.${groupIndex}.startDate`, startDate);
      form.setValue(`classes.${groupIndex}.nextPaymentDate`, nextPaymentDate);
  
      if (schoolType === "تحضيري") {
        // Calculate the number of Sunday to Thursday days between the start date and next payment date
        const workingDays = eachDayOfInterval({
          start: startDate,
          end: nextPaymentDate,
        }).filter(date => {
          const day = getDay(date);
          return day >= 0 && day <= 4;  // Sunday (0) to Thursday (4)
        });
        form.setValue(`classes.${groupIndex}.numberOfSessions`, workingDays.length);
      }
                
                
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                   )} 
        
                 
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeClass(groupIndex)}
                      className="ml-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Group
                    </Button>
          </div>
          <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('Day')}</TableHead>
                        <TableHead>{t('Start Time')}</TableHead>
                        <TableHead>{t('End Time')}</TableHead>
                        <TableHead>{t('Room')}</TableHead>
               
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.groups.map((session, sessionIndex) => (
                        <TableRow key={`${groupIndex}-${sessionIndex}`}>
                          <TableCell>
                            <Select
                              value={session.day}
                              onValueChange={(value) => updateSessionField(groupIndex, sessionIndex, 'day', value)}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                              <SelectContent>
                                {days.map((day) => (
                                  <SelectItem key={day} value={day}>{t(day)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                          <Select
                            onValueChange={(e)=>updateSessionField(groupIndex, sessionIndex, 'start', e)}
                            value={session.start}
                          >
              
                              <SelectTrigger
                                id={`start-${index}`}
                                aria-label={`Select start time`}
                              >
                                <SelectValue placeholder={t('select-start-time')} />
                              </SelectTrigger>
  
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          </TableCell>
                          <TableCell>
                          <Select
                            onValueChange={(e)=>updateSessionField(groupIndex, sessionIndex, 'end', e)}
                            value={session.end}
                          >
              
                              <SelectTrigger
                                id={`end-${index}`}
                                aria-label={`Select end time`}
                              >
                                <SelectValue placeholder={t('select-end-time')} />
                              </SelectTrigger>
  
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={session.room}
                              onValueChange={(value) => updateSessionField(groupIndex, sessionIndex, 'room', value)}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Select room" />
                              </SelectTrigger>
                              <SelectContent>
                              {
                              Array.from({ length: profile.NumberOfClasses }, (_, i) => `room ${i + 1}`).map((room) => (      
                                 <SelectItem key={room} value={room}>{room}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeSession(groupIndex, sessionIndex)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))} 
                    </TableBody>
                  </Table>
                   <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={() => addSession(groupIndex)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Session
                  </Button> 
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="mt-4 w-full"
        onClick={() => {
          appendClass({
            name: `Group ${fields.length + 1}`,
            group: '',
            groups:[],
            numberOfSessions:schoolType === "تحضيري"?24:0,
            amount: 0,
            stream: schoolType === 'high'?[]:[schoolType],
            year: '',
            paymentType: '',
            startDate:new Date(),
            active:false
          
          });
        }}
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        {t('Add New Group')}
      </Button>
    </ScrollArea>
  </div>
  )}
              </div>
            </Step>
          )
        })}
        <Footer formData={getValues()} form={form} isSubmitting={isSubmitting} reset={reset} teacher={teacher}/>

      </Stepper>

    </div>
    </form>
    </Form>
      </DialogContent>
    </Dialog>
  )
}
export default EditTeacher;
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getNextPaymentDate(sessions: Session[], classStartDate: Date, numberOfSessions: number): Date {
  // Step 1: Find the last session of the week
  const lastSession = sessions.reduce((last, current) => {
    return daysOfWeek.indexOf(current.day) > daysOfWeek.indexOf(last.day) ? current : last;
  });

  // Step 2: Calculate the date of the last session in the first week
  const classStartWeekStart = startOfWeek(classStartDate);

  // Find the date for the last session in the first week
  let lastSessionDate = new Date(classStartWeekStart);
  while (getDay(lastSessionDate) !== daysOfWeek.indexOf(lastSession.day)) {
    lastSessionDate.setDate(lastSessionDate.getDate() + 1);
  }

  // Set the start time for the session
  const [startHours, startMinutes] = lastSession.end.split(':').map(Number);
  lastSessionDate.setHours(startHours, startMinutes);

  // Step 3: Calculate the sessions to move forward based on numberOfSessions and sessions.length
  const weeksToAdd = Math.floor(numberOfSessions / sessions.length)-1;

  // Step 4: Move forward the calculated number of weeks
  const nextPaymentDate = addWeeks(lastSessionDate, weeksToAdd);

  return nextPaymentDate;
}
function adjustStartDateToFirstSession(startDate: Date, sessions: Session[]): Date {
  // Step 1: Find the first session of the week
  const firstSession = sessions.reduce((first, current) => {
    return daysOfWeek.indexOf(current.day) < daysOfWeek.indexOf(first.day) ? current : first;
  });

  // Step 2: Get the start time of the first session
  const [sessionHours, sessionMinutes] = firstSession.start.split(':').map(Number);

  // Step 3: Adjust only the hours and minutes of the start date
  let adjustedDate = new Date(startDate);
  adjustedDate = setHours(adjustedDate, sessionHours);
  adjustedDate = setMinutes(adjustedDate, sessionMinutes);

  // Step 4: Add one hour to the adjusted time
  adjustedDate = addHours(adjustedDate, 1);

  return adjustedDate;
}
const Footer: React.FC<FooterProps> = ({ formData, form, isSubmitting,reset,teacher}) => {
  const user = useUser()

  const t=useTranslations()

  const {
    nextStep,
    prevStep,
    resetSteps,
    isDisabledStep,
    hasCompletedAllSteps,
    isLastStep,
    isOptionalStep,
  } = useStepper()
  
  const  {setTeachers,classes,setClasses,setStudents}= useData()





  function compareClasses(oldClasses,newClasses): UpdateResult {
    const updated=[]
    const oldClassIds = oldClasses.map(cls => cls.id);
    const newClassIds = newClasses.map(cls => cls.id);
  
    // Find added classes
    const addedClasses = newClasses.filter(cls => !oldClassIds.includes(cls.id));
  
    // Find removed classes
    const removedClasses = oldClasses.filter(cls => !newClassIds.includes(cls.id));
    
    newClasses.forEach(newCls => {
      if (oldClassIds.includes(newCls.id)) {
        updated.push(newCls);
      }
    });
  
    return { addedClasses, removedClasses, updatedClasses: updated };

}

  async function processStudentChanges(result) {
    const { addedClasses, removedClasses, updatedClasses } = result;
  
    // Add students to classes
    if (addedClasses && Array.isArray(addedClasses)) {
      for (const clss of addedClasses) {
        const day= adjustStartDateToFirstSession(clss.startDate, clss.groups);
        
        const clssId = await addGroup({
          ...clss,
          year: clss.year,
          students: [],
          reimbursements: [],
          teacherUID: formData.id,
          teacherName: formData.name,
          subject: formData["educational-subject"],
          startDate:formData["educational-subject"] != "تحضيري"?day:clss.startDate,
          nextPaymentDate:formData["educational-subject"] != "تحضيري"?getNextPaymentDate(clss.groups, day,clss.numberOfSessions):clss.nextPaymentDate,
          active:clss.active
        }, formData.id,user);

        setClasses(prevClasses => [
          ...prevClasses,
          {
            ...clss,
            id: clssId,
            Attendance: {},
            students: [],
            reimbursements: [],
            subject: formData['educational-subject'],
            startDate:formData["educational-subject"] != "تحضيري"?day:clss.startDate,
            nextPaymentDate:formData["educational-subject"] != "تحضيري"?getNextPaymentDate(clss.groups, day,clss.numberOfSessions):clss.nextPaymentDate,
            teacherName: formData.name,
            teacherUID: formData.id
          }
        ]);
    
        setTeachers(prevTeachers =>
          prevTeachers.map(tchr =>
            tchr.id === formData.id
              ? {
                  ...tchr,
                  classes: [
                    ...tchr.classes,
                    {
                      ...clss,
                      id: clssId,
                      Attendance: {},
                      students: [],
                      reimbursements: [],
                      subject: formData['educational-subject'],
                      teacherName: formData.name,
                      teacherUID: formData.id,
                      startDate:formData["educational-subject"] != "تحضيري"?day:clss.startDate,
                      nextPaymentDate:formData["educational-subject"] != "تحضيري"?getNextPaymentDate(clss.groups, day,clss.numberOfSessions):clss.nextPaymentDate,
                    }
                  ],
                  groupUIDs: [...tchr.groupUIDs, clssId]  // Correctly add the new group UID
                }
              : tchr
          )
        );
      }
    }
  
  //   // Remove students from classes
    if (removedClasses && Array.isArray(removedClasses)) {
      for (const clss of removedClasses) {
        await removeGroupFromDoc(clss,clss.students)
          
       setClasses(prevClasses => prevClasses.filter(cls => cls.id === clss.id));
       setTeachers(prevTeachers =>
    prevTeachers.map(tchr =>
      tchr.id === teacher.id
        ? {
           ...formData,classes:tchr.classes.filter((cls)=>cls.id!=clss.id),groupUIDs:tchr.groupUIDs.filter((grp)=>grp!=clss.id)
          }
        : tchr
    )
  );


  setStudents(prevStudents =>
    prevStudents.map(std => {
      if (clss.students.some(st => st.id === std.id)) {
        // If the student is in studentsToRemove, update their classes
        return {
          ...std,
          classes: std.classes.filter(cls => cls.id !=clss.id),
          classesUIDs:std.classesUIDs.filter(cls => cls.id !=clss.id),
        };
      }
      return std; // Return the student as is if not in studentsToRemove
    })
  );

  
        }
      }
  
      if (updatedClasses && Array.isArray(updatedClasses)) {
        for (const classupdate of updatedClasses) {  
          const day=adjustStartDateToFirstSession(classupdate.startDate, classupdate.groups)   
          const a=classes.find(cls=>cls.id===classupdate.id)

          
          const classesDetailes=a.active
          if (classesDetailes===false && classupdate.active===true){
            const newClass = {
              ...classupdate,
              startDate: classupdate.active 
                ? formData["educational-subject"] != "تحضيري"?day:classupdate.startDate
                : classupdate.startDate,
              ...(classupdate.active && {
                nextPaymentDate:formData["educational-subject"] != "تحضيري"?getNextPaymentDate(classupdate.groups, day,classupdate.numberOfSessions):classupdate.nextPaymentDate,
              }),
            };
            const updatedStudents =classupdate.students.map(std => ({
              ...std,
              nextPaymentDate:formData["educational-subject"] != "تحضيري"?getNextPaymentDate(classupdate.groups, day,classupdate.numberOfSessions):classupdate.nextPaymentDate,
            }));
            await updateClassGroup(classupdate.id,newClass);
            await activateStudents(classupdate.id,updatedStudents)
            setClasses(prevClasses =>
              prevClasses.map(cls => {
                if (cls.id === newClass.id) {
                  return {...newClass};
                }
                return cls;
              })
            );
            setTeachers(prevTeachers =>
              prevTeachers.map(cls => {
                if (cls.id === teacher.id) {
                  return {
                    ...cls,
                    classes: cls.classes.map(cls =>
                      cls.id === newClass.id ? {...newClass } : cls
                    )
                  };
                }
                return cls;
              })
            );
            setStudents(prevStudents =>
              prevStudents.map(std => {
                if (newClass.students.some(st => st.id === std.id)) {
                  // If the student is in studentsToRemove, update their classes
                  return {
                    ...std,
                    classes: std.classes.map(cls =>
                      cls.id === newClass.id? {...newClass } : cls
                    )
                  };
                }
                return std; // Return the student as is if not in studentsToRemove
              })
            );
          }    
          if (classesDetailes===false && classupdate.active===false){
            const newClass = {
              ...classupdate,
            };
            await updateClassGroup(classupdate.id,newClass);
            setClasses(prevClasses =>
              prevClasses.map(cls => {
                if (cls.id === newClass.id) {
                  return {...newClass};
                }
                return cls;
              })
            );
            setTeachers(prevTeachers =>
              prevTeachers.map(cls => {
                if (cls.id === teacher.id) {
                  return {
                    ...cls,
                    classes: cls.classes.map(cls =>
                      cls.id === newClass.id ? {...newClass } : cls
                    )
                  };
                }
                return cls;
              })
            );
            setStudents(prevStudents =>
              prevStudents.map(std => {
                if (newClass.students.some(st => st.id === std.id)) {
                  // If the student is in studentsToRemove, update their classes
                  return {
                    ...std,
                    classes: std.classes.map(cls =>
                      cls.id === newClass.id? {...newClass } : cls
                    )
                  };
                }
                return std; // Return the student as is if not in studentsToRemove
              })
            );
          }
          if(classesDetailes===true && classupdate.active===true){
            const day=adjustStartDateToFirstSession(classupdate.startDate, classupdate.groups) 
            const newClass = {
              ...classupdate,
              startDate: classupdate.active 
              ? formData["educational-subject"] != "تحضيري"?day:classupdate.startDate
              : classupdate.startDate,
            ...(classupdate.active && {
              nextPaymentDate:formData["educational-subject"] != "تحضيري"?getNextPaymentDate(classupdate.groups, day,classupdate.numberOfSessions):classupdate.nextPaymentDate,
              }),
            };
            const updatedStudents =classupdate.students.map(std => ({
              ...std,
              nextPaymentDate:formData["educational-subject"] != "تحضيري"?getNextPaymentDate(classupdate.groups, day,classupdate.numberOfSessions):classupdate.nextPaymentDate,
            }));
            await updateClassGroup(classupdate.id,newClass);
            await activateStudents(classupdate.id,updatedStudents)
            setClasses(prevClasses =>
              prevClasses.map(cls => {
                if (cls.id === newClass.id) {
                  return {...newClass};
                }
                return cls;
              })
            );
            setTeachers(prevTeachers =>
              prevTeachers.map(cls => {
                if (cls.id === teacher.id) {
                  return {
                    ...cls,
                    classes: cls.classes.map(cls =>
                      cls.id === newClass.id ? {...newClass } : cls
                    )
                  };
                }
                return cls;
              })
            );
            setStudents(prevStudents =>
              prevStudents.map(std => {
                if (newClass.students.some(st => st.id === std.id)) {
                  // If the student is in studentsToRemove, update their classes
                  return {
                    ...std,
                    classes: std.classes.map(cls =>
                      cls.id === newClass.id? {...newClass } : cls
                    )
                  };
                }
                return std; // Return the student as is if not in studentsToRemove
              })
            );
          } 
        
        }
    }
  }
  const {toast}=useToast()
  const onSubmit = async(data:Teacher) => {
  const result=compareClasses(teacher.classes,data.classes)

  
  await processStudentChanges(result)
    const { classes, ...teacherData } = data;

  // Ensure only name, year, birthdate, and phone number are updated
  const teacherInfoToUpdate = {
    name: teacherData.name,
    year: teacherData.year,
    birthdate: teacherData.birthdate,
    phoneNumber: teacherData.phoneNumber,
    paymentType:teacherData.paymentType
  };

  toast({
    title: "Teacher Updated!",
    description: `The Teacher, ${data.name} info are updated `,
  });
  // Update the teacher in Firestore
  await updateTeacher(teacherInfoToUpdate,teacher.id,user);
  setTeachers((prev: Teacher[]) => 
  prev.map(t => t.id === teacher.id ? { ...t, ...teacherInfoToUpdate } : t)
);
  nextStep()
    
  };


  return (
    <>
      {hasCompletedAllSteps && (
      <div className="flex items-center justify-center">
      <div className="rounded-md bg-green-50 p-6 w-full max-w-md">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CircleCheckIcon className="h-7 w-7 text-green-400" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-green-800">{t('teacher-edited-successfully')}</h3>
          
          </div>
        </div>
      </div>
    </div>
    
      )}
      <div className="w-full flex justify-end gap-2">
        {hasCompletedAllSteps ? (
                 <DialogFooter>
                     <DialogClose asChild>
         
          
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
              {t('prev')}
            </Button>
            {isLastStep?(        <LoadingButton size="sm"    loading={isSubmitting}        type={'submit'}   onClick={form.handleSubmit(onSubmit)}>
            {t('finish')}
            </LoadingButton>):(        <Button size="sm"            type={"button"}    onClick={nextStep}>
              {isLastStep ? "Finish" : isOptionalStep ? "Skip" : "Next"}
            </Button>)}
    
          </>
        )}
      </div>
    </>
  )

        }

function CheckIcon(props:any) {
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
          )
        }


        function CircleCheckIcon(props:any) {
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
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          )
        }
        