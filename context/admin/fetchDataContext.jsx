"use client"
import React, { createContext, useState,useContext,useEffect} from 'react';
import { getDocs,collection,query,where,orderBy,getDoc, doc} from 'firebase/firestore';
import { db } from "@/firebase/firebase-config"
import {subDays } from "date-fns"

export const AppContext = createContext();

// Create the provider component
export const  FetchDataProvider = ({ children }) => {
  const [date, setDate] = useState({
    from: subDays(new Date(), 30), // 30 days ago
    to: new Date(), // Today's date
  });
  const [profile, setProfile] = useState([]);
  const [levels, setLevels] = useState([]);
  const [parents,setParents]=useState([])
  const [students,setStudents]=useState([]);
  const [teachers,setTeachers]=useState([]);
  const [classes,setClasses]=useState([])
  const [invoices,setInvoices]=useState({})
  const [analytics,setAnalytics]=useState({})
  const [teachersSalary,setTeachersSalary]=useState([]);
  const [payouts,setPayouts]=useState([]);
  const [payoutsActionTrack,setPayoutsActionTrack] =useState([])
  useEffect(()=>{
    const getAnalytics=async()=>{
      try {
        const PayoutsSnapshot = await getDoc(doc(db, "Billing","analytics"));
        const otherPayoutsSnapShot= await getDoc(doc(db, "Billing","payouts"));
      
        const otherPayoutsData = otherPayoutsSnapShot.data();
        setPayoutsActionTrack(otherPayoutsData.actionTrack || []);
     
       
     
          //console.table(parentsData);
        setAnalytics({...PayoutsSnapshot.data(),...otherPayoutsSnapShot.data()})
      } catch (error) {
        console.error('Error fetching Payouts:', error);
      }
    };
    getAnalytics()
  },[])

  useEffect(() => {
    const getPayouts = async () => {
      try {
        const PayoutsSnapshot = await getDocs(
          query(
            collection(db, "Billing", "payouts", "Payout"),
            where("paymentDate", ">=", date.from),
            where("paymentDate", "<=", date.to)
          )
        );
  
        const PayoutsData = PayoutsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          paymentDate: new Date(doc.data().paymentDate.toDate()),
          payment: doc.id,
          value: doc.id,
          label: doc.id
        }));
  
        setPayouts(PayoutsData);
      } catch (error) {
        console.error('Error fetching Payouts:', error);
      }
    };
  
    getPayouts();
  }, [date]);
 useEffect(() => {
    const getTeachersSalary = async () => {
      try {
        const teachersSalarySnapshot = await getDocs(
          query(
            collection(db, "Billing", "payouts", "TeachersTransactions"),
            where("date", ">=", date.from),
            where("date", "<=", date.to)
          )
        );
  
        const TeachersSalaryData = teachersSalarySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
     
          date: new Date(doc.data().date.toDate()),
          value: doc.id,
          label: doc.id,
          teacherSalary: doc.id
        }));
  
        setTeachersSalary(TeachersSalaryData);
      } catch (error) {
        console.error('Error fetching Teachers:', error);
      }
    };
  
    getTeachersSalary();
  }, [date]);
  useEffect(() => {
    const getInvoices = async () => {
      try {
        
        const invoicesSnapshot = await getDocs(
          query(collection(db, 'Billing', "payments", "Invoices"),
          ));
          
          
    
  
          const invoicesData = invoicesSnapshot.docs.map((doc) => {
            const invoiceData = doc.data();
            return {
              ...invoiceData,
              lastPaymentDate: new Date(invoiceData.lastPaymentDate.toDate()), // Convert lastPaymentDate
              transaction: Array.isArray(invoiceData.transaction) // Check if transaction exists and is an array
                ? invoiceData.transaction
                    .map((trans) => ({
                      ...trans,
                      paymentDate:new Date(trans.paymentDate.toDate()), // Handle missing paymentDate
                      nextPaymentDate: trans.nextPaymentDate ? new Date(trans.nextPaymentDate.toDate()) : new Date, // Handle missing nextPaymentDate
                    }))
                    .filter(
                      (trans) =>
                        trans.paymentDate && // Ensure paymentDate exists
                        trans.paymentDate >= date.from && 
                        trans.paymentDate <= date.to
                    )
                : [], // If transaction doesn't exist, return an empty array
            };
          });
          
  
          //paymentDate:new Date(doc.data().paymentDate.toDate()),
         /* id: doc.id,
          value: doc.id,
          label: doc.id,
          invoice: doc.id,
          paymentDate: new Date(doc.data().paymentDate.toDate())
          */
     
  console.log('test invoicesData',invoicesData );
        setInvoices(invoicesData);
      } catch (error) {
        console.error('Error fetching Invoices:', error);
      }
    };
  
    getInvoices();
  }, [date]);
  useEffect(() => {
      const getClasses = async () => {
        try {
          // Fetch the documents from the 'Groups' collection in parallel
          const [groupsSnapshot, teachersSnapshot, studentsSnapshot] = await Promise.all([
            getDocs(collection(db, 'Groups')),
            getDocs(collection(db, 'Teachers')),
            getDocs(collection(db, 'Students'))
          ]);
  
          // Process groups and attendance data
          const groupsDataPromises = groupsSnapshot.docs.map(async (groupDoc) => {
            const groupId = groupDoc.id;
            const groupData = groupDoc.data();
            const attendanceSnapshot = await getDocs(collection(db, `Groups/${groupId}/Attendance`));
  
            const attendanceData = attendanceSnapshot.docs.reduce((acc, doc) => {
              acc[doc.id] = {
                ...doc.data(),
     
                id: doc.id,
              };
              return acc;
            }, {});
  
            return {
              id: groupId,
              ...groupData,
              startDate: groupData.startDate ? new Date(groupData.startDate.toDate()) : new Date(),
              nextPaymentDate: groupData.nextPaymentDate ? new Date(groupData.nextPaymentDate.toDate()) : new Date(),
              Attendance: attendanceData,
            };
          });
  
          const classesData = await Promise.all(groupsDataPromises);
  
          // Process teachers data
          const TeachersData = teachersSnapshot.docs.map((doc) => {
          const teacher = { ...doc.data(),
            id: doc.id,
            birthdate: new Date(doc.data().birthdate.toDate()),
            teacher: `${doc.data().name}`,
            phoneNumber: doc.data().phoneNumber,
            year: doc.data().year,
            value:doc.id,
            label:doc.data().name,
            actionTrack: doc.data().actionTrack || []

          }
          const result = teacher.groupUIDs.flatMap(cls => {
            const classDetail = classesData.find(clss => clss.id === cls);
            
              if(classDetail){
       
                
                const { Attendance, ...rest } = classDetail;
                return rest;
              }
         
                    });
          return {
            ...teacher,
            classes: result
          };
        });
  
          // Process students data
          const StudentsData = studentsSnapshot.docs.map((doc) => {
            const student = {
              ...doc.data(),
              id: doc.id,
              nextPaymentDate:new Date(doc.data().nextPaymentDate.toDate()),
              birthdate: new Date(doc.data().birthdate.toDate()),
              student: `${doc.data().name}`,
              value: `${doc.data().name}`,
              label: `${doc.data().name}`,
              actionTrack: doc.data().actionTrack || []
            };
  
            // Calculate the result for each student
            const result = student.classesUIDs.flatMap(cls => {
              const classDetail = classesData.find(clss => clss.id === cls.id);
              if (!classDetail) return [];
  
              const studentDetail = classDetail.students.find(std => std.id === student.id);
              if (!studentDetail) return [];
  
              const groupDetail = classDetail.groups
              if (!groupDetail) return [];
  
              return {
                cs: studentDetail.cs,
                groups:groupDetail,
                group: classDetail.group,
                id: cls.id,
                index: studentDetail.index,
                name: classDetail.teacherName,
                subject: classDetail.subject,
                sessionsLeft:studentDetail.sessionsLeft,
                amount:studentDetail.amount,
                debt:studentDetail.debt,
                nextPaymentDate:studentDetail.nextPaymentDate?new Date(studentDetail.nextPaymentDate.toDate()) : null,
                sessionsToStudy:studentDetail.sessionsToStudy,
                addedAt:studentDetail.addedAt|| student.lastPaymentDate
              };
            });
  
            return {
              ...student,
              classes: result
            };
          });
  
          // Set state
          setStudents(StudentsData);
          setTeachers(TeachersData);
          setClasses(classesData);
          console.log("donnnee");
          
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
  
      getClasses();
    }, []);
  


  useEffect(() => {
    const getLevels = async () => {
      try {
        const levelsSnapshot = await getDocs(collection(db, 'Levels'));
      
        const levelsData = levelsSnapshot.docs.map((doc) => ({ ...doc.data(),
           value:doc.data().level,
           label:doc.data().level,
           id: doc.id,
           start:new Date(doc.data().start.toDate()),
           end:new Date(doc.data().end.toDate()),
           registrationDeadline:new Date(doc.data().registrationDeadline.toDate())}));
   
        setLevels(levelsData);
      } catch (error) {
        console.error('Error fetching levels:', error);
      }
    };
    const getParents = async () => {
      try {
        const parentsSnapshot = await getDocs(collection(db, 'Parents'));
      
        const parentsData = parentsSnapshot.docs.map((doc) => ({ ...doc.data(),
           id: doc.id,
           dateOfBirth:new Date(doc.data().dateOfBirth.toDate()),
           parent: `${doc.data().firstName} ${doc.data().lastName}`,
           value: `${doc.data().firstName} ${doc.data().lastName}`,
           label: `${doc.data().firstName} ${doc.data().lastName}`,

          }))
       
        setParents(parentsData)
      } catch (error) {
        console.error('Error fetching levels:', error);
      }
    };
    getLevels();
    getParents();
  }, []);
  useEffect(() => { 
    const getProfile = async () => {
      try {
        const profileSnapshot = await getDoc(doc(db, 'Profile','GeneralInformation'));
      
        
           
        setProfile({...profileSnapshot.data(),id:profileSnapshot.id})
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    getProfile();
  }, []);
  return (
    <AppContext.Provider value={{levels,setLevels,setParents,parents,profile,setProfile,students,setStudents,teachers,setTeachers,classes,setClasses,invoices,setInvoices,analytics,setAnalytics,teachersSalary,setTeachersSalary,payouts,setPayouts,date,setDate,payoutsActionTrack}}>
      {children}
    </AppContext.Provider>
  );
};
export const  useData =()=>{


    const value=useContext(AppContext)
    try{
    if(!value){
        throw new Error("Error not wrapped inside layout  ",)
    }   }catch(e){
        console.log(e);
    }
    return value
}
















