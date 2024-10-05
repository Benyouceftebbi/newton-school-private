
import React, { useRef } from "react";
import {addProfile} from "@/lib/hooks/profile"
import { useData } from "@/context/admin/fetchDataContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import ImageUpload from "@/app/[locale]/(home)/students/components/uploadFile";

import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { uploadFilesAndLinkToCollection } from "@/context/admin/hooks/useUploadFiles";

import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import  {profileFormSchema}  from "@/validators/general-info";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loadingButton";
import OpenDaysTable from "../../components/open-days-table";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProfileFormValues = z.infer<typeof profileFormSchema>;




export function ProfileForm() {
  const languages = [
 
    { code: "ar", name: "Arabe" },
    { code: "fr", name: "Francais" },
   
  ]
const [filesToUpload, setFilesToUpload] = React.useState<FileUploadProgress[]>([]);
const t=useTranslations()
  const form = useForm<any>({
    //resolver: zodResolver(profileFormSchema),
    defaultValues: {
      bio:  "I own a computer.",
      urls:  [
        { value: "https://shadcn.com" },
        { value: "http://twitter.com/shadcn" },
      ],
      schoolName:  "Sample School",
      email:  "salah@email.com",
      phoneNumber:  "+1 1234567890",
      capacity: 500,
      nationalRanking:  10,
      address:  "123 Main St, City, Country",
      openDays:  [
        { day: "Monday", start: "09:00", end: "17:00", state: "open" },
        { day: "Tuesday", start: "09:00", end: "17:00", state: "open" },
        { day: "Wednesday", start: "09:00", end: "17:00", state: "open" },
        { day: "Thursday", start: "09:00", end: "17:00", state: "open" },
        { day: "Friday", start: "09:00", end: "17:00", state: "open" },
        { day: "Saturday", start: "10:00", end: "14:00", state: "open" },
        { day: "Sunday", start: "07:00", end: "18:00", state: "open" }
      ],
      classNames : [
        "Class A",
      ]
    }

  });

  const { fields: fields, append: append } = useFieldArray({
    control: form.control,
    name: "urls",
  });
  const { fields: classNames, append: appendClass } = useFieldArray({
    control: form.control,
    name: "classNames",
  });
  const { fields: openDays } = useFieldArray({
    control: form.control,
    name: "openDays",
  });
  


  const { reset,formState, setValue, getValues,control,watch} = form;
  const {profile,setProfile}=useData()
  React.useEffect(() => {
    reset(profile)
    console.log("reset",profile);
    
  }, [profile,reset])
  

  const {toast} = useToast()
  const onSubmit = async(data:any) => {
    await addProfile(data)
    setProfile({...data,id:"GeneralInformation"})
    toast({
      title: t('changes-applied-1'),
      description: t(`changes-applied-Successfully`),
    });
    console.log(data);


 
  }
 
 /* function onSubmit(data: ProfileFormValues) {

    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }
*/
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* School name field */}
        <FormField
          control={form.control}
          name="schoolName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('school-name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('enter-your-school-name')} {...field} />
              </FormControl>
              <FormDescription>
                {t('this-is-the-name')} </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

<FormField
          control={form.control}
          name="RegistrationFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('registration-fee')}</FormLabel>
              <FormControl>
              <Input type="number" placeholder="500 DA" {...field} onChange={event => field.onChange(+event.target.value)} />
              </FormControl>
              <FormDescription>
                {t('this-is-the-registration-fee')} </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

