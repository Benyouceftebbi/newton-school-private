import { db } from "@/firebase/firebase-config"
import { addDoc, collection, deleteDoc, doc, increment ,arrayUnion, updateDoc ,setDoc,getDoc} from "firebase/firestore"
import { studentPaymentSchema } from "@/validators/studentPaymentSchema";
import { z } from "zod";
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

  // Save the action log in Firestore
  const log = await doc(db, resourceType, resourceId)
  await updateDoc(log,{
    actionTrack: arrayUnion(actionLog)
  });
  return log;
}
function getMonthInfo(date: Date) {
  const monthIndex = date.getMonth(); // Get the month index (0-11)
  const monthInfo = months[monthIndex]; // Get the corresponding month object
  return { fullName: monthInfo.name, abbreviation: monthInfo.abbreviation };
}
type StudentPaymentFormValues = z.infer<any> & {documents?:any[]};

export const addPaymentTransaction = async (transaction: any, studentID: string,user:any) => {
    const role = user.role === null ? 'admin' : user.role;
    const month = getMonthInfo(transaction.paymentDate);

    await logAction(user.uid, role, 'Students', studentID, 'add new payment', { studentId:studentID,transactionDate:transaction.paymentDate,transactionAmount: transaction.amount,groupPaid:transaction.group});

    try {
        // Validate studentID
        if (!studentID) {
            throw new Error("Student ID is required.");
        }

        // Reference to the specific student's invoice document
        const transactionRef = doc(db, "Billing", "payments", "Invoices", studentID);

        // Ensure transaction is not undefined
        if (!transaction || !transaction) {
            throw new Error("Transaction data is missing or malformed.");
        }

        // Update the document with arrayUnion
        await updateDoc(transactionRef, {
            transaction: arrayUnion(transaction), // Ensure transaction.transaction is an array
            // months: arrayUnion(...months) // Uncomment and modify if using months
        });

    const analyticsRef = doc(db, "Billing", "analytics");
    const analyticsDoc = await getDoc(analyticsRef);

    if (!analyticsDoc.exists()) {
      // Initialize the document with an array of month objects if it doesn't exist
      const data = {
        totalExpenses: 0,
        totalIncome: transaction.amount,
        data: months.map(monthh => ({
          month: monthh.name,
          expenses: 0,
          income: transaction.amount
        }))
      };
      await setDoc(analyticsRef, data);
    } else {
      // Retrieve the existing data array
      const existingData = analyticsDoc.data()?.data || [];

      // Find the index of the current month in the array
      const monthIndex = existingData.findIndex((m: any) => m.month === month.fullName);

      if (monthIndex !== -1) {
        // Update the specific month's income
        existingData[monthIndex].income += transaction.amount;
      } else {
        // Add a new entry if the month wasn't found
        existingData.push({
          month: month.fullName,
          expenses: 0,
          income: transaction.amount,
        });
      }
   
      // Update the totalIncome and the data array
      await updateDoc(analyticsRef, {
        totalIncome: increment(transaction.amount),
        data: existingData
      });
    }

    console.log("Transaction successfully added to Firestore!");

    return transactionRef.id; // Return the ID of the document
  } catch (error) {
    console.error("Error adding transaction:", error);
    throw error; // Optionally re-throw the error to propagate it further if needed
  }
}


export async function updatesessionsLeft(paymentDate,nextPaymentDate,debt,studentId){
  

        await updateDoc(doc(db,'Students',studentId),{
              debt:debt,
              lastPaymentDate:paymentDate,
              nextPaymentDate:nextPaymentDate
  
  
        });
    }
