import { db } from "@/firebase/firebase-config"
import { addDoc,collection, deleteDoc, doc, increment, updateDoc } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes, uploadString } from "firebase/storage";
import { storage } from "@/firebase/firebase-config";
import { StudentSchema,Student } from "@/validators/auth";
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
export const addStudent = async (student:Student) => {
    try {
  
        const studentRef = await addDoc(collection(db, "Students"), student);
        await uploadAndLinkToCollection(student.photo,'Students',studentRef.id,'photo')
        console.log("Student added successfully:", studentRef.id);
        return studentRef.id; // Assuming you want to return the ID of the added Student
    } catch (error) {
        console.error("Error adding Student:", error);
        // Handle the error here, such as displaying a message to the user or logging it for further investigation
        throw error; // Optionally re-throw the error to propagate it further if needed
    }
    
};
export const updateStudent = async(updatedstudent:Student,studentId:string,student:any,level:any)=>{
    try {
            await updateDoc(doc(db, "Students",studentId), updatedstudent);
            // const shortMonth = updatedstudent.joiningDate.toLocaleDateString('en', { month: 'short' });
            // if (updatedstudent.feedingFee === 'Paid' && student.feedingFee === 'notPaid') {
            //         await updateDoc(doc(db,"Billing","analytics"),{
            //             totalIncome: increment(level.feedingFee),
            //             [`data.${shortMonth}.income`]: increment(level.feedingFee)
                        
            //         })
            //   }
              
            //   if (updatedstudent.registrationAndInsuranceFee === 'Paid' && student.registrationAndInsuranceFee === 'NotPaid') {
            //     await updateDoc(doc(db,"Billing","analytics"),{
            //         totalIncome: increment(level.registrationAndInsuranceFee),
            //         [`data.${shortMonth}.income`]: increment(level.registrationAndInsuranceFee)
                    
            //     })
            //   }
              
        console.log("Student updated successfully:");
        return true; // Assuming you want to return the ID of the added Student
    } catch (error) {
        console.error("Error updating Student:", error);
        // Handle the error here, such as displaying a message to the user or logging it for further investigation
        throw error; // Optionally re-throw the error to propagate it further if needed
    } 
}
export const deleteStudent = async(studentId:string)=>{
    try {
            await deleteDoc(doc(db, "Students",studentId));
        console.log("Student deleted successfully:");
        return true; // Assuming you want to return the ID of the added Student
    } catch (error) {
        console.error("Error deleting Student:", error);
        // Handle the error here, such as displaying a message to the user or logging it for further investigation
        throw error; // Optionally re-throw the error to propagate it further if needed
    } 
}