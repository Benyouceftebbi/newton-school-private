const {onCall,HttpsError,onRequest} = require("firebase-functions/v2/https");
const {getDatabase} = require("firebase-admin/database");
const {logger} = require("firebase-functions/v2");
const admin=require('firebase-admin')
const functions = require('firebase-functions');
var generator = require('generate-password');
const { format,isBefore,addWeeks } = require('date-fns'); // For day formatting
admin.initializeApp();



exports.createUserAndAssignRole = onCall({cors:true},async (request) => {
  try {
    const { data } = request;
    var password = generator.generate({
      length: 10,
      numbers: true
    });

    const userRecord =  await admin.auth().createUser({
      email: data.email,
      password: password,
    });
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: "worker" });
    const parentData = {
      ...data,
      id: userRecord.uid,
    };
    await admin.firestore().collection('users').doc(userRecord.uid).set(parentData);

    logger.info("User created and assigned role");

    return { success: true, uid: userRecord.uid, data: data, password:password};
  } catch (error) {
    // Log error message
    logger.error("Error creating user and assigning role:", error);

    // Throw HttpsError
    throw new HttpsError("internal", "Error creating user and assigning role");
  }
});

exports.deductSessions = functions.pubsub
  .schedule('every day 00:00')
  .timeZone('Africa/Algiers')
  .onRun(async (context) => {
    const db = admin.firestore();
    const today = format(new Date(), 'EEEE'); // Get today's day of the week
    const todayDateString = format(new Date(), 'yyyy-MM-dd'); // Get today's date as yyyy-MM-dd

    try {
      // Get all the groups where paymentType is 'monthly' and active is true
      const groupsSnapshot = await db
        .collection('Groups')
        .where('paymentType', '==', 'monthly')
        .where('active', '==', true)
        .get();

      if (groupsSnapshot.empty) {
        console.log('No matching groups found.');
        return null;
      }

      // Loop through each group
      for (const groupDoc of groupsSnapshot.docs) {
        const groupData = groupDoc.data();
        let updatedStudents = groupData.students || [];

        // Check if there's any class that matches today's day
        const matchingClasses = groupData.groups.filter(
          (classGroup) => classGroup.day === today
        );

        if (matchingClasses.length > 0) {
          console.log(`Processing group with matching day: ${today}`);

          // Check if today's attendance document exists
          const attendanceDoc = await db
            .collection('Groups')
            .doc(groupDoc.id)
            .collection('Attendance')
            .doc(todayDateString)
            .get();

          let attendanceList = [];
          if (attendanceDoc.exists) {
            attendanceList = attendanceDoc.data().attendanceList || [];
            console.log(
              `Found attendance for ${todayDateString} with ${attendanceList.length} students.`
            );
          } else {
            console.log(`No attendance found for ${todayDateString}`);
          }

          // Loop through the students and decrement their sessionsLeft if they're not in the attendance list
          updatedStudents = updatedStudents.map((student) => {
            // Check if the student is present in today's attendance list
            const isInAttendance = attendanceList.some(
              (attendedStudent) => attendedStudent.id === student.id
            );

            if (!isInAttendance) {
              const currentSessionsLeft = student.sessionsLeft || 0;
              // Decrement by 1 if sessionsLeft is greater than 0, otherwise leave it at 0
              student.sessionsLeft =
                currentSessionsLeft > 0 ? currentSessionsLeft - 1 : 0;

              console.log(
                `Updated sessionsLeft for student ${student.id}: ${student.sessionsLeft}`
              );
            } else {
              console.log(`Skipping session deduction for student ${student.id} as they are marked in attendance.`);
            }

            return student; // Return the updated student object
          });

          // Update the group's students array with the updated students
          await db.collection('Groups').doc(groupDoc.id).update({
            students: updatedStudents,
          });

          console.log(`Updated students for group ${groupDoc.id}`);
        }
      }
    } catch (error) {
      console.error('Error running daily session deduction:', error);
    }

    return null;
  });

  exports.updateDebtsAndNextPaymentDate = functions.pubsub
  .schedule('every day 00:00') // Run every night at midnight
  .timeZone('Africa/Algiers') // Optional: Set your timezone
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date(); // Current time when the function is running

    try {
      // Get all groups where paymentType is 'monthly'
      const groupsSnapshot = await db
        .collection('Groups')
        .where('paymentType', '==', 'monthly')
        .get();

      if (groupsSnapshot.empty) {
        console.log('No matching groups found.');
        return null;
      }

      // Loop through each group
      for (const groupDoc of groupsSnapshot.docs) {
        const groupData = groupDoc.data();
        let updatedStudents = groupData.students || [];

        // Check if group's nextPaymentDate is before now
        if (groupData.nextPaymentDate && isBefore(groupData.nextPaymentDate.toDate(), now)) {
          console.log(`Processing group with overdue nextPaymentDate: ${groupData.nextPaymentDate.toDate()}`);

          // Loop through the students in the group
          updatedStudents = updatedStudents.map((student) => {
            const studentNextPaymentDate = student.nextPaymentDate
              ? student.nextPaymentDate.toDate()
              : null;

            // Check if student's nextPaymentDate is also overdue
            if (studentNextPaymentDate && isBefore(studentNextPaymentDate, now)) {
              // Increment student's debt by student's amount
              const currentDebt = student.debt || 0;
              const amount = student.amount || 0; // Ensure amount is defined
              const updatedDebt = currentDebt + amount;

              // Update nextPaymentDate by adding 3 weeks
              const newNextPaymentDate = addWeeks(now, 3);

              // Update the student's debt and nextPaymentDate
              student.debt = updatedDebt;
              student.nextPaymentDate = admin.firestore.Timestamp.fromDate(newNextPaymentDate);
              student.sessionsToStudy=groupData.numberOfSessions

              console.log(`Updated student ${student.id}: debt = ${updatedDebt}, nextPaymentDate = ${newNextPaymentDate}`);
            }

            return student; // Return the updated student object
          });

          // Update the group's students array with the updated students
          await db.collection('Groups').doc(groupDoc.id).update({
            students: updatedStudents,
          });

          console.log(`Updated students for group ${groupDoc.id}`);
        }
      }
    } catch (error) {
      console.error('Error updating debts and next payment dates:', error);
    }

    return null;
  });