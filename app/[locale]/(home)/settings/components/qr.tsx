/**
 * v0 by Vercel.
 * @see https://v0.dev/t/ImfugvbdxQO
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
"use client"

import { useEffect, useState } from "react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import QRCode from 'qrcode'
import { PDFDocument, PDFName, PDFPage, rgb } from 'pdf-lib';
import { saveAs } from "file-saver"; // Import saveAs from file-saver
import path from 'path';
import { decode } from 'base64-arraybuffer';
import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/firebase/firebase-config"
const copyPage = (originalPage) => {
  const cloneNode = originalPage.node.clone();

  const { Contents } = originalPage.node.normalizedEntries();
  if (Contents) cloneNode.set(PDFName.of('Contents'), Contents.clone());

  const cloneRef = originalPage.doc.context.register(cloneNode);
  const clonePage = PDFPage.of(cloneNode, cloneRef, originalPage.doc);
  return clonePage;
};

const generateQrCode = async (data: string) => {
    return QRCode.toDataURL(data);
  };
  
  const generateFirestoreId = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 20; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };
  
  const fetchExistingIds = async (collectionPath: string, documentId: string): Promise<Set<string>> => {
    const existingIds = new Set<string>();
    const docRef = doc(db, collectionPath, documentId);
    const querySnapshot = await getDoc(docRef);
  
    if (querySnapshot.exists()) {
      const data = querySnapshot.data();
      if (data && Array.isArray(data.qrs)) {
        // Add each ID from the qrs array to the Set
        data.qrs.forEach((id: string) => existingIds.add(id));
      }
    }
  
    return existingIds;
  };
  
  const generateUniqueIds = async (count: number): Promise<string[]> => {
    // const existingIds = await fetchExistingIds("Qrs", "NYX2q0LyHKjO79FkhhOs");
    const uniqueIds = new Set<string>();
  
    while (uniqueIds.size < count) {
      const newId = generateFirestoreId();
      // if (!existingIds.has(newId)) {
      uniqueIds.add(newId);
      // }
    }
  
    return Array.from(uniqueIds);
  };
  
  const generateIdsAndQRCodes = async (count: number) => {
    const ids = await generateUniqueIds(count); // Await the result here
  
    const idsAndQRCodesPromises = ids.map(async (id) => {
      const qrCode = await generateQrCode(id);
      return { id, qrCode };
    });
  
    return Promise.all(idsAndQRCodesPromises);
  };
  const addQRCodesToPDF = async (pdfBytes, qrCodeTexts) => {
    try {

  
      // Generate QR codes as data URLs
      const qrCodeDataUrls = await Promise.all(
        qrCodeTexts.map(text => QRCode.toDataURL(text, { margin: 0 }))
      );
  
      // Convert data URLs to Uint8Array
      const qrCodeBytesArray = qrCodeDataUrls.map(url => 
        Uint8Array.from(atob(url.split(',')[1]), c => c.charCodeAt(0))
      );
  
      // Load the original PDF
      const donorDoc = await PDFDocument.load(pdfBytes);
  
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
  
      // Copy the original page
      const [originalPage] = await donorDoc.copyPages(donorDoc, [0]);
  
      // Add three pages to the new PDF, each containing the original page's content
      const pages = [];
      for (let i = 0; i < qrCodeBytesArray.length; i++) {
        const [copiedPage] = await pdfDoc.copyPages(donorDoc, [0]); // Copy the original page content
    
        const newPage = copyPage(copiedPage);
        pdfDoc.addPage(newPage);

        const qrCodeImage = await pdfDoc.embedPng(qrCodeBytesArray[i]);
        const qrCodeDims = qrCodeImage.scale(0.5); // Adjust size as needed
  
        newPage.drawImage(qrCodeImage, {
          x: 173.5, // X position in points (adjust as needed)
          y: newPage.getHeight() - qrCodeDims.height - 53, // Y position in points (adjust as needed)
          width: qrCodeDims.width,
          height: qrCodeDims.height,
        });
      }
   
      // Save the updated PDF
      const updatedPdfBytes = await pdfDoc.save();
      return updatedPdfBytes;
    } catch (error) {
      console.error('Error adding QR codes to PDF:', error);
      throw error;
    }
  };
export const Component = ()   => {
  const [selectedQrCode, setSelectedQrCode] = useState(null)
  const [qrs,setQrs]=useState()
  const handleQrCodeClick = (qrCodeText) => {
    setSelectedQrCode(qrCodeText)
  }
  const handleCloseModal = () => {
    setSelectedQrCode(null)
  }

  const [data, setData] = useState<{ id: string, qrCode: string }[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const result = await generateIdsAndQRCodes(10);
      setData(result);
    };
    
    fetchData();
  }, []);
  
    const handleDownload = async () => {
      try {
        // Step 1: Generate Unique IDs
        const uniqueIds = await generateUniqueIds(50);
    
        // Step 2: Save to Firestore
        await updateDoc(doc(db, 'Qrs',"almawaridis30cartes"), {
          qrs:arrayUnion(...uniqueIds) 
        });
    
        // Step 3: Output the IDs to a JSON file
        const jsonContent = JSON.stringify({ qrs: uniqueIds }, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json" });
        saveAs(blob, 'output.json');
    
        console.log("QR codes generated and saved to Firestore and output.json");
      } catch (error) {
        console.error("Error processing QR codes:", error);
      }
    };
  
  return (
   <div className="max-w-6xl mx-auto border rounded-lg shadow-lg">
      <button onClick={handleDownload}>
      Download PDF with QR Code
    </button>
       
   <div className="max-h-[500px] overflow-auto">
  
     <Table>
       <TableHeader>
         <TableRow>
           <TableHead className="w-[300px] sticky top-0 bg-background">ID</TableHead>
           <TableHead className="sticky top-0 bg-background">QR Code</TableHead>
         </TableRow>
       </TableHeader>
       <TableBody>
       {data.map((item) => (
        <TableRow key={item.id}>
          <TableCell className="font-medium sticky left-0 bg-background"></TableCell>
          <TableCell>
            <button onClick={() => handleQrCodeClick(item.id)}>
              <img src={item.qrCode} className="w-24 h-24 text-muted-foreground" alt="QR Code" />
            </button>
          </TableCell>
        </TableRow>
      ))}
       </TableBody>
     </Table>
   </div>

 </div>
  )
}


function CircleCheckIcon(props: any) {
   return (
       <svg width="232" height="232" viewBox="0 0 232 232"
            xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" xmlnsEv="http://www.w3.org/2001/xml-events">
           <rect x="0" y="0" width="232" height="232" fill="#ffffff" />
           <defs>
               <rect id="p" width="8" height="8" />
           </defs>
       </svg>
   );
}