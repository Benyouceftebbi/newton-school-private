import { db } from "@/firebase/firebase-config"
import { addDoc,arrayRemove,arrayUnion,collection, deleteDoc, doc, getDoc, increment, runTransaction, setDoc, updateDoc, writeBatch } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes, uploadString } from "firebase/storage";
import { storage } from "@/firebase/firebase-config";
import { StudentSchema,Student } from "@/validators/auth";
import { parse } from "date-fns";


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
function dataURLtoFile(dataurl:string, filename:string) {
    var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[arr.length - 1]), 
        n = bstr.length, 
        u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

//Usage example:


export async function uploadAndLinkToCollection(
    image: string | null, // Changed to File type for actual file upload
    folder: string,
    cls: string,
    name: string,
  ): Promise<string> {
    const folderRef = ref(storage, `${folder}/${cls}`);
    const fileRef = ref(folderRef, name);
    var file = dataURLtoFile(image ?image:'null','photo.jpeg');
    await uploadBytes(fileRef, file);

    const downloadUrl = await getDownloadURL(fileRef);
    await updateDoc(doc(db,folder,cls), {
        photo: downloadUrl,
      });
    // Assuming you want to return an array of objects with metadata
    return downloadUrl
  }
  export const addStudent = async (student: Student,user:any) => {
    try {
      const role = user.role === null ? 'admin' : user.role;
      // Add the student document outside of the transaction
      const studentRef = doc(db, "Students", student.id);
      await setDoc(studentRef, student);
  
      // Upload the student's photo if it exists
      if (student.photo) {
        await uploadAndLinkToCollection(student.photo, 'Students', student.id, 'photo');
      }
  
      // Gather all necessary data before starting the transaction
      const classUpdates: { classID: string, newIndex: number, group: string,cs:string,sessionsLeft:number }[] = [];
      
      for (const cls of student.classes) {
        const classRef = doc(db, 'Groups', cls.id);
        const classDoc = await getDoc(classRef);
        
        if (classDoc.exists()) {
          const classData = classDoc.data();
          const students = classData.students || [];
          const highestIndex = students.reduce((max, student) => Math.max(max, student.index || 0), 0);
          const newIndex = highestIndex + 1;
          if(classData.paymentType==='monthly'){
     // Collect data for use in the transaction
     classUpdates.push({ classID: cls.id, newIndex, group: cls.group ,cs:cls.cs,
      sessionsLeft:classData.numberOfSessions,
      amount:classData.active? cls.amount : classData.amount,
      debt: classData.active? cls.debt : classData.amount,
      active:classData.active,
      ...(classData.active && { nextPaymentDate:classData?.nextPaymentDate }),
      sessionsToStudy:cls.sessionsToStudy});
          }
          else{
            classUpdates.push({ classID: cls.id, newIndex, group: cls.group ,cs:cls.cs,
              sessionsLeft:0,
              amount: cls.amount,
              debt: 0,
              active:classData.active,
              ...(classData.active && { nextPaymentDate:classData?.nextPaymentDate }),
              sessionsToStudy:0});
          }
     
        } else {
          console.log('No such document for class ID:', cls.id);
          // Handle missing class documents if necessary
        }
      }
      const result = await runTransaction(db, async (transaction) => {
        for (const update of classUpdates) {
          console.log("Dwdqwdwqd",update);
          
          const classRef = doc(db, 'Groups', update.classID);
          transaction.update(classRef, {
            students: arrayUnion({
              id: student.id,
              name: student.name,
              index: update.newIndex,
              year: student.year,
              group: update.group ,
              cs:update.cs,
              sessionsLeft:0,
              amount:update.amount,
              ...(update.active && { nextPaymentDate:update?.nextPaymentDate }),
              sessionsToStudy:update.sessionsToStudy,
              debt:update.debt
            })
          });
        }
  
        // Return class updates for post-transaction processing
        return { studentId: student.id, classUpdates };
      });
  

      const transactionRef = doc(db, "Billing", "payments", "Invoices", student.id);
            await setDoc(transactionRef, {
            monthlypayment:student.monthlypayment,
            debt:0,
            field:student.field,
            lastPaymentDate:student.lastPaymentDate,
            registrationAndInsuranceFee:student.registrationAndInsuranceFee,
            school:student.school,
            year:student.year,
            student: {
                student: student.name,
                id: student.id,
                nextPaymentDate: student.nextPaymentDate,

            },
            transaction:[{
              paymentDate:student.lastPaymentDate,
              amount:student.registrationAndInsuranceFee
            }]
            });

            await logAction(user.uid, role, 'Students', student.id, 'add new student', { studentName: student.name });
      return result;
    } catch (error) {
      console.error("Error adding Student:", error);
      // Handle the error here
      throw error; // Optionally re-throw the error
    }
  };
  
