import { z } from 'zod';
import { parseISO, isBefore, startOfToday, startOfYear } from 'date-fns';

const GroupSchema = z.array(
  z.object({
    day: z.string(),
    end: z.string(),
    room: z.string(),
    start: z.string(),
  })
);
const ClassesUIDsSchema = z.array(z.object({
  id: z.string(),
  group: z.string(),
}));

export const SubjectsSchema = z.array(
  z.object({
    amount: z.number(),
    cs: z.string(),
    debt: z.number(),
    group: z.string(),
    groups: GroupSchema, // Referencing the GroupSchema
    id: z.string(),
    index: z.number(),
    name: z.string(),
    sessionsLeft: z.number(),
    sessionsToStudy: z.number(),
    subject: z.string(),
  })
);

const ActionTrackSchema = 
  z.object({
    action: z.string().optional(),
    additionalInfo: z.object({
      classId: z.string().optional(),
      studentID: z.string().optional(),
      studentName: z.string().optional(),
      resourceId: z.string().optional(),
      resourceType: z.string().optional(),
      birthdate: z.date().optional(),
      birthplace: z.string().optional(),
    }),
    timestamp: z.string().optional(),
    userId: z.string().optional(),
    userType: z.string().optional(),
  });

// Define the StudentSchema
export const StudentSchema = z.object({
  actionTrack: z.array(ActionTrackSchema).optional(),// Referencing the ActionTrackSchema
  birthdate: z.date().refine((value: Date) => value < new Date(), {
    message: 'Please enter a valid date of birth.',
  }),
  birthplace: z.string().min(1, { message: 'Birthplace is required' }),
  classes: SubjectsSchema,
  classesUIDs: ClassesUIDsSchema,
  debt: z.number().optional(),
  field: z.string().min(1, { message: 'Field is required' }),
  id: z.string( { message: 'Name is required' }),
  label:z.string().optional(),
  lastPaymentDate: z.date().optional(),
  monthlypayment: z.number().optional(),
  name: z.string().min(1, { message: 'Name is required' }),
  nextPaymentDate: z.date().optional(),
  phoneNumber: z.string().min(10, 'Please enter a value between 10 and 15 characters.').max(15, 'Please enter a value between 10 and 15 characters.'),
  photo: z.string().optional(),
  registrationAndInsuranceFee: z.number().optional(),
  school: z.string().min(1, { message: 'School is required' }),
  student:z.string().optional(),
  studentIndex: z.number( { message: 'Name is required' }),
  totalAmount: z.number().optional(),
  value:z.string().optional(),
  year: z.string().min(1, { message: 'Year is required' }),
  newId:z.string().optional(),




});

// Generate TypeScript type from the Zod schema
export type Student = z.infer<typeof StudentSchema>;



/**
 * 
  debt: z.number( { message: 'Name is required' }),
 
  lastPaymentDate: z.date( { message: 'Name is required' }),
  monthlypayment: z.number( { message: 'Name is required' }),
  nextPaymentDate: z.date( { message: 'Name is required' }),
  totalAmount: z.number( { message: 'Name is required' }),
  newId:z.string().optional(),


classes

      nextPaymentDate: z.date(),

 */
