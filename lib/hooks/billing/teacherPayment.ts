

import { db } from "@/firebase/firebase-config"
import { addDoc, collection, deleteDoc, doc, updateDoc ,setDoc,increment, arrayUnion, getDoc} from "firebase/firestore"
import { teacherPaymentRegistrationSchema } from "@/validators/teacherSalarySchema";
import { z } from "zod";
import { addWeeks } from "date-fns";


async function logAction(userId: string, userType: string, resourceType: string, resourceId: string, action: string, additionalInfo: object = {}) {
  const actionLog = {
    userId,
    userType,
    resourceType,
    resourceId,
    action,
    timestamp: new Date().toISOString(),
    additionalInfo
  };

  // Save the action log in Firestore
  const log = await doc(db, resourceType, resourceId)
  await updateDoc(log,{
    actionTrack: arrayUnion(actionLog)
  });
  return log;
}


export function getMonthInfo(date:Date) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = date.getMonth(); // Get the month index (0-11)
    const monthName = months[monthIndex];
    const monthAbbreviation = monthName.slice(0, 3); // Get the first three characters for the abbreviation
    return { fullName: monthName, abbreviation: monthAbbreviation };
  }
  const applyPayment = (totalAdvancePayment, paymentAmount) => {
    if (totalAdvancePayment > 0) {
      // If payment exceeds totalAdvancePayment
      if (paymentAmount >= totalAdvancePayment) {
        paymentAmount -= totalAdvancePayment; // Reduce paymentAmount by totalAdvancePayment
        totalAdvancePayment = 0; // Set totalAdvancePayment to 0
      } else {
        totalAdvancePayment -= paymentAmount; // Reduce totalAdvancePayment by paymentAmount
        paymentAmount = 0; // Set paymentAmount to 0 as it's fully consumed
      }
    }
  
    return { totalAdvancePayment, paymentAmount };
  };
