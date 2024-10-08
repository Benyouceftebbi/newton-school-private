


import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTranslations } from 'next-intl';
import { useData } from '@/context/admin/fetchDataContext';


function CardsRevenue() {
const t=useTranslations()
const {analytics}=useData()
console.log("anannanananna",analytics.data);

const getMonthAbbreviation = (fullMonth: string) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthIndex = monthNames.findIndex((month) => month.toLowerCase() === fullMonth?.toLowerCase());
  return monthIndex !== -1 ? monthNames[monthIndex].slice(0, 3) : '';
};

const data: any[] =analytics.data?Object.keys(analytics.data)
  .map((key: any) => ({
    month: getMonthAbbreviation(analytics.data[key].month),
    income: analytics.data[key].income || 0,
    expenses: analytics.data[key].expenses || 0,
  }))
  .sort((a, b) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const aIndex = monthNames.findIndex(month => month.toLowerCase().startsWith(a.month.toLowerCase()));
    const bIndex = monthNames.findIndex(month => month.toLowerCase().startsWith(b.month.toLowerCase()));
    return aIndex - bIndex;
  }):[];

const getCurrentMonthData = () => {
  const currentMonth = new Date().toLocaleString('default', { month: 'short' });
  return data.find(item => item.month === currentMonth);
};

const getPreviousMonthData = () => {
  const currentMonthIndex = new Date().getMonth();
  const previousMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
  const previousMonthName = new Date(0, previousMonthIndex).toLocaleString('default', { month: 'short' });
  return data.find(item => item.month === previousMonthName);
};

const calculateRate = () => {
  const currentMonthData = getCurrentMonthData();
  const previousMonthData = getPreviousMonthData();

  if (!currentMonthData || !previousMonthData) {
    return null; // Data not found for current or previous month
  }

  const rate = ((currentMonthData.income - previousMonthData.income) / previousMonthData.income) * 100;
  return rate.toFixed(2); // Return rate with two decimal places
};
  return (
<Card className='border-2 border-gray-200'>
<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
  <CardTitle className="text-sm font-normal">{t('total-revenue')}</CardTitle>
</CardHeader>
<CardContent>
<div className="text-2xl font-bold">DZD { data.reduce((acc, curr) => acc + curr.income, 0)}</div>
<p className="text-xs text-muted-foreground">
      {t('from-last-month',{rate:calculateRate()})} </p>
  <div className="mt-4 h-[80px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
       <Tooltip
       cursor={{fill: 'transparent'}}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {t('income')} </span>
                            <span className="font-bold text-blue-500">
                              {payload[0].value}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {t('expenses')} </span>
                            <span className="font-bold text-muted-foreground">
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
      <Bar
          dataKey="income"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
                    
      <Bar
          dataKey="expenses"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          style={
            {
              stroke: "var(221.2 83.2% 53.3%)",
              opacity: 0.25,
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
      interval={0} // Display all labels
    // Rotate labels if needed
    />
      </BarChart>
    </ResponsiveContainer>
  </div>
</CardContent>
</Card>


  )
}
export default CardsRevenue
{/* <Card>
<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
  <CardTitle className="text-sm font-normal">Subscriptions</CardTitle>
</CardHeader>
<CardContent>
  <div className="text-2xl font-bold">+2350</div>
  <p className="text-xs text-muted-foreground">
    +180.1% from last month
  </p>
  <div className="mt-4 h-[80px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <Bar
          dataKey="subscription"
          style={
            {
              fill: "var(--theme-primary)",
              opacity: 1,
              "--theme-primary": `hsl(221.2 83.2% 53.3%)`,
            } as React.CSSProperties
          }
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</CardContent>
</Card> */}