export const updateStudent = async(updatedstudent: any,studnetId:string,user:any)=>{

  
  try {
    const role = user.role === null ? 'admin' : user.role;
    console.log('Role id',user.uid);
    console.log('Role ',role);
          await updateDoc(doc(db, "Students",studnetId), updatedstudent);
    console.log("student updated successfully:");

      await logAction(user.uid, role, 'Students', studnetId, 'edit student', { studentName: updatedstudent.name });

      return true; // Assuming you want to return the ID of the added Teacher
  } catch (error) {
      console.error("Error updating Teacher:", error);
      // Handle the error here, such as displaying a message to the user or logging it for further investigation
      throw error; // Optionally re-throw the error to propagate it further if needed
  }
}
export const deleteStudent = async (student, classes) => {
  try {
    // Create an array of promises for each class update
    const updatePromises = student.classesUIDs.map(async (cls) => {
      // Find the specific class and student details
      const classData = classes.find(clss => clss.id === cls.id);
      if (!classData) {
        throw new Error(`Class with ID ${cls.id} not found`);
      }

      const studentDetails = classData.students.find(std => std.id === student.id);
      if (!studentDetails) {
        throw new Error(`Student with ID ${student.id} not found in class ${cls.id}`);
      }

      const indx = studentDetails.index;


      // Reference to the class document
      const classDocRef = doc(db, 'Groups', cls.id);

      // Update the class document
      await updateDoc(classDocRef, {
        students: arrayRemove(studentDetails)
      });
    });

    // Wait for all update operations to complete
    await Promise.all(updatePromises);

    // Delete the student from the Students collection
    const studentDocRef = doc(db, 'Students', student.id);
    await deleteDoc(studentDocRef);

    console.log('Student removed from all classes and deleted from Students collection successfully');
  } catch (error) {
    console.error('Error deleting student:', error);
  }
};