type TeacherSalaryFormValues = z.infer<typeof  teacherPaymentRegistrationSchema> & {documents?:any[]};
const months = [
    { abbreviation: 'Jan', name: 'January' },
    { abbreviation: 'Feb', name: 'February' },
    { abbreviation: 'Mar', name: 'March' },
    { abbreviation: 'Apr', name: 'April' },
    { abbreviation: 'May', name: 'May' },
    { abbreviation: 'Jun', name: 'June' },
    { abbreviation: 'Jul', name: 'July' },
    { abbreviation: 'Aug', name: 'August' },
    { abbreviation: 'Sep', name: 'September' },
    { abbreviation: 'Oct', name: 'October' },
    { abbreviation: 'Nov', name: 'November' },
    { abbreviation: 'Dec', name: 'December' }
  ];
  export const addTeacherSalary = async (transaction: any,user:any) => {
    try {
      const role = user.role === null ? 'admin' : user.role;

        // Calculate the new total advance payment after applying the transaction amount
        const result = applyPayment(transaction.teacher.totalAdvancePayment, transaction.amount);
        console.log("results",result);
        
        // Get month information based on the transaction date
        const month = getMonthInfo(transaction.date);
        
        // Create a reference for the teacher transaction in the Firestore collection
        const teacherTransRef = await addDoc(collection(db, "Billing", "payouts", "TeachersTransactions"), {...transaction,amount:result.paymentAmount});
        
        // Add the transaction reference to the teacher's salary document
        await setDoc(doc(db, "Teachers", transaction.teacher.id, "TeacherSalary", teacherTransRef.id), { ref: teacherTransRef.id });
        
        // Update the total teachers' expenses in the "payouts" document
        await updateDoc(doc(db, "Billing", "payouts"), {
            teachersExpenses: increment(result.paymentAmount),
        });
        await logAction(user.uid, role, 'Teachers', transaction.teacher.id, 'add new Salary', { Teacherid:transaction.teacher.id,transactionDate:transaction.date,transactionAmount:result});

        // Retrieve the analytics document to update monthly and total expenses
        const analyticsRef = doc(db, "Billing", "analytics");
        const analyticsDoc = await getDoc(analyticsRef);
        const existingData = analyticsDoc.data()?.data || [];
        
        // Find the index of the current month in the analytics data
        const monthIndex = existingData.findIndex((m: any) => m.month === month.fullName);
        
        if (monthIndex !== -1) {
            // If the month already exists, update the expenses for that month
            existingData[monthIndex].expenses += result.paymentAmount;
        } else {
            // If the month doesn't exist, add a new entry with the expenses
            existingData.push({
                month: month.fullName,
                expenses: result.paymentAmount,
                income: 0, // Assuming no income update is needed here
            });
        }
        
        // Update the total expenses and the analytics data in Firestore
        await updateDoc(analyticsRef, {
            totalExpenses: increment(result.paymentAmount),
            data: existingData
        });
        


        // Update the teacher's advance payment details based on payment type
        if (transaction.paymentType === 'salary') {
            // Update the totalAdvancePayment for the teacher
            await updateDoc(doc(db, "Teachers", transaction.teacher.id), {
              totalAdvancePayment: result.totalAdvancePayment,
            });
          
            // Update the next payment date and students for each expense in the transaction
            await Promise.all(transaction.expenses.map(async (exp: any) => {
              // Map over students and update their sessionsToStudy, debt, and nextPaymentDate
              const updatedStudents = exp.students.map((std: any) => ({
                ...std,
                sessionsToStudy: exp.numberOfSessions, // Update number of sessions to study
                debt: std.debt + std.amount, // Add expense amount to student's debt
                nextPaymentDate: addWeeks(std.nextPaymentDate, 3), // Add 3 weeks to the student's next payment date
              }));
          
              // Update the group document with the new nextPaymentDate and students
              await updateDoc(doc(db, 'Groups', exp.id), {
                nextPaymentDate: addWeeks(exp.nextPaymentDate, 3), // Add 3 weeks to the group's next payment date
                students: updatedStudents, // Update students in the group
              });
            }));
          }else {
            await updateDoc(doc(db, "Teachers", transaction.teacher.id), {
                advancePayment: arrayUnion({ date: transaction.date, amount: transaction.amount }),
                totalAdvancePayment: increment(transaction.amount)
            });
        }

        // Return the ID of the added teacher transaction
        return teacherTransRef.id;
    } catch (error) {
        console.error("Error adding Teacher Salary:", error);
        throw error; // Re-throw the error for further handling if needed
    }
};
export const updateTeacherSalary = async(updatedtransaction:TeacherSalaryFormValues,transactionID:string,oldSalary:number)=>{
    try {
        const month=getMonthInfo(updatedtransaction.salaryDate)
           await updateDoc(doc(db, "Billing","payouts","TeachersTransactions",transactionID), updatedtransaction);

    if(oldSalary!=updatedtransaction.salaryAmount){
        await updateDoc(doc(db, "Billing", "payouts"), {
            teachersExpenses: increment(updatedtransaction.salaryAmount-oldSalary),
            
        });
        await updateDoc(doc(db, "Billing","analytics"), {
            totalExpenses:increment(updatedtransaction.salaryAmount-oldSalary),
            [`data.${month.fullName}.expenses`]: increment(updatedtransaction.salaryAmount-oldSalary)

        });
    }
             
        console.log("Tracher Salary updated successfully:",transactionID);
        return true; // Assuming you want to return the ID of the added Tracher Salary
    } catch (error) {
        console.error("Error updating Teacher:", error);
        // Handle the error here, such as displaying a message to the user or logging it for further investigation
        throw error; // Optionally re-throw the error to propagate it further if needed
    } 
}
export const deleteTeacherSalary = async(transactionID:string)=>{
    try {
            await deleteDoc(doc(db, "Billing","payouts","TeachersTransactions",transactionID));
        console.log("Tracher Salary deleted successfully:");
        return true; // Assuming you want to return the ID of the added Tracher Salary
    } catch (error) {
        console.error("Error deleting Tracher Salary:", error);
        // Handle the error here, such as displaying a message to the user or logging it for further investigation
        throw error; // Optionally re-throw the error to propagate it further if needed
    } 
}

