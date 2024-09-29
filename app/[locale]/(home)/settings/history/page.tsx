'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useData } from "@/context/admin/fetchDataContext"

export default function AdminTrackRole() {
  const { students, teachers, payoutsActionTrack } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [date, setDate] = useState<Date>()
  const [actionType, setActionType] = useState("all")

  const allActionTracks = useMemo(() => {
    const studentActionTracks = students?.flatMap(student => student.actionTrack) || []
    const teacherActionTracks = teachers?.flatMap(teacher => teacher.actionTrack) || []
    return [...payoutsActionTrack, ...studentActionTracks, ...teacherActionTracks]
  }, [students, teachers, payoutsActionTrack])

  const filterActions = (actions) => {
    return actions.filter(action => {
      const matchesSearch = action.action.toLowerCase().includes(searchTerm.toLowerCase())
      const actionDate = new Date(action.timestamp)
      const matchesDate = date ? actionDate.toDateString() === date.toDateString() : true
      const matchesType = actionType === "all" || action.action === actionType
      return matchesSearch && matchesDate && matchesType
    })
  }

  const actionTypes = useMemo(() => {
    const types = new Set(allActionTracks.map(action => action.action))
    return ["all", ...types]
  }, [allActionTracks])

  const userTypes = useMemo(() => {
    const types = new Set(allActionTracks.map(action => action.userType))
    return Array.from(types)
  }, [allActionTracks])

  return (
    <div className="container mx-full p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Track Role</h1>
      
      <Tabs defaultValue={userTypes[0]} className="w-full mb-6">
        <TabsList>
          {userTypes.map(type => (
            <TabsTrigger key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</TabsTrigger>
          ))}
        </TabsList>

        <div className="my-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="Search actions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-[280px] justify-start text-left font-normal ${!date && "text-muted-foreground"}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {userTypes.map(userType => (
          <TabsContent key={userType} value={userType}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{userType.charAt(0).toUpperCase() + userType.slice(1)} Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-full justify-start">
                              Type <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {actionTypes.map((type) => (
                              <DropdownMenuItem key={type} onClick={() => setActionType(type)}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>
                      <TableHead>Additional Info</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterActions(allActionTracks.filter(action => action.userType === userType)).map((action, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{action.action}</TableCell>
                        <TableCell>{JSON.stringify(action.additionalInfo)}</TableCell>
                        <TableCell>{action.userId}</TableCell>
                        <TableCell>{new Date(action.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
