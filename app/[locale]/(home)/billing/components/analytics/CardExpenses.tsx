"use client"

import { useTranslations } from 'next-intl'
import { useData } from '@/context/admin/fetchDataContext'
import { Card, CardContent } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, DollarSignIcon } from "lucide-react"
import { Progress } from "@/components/ui/progress"

type Transaction = {
  amount?: number
  paymentAmount?: number
  type: 'invoice' | 'teacher' | 'payout'
}

export default function CardIncome() {
  const t = useTranslations()
  const { payouts, invoices, teachersSalary } = useData()

  const allTransactions: Transaction[] = [
    ...payouts.map(payout => ({ ...payout, type: 'payout' as const })),
    ...invoices.flatMap(invoice => 
      (invoice.transaction || []).map(transaction => ({
        ...transaction,
        type: 'invoice' as const
      }))
    ),
    ...teachersSalary.map(transaction => ({
      ...transaction,
      type: 'teacher' as const
    }))
  ]

  const { totalIncome, totalExpenses } = allTransactions.reduce((acc, transaction) => {
    const amount = transaction.amount || transaction.paymentAmount || 0
    if (transaction.type === 'invoice') {
      acc.totalIncome += amount
    } else {
      acc.totalExpenses += amount
    }
    return acc
  }, { totalIncome: 0, totalExpenses: 0 })

  const totalAmount = totalIncome + totalExpenses
  const incomePercentage = (totalIncome / totalAmount) * 100
  const expensesPercentage = (totalExpenses / totalAmount) * 100

  return (
    <Card className="w-[395px] h-[235px] overflow-hidden border-2 border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t('financial-summary')}</h3>
          <DollarSignIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-4">
          <FinancialItem
            title={t('total-income')}
            amount={totalIncome}
            percentage={incomePercentage}
            icon={ArrowUpIcon}
            isPositive={true}
          />
          <FinancialItem
            title={t('total-expenses')}
            amount={totalExpenses}
            percentage={expensesPercentage}
            icon={ArrowDownIcon}
            isPositive={false}
          />
        </div>
        <div className="mt-6">
          <Progress value={incomePercentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}

type FinancialItemProps = {
  title: string
  amount: number
  percentage: number
  icon: React.ElementType
  isPositive: boolean
}

function FinancialItem({ title, amount, percentage, icon: Icon, isPositive }: FinancialItemProps) {
  const colorClass = isPositive ? 'text-green-500' : 'text-red-500'

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Icon className={`h-4 w-4 ${colorClass}`} />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-right">
        <div className="font-semibold">{amount.toLocaleString()} DZD</div>
        <div className={`text-xs ${colorClass}`}>{percentage.toFixed(1)}%</div>
      </div>
    </div>
  )
}