export const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };
  export const writeAttendance = async (std:any) => {
    try {
      const date = new Date(); // Current date and time
      const formattedDate = formatDateToYYYYMMDD(date)
      const docRef = doc(db, 'Groups', std.id, 'Attendance', formattedDate);
      const attendanceData = {
        cs:std.cs,
        index:std.studentIndex,
        group:std.studentGroup,
        name:std.name,
        status:'present'
      };
  
      // Use setDoc with merge: true to create or update the document
      await updateDoc(docRef,{
        attendanceList:arrayUnion(attendanceData)
      })
    } catch (error) {
      console.error("Error writing attendance: ", error);
    }
  };
  export async function addStudentToClass(student,classId,studentId,user) {
    const { group, id, index, name, year,cs,studentName,studentID } = student;
  
    const role = user.role === null ? 'admin' : user.role;

    const classDocRef = doc(db, 'Groups', classId);
    await updateDoc(classDocRef, {
      students: arrayUnion(student)
    });
  
    const studentDocRef = doc(db, 'Students', studentId);
    await updateDoc(studentDocRef, {
      classesUIDs: arrayUnion({ id: classId, group: group })
    });

    await logAction(user.uid, role, 'Students',studentId , 'Add Student to a group', { studentID:studentId,classId:classId });

    
  
  }
  export async function removeStudentFromClass(student,studentId,classId,user) {
    const { id, group,index,name,year,cs } = student;
  
    const role = user.role === null ? 'admin' : user.role;

    const studentDocRef = doc(db, 'Students', studentId);  

  
      await updateDoc(studentDocRef, {
        classesUIDs: arrayRemove({ id:classId, group })
      });
  
      const classDocRef = doc(db, 'Groups', classId);
      await updateDoc(classDocRef, {
        students: arrayRemove(student)
      });

      await logAction(user.uid, role, 'Students',studentId , 'Remove a Student from a group', { studentID:studentId,classId:classId });

     }
    
     export  async function changeStudentGroup(classId,studentId,students,classesUIDs,user) {
    
      const role = user.role === null ? 'admin' : user.role;


      const studentDocRef = doc(db, 'Students', studentId);  

      await updateDoc(studentDocRef, {
       classesUIDs
      });
  
      const classDocRef = doc(db, 'Groups',classId);
      await updateDoc(classDocRef, {
        students:students
      }); 

   
        await logAction(user.uid, role, 'Students',studentId , 'Change the Student group', { studentID:studentId,classId:classId });

      }
  
export async function markAttendance(classId,attendanceId,student){

    await updateDoc(doc(db,'Groups',classId,'Attendance',attendanceId),{
      attendanceList:arrayUnion({index:student.index,group:student.group,name:student.name,status:student.status})
    })
  }

  export async function changeStudentCard(studentId:string,newId:string,user){

    const role = user.role === null ? 'admin' : user.role;
    await updateDoc(doc(db,'Students',studentId),{
      newId:newId
    })
    await logAction(user.uid, role, 'Students',studentId , 'Change student Card', { studentID:studentId });

  }
  export async function getStudentCount(classId: string): Promise<number> {
    const classRef = doc(db, 'Groups', classId);
  
    try {
      // Run a transaction to ensure atomicity
      const newStudentIndex = await runTransaction(db, async (transaction) => {
        const classDoc = await transaction.get(classRef);
        if (!classDoc.exists()) {
          throw new Error('Class not found');
        }
  
        const classData = classDoc.data();
        const students = classData.students;
        let highestIndex = 0;
        
        for (const student of students) {
          if (typeof student.index === 'number') {
            highestIndex = Math.max(highestIndex, student.index);
          }
        }
        console.log("highest",highestIndex);
        
        const currentStudentCount = highestIndex + 1;
  
        return currentStudentCount;
      });
  

      return newStudentIndex; // Adding 1 to get the new index
    } catch (error) {
      console.error('Error fetching student count:', error);
      throw error;
    }


  }


  export async function updateStudentFinance(paymentDate,nextPaymentDate,debt,studentId){
  

      await updateDoc(doc(db,'Students',studentId),{
            debt:debt,
            lastPaymentDate:paymentDate,
            nextPaymentDate:nextPaymentDate


      });

}
export const updateStudentPicture = async (studentId: string, image:any,user) => {
  try {

    const role = user.role === null ? 'admin' : user.role;

    const storageRef = ref(storage, `Students/${studentId}/photo`); // Assuming you're storing pictures in a folder named 'students' with a unique ID for each student
    var file = dataURLtoFile(image ?image:'null','photo.jpeg');
    // Upload the new image, overwriting the old one
    await uploadBytes(storageRef, file);
    console.log("Profile picture updated successfully.");

    await logAction(user.uid, role, 'Students',studentId , 'Change Profile Picture', { studentID:studentId});

    console.log("Firestore document updated successfully.");
  } catch (error) {
    console.error("Error updating profile picture:", error);
    throw error;
  }

};
