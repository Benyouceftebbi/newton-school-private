import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import rrulePlugin from '@fullcalendar/rrule';
import { AttandenceDataModel } from './attendance-sheet';
import { useData } from '@/context/admin/fetchDataContext';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'; // Import the resourceTimeline plugin
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { fr } from 'date-fns/locale'; // Import French locale

import '@mobiscroll/react/dist/css/mobiscroll.min.css';

import { useCallback,useMemo} from 'react';
import {
  Eventcalendar,
  MbscCalendarColor,
  MbscCalendarEvent,
  MbscEventcalendarView,
  MbscResource,
  setOptions,
  locale,
  Popup,
} from '@mobiscroll/react';
import { FC} from 'react';
import './style.css'
import { format, formatDate, set, startOfWeek } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { generateTimeOptions } from '../../settings/components/open-days-table';
import { arrayUnion, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
// Function to generate a random color
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Function to map days to RRule compatibl


setOptions({
  theme: 'ios',
  themeVariant: 'light'
});
const formatDateToYYYYMMDD = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based, so add 1
  const day = date.getDate().toString().padStart(2, '0'); // Pad day with leading zero if needed

  return `${year}-${month}-${day}`;
};
const dayToWeekDay = {
  "Sunday": "SU",
  "Monday": "MO",
  "Tuesday": "TU",
  "Wednesday": "WE",
  "Thursday": "TH",
  "Friday": "FR",
  "Saturday": "SA"
};
const now = new Date();
const day = now.getDay();
const month = 7; // August (0-based index)
const year = now.getFullYear() - 1; // One year before the current year
const monday = now.getDate() - day + (day == 0 ? -6 : 1);
const extractRoomNumber = (room:string) => {
  const match = room.match(/(\d+)$/); // Match the last number in the string
  return match ? parseInt(match[1], 10) : 1; // Default to 1 if no number is found
};

