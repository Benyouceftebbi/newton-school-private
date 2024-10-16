
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import levelSchema from '@/validators/level';
import { LoadingButton } from '@/components/ui/loadingButton';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Level } from './levels-table';
import CalendarDatePicker from "../../../students/components/date-picker";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusCircle } from "lucide-react";
import { updateLevel } from "@/lib/hooks/levels";
import React from "react";
import { useData } from "@/context/admin/fetchDataContext";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type LevelFormValues = z.infer<typeof levelSchema> & {value:string;label:string,classes:string[]};
interface SheetDemoProps {
    level: Level;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    open: boolean; 
}




const EditFormSheetDemo: React.FC<SheetDemoProps> = ({ level,setOpen,open }) => {
  const t=useTranslations()
  const objectOptions = [
    { value: 'math', label: t('Mathematics') },
    { value: 'english', label: t('English') },
    { value: 'arabic', label: t('Arabic_Language') },
    { value: 'physics', label: t('physics') },
    { value: 'science', label: t('science') },
    { value: 'history', label: t('history') },
    { value: 'geography', label: t('geography')},
    { value: 'art', label: t('art') },
    { value: 'music', label: t('music') },
    { value: 'physical_education', label: t('physical-education') },
    { value: 'ict', label: t('ict-information-and-communication-technology') },
    {value:'islamic_education',label:t('Islamic_Education')},
    {value:'scientific_activities',label:t('Scientific_Activities')},
    {value:'art',label:t('Artistic_Education_and_Technological_Alertness')},
    {value:'social_science',label:t('Social_Sciences')},
    {value:'french',label:t("French_Language")}
  
  ];
  const {setLevels}=useData()
  const form = useForm<LevelFormValues>({
    //resolver: zodResolver(levelSchema),
    defaultValues:{ id: "1",
        level: "Kindergarten",
        start: new Date("2024-09-01"),
        end: new Date("2025-06-30"),
        fee: 1000,
        status: "open",
        registrationDeadline: new Date("2024-08-15"),
        registrationAndInsuranceFee:0,
        feedingFee:0,
        subjects:[{value:'',label:''}],
        classes:[],
        prices:[]}
  });
  const {toast}=useToast()
  const { reset, handleSubmit, control, formState,getValues,setValue,register} = form;
  const {isSubmitting}=formState
  const periodOptions = Array.from({ length: 12 }, (_, index) => `${index + 1} month`);


//reset useform default values on each new level
  React.useEffect(() => {
    reset(level)
 }, [level,reset])

  const { fields:subjects, append:appendSubject,remove:removeSubject} = useFieldArray({
    control: form.control,
    name: "subjects",
  });
  const { fields:prices, append:appendPrice,remove:Price, } = useFieldArray({
    control: form.control,
    name: "prices",
  });
  const { fields: fields, append: append,remove:removeClass } = useFieldArray({
    control: form.control,
    name: "classes",
  });
  const onSubmit =async (data:LevelFormValues ) => {
    const {value, label, ...updatedData} = data;
    await updateLevel(updatedData,data.id)
    setLevels((prev:any) => {
      const updatedLevels = prev.map((level:Level) =>
        level.id === data.id ? data : level
      );
      return updatedLevels;
    });
    toast({
      title: t('changes-applied-1'),
      description: t(`changes-applied-Successfully`),
    });
    console.log(data);
    
    reset()
    setOpen(false)
 
  }
  const handleChangePrice = (index:number, newPrice:number) => {
    const newPrices = [...getValues('prices')]; // Get the current prices array
    newPrices[index].price = newPrice; // Update the price at the specified index
    setValue('prices', newPrices); // Set the updated prices array in the form
  };
  const handleChangePeriod = (index:number, newPrice:string) => {
    console.log("wqeqeqwe");
    const newPrices = [...getValues('prices')]; // Get the current prices array
    newPrices[index].period = newPrice; // Update the price at the specified index
    setValue('prices', newPrices); // Set the updated prices array in the form
  };
  return (
    <Sheet open={open} onOpenChange={setOpen}>
  <SheetContent className="sm:max-w-[650px]">
    <ScrollArea className="h-screen  ">

      <SheetHeader>
        <SheetTitle>{t('edit-new-level')}</SheetTitle>
        <SheetDescription>
          {t('enter-the-new-details-for-the-level-including-price-and-subjects-of-study')} </SheetDescription>
      </SheetHeader>


      <Form {...form}>
  <form  className="grid gap-4 py-4" onSubmit={handleSubmit(onSubmit)}>
    {/* Input fields */}
    <FormField
      control={control}
      name="level"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('level')}</FormLabel>
          <FormControl>
            <Input {...field} placeholder={t('enter-level-name')} />
          </FormControl>
          <FormDescription>{t('this-is-the-name-of-the-level')}</FormDescription>

          <FormMessage />
        </FormItem>
      )}
    />
    
    <FormField
      control={control}
      name="start"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('start-date-0')}</FormLabel>
          <FormControl>
            
          <CalendarDatePicker
            {...field}
   
              date={new Date(getValues("start"))}
              setDate={(selectedValue) => {
              if (selectedValue === undefined) {
          // Handle undefined case if needed
             } else {
                  form.setValue("start", selectedValue);
                }
      }}
    />
          </FormControl>
          <FormDescription>{t('this-is-the-start-date-of-the-level')}</FormDescription>

          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="end"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('end-date')}</FormLabel>
          <FormControl>
            
          <CalendarDatePicker
            {...field}

              date={new Date(getValues("end"))}
              setDate={(selectedValue) => {
              if (selectedValue === undefined) {
          // Handle undefined case if needed
             } else {
                  form.setValue("end", selectedValue);
                }
      }}
    />
          </FormControl>
          <FormDescription>{t('this-is-the-end-date-of-the-level')}</FormDescription>

          <FormMessage />
        </FormItem>
      )}
    />
  
  <FormField
      control={control}
      name="registrationDeadline"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('deadline')}</FormLabel>
          <FormControl>
            
          <CalendarDatePicker
            {...field}
        
              date={new Date(getValues("registrationDeadline"))}
              setDate={(selectedValue) => {
              if (selectedValue === undefined) {
          // Handle undefined case if needed
             } else {
                  form.setValue("registrationDeadline", selectedValue);
                }
      }}
    />
          </FormControl>
          <FormDescription>{t('this-is-the-registration-deadline-date-of-the-level')}</FormDescription>

          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="fee"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('price')}</FormLabel>
          <FormControl>
            <Input {...field} placeholder={t('enter-price')}  type="number"  onChange={event => field.onChange(+event.target.value)}/>
          </FormControl>
          <FormDescription>{t('this-is-the-fee-for-the-level')}</FormDescription>

          <FormMessage />
        </FormItem>
      )}
    />
        <FormField
            control={control}
            name="registrationAndInsuranceFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('registration-and-insurance-fee')}</FormLabel>
                <FormControl>
                <Input {...field} placeholder={t('enter-price')}  type="number"  onChange={event => field.onChange(+event.target.value)}/>
                </FormControl>
                <FormDescription>{t('this-is-a-fee-for-registration-and-insurance')}</FormDescription>

                <FormMessage />
              </FormItem>
            )}
          />
                    <FormField
            control={control}
            name="feedingFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('feeging-fee')}</FormLabel>
                <FormControl>
                <Input {...field} placeholder={t('enter-price')}  type="number"  onChange={event => field.onChange(+event.target.value)}/>
                </FormControl>
                <FormDescription>{t('this-is-a-fee-for-food-such-as-lunch')}</FormDescription>

                <FormMessage />
              </FormItem>
            )}
          />  
    <FormField
            control={control}
            name="prices"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('payment-methods')}</FormLabel>
                <FormDescription>{t('add-how-parents-are-going-to-pay')}</FormDescription>
                <Table>
  <TableHeader>
    <TableRow>
      <TableHead>{t('name')}</TableHead>
      <TableHead>{t('period')}</TableHead>
      <TableHead>{t('price')}</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>

                {prices.map((option,index) => (
        
        
                    <TableRow key={index}>
                    <TableCell className="font-semibold">
                 
              <Input
                placeholder={t('enter-method-name')}
                defaultValue={option.name}
                {...register(`prices.${index}.name`)}
              />
 
            </TableCell>
            <TableCell>

              <Select
              defaultValue={option.period}
              onValueChange={(e) =>handleChangePeriod(index,e)}
              >
                                 <SelectTrigger
                              id={`period-${index}`}
                              aria-label={`Select period`}
                            >
                              <SelectValue placeholder={t('select-period')} />
                            </SelectTrigger>
            <SelectContent>
 
                            {periodOptions.map((time) => (
                              <SelectItem key={time} value={time}   >
                                {time}
                              </SelectItem>
                            ))}
           
                          </SelectContent>
              </Select>
    
            </TableCell>
            <TableCell>
      
              <Input
               placeholder={t('enter-price')}
               type="number"
               value={option.price}
               onChange={(e) => handleChangePrice(index, parseInt(e.target.value))}

              />
  
            </TableCell>
      </TableRow>
    

                ))}
         
         </TableBody>
