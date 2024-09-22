
import { CardContent,Card,CardHeader,CardTitle,CardDescription} from '@/components/ui/card';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "@/components/ui/avatar"
import { format } from "date-fns";
import { useTranslations } from 'next-intl';
import { useData } from '@/context/admin/fetchDataContext';
import { ScrollArea } from '@/components/ui/scroll-area';
function CardTransactions(){
  const t=useTranslations()
  const {payouts,invoices,teachersSalary}=useData()
  const allInvoiceTransactions = invoices.flatMap(invoice => 
    (invoice.transaction || []).map(transaction => ({
      ...transaction,
      student: invoice.student.student,
      type: 'invoice'
    }))
  )

  const allTeacherTransactions = teachersSalary.map(transaction => ({
    ...transaction,
    type: 'teacher'
  }))

  // Combine payouts, invoice transactions, and teacher transactions
  const allTransactions = [
    ...payouts.map(payout => ({ ...payout, type: 'payout' })),
    ...allInvoiceTransactions,
    ...allTeacherTransactions
  ]

  // Sort transactions by date
  allTransactions.sort((a, b) => {
    const dateA = a.type === 'teacher' ? new Date(a.date) : (a.type === 'payout' ? new Date(a.date) : new Date(a.paymentDate));
    const dateB = b.type === 'teacher' ? new Date(b.date) : (b.type === 'payout' ? new Date(b.date) : new Date(b.paymentDate));
    return dateB.getTime() - dateA.getTime(); // Sort in descending order (most recent first)
  });

  const totalSum = allTransactions.reduce((sum, transaction) => {
    const amount = transaction.amount || transaction.paymentAmount || 0;
    return sum + (transaction.type === 'invoice' ? amount : -amount);
  }, 0);
  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{t('recent-transactions')}</CardTitle>
          <CardDescription>
            {t('you-made-265-transactions-this-week', { numb: allTransactions.length })}
          </CardDescription>
        </div>
        <div className={`text-2xl font-bold ${totalSum >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {totalSum >= 0 ? '+' : '-'}
          {Math.abs(totalSum).toLocaleString()} DZD
        </div>
        </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px]">
          <div className="space-y-8">
            {allTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/placeholder.svg" alt="Avatar" />
                  <AvatarFallback>
                    {transaction.type === 'payout' ? (transaction.fromWho?.charAt(0) || 'P') :
                     transaction.type === 'invoice' ? (transaction.student?.charAt(0) || 'S') :
                     'T'}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {transaction.type === 'payout' ? transaction.paymentTitle :
                     transaction.type === 'invoice' ? (transaction.student || 'Unknown Student') :
                     (transaction.paymentType === 'salary' ? 'Salary Payment' : 'Advance Payment')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.type === 'payout' ? transaction.fromWho :
                     transaction.type === 'invoice' ? (transaction.group || 'No group') :
                     (transaction.month || 'Unknown Month')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transaction.date || transaction.paymentDate), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
                <div className={`ml-auto font-medium ${
                  transaction.type === 'invoice' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {transaction.type === 'invoice' ? '+' : '-'}
                  {transaction.amount || transaction.paymentAmount} DZD
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default CardTransactions
