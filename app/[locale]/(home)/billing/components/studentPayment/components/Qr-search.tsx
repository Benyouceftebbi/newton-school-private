import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CircleAlertIcon, CircleCheckIcon, PlusCircle, ScanIcon } from 'lucide-react';
import QrScanner from "qr-scanner";
import { useTranslations } from 'next-intl';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const isFirestoreId = (id) => {
  if (typeof id !== 'string' || id.length !== 20) {
    return false;
  }

  const firestoreIdRegex = /^[a-zA-Z0-9]{20}$/;
  return firestoreIdRegex.test(id);
};

const QrSeach: React.FC<{ onStudentScanned: (name: string) => void }> = ({ onStudentScanned }) => {
  const t = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);
  const highlightCodeOutlineRef = useRef<HTMLDivElement>(null);
  const qrScanner = useRef<QrScanner | null>(null);
  const [showingQrScanner, setShowingQrScanner] = useState(false);
  const [student, setStudent] = useState(undefined);
  const audioRefSuccess = useRef(null);
  const audioRefError = useRef(null);
  const processedQrCodes = useRef(new Set<string>());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleQrScan = async (result) => {
    if (!isFirestoreId(result.data)) {
      setStudent(null);
      audioRefError.current?.play();
      return;
    }
    const userRef = doc(db, 'Students', result.data);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      setStudent(userData);
      onStudentScanned(userData.name || ''); // Send student name or empty string if name not found
      audioRefSuccess.current?.play();
    } else {
      setStudent(null);
      onStudentScanned(''); // Send empty string if student not found
      audioRefError.current?.play();
    }
    stopScanner();
    setIsDialogOpen(false); // Close the dialog
  };

  const stopScanner = () => {
    qrScanner.current?.stop();
    qrScanner.current = null;
    if (videoRef.current) {
      videoRef.current.hidden = true;
    }
    processedQrCodes.current.clear();
    setShowingQrScanner(false);
  };

  const handleButtonClick = async () => {
    if (videoRef.current) {
      videoRef.current.hidden = false;
    }
    qrScanner.current = new QrScanner(videoRef.current!, handleQrScan, {
      highlightScanRegion: true,
      overlay: highlightCodeOutlineRef.current!,
      maxScansPerSecond: 1,
      preferredCamera: 'user',
    });
    await qrScanner.current.start();
    setShowingQrScanner(true);
    setIsDialogOpen(true); // Open the dialog
  };
  const [scannedCode, setScannedCode] = useState<string>('');



  React.useEffect(() => {
    if (scannedCode) {
      console.log("qr scanned",scannedCode);
      
      onQrScannedInput(scannedCode);
    
    }
  }, [scannedCode]);
  const onQrScannedInput=async(id)=>{
    if (!isFirestoreId(id)) {
      setStudent(null);
      audioRefError.current?.play();
      return;
    }
    
    const userRef = doc(db, 'Students', id);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      setStudent(userData);
      onStudentScanned(userData.name || ''); // Send student name or empty string if name not found
      audioRefSuccess.current?.play();
    } else {
      setStudent(null);
      onStudentScanned('');//Send empty string if student not found
      audioRefError.current?.play();
    }

    setIsDialogOpen(false); // Close the dialog
    
  }
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild className='mr-3'>
        <Button variant="outline" className="ml-2">
          <QrCodeIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Scan Student QR Code</DialogTitle>
        </DialogHeader>
        <audio id="qr-scan-sound-success" ref={audioRefSuccess} src="/success.mp3"></audio>
        <audio id="qr-scan-sound-error" ref={audioRefError} src="/error.mp3"></audio>
        <div className="grid gap-6 py-6">
          <div className="aspect-square bg-background rounded-md overflow-hidden relative h-[300px] w-full flex items-center justify-center">
            <video hidden={!showingQrScanner} ref={videoRef} className="absolute inset-0 w-full h-full object-cover"></video>
          </div>
          {showingQrScanner ? (
            <button
              onClick={stopScanner}
              className="mt-4 text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800"
            >
              {t('Stop QR Scanner')}
            </button>
          ) : (
            <button
              onClick={handleButtonClick}
              type='button'
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
            >
              {t('Start QR Scanner')}
            </button>
          )}
            {/** <div className="bg-muted rounded-lg p-6 flex flex-col items-center justify-center gap-4">
      <Card className="w-full max-w-md mx-auto">
 <CardHeader>
   <CardTitle className="text-2xl font-bold text-center">QR Code Scanner</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
   <div className="relative">
   <Input
     type="text"
     value={scannedCode}
     onChange={(e) => {setScannedCode(e.target.value)}}
     placeholder="Scan QR code here"
     autoFocus
   />
     <ScanIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
   </div>
 </CardContent>
</Card>
  
 </div>**/}
        </div>
      </DialogContent>
    </Dialog>
  );
};

function QrCodeIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
    </svg>
  );
}

export default QrSeach;