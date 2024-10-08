
"use client"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DataTableDemo } from "./components/table"
import PaymentForm from "./components/paymentForm"
import { Overview } from "./components/area-chart"
import { useTranslations } from "next-intl"
import { useData } from "@/context/admin/fetchDataContext";
import { Button } from "@/components/ui/button"
import { db } from "@/firebase/firebase-config";

import { addDoc, collection, doc, getDoc, increment, setDoc, updateDoc, arrayUnion} from "firebase/firestore";

 function Payouts() {


  
  const t=useTranslations()
  const { analytics,classes,students}= useData()
  const total_expences = analytics.totalExpenses
  const total_payouts =(total_expences-analytics.teachersExpenses)
const pecentage = (((total_expences-analytics.teachersExpenses)/total_expences)*100).toFixed(2)



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
  

    <div className="flex flex-row min-h-screen w-full flex-col ">
<Button type="submit" onClick={() => updateStudentAddedAtAndSave(classes, students)}></Button>
      <div className="flex flex-col sm:gap-4 sm:py-4 ">
   
        <div className="grid flex items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
          <div className="flex grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
      
              <Card
                x-chunk="dashboard-05-chunk-0"
              >
      <CardHeader className="pb-2">
      <CardDescription>{t('payments')}</CardDescription>
                  <Overview/>
           
           
                </CardHeader>
              </Card>
              <Card x-chunk="dashboard-05-chunk-1">
                <CardHeader className="pb-2">
                  <CardDescription>{t('total-expences')}</CardDescription>
                  <CardTitle className="text-4xl">{total_expences} DZD </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                  {t('this-year')} </div>
                </CardContent>
                <CardFooter>
                  <Progress value={80} aria-label="25% increase" />
                </CardFooter>
              </Card>
              <Card x-chunk="dashboard-05-chunk-2">
                <CardHeader className="pb-2">
                  <CardDescription>{t('total-payouts')}</CardDescription>
                  <CardTitle className="text-4xl">{total_payouts} DZD</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                  {t('this-year')}</div>
                </CardContent>
                <CardFooter>
                  <Progress value={67} aria-label="12% increase" />
                </CardFooter>
              </Card>
              <Card x-chunk="dashboard-05-chunk-2">
                <CardHeader className="pb-2">
                  <CardDescription>{t('avreage-expences')}</CardDescription>
                  <CardTitle className="text-4xl">{pecentage} %</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    {t('per-month')} </div>
                </CardContent>
                <CardFooter>
                  <Progress value={67} aria-label="12% increase" />
                </CardFooter>
              </Card>
            </div>
      
        
         
          <DataTableDemo />
        

          </div>

          <PaymentForm />


       




        </div>
      </div>
    </div>
 
  )
}
export default Payouts