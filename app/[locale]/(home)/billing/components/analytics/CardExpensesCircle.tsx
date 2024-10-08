

import { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip , Sector, Legend, } from 'recharts';
import { CardContent,Card,CardHeader,CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { useData } from '@/context/admin/fetchDataContext';





const COLORS = ['#2563eb', '#35155D', '#512B81', '#4477CE', '#8CABFF', '#FF5733', '#33FF57', '#5733FF'];

const renderActiveShape = (props:any,rate:string) => {
  
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
   
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`DZD ${value}`}</text>

        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {`(${rate} ${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };
export function CircleExpenses() {

    const [activeIndex, setActiveIndex] = useState<number>(0);
const t=useTranslations()
const {analytics}=useData()
const {data,totalIncome,totalExpenses,...rest}=analytics
const expensesData= Object.entries(rest).map(([name, value]) => ({
  name,
  value,
}));

  const handleSetActiveIndex = (_:any,index: number) => {
    setActiveIndex(index);
  };
  return (

    <Card className="relative border-2 border-gray-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 absolute w-full">
      <CardTitle className="text-sm font-medium">{t('expenses')}</CardTitle>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        className="h-4 w-4 text-muted-foreground"
      >
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <path d="M2 10h20" />
      </svg>
    </CardHeader>
    <CardContent>
   

<div className="mt-4 h-[180px] ">
    <div className='h-full'>


    <ResponsiveContainer width="100%" height='100%'>
    <PieChart >

        <Pie
          activeIndex={activeIndex}
          activeShape={(a:any)=>renderActiveShape(a,t('rate'))}
          startAngle={180}
          endAngle={0}
          data={expensesData}
          cx="50%"
          cy="90%"
          innerRadius={80}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
          onMouseEnter={handleSetActiveIndex}
        >
          {expensesData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}  />
          ))}
        </Pie>
        {/* <Legend content={<CustomLegend />} /> */}
       <Tooltip
      content={({ active, payload }) => {
        if (active && payload && payload.length) {
            
          return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
              {payload.map((entry, index) => (
                <div key={`tooltip-item-${index}`} className="flex flex-col">
                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                    {entry.name}
                  </span>
                  <span className="font-bold">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          );
        }
        return null;
      }}
    />
    </PieChart>
  </ResponsiveContainer>
  </div>
  </div>
                  </CardContent>
                </Card>
  )


}