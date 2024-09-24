import { db } from "@/firebase/firebase-config";
import { addDoc, collection, doc, getDoc, increment, setDoc, updateDoc, arrayUnion} from "firebase/firestore";
import { PaymentRegistrationSchema } from "@/validators/paymentSchema";
import { z } from "zod";
import { getMonthInfo } from "./teacherPayment";

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

  // Reference to the document
  const logRef = doc(db, resourceType, resourceId);
  
  // Check if the document exists
  const docSnap = await getDoc(logRef);

  if (!docSnap.exists()) {
    // If document doesn't exist, create it with the actionTrack array
    await setDoc(logRef, {
      actionTrack: [actionLog]
    });
  } else {
    // If document exists, append the actionLog to the actionTrack array
    await updateDoc(logRef, {
      actionTrack: arrayUnion(actionLog)
    });
  }

  return logRef;
}

type PaymentFormValues = z.infer<typeof PaymentRegistrationSchema> & { documents?: any };

export const addPayment = async (transaction: PaymentFormValues,user:any) => {
  try {
    const role = user.role === null ? 'admin' : user.role;

    const month = getMonthInfo(transaction.paymentDate);
    const paymentTransRef = await addDoc(collection(db, "Billing", "payouts", "Payout"), transaction);

    await logAction(user.uid, role, "Billing", "payouts", 'add new payment', { transactionAmount: transaction.paymentAmount,typeofPayment:transaction.typeofPayment,paymentDate:transaction.paymentDate,fromWho:transaction.fromWho});

    // Reference to the added document
    const key = transaction.typeofPayment;
    console.log("Payout Salary added successfully:", paymentTransRef.id);

    await updateDoc(doc(db, "Billing", "payouts"), {
      [`${key}Expenses`]: increment(transaction.paymentAmount),
    });

    const docRef = doc(db, "Billing", "analytics");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Initialize the document with an array of month objects
      const data = {
        totalExpenses: 0,
        totalIncome: 0,
        data: months.map(monthh => ({
          month: monthh.name,
          expenses: 0,
          income: 0
        }))
      };

      await setDoc(docRef, data);
    } else {
      // Retrieve the existing data array
      const existingData = docSnap.data()?.data || [];

      // Find the index of the current month in the array
      const monthIndex = existingData.findIndex((m: any) => m.month === month.fullName);

      if (monthIndex !== -1) {
        // Update the specific month's expenses
        existingData[monthIndex].expenses += transaction.paymentAmount;
      } else {
        // Add a new entry if the month wasn't found
        existingData.push({
          month: month.fullName,
          expenses: transaction.paymentAmount,
          income: 0,
        });
      }

      // Update the totalExpenses and the data array
      await updateDoc(docRef, {
        totalExpenses: increment(transaction.paymentAmount),
        data: existingData
      });
    }

    return paymentTransRef.id;
  } catch (error) {
    console.error("Error adding Payout Salary:", error);
    throw error;
  }
};
export const updatePayment = async(updatedtransaction:PaymentFormValues,transactionID:string,oldAmount:number)=>{
    try {
        const month=getMonthInfo(updatedtransaction.paymentDate)

            await updateDoc(doc(db, "Billing","payouts","Payout",transactionID), updatedtransaction);
       
            if(oldAmount!=updatedtransaction.paymentAmount){
                await updateDoc(doc(db, "Billing", "payouts"), {
                    teachersExpenses: increment(updatedtransaction.paymentAmount-oldAmount),
                    
                });
                await updateDoc(doc(db, "Billing","analytics"), {
                    totalExpenses:increment(updatedtransaction.paymentAmount-oldAmount),
                    [`data.${month.name}.expenses`]: increment(updatedtransaction.paymentAmount-oldAmount)
        
                });
            }
            console.log("Payout Salary updated successfully:");
        return true; // Assuming you want to return the ID of the added Payout Salary
    } catch (error) {
        console.error("Error updating payment:", error);
        // Handle the error here, such as displaying a message to the user or logging it for further investigation
        throw error; // Optionally re-throw the error to propagate it further if needed
    } 
}
export const deletePayment = async(transactionID:string)=>{
    try {
            await deleteDoc(doc(db, "Billing","payouts","Payout",transactionID));
        console.log("Payout Salary deleted successfully:");
        return true; // Assuming you want to return the ID of the added Payout Salary
    } catch (error) {
        console.error("Error deleting Payout Salary:", error);
        // Handle the error here, such as displaying a message to the user or logging it for further investigation
        throw error; // Optionally re-throw the error to propagate it further if needed
    } 
}
