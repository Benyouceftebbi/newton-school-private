"use client"

import { useTranslations } from 'next-intl'
import { useData } from '@/context/admin/fetchDataContext'
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

export default function NetProfitSummary() {
  const t = useTranslations()
  const { payouts, invoices, teachersSalary } = useData()

  const allTransactions = [
    ...payouts.map(payout => ({ ...payout, type: 'payout' })),
    ...invoices.flatMap(invoice => (invoice.transaction || []).map(transaction => ({ ...transaction, type: 'invoice' }))),
    ...teachersSalary.map(transaction => ({ ...transaction, type: 'teacher' }))
  ]

  const totalIncome = allTransactions.reduce((sum, transaction) => 
    sum + (transaction.type === 'invoice' ? (transaction.amount || transaction.paymentAmount || 0) : 0), 0)

  const totalExpenses = allTransactions.reduce((sum, transaction) => 
    sum + (transaction.type !== 'invoice' ? (transaction.amount || transaction.paymentAmount || 0) : 0), 0)

  const totalSum = totalIncome - totalExpenses
  const benefitPercentage = totalIncome > 0 ? (totalSum / totalIncome) * 100 : 0

  return (
    <Card className="w-[395px] h-[235px] overflow-hidden bg-white dark:bg-gray-800 border-2 border-gray-200">
      <CardContent className="p-6 flex flex-col h-full">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('net-profit-summary')}</h2>
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2 flex items-center justify-center">
              <span className={totalSum >= 0 ? "text-green-500" : "text-red-500"}>
                {totalSum >= 0 ? "+" : "-"}
                {Math.abs(totalSum).toLocaleString()} DZD
              </span>
            </div>
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              benefitPercentage >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
              {benefitPercentage >= 0 ? (
                <ArrowUpIcon className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 mr-1" />
              )}
              {Math.abs(benefitPercentage).toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('total-income')}</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{totalIncome.toLocaleString()} DZD</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('total-expenses')}</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{totalExpenses.toLocaleString()} DZD</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}