const VerticalResourceView = () => {
  const {classes,profile,setClasses}=useData()
  const [events,setEvents]=useState<MbscCalendarEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [openCard, setOpenCard] = useState(false);
  const [open,setOpen]=useState(false)
  const timeOptions = generateTimeOptions("07:00","22:00", 30);
  useEffect(() => {
    const fetchAndFormatData = async () => {

      const formattedEvents = classes.flatMap((classItem) => {
        // Extract groups array and other necessary fields
        const groups = classItem.groups || [];
        const extraClasses = classItem.extraClasses || []; // Extract extraClasses if available
        const classId = classItem.id; // Extract the class ID from classItem
        const color = getRandomColor();
      
        const eventsFromGroups = groups.flatMap((group) => {
          const { day, start, end, room } = group;
      
          if (!start || !end || !room) {
            console.error('Missing required event properties:', group);
            return []; // Skip this event if any required property is missing
          }
      
          const targetDayAbbreviation = dayToWeekDay[day];
      
          if (!targetDayAbbreviation) {
            console.log("Invalid day in group", classId);
            throw new Error("Invalid day provided");
          }
      
          const firstDayOfMonth = new Date(year, month, 1);
          let targetDate = new Date(firstDayOfMonth);
          while (targetDate.getDay() !== Object.keys(dayToWeekDay).indexOf(day)) {
            targetDate.setDate(targetDate.getDate() + 1);
          }
      
          const offset = new Date().getTimezoneOffset() * 60000; // Offset in milliseconds
          const startDate = new Date(year, month, targetDate.getDate(), ...start.split(':').map(Number));
          startDate.setTime(startDate.getTime() - offset); // Adjust for timezone offset
      
          const endDate = new Date(year, month, targetDate.getDate(), ...end.split(':').map(Number));
          endDate.setTime(endDate.getTime() - offset); // Adjust for timezone offset
      
          const resourceNumber = extractRoomNumber(room);
      
          return {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            title: classItem.subject,
            resource: resourceNumber, // Set your resource ID if needed
            color: color,
            recurring: {
              repeat: 'weekly',
              until: '2025-07-25',
              weekDays: targetDayAbbreviation,
              interval: 1
            },
            extraInfo: {
              classId: classItem.id,
              group: classItem.group,
              subject: classItem.subject,
              year: classItem.year,
              teacher: classItem.teacherName
            }
          };
        });
      
        const eventsFromExtraClasses = extraClasses.map((extraClass) => {
          const { startTime, endTime, room } = extraClass;
      
          if (!startTime || !endTime || !room) {
            console.error('Missing required event properties in extraClasses:', extraClass);
            return null;
          }
      
      
          const resourceNumber = extractRoomNumber(room);
      
          return {
            start: startTime.toDate(),
            end: endTime.toDate(),
            title: `${classItem.subject} (Extra Class)`,
            resource: resourceNumber,
            color: color,
            extraInfo: {
              ...extraClass,
              startClass:extraClass.start,
              endClass:extraClass.end,
              classId:classId,
              group: classItem.group,
              subject: classItem.subject,
              year: classItem.year,
              teacher: classItem.teacherName,
              extra:true
            }
          };
        }).filter(Boolean); // Filter out null events
      
        return [...eventsFromGroups, ...eventsFromExtraClasses];
      });
  
      setEvents(formattedEvents);
    };
  
    fetchAndFormatData();
  }, [classes]);
  const handleEventClick =(args) => {
    try {
 
      
   
      if (!args || !args.event || !args.event.start || !args.event.extraInfo) {
        throw new Error('Invalid event data provided');
      }
  
      // Validate extraInfo
      const { classId, group } = args.event.extraInfo;
      if (typeof classId !== 'string' || typeof group !== 'string') {
        throw new Error('Invalid extraInfo data');
      }
  
      // Format the date
      const formattedDate = formatDateToYYYYMMDD(args.event.start);
  
      // Find the attendance object for the class
      const attendance = classes.find((cls) => cls.id === classId);

  
      // Ensure attendance is defined before accessing its properties
      if (!attendance) {
        throw new Error(`Attendance object not found for classId: ${classId}`);
      }
  
      // Use optional chaining and default value for safety
      const attendanceDetail = attendance.Attendance?.[`${formattedDate}`] || { attendanceList: [] };
 const {Attendance,...rest}=attendance
      // Update the selected event with details and extra info
      setSelectedEvent({ ...args.event.extraInfo, ...attendanceDetail,...rest,attendanceId:`${formattedDate}`,start:args.event.start,end:args.event.end});
  
      // Open the event card
      setOpenCard(true);
  
      
    } catch (error) {
      // Log the error for debugging
      console.error('Error handling event click:', error);
  
      // Display a user-friendly message
      alert(`An error occurred while processing the event. Please try again. ${error.message}`);
  
      // Optionally, you can also send error details to a logging service
      // sendErrorToLoggingService(error);
    }
  }

  const myResources = useMemo<MbscResource[]>(
    () => {
      const rooms = [];
      const colors = ['#f7c4b4', '#c6f1c9', '#e8d0ef', '#edeaba', '#bacded'];
      
      for (let i = 1; i <= profile.NumberOfClasses; i++) {
        rooms.push({
          id: i,
          name: `room ${i}`,
          color: colors[(i - 1) % colors.length], // Cycle through colors
        });
      }
      
      return rooms;
    },
    [profile.NumberOfClasses] // Recompute if NumberOfClasses changes
  );

  const myView = useMemo<MbscEventcalendarView>(
    () => ({
      schedule: {
        type: 'week',
        allDay: false,
        startDay: 0,
        endDay: 6,
        startTime: '07:00',
        endTime: '22:00',
    
      },
   
    }),
    [],
  );

  const myColors = useMemo<MbscCalendarColor[]>(
    () => [
      {
        start: '05:00',
        end: '22:00',
        recurring: {
          repeat: 'daily',
        },
        resource: 2,
        background: '#d3b9711a',
      },
    ],
    [],
  );
  const getStartOfWeek = (date = new Date()) => {
    return startOfWeek(date, { weekStartsOn: 0 }); // Change `weekStartsOn` to 1 if you want Monday as the start
  };
  const defaultSelectedDate = getStartOfWeek();

  
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [formData, setFormData] = useState({
    subject: '',
    teacher: '',
    group: '',
    startTime: '',
    endTime: '',
       room:'',
      isPaid:'false'
  })

  const handleSelectSlot = (slotInfo) => {
    setSelectedSlot(slotInfo.event)
    
    setOpen(true)
    setFormData({
      ...formData,
      startTime : format(new Date(slotInfo.event.start), 'HH:mm'),
      endTime : format(new Date(slotInfo.event.end), 'HH:mm')
    })
  }

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    if (field==='group'){
      setFormData({ ...formData, [field]: value })
    }
  }

  const handleSubmit =async() => {
    const selectedClass=classes.find(cls=>cls.id===formData.group)
    const newEvent = {
      title:formData.subject,
      start : set(new Date(selectedSlot.start), {
        hours: parseInt(formData.startTime.split(':')[0]),
        minutes: parseInt(formData.startTime.split(':')[1]),
      }),
      
    end : set(new Date(selectedSlot.start), {
        hours: parseInt(formData.endTime.split(':')[0]),
        minutes: parseInt(formData.endTime.split(':')[1]),
      }),
      resource:parseInt(formData.room.match(/\d+/)[0], 10),
      color:getRandomColor(),
      extraInfo:{
        classId:selectedClass.id,
        group:selectedClass.group,
        subject:selectedClass.subject,
        year:selectedClass.year,
        teacher:selectedClass.teacherName
      }

    }

    await updateDoc(doc(db,'Groups',formData.group),{
      extraClasses:arrayUnion({
        start:formData.startTime,end:formData.endTime,room:formData.room,startTime:newEvent.start,endTime:newEvent.end,isPaid:formData.isPaid,day:format(new Date(selectedSlot.start), 'EEEE')
      })
    })
    setClasses((prev) =>
      prev.map((cls) =>
        cls.id === formData.group
          ? {
              ...cls,
              extraClasses: cls.extraClasses
                ? // If extraClasses exists, append the new event
                  [
                    ...cls.extraClasses,
                    {
                      start: formData.startTime,
                      end: formData.endTime,
                      room: formData.room,
                      startTime: Timestamp.fromDate(new Date(newEvent.start)), // Convert to Firestore Timestamp
                      endTime: Timestamp.fromDate(new Date(newEvent.end)), 
                      isPaid: formData.isPaid,
                      day: format(new Date(selectedSlot.start), 'EEEE'),
                    },
                  ]
                : // If extraClasses doesn't exist, create a new array with the event
                  [
                    {
                      start: formData.startTime,
                      end: formData.endTime,
                      room: formData.room,
                      startTime: Timestamp.fromDate(new Date(newEvent.start)), // Convert to Firestore Timestamp
                      endTime: Timestamp.fromDate(new Date(newEvent.end)), 
                      isPaid: formData.isPaid,
                      day: format(new Date(selectedSlot.start), 'EEEE'),
                    },
                  ],
            }
          : cls
      )
    );

    setEvents([...events, newEvent])
    setOpen(false)
    setFormData({
      subject: '',
      teacher: '',
      group: '',
      startTime: '',
      endTime: '',
      room:'',
      isPaid:'false'
    })
  }
  const subjects =  [
    "تحضيري",
    "رياضيات",
    "علوم",
    "فيزياء",
    "فلسفة",
    "العربية",
    "الإنجليزية",
    "الفرنسية",
    "اسبانية",
    "المانية",
    "ايطالية",
    "محاسبة",
    "هندسة مدنية",
    "هندسة ميكانيكية",
    "هندسة الطرائق",
    "الهندسة الكهربائية",
    "قانون",
    "اقتصاد",
    "العلوم الاسلامية",
    "تاريخ وجغرافيا",
    "Math",
    "Algebre",
    "Analyse",
    "Physique",
    "Chimie",
    "Gestion",
    "Informatique"
  
  ];
  const [appointment, setAppointment] = useState();
  const [isTooltipOpen, setTooltipOpen] = useState(false);

  const [tooltipAnchor, setTooltipAnchor] = useState(null);

  const timer = useRef(null);

  const openTooltip = useCallback((args) => {
    console.log("arge",args);
    
    const event = args.event;


    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

   
    setAppointment(event);
    setTooltipAnchor(args.domEvent.target.closest('.mbsc-schedule-event'));
    setTooltipOpen(true);
  }, []);





  const handleEventHoverIn = useCallback(
    (args) => {
      openTooltip(args);
    },
    [openTooltip],
  );

  const handleEventHoverOut = useCallback(() => {
    if (!timer.current) {
      timer.current = setTimeout(() => {
        setTooltipOpen(false);
      }, 200);
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    timer.current = setTimeout(() => {
      setTooltipOpen(false);
    }, 200);
  }, []);

  const handleTooltipClose = useCallback(() => {
    setTooltipOpen(false);
  }, []);







  return (
    <div>
 <Eventcalendar
   clickToCreate={true}
      view={myView}
      data={events}
      resources={myResources}
      colors={myColors}
      onEventClick={handleEventClick}

      onEventCreated={(e)=>handleSelectSlot(e)}
      groupBy='date'
      locale={locale['fr']}
defaultSelectedDate={format(defaultSelectedDate, 'yyyy-MM-dd')}
onEventHoverIn={handleEventHoverIn}
onEventHoverOut={handleEventHoverOut}
    />
  <Popup
        anchor={tooltipAnchor}
        contentPadding={false}
        display="anchored"
        isOpen={isTooltipOpen}
        scrollLock={false}
        showOverlay={false}
        touchUi={false}
        width={350}
        onClose={handleTooltipClose}

      >
       {appointment &&( <div className="bg-popover text-popover-foreground rounded-lg shadow-lg overflow-hidden" 
           onMouseEnter={handleMouseEnter} 
           onMouseLeave={handleMouseLeave}>
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-lg">{appointment.title}</h3>
          <p className="text-sm">
            {/* Format date in French */}
            {format(appointment.start, "PPP", { locale: fr })} {format(appointment.start, "p", { locale: fr })} - {format(appointment.end, "p", { locale: fr })}
          </p>
          <p className="text-sm">Professeur: {appointment.extraInfo.teacher}</p>
          <p className="text-sm">Classe/Année: {appointment.extraInfo.year}</p>
          {appointment.group && <p className="text-sm">Groupe: {appointment.group}</p>}
          {appointment.resource && <p className="text-sm">Lieu: Salle {appointment.resource}</p>}
        </div>
      </div>)}
      </Popup>
<Dialog open={open} onOpenChange={(e)=>{setOpen(e);setEvents([...events])}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject
              </Label>
              <Select onValueChange={(value) => handleInputChange('subject', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacher" className="text-right">
                Teacher
              </Label>
              <Select onValueChange={(value) => handleInputChange('teacher', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                {formData.subject ? (
  Array.from(
    new Set(
      classes
        .filter(cls => cls.subject === formData.subject) // Assuming you're filtering based on formData.subject
        .map(cls => cls.teacherName) // Map to teacherName to get a list of names
    )
  ).map(name => (
    <SelectItem key={name} value={name}>
      {name}
    </SelectItem>
  ))
) : (
  <p className="text-sm text-muted-foreground">Select Subject first</p>
)}
                </SelectContent>
              </Select>
            </div>
<div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group" className="text-right">
                Group
              </Label>
              <Select value={classes.find(type => type.id === formData?.id)} onValueChange={(value) => handleInputChange('group', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {formData.subject && formData.teacher ?classes.filter(cls => 
                                      cls.subject === formData.subject && 
                                     
                                      cls.teacherName === formData.teacher
                                    ).map((groupp, index) => (
                                      <SelectItem key={groupp.id} value={groupp.id}>
                                        {groupp.group}
                                      </SelectItem>
                                    )):(<p className="text-sm text-muted-foreground">Select Subject and name first</p>)
                
                }
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacher" className="text-right">
                Room
              </Label>
              <Select onValueChange={(value) => handleInputChange('room', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                {Array.from({ length: profile.NumberOfClasses }, (_, i) => `room ${i + 1}`).map((room) => (      
       <SelectItem key={room} value={room}>{room}</SelectItem>
      ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacher" className="text-right">
                Paid sessions
              </Label>
              <Select onValueChange={(value) => handleInputChange('isPaid', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
               
       <SelectItem  value={"true"}>{"true"}</SelectItem>
       <SelectItem  value={"false"}>{"false"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <Select
                  value={formData.startTime}
                  onValueChange={(e) => handleInputChange('startTime', e)}
            
                        >
            
                            <SelectTrigger
                                  className="col-span-3"
                              aria-label={`Select start time`}
                            >
                              <SelectValue placeholder={'select-start-time'} />
                            </SelectTrigger>

                          <SelectContent       className="col-span-3">
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time
              </Label>
              <Select
                  value={formData.endTime}
                  onValueChange={(e) =>handleInputChange('endTime', e)}
              
                        >
            
                            <SelectTrigger
                                 className="col-span-3"
                              aria-label={`Select start time`}
                            >
                              <SelectValue placeholder={'select-end-time'} />
                            </SelectTrigger>

                          <SelectContent     className="col-span-3">
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit}>Add Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        <AttandenceDataModel
          open={openCard}
          setOpen={setOpenCard}
          selectedEvent={selectedEvent}

        />

    </div>
    
  );
};

export default VerticalResourceView;