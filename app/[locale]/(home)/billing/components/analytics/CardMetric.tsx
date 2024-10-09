

import { Line, LineChart, ResponsiveContainer, Tooltip,XAxis,YAxis } from "recharts"


import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTranslations } from "next-intl";
import { useData } from "@/context/admin/fetchDataContext";



type MonthName = 'January' | 'February' | 'March' | 'April' | 'May' | 'June' | 'July' | 'August' | 'September' | 'October' | 'November' | 'December';


export function CardsMetric() {
  
const {analytics}=useData()
const t=useTranslations()
const data = analytics?.data
  ? Object.keys(analytics.data)
      .map((key) => ({
        month: analytics.data[key].month as MonthName, // Assert the type of month
        income: analytics.data[key].income || 0,
        expenses: analytics.data[key].expenses || 0,
      }))
      .sort((a, b) => {
        const monthsOrder: Record<MonthName, number> = {
          January: 5,
          February: 6,
          March: 7,
          April: 8,
          May: 9,
          June: 10,
          July: 11,
          August: 12,
          September: 1,
          October: 2,
          November: 3,
          December: 4,
        };

        return monthsOrder[a.month] - monthsOrder[b.month];
      })
  : [];


  return (

    <Card className="col-span-4 border-2 border-gray-200">
    <CardHeader>
      <CardTitle>{t('overview')}</CardTitle>
    </CardHeader>
    <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {t('income')} </span>
                            <span className="font-bold text-muted-foreground">
                              {payload[0].value}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {t('expenses')} </span>
                            <span className="font-bold">
                              {payload[1].value}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return null
                }}
              />
              <Line
                type="monotone"
                strokeWidth={2}
                dataKey="income"
                activeDot={{
                  r: 6,
                  style: { fill: "var(221.2 83.2% 53.3%)", opacity: 0.25 },
                }}
                style={
                  {
                    stroke: "var(221.2 83.2% 53.3%)",
                    opacity: 0.25,
                    "--theme-primary": `hsl(221.2 83.2% 53.3%)`,
                  } as React.CSSProperties
                }
              />
              <Line
                type="monotone"
                dataKey="expenses"
                strokeWidth={2}
                activeDot={{
                  r: 8,
                  style: { fill: "var(221.2 83.2% 53.3%)" },
                }}
                style={
                  {
                    stroke: "var(221.2 83.2% 53.3%)",
                    "--theme-primary": `hsl(221.2 83.2% 53.3%)`,
                  } as React.CSSProperties
                }
              />
                    <XAxis
          dataKey="month"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          scale="point"
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `DZD${value}`}
          
        />
            </LineChart>
          </ResponsiveContainer>
          </CardContent>
                </Card>

  )
}