</Table>
<Button type='button' size="sm" variant="ghost" className="gap-1 w-full"  onClick={() => appendPrice({name: '', period:'',price:0})}>
                      <PlusCircle className="h-3.5 w-3.5" />
                      {t('add-level')} </Button>
                <FormMessage />
              </FormItem>
            )}
          />
                    <div>
   {fields.map((field, index) => (
            <FormField
              control={form.control}
              key={field.id}
              name={`classes.${index}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(index !== 0 && "sr-only")}>
                    {t('classes')} </FormLabel>
                  <FormDescription className={cn(index !== 0 && "sr-only")}>
                 {t('add-classes-to-this-level')} </FormDescription>
                  <FormControl>
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input {...field} />
                    <Button  type="button" variant="destructive" onClick={()=>removeClass(index)}>{t('remove')}</Button>
    </div>

                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
                   <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => append("")}
          >
            {t('add-class-0')} </Button>
        </div>
    {/* Checkboxes for Objects of Study */}
    <FormField
      control={control}
      name="subjects"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('subjects-of-study')}</FormLabel>
          <FormDescription>{t('select-the-subjects-for-this-level')}</FormDescription>
          <div className="grid grid-cols-2 gap-4">
          {objectOptions.map((option) => (
            <div key={option.value} className="flex flex-row items-start space-x-3">
              <FormControl>
                <Checkbox
                  
                  checked={subjects.some(obj => obj.value === option.value)}
           
                  onCheckedChange={(checked) => {
                    if (checked) {
                      appendSubject({ value: option.value,label:option.label });
                    } else {
                      const indexToRemove = subjects.findIndex(obj => obj.value === option.value);
                      if (indexToRemove !== -1) {
                        removeSubject(indexToRemove);
                      }
                    }
                  }}
                  
                />
              </FormControl>
              <FormLabel>{option.label}</FormLabel>
            </div>
          ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <SheetFooter className="pb-20">
            <SheetClose asChild>
              <LoadingButton
                loading={isSubmitting}
                type="submit"
            
              >
                {t('save-changes')} </LoadingButton>
            </SheetClose>
          </SheetFooter>
  </form>
</Form>

          </ScrollArea>
    </SheetContent>
  </Sheet>
);
}
export default EditFormSheetDemo