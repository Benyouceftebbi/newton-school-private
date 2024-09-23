import jsPDF from 'jspdf';

import { format } from 'date-fns';
import autoTable from 'jspdf-autotable';
import { font } from "@/lib/fontscustom/Amiri-Regular-normal"
const generatePDF = (selectedEvent, attendance, dates) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // 'l' for landscape, 'mm' for units in millimeters, 'a4' for A4 paper size

  // Add Amiri font for Arabic text support
  doc.addFileToVFS('Amiri-Regular.ttf', font);
  doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  doc.setFont('Amiri'); // Set font to Amiri for Arabic text

  // Title (e.g., Teacher's Name)
  doc.setFontSize(18);
  doc.text(selectedEvent.teacher, 20, 20);


  // Table Columns (Arabic headers for Index, Student Name, Group, and Dates)
  const columns = [       // Index
    "اسم الطالب",      // Student Name
      // Group
    ...dates
  ];

  // Populate Table Rows with Attendance Data
  const rows = attendance.map((student, index) => [                     // Index
    student.name,                   // Student Name               // Group
    ...dates.map(date => student[date] === 'present' ? 'حاضر' : 'غائب'), // Present/Absent status for each date
  ]);

  // Generate Table Using autoTable
  autoTable(doc, {
    head: [columns],  // Define the table header
    body: rows,       // Define the table body (attendance data)
    theme: 'grid',    // Use grid theme for the table
    headStyles: {
      fillColor: '#E0E0E0',  // Header background color
      textColor: 'black',     // Header text color
      font: 'Amiri',          // Font for the header (Arabic support)
    },
    bodyStyles: {
      font: 'Amiri',

       
               // Font for the table body (Arabic support)
    },
    columnStyles:{
      0:{
        cellWidth:50
      }
    },
    startY: 80,              // Starting Y position for the table
    
  });

  // Save the PDF with a meaningful file name
  doc.save('teacher_class_review.pdf');
};
export default generatePDF;