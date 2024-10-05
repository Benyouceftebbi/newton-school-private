"use client"
import {
  Tabs,

  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { DataTableDemo } from "./components/table"
import { useState } from "react"
import {useTranslations} from "next-intl"
function Dashboard() {
  const [filter,setFilter]=useState("All")
  const t=useTranslations()
  const handleFilter = (classType) => {
        setFilter(classType)
  };
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
    <main className="flex flex-col lg:flex-row flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
    
      <div className="grid auto-rows-max items-start gap-4 md:gap-8  gridlg:w-8/12 w-full">
        <Tabs defaultValue="all">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="all" onClick={() => handleFilter("All")}>{t('all')}</TabsTrigger>
              {["جامعي","ثانوي","متوسط","ابتدائي","تحضيري","لغات",].map((level) => (
                <TabsTrigger key={level} value={level} onClick={() => handleFilter(level)}>
                  {t(`${level}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
           <DataTableDemo filter={filter}/> 
    
        </Tabs>
      </div>
    </main>
          </div>


  )
}
export default Dashboard