export const updateStudentInvoice = async(updatedtransaction:StudentPaymentFormValues,transactionID:string,oldSalary:number)=>{
    try {
        const month=getMonthInfo(updatedtransaction.paymentDate)
           await updateDoc(doc(db, "Billing","payments","Invoices",transactionID), updatedtransaction);

    if(oldSalary!=updatedtransaction.paymentAmount){
        await updateDoc(doc(db,"Students",updatedtransaction.student.id),{
            amountLeftToPay:increment(updatedtransaction.paymentAmount-oldSalary)
        })
        await updateDoc(doc(db,"Parents",updatedtransaction.parent.id),{
            totalPayment:increment(updatedtransaction.paymentAmount-oldSalary)
        })
        await updateDoc(doc(db, "Billing","analytics"), {

            [`data.${month.fullName}.income`]: increment(updatedtransaction.paymentAmount-oldSalary),
            totalIncome: increment(updatedtransaction.paymentAmount-oldSalary),
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
            await deleteDoc(doc(db,  "Billing","payments","Invoices",transactionID));
        console.log("Tracher Salary deleted successfully:");
        return true; // Assuming you want to return the ID of the added Tracher Salary
    } catch (error) {
        console.error("Error deleting Tracher Salary:", error);
        // Handle the error here, such as displaying a message to the user or logging it for further investigation
        throw error; // Optionally re-throw the error to propagate it further if needed
    } 
}
export async function updateStudentPaymentInfo(groupId, studentData, item) {
  try {
    // Fetch the group document
    const groupDoc = await getDoc(doc(db, 'Groups', groupId));
    
    // Extract the students array and update the specific student
    const updatedStudents = groupDoc.data().students.map((std) => 
      std.id === studentData.id 
        ? {
            ...std,
            nextPaymentDate: item.nextPaymentDate,
            debt: Math.abs(item.debt - item.amountPaid),
            sessionsLeft: item.sessionsLeft,
            sessionsToStudy:groupDoc.data().numberOfSessions
          }
        : std
    );

    // Update the group document with the modified students array
    await updateDoc(doc(db, 'Groups', groupId), {
      students: updatedStudents
    });
return updatedStudents
  } catch (error) {
    console.error("Error updating student payment info:", error);
  }
}

export async function updateSessionLeft(groupId, studentData, item,user) {
  try {
    const role = user.role === null ? 'admin' : user.role;

    // Fetch the group document
    const groupDoc = await getDoc(doc(db, 'Groups', groupId));
    
    // Extract the students array and update the specific student
    const updatedStudents = groupDoc.data().students.map((std) => 
      std.id === studentData.id 
        ? {
            ...std,
            sessionsLeft: item.sessionsLeft,
            sessionsToStudy: item.sessionsToStudy,
            debt: item.debt
            //sessionsToStudy: item.sessionsToStudy
          }
        : std
    );
    await logAction(user.uid, role, 'Students', studentData.id, 'reimbursment', { studentId:studentData.id,group:groupId,NewnumberOfsessionTostudy: item.sessionsToStudy,newDebt:item.debt});

    // Update the group document with the modified students array
    await updateDoc(doc(db, 'Groups', groupId), {
      students: updatedStudents
    });
return updatedStudents
  } catch (error) {
    console.error("Error updating student payment info:", error);
  }
}

export const addNewCardTransaction = async (transaction: any, studentID: string,user:any) => {
  const month = getMonthInfo(transaction.paymentDate);
  try {
    // Validate studentID
    if (!studentID) {
        throw new Error("Student ID is required.");
    }

    // Reference to the specific student's invoice document
    const transactionRef = doc(db, "Billing", "payments", "Invoices", studentID);

    // Ensure transaction is not undefined
    if (!transaction || !transaction) {
        throw new Error("Transaction data is missing or malformed.");
    }

    // Update the document with arrayUnion
    await updateDoc(transactionRef, {
        transaction: arrayUnion(transaction), // Ensure transaction.transaction is an array
    });

      const analyticsRef = doc(db, "Billing", "analytics");
      const analyticsDoc = await getDoc(analyticsRef);
      if (!analyticsDoc.exists()) {
        // Initialize the document with an array of month objects if it doesn't exist
        const data = {
          totalExpenses: 0,
          totalIncome: transaction.amount,
          data: months.map(monthh => ({
            month: monthh.name,
            expenses: 0,
            income: transaction.amount
          }))
        };
        await setDoc(analyticsRef, data);
      } else {
        // Retrieve the existing data array
        const existingData = analyticsDoc.data()?.data || [];
  
        // Find the index of the current month in the array
        const monthIndex = existingData.findIndex((m: any) => m.month === month.fullName);
  
        if (monthIndex !== -1) {
          // Update the specific month's income
          existingData[monthIndex].income += transaction.amount;
        } else {
          // Add a new entry if the month wasn't found
          existingData.push({
            month: month.fullName,
            expenses: 0,
            income: transaction.amount,
          });
        }
     
        // Update the totalIncome and the data array
        await updateDoc(analyticsRef, {
          totalIncome: increment(transaction.amount),
          data: existingData
        });
      }
  
      console.log("Transaction successfully added to Firestore!");
  
      return transactionRef.id; // Return the ID of the document
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error; // Optionally re-throw the error to propagate it further if needed
    }
}