<FormField
          control={form.control}
          name="NewCardFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('new-card-fee')}</FormLabel>
              <FormControl>
              <Input type="number" placeholder="350 DA" {...field} onChange={event => field.onChange(+event.target.value)} />
              </FormControl>
              <FormDescription>
                {t('new-card-fee')} </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
       <FormField
  control={form.control}
  name="NumberOfClasses"
  render={({ field }) => {
    const [initialValue, setInitialValue] = React.useState<number | null>(null);

    React.useEffect(() => {
      // Set the initial value when the field is first rendered or has a value
      if (field.value && initialValue === null) {
        setInitialValue(field.value);
      }
    }, [field.value, initialValue]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = +event.target.value;

      // Prevent reducing the value below the initial one
      if (initialValue !== null && newValue < initialValue) {
        return; // Ignore the change
      }

      field.onChange(newValue);

      // Update the initial value if it's still null
      if (initialValue === null) {
        setInitialValue(newValue);
      }
    };

    return (
      <FormItem>
        <FormLabel>{t('NumberOfClasses')}</FormLabel>
        <FormControl>
          <Input
            type="number"
            placeholder="8 Classes"
            {...field}
            onChange={handleInputChange}
            min={initialValue ?? 1} // Optional: Set a minimum value if needed
          />
        </FormControl>
        <FormDescription>
          {t('this-is-the-number-of-classes')}
        </FormDescription>
        <FormMessage />
      </FormItem>
    );
  }}
/>

        {/* Email field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('email')}</FormLabel>
              <FormControl>
                <Input placeholder={t('enter-your-school-name')} {...field} />
              </FormControl>
              <FormDescription>
                {t('this-is-the-email')} </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bio field */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('bio')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('tell-us-a-little-bit-about-yourself')}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t('you-can')} <span>@mention</span> {t('other-users-and-organizations-to-link-to-them')} </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone number field */}
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('phonen-number')}</FormLabel>
              <FormControl>
                <Input placeholder="+1 1234567890" {...field}/>
              </FormControl>
              <FormDescription>
                {t('the-phone-number-should-be-in-the-format-country-code-number')} </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Capacity field */}
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Capacity')}</FormLabel>
              <FormControl>
                <Input type="number" placeholder="500" {...field} onChange={event => field.onChange(+event.target.value)}/>
              </FormControl>
              <FormDescription>
                {t('This-is-the-maximum-capacity-for-your-school-or-organization.')} </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* National ranking field */}
        <FormField
          control={form.control}
          name="nationalRanking"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('national-ranking')}</FormLabel>
              <FormControl>
                <Input type="number" placeholder="10" {...field} onChange={event => field.onChange(+event.target.value)}/>
              </FormControl>
              <FormDescription>
                {t('This-is-the-national-ranking')} </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address field */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('address')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="123 Main St, City, Country"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t('this-is-the-address-of-your-school-or-organization.')} </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
 {!watch('photo') ? (
        <div className="w-[300px] items-center justify-center flex flex-col">
          
          <img src={watch('photo')} alt="Captured photo" className='w-[300px] h-auto object-cover rounded-lg' />
          <div className="flex gap-2">

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
<div className="space-y-4">
<FormField
             
                  control={form.control}
                  name={"ticketLanguage"}
                  render={({ field }) => (
                    <FormItem style={{ marginBottom: 15 }}>
                      <FormLabel>{t('ticket-language')}</FormLabel>
                      <FormControl>
                      <Select {...field} value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {t(lang.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
          
        </div>
        {/* URL fields */}
        <div>
          {fields.map((field, index) => (
            <FormField
              control={form.control}
              key={field.id}
              name={`urls.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(index !== 0 && "sr-only")}>
                    {t('URLs')} </FormLabel>
                  <FormDescription className={cn(index !== 0 && "sr-only")}>
                    {t('add-links-to-your-website')} </FormDescription>
                  <FormControl>
                    <Input {...field} />
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
            onClick={() => append({ value: "" })}
          >
            {t('add-url')} </Button>
        </div>
        <div>
          {/*classNames.map((field, index) => (
            <FormField
              control={form.control}
              key={index}
              name={`classNames.${index}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(index !== 0 && "sr-only")}>
                   {t('classes')} </FormLabel>
                  <FormDescription className={cn(index !== 0 && "sr-only")}>
                    {t('add-class-room-name')} </FormDescription>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              ))*/}
         {/* <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => appendClass("")}
          >
            {t('add-classroom')} </Button>
            */}
        </div>
          <OpenDaysTable openDays={openDays} form={form}/>
          {/* <ImageUpload filesToUpload={filesToUpload} setFilesToUpload={setFilesToUpload}/> */}

        <LoadingButton  
         loading={form.formState.isSubmitting}
>{t('update-profile-0')}</LoadingButton>
      </form>
    </Form>
  );
}
