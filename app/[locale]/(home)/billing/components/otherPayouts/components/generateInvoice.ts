import { format } from "date-fns";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
//import { useData } from "@/context/admin/fetchDataContext";
// Add a helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(amount);
};

export function downloadInvoice(paymentData: any, id: string, titles: any[], words: any) {
  const doc = new jsPDF();

  // Set document properties
 

  // Add logo placeholder
  doc.setFontSize(24);
  doc.setTextColor(51, 102, 255);
  doc.text('LOGO', 20, 30);

  // Add company information


  /*
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${profile.schoolName}`, 20, 50);
  doc.text(`${profile.address}`, 20, 55);
  doc.text(`Phone: ${profile.phoneNumber}`, 20, 65);
  doc.text(`Email: ${profile.email}`, 20, 70);
*/


  // Add invoice details
  let paymentDate = new Date(paymentData.paymentDate);
  if (isNaN(paymentDate.getTime())) {
    console.error('Invalid paymentDate:', paymentData.paymentDate);
    paymentDate = new Date();
  }

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('INVOICE', 140, 30);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Invoice Number: #${id}`, 140, 40);
  doc.text(`Date: ${format(paymentDate, 'dd/MM/yyyy')}`, 140, 45);
  doc.text(`Due Date: ${format(new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy')}`, 140, 50);

  // Add client information (replace with actual client data)
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Bill To:', 20, 90);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Client Name', 20, 100);
  doc.text('Client Address', 20, 105);
  doc.text('City, Country, ZIP', 20, 110);

  // Add invoice items
  autoTable(doc, {
    startY: 120,
    head: [titles],
    body: [Object.values(paymentData)],
    theme: 'striped',
    headStyles: {
      fillColor: [51, 102, 255],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  // Add total section
  const finalY = (doc as any).lastAutoTable.finalY || 120;
  autoTable(doc, {
    startY: finalY + 10,
    body: [
      [{ content: words.subtotal, styles: { fontStyle: 'bold' } }, { content: formatCurrency(paymentData.paymentAmount), styles: { halign: 'right' } }],
      [{ content: words.totalTax, styles: { fontStyle: 'bold' } }, { content: formatCurrency(0), styles: { halign: 'right' } }],
      [{ content: words.totalAmount, styles: { fontStyle: 'bold' } }, { content: formatCurrency(paymentData.paymentAmount), styles: { halign: 'right', fontSize: 12, textColor: [51, 102, 255] } }],
    ],
    theme: 'plain',
    styles: {
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 'auto' },
    },
  });

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(150);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    doc.text('Thank you for your business!', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 5, { align: 'center' });
  }

  return doc.save("invoice");
}

export function generateBill(paymentData: any, id: string, titles: any[], words: any) {
  const doc = new jsPDF();

  // Set document properties
 

  // Add logo placeholder
  doc.setFontSize(24);
  doc.setTextColor(51, 102, 255);
  doc.text('LOGO', 20, 30);

  // Add company information
  
  // Add bill details
  let paymentDate = new Date(paymentData.paymentDate);
  if (isNaN(paymentDate.getTime())) {
    console.error('Invalid paymentDate:', paymentData.paymentDate);
    paymentDate = new Date();
  }

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('BILL', 140, 30);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Bill Number: #${id}`, 140, 40);
  doc.text(`Date: ${format(paymentDate, 'dd/MM/yyyy')}`, 140, 45);

  // Add bill items
  autoTable(doc, {
    startY: 80,
    head: [titles],
    body: [Object.values(paymentData)],
    theme: 'striped',
    headStyles: {
      fillColor: [51, 102, 255],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  // Add separator
  const finalY = (doc as any).lastAutoTable.finalY || 80;
  doc.setDrawColor(200);
  doc.line(20, finalY + 10, doc.internal.pageSize.width - 20, finalY + 10);

  // Add total amount
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Total Amount:', 20, finalY + 20);
  doc.setTextColor(51, 102, 255);
  doc.setFontSize(14);
  doc.text(formatCurrency(paymentData.paymentAmount), doc.internal.pageSize.width - 20, finalY + 20, { align: 'right' });

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(150);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    doc.text('Thank you for your payment!', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 5, { align: 'center' });
  }

  return doc.save("bill");

}

}
