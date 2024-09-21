import jsPDF from 'jspdf';

import { format } from 'date-fns';
import autoTable from 'jspdf-autotable';
import { font } from "@/lib/fontscustom/Amiri-Regular-normal"
const generatePDF = (selectedEvent, attendance) => {
  const doc = new jsPDF();

  // Set font to a type that supports Arabic, like `Arial`
  doc.addFileToVFS('Amiri-Regular.ttf', font);
  doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  doc.setFont('Amiri');
  
  // Title
  doc.setFontSize(18);
  doc.text(selectedEvent.teacher, 20, 20);
  
  // Additional Info
  doc.setFontSize(14);
  doc.text(selectedEvent.year, 20, 30);
  doc.text(selectedEvent.subject, 20, 40);



  doc.text(`تاريخ الحصة: ${format(new Date(selectedEvent.start), 'yyyy-MM-dd HH:mm')}`, 20, 60);
  doc.text(`عدد الحاضرين: ${attendance.length} تلميذ`, 20, 70);
  // Table
  const columns = ["Index", "Etudiants", "Group", "Status",];
  const rows = attendance.map((student, index) => [
    index + 1,                      // Index
    student.name,                   // Student Name
    student.group,                  // Group
    student.status, // Status

  ]);

autoTable(doc,{
  head: [columns],
  body: rows,
  theme: 'grid',
  headStyles:{
    fillColor: '#E0E0E0',
    textColor:'black',
    font:'Amiri',
  },
  bodyStyles:{
          font:'Amiri',
  },
  startY: 120
});

  // Save the PDF
  doc.save('teacher_class_review.pdf');
};

export default generatePDF;