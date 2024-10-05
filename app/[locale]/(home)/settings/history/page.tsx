"use client"

import { useState, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, Search, Filter, Download } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useData } from "@/context/admin/fetchDataContext"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function AdminTrackRole() {
  const { students, teachers, payoutsActionTrack } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [date, setDate] = useState<Date>()
  const [actionType, setActionType] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [userType, setUserType] = useState("all")
  const itemsPerPage = 10

  const allActionTracks = useMemo(() => {
    const studentActionTracks = students?.flatMap(student => student.actionTrack) || []
    const teacherActionTracks = teachers?.flatMap(teacher => teacher.actionTrack) || []
    return [...payoutsActionTrack, ...studentActionTracks, ...teacherActionTracks]
  }, [students, teachers, payoutsActionTrack])

  const filterActions = useCallback((actions) => {
    return actions.filter(action => {
      const matchesSearch = action.action.toLowerCase().includes(searchTerm.toLowerCase())
      const actionDate = new Date(action.timestamp)
      const matchesDate = date ? actionDate.toDateString() === date.toDateString() : true
      const matchesType = actionType === "all" || action.action === actionType
      const matchesUserType = userType === "all" || action.userType === userType
      return matchesSearch && matchesDate && matchesType && matchesUserType
    })
  }, [searchTerm, date, actionType, userType])

  const actionTypes = useMemo(() => {
    const types = new Set(allActionTracks.map(action => action.action))
    return ["all", ...Array.from(types)]
  }, [allActionTracks])

  const userTypes = useMemo(() => {
    const types = new Set(allActionTracks.map(action => action.userType))
    return ["all", ...Array.from(types)]
  }, [allActionTracks])

  const paginateActions = useCallback((actions) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return actions.slice(startIndex, startIndex + itemsPerPage)
  }, [currentPage])

  const filteredActions = useMemo(() => filterActions(allActionTracks), [filterActions, allActionTracks])
  const paginatedActions = useMemo(() => paginateActions(filteredActions), [paginateActions, filteredActions])

  const totalPages = Math.ceil(filteredActions.length / itemsPerPage)

  const handleExport = useCallback(() => {
    const csvContent = [
      ["Type", "Additional Info", "User ID", "Date & Time"],
      ...filteredActions.map(action => [
        action.action,
        JSON.stringify(action.additionalInfo),
        action.userId,
        new Date(action.timestamp).toLocaleString()
      ])
    ].map(e => e.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", "action_tracks.csv")
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [filteredActions])

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Admin Track Role</h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleExport} variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export to CSV</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Input
              type="text"
              placeholder="Search actions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                {actionType === "all" ? "All Types" : actionType}
                <ChevronDown className="ml-auto h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {actionTypes.map((type) => (
                <DropdownMenuItem key={type} onClick={() => setActionType(type)}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                {userType === "all" ? "All Users" : userType}
                <ChevronDown className="ml-auto h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {userTypes.map((type) => (
                <DropdownMenuItem key={type} onClick={() => setUserType(type)}>
                  {type === "all" ? "All Users" : type.charAt(0).toUpperCase() + type.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-gray-50 dark:bg-gray-800">
          <CardTitle className="text-2xl flex items-center justify-between">
            <span>Action Tracks</span>
            <Badge variant="outline" className="ml-2">
              {filteredActions.length} results
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Type</TableHead>
                  <TableHead className="w-[200px]">Additional Info</TableHead>
                  <TableHead className="w-[100px]">User Type</TableHead>
                  <TableHead className="w-[100px]">User ID</TableHead>
                  <TableHead className="w-[200px]">Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedActions.map((action, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant="secondary">{action.action}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="truncate block w-full text-left">
                          {JSON.stringify(action.additionalInfo).slice(0, 50)}
                            {JSON.stringify(action.additionalInfo).length > 50 ? '...' : ''}
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[300px] break-words">
                            <p>{JSON.stringify(action.additionalInfo, null, 2)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{action.userType}</Badge>
                    </TableCell>
                    <TableCell>{action.userId}</TableCell>
                    <TableCell>{new Date(action.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" /> Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
