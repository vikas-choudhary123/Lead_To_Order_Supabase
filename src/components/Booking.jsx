"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Calendar, Clock, User, Search, Plus } from "lucide-react"

const Booking = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tableHeaders, setTableHeaders] = useState([])
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    totalClients: 0
  })

  useEffect(() => {
    const fetchGoogleSheetData = async () => {
      try {
        setLoading(true)
        console.log("Starting to fetch Google Sheet data...")
        
        // Google Sheet Details
        const sheetId = '1Kb-fhC1yiFJCyPO7TJDqnu-lQ1n1H6mLErlkSPc6yHc'
        const sheetName = 'Booking DB'
        
        // Create URL to fetch the sheet in JSON format (this method works for public sheets)
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
        console.log("Fetching from URL:", url)
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`)
        }
        
        // Extract the JSON part from the response (Google returns a weird format)
        const text = await response.text()
        // The response is like: google.visualization.Query.setResponse({...})
        const jsonStart = text.indexOf('{')
        const jsonEnd = text.lastIndexOf('}')
        const jsonString = text.substring(jsonStart, jsonEnd + 1)
        const data = JSON.parse(jsonString)
        
        // Extract headers from cols
        const headers = data.table.cols.map(col => ({
          id: col.id,
          label: col.label || col.id,
          type: col.type
        })).filter(header => header.label) // Filter out empty headers
        
        setTableHeaders(headers)
        
        // Calculate today's date for comparison
        const today = new Date()
        const todayMonth = today.getMonth() // JS months are 0-indexed (0-11)
        const todayDay = today.getDate()
        const todayYear = today.getFullYear()
        today.setHours(0, 0, 0, 0) // Reset time for accurate date comparison
        
        console.log(`Today is ${todayMonth+1}/${todayDay}/${todayYear} (m/d/yyyy format)`)
        
        // Extract and transform data rows with safer handling
        const rowsData = data.table.rows.map(row => {
          const rowData = {}
          
          // Add an internal unique ID
          rowData._id = Math.random().toString(36).substring(2, 15)
          
          // Process each cell carefully
          row.c && row.c.forEach((cell, index) => {
            if (index < headers.length) {
              const header = headers[index]
              
              // Handle null or undefined cell
              if (!cell) {
                rowData[header.id] = ''
                return
              }
              
              // Get the value, with fallbacks
              const value = cell.v !== undefined && cell.v !== null ? cell.v : ''
              rowData[header.id] = value
              
              // Store formatted version if available
              if (cell.f) {
                rowData[`${header.id}_formatted`] = cell.f
              }
              
              // Special handling for dates
              if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
                if (cell.f) {
                  // Use the formatted date string if available
                  rowData[`${header.id}_formatted`] = cell.f
                } else if (value) {
                  try {
                    // Try to format the date value
                    const dateObj = new Date(value)
                    if (!isNaN(dateObj.getTime())) {
                      rowData[`${header.id}_formatted`] = dateObj.toLocaleDateString()
                    }
                  } catch (e) {
                    console.log("Date formatting error:", e)
                  }
                }
              }
            }
          })
          return rowData
        }).filter(row => Object.keys(row).length > 1) // Filter out empty rows (more than just _id)
        
        // Column G (index 6) is the date column we need to check
        // We'll directly use the index for column G
        const columnG = 6
        const dateColumnId = headers[columnG]?.id
        
        console.log("Using date column G with id:", dateColumnId)
        
        if (!dateColumnId) {
          console.error("Column G not found in headers")
        }
        
        // Filter out past appointments - ONLY keep today and future appointments from column G
        const filteredRowsData = rowsData.filter(row => {
          try {
            // Skip if no date column found or no value in the cell
            if (!dateColumnId || !row[dateColumnId]) return false
            
            // Get the date value from column G
            const dateValue = row[dateColumnId]
            
            // Handle Google Sheets date format: Date(year,month,day)
            if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
              // Extract the year, month, day using regex
              const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateValue)
              if (match) {
                const year = parseInt(match[1], 10)
                const month = parseInt(match[2], 10) // Month is 0-indexed in JS Date
                const day = parseInt(match[3], 10)
                
                // Create appointment date object and reset time for comparison
                const appointmentDate = new Date(year, month, day)
                appointmentDate.setHours(0, 0, 0, 0)
                
                // Keep this appointment if it's today or in the future
                const isCurrentOrFutureDate = appointmentDate >= today
                
                if (isCurrentOrFutureDate) {
                  console.log(`Keeping appointment date: ${month+1}/${day}/${year}`)
                } else {
                  console.log(`Filtering out past date: ${month+1}/${day}/${year}`)
                }
                
                return isCurrentOrFutureDate
              }
            }
            
            return false
          } catch (error) {
            console.log("Date comparison error:", error)
            return false
          }
        })
        
        // Set the filtered appointments (only today and future dates from column G)
        setAppointments(filteredRowsData)
        
        // Count today's appointments (only those where column G has today's date)
        const todaysAppts = filteredRowsData.filter(row => {
          try {
            // Fixed: changed dateColumn to dateColumnId
            if (!dateColumnId || !row[dateColumnId]) return false
            
            // Get the date value from the row
            const dateValue = row[dateColumnId]
            
            // Handle Google Sheets date format: Date(year,month,day)
            if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
              // Extract the year, month, day using regex
              const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateValue)
              if (match) {
                const year = parseInt(match[1], 10)
                const month = parseInt(match[2], 10) // Month is 0-indexed in JS Date
                const day = parseInt(match[3], 10)
                
                // Check if it's today - fixed comparison (removed unnecessary adjustment)
                const isToday = day === todayDay && month === todayMonth && year === todayYear
                
                return isToday
              }
            }
            
            return false
          } catch (error) {
            console.log("Date comparison error:", error)
            return false
          }
        }).length
        
        // Count upcoming appointments (dates after today)
        const upcomingAppts = filteredRowsData.filter(row => {
          try {
            // Fixed: changed dateColumn to dateColumnId
            if (!dateColumnId || !row[dateColumnId]) return false
            
            // Get the date value
            const dateValue = row[dateColumnId]
            
            // Handle Google Sheets date format: Date(year,month,day)
            if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
              // Extract the year, month, day using regex
              const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateValue)
              if (match) {
                const year = parseInt(match[1], 10)
                const month = parseInt(match[2], 10) // Month is 0-indexed in JS Date
                const day = parseInt(match[3], 10)
                
                // Create date objects for comparison
                const appointmentDate = new Date(year, month, day)
                // Fixed: removed unnecessary adjustment to todayMonth
                const todayDate = new Date(todayYear, todayMonth, todayDay)
                
                // Reset time parts for accurate date comparison
                appointmentDate.setHours(0, 0, 0, 0)
                todayDate.setHours(0, 0, 0, 0)
                
                // Is this date in the future?
                const isFuture = appointmentDate > todayDate
                
                return isFuture
              }
            }
            
            return false
          } catch (error) {
            console.log("Date comparison error:", error)
            return false
          }
        }).length
        
        // Total clients count (total number of rows including past appointments)
        const totalClients = rowsData.length
        
        setStats({
          today: todaysAppts,
          upcoming: upcomingAppts,
          totalClients: totalClients
        })
        
        setLoading(false)
      } catch (error) {
        console.error("Error fetching Google Sheet data:", error)
        setError("Failed to load appointment data")
        setLoading(false)
      }
    }

    fetchGoogleSheetData()
  }, [])

  // Function to handle search
  const [searchTerm, setSearchTerm] = useState("")
  const filteredAppointments = searchTerm
    ? appointments.filter(appointment => 
        Object.values(appointment).some(
          value => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : appointments

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-blue-800">Appointments</h2>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" size={18} />
            <input
              type="text"
              placeholder="Search appointments..."
              className="pl-10 pr-4 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300">
            <Plus size={18} className="mr-2" />
            New Appointment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-4 flex items-center hover:scale-105 transition-transform duration-300"
        >
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <Calendar size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-blue-500">Today's Appointments</p>
            <p className="text-2xl font-bold text-blue-800">{stats.today}</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-4 flex items-center hover:scale-105 transition-transform duration-300"
        >
          <div className="rounded-full bg-indigo-100 p-3 mr-4">
            <Clock size={24} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-indigo-500">Upcoming</p>
            <p className="text-2xl font-bold text-indigo-800">{stats.upcoming}</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-4 flex items-center hover:scale-105 transition-transform duration-300"
        >
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <User size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-purple-500">Total Clients</p>
            <p className="text-2xl font-bold text-purple-800">{stats.totalClients}</p>
          </div>
        </motion.div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-blue-600">Loading appointment data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
          {error} <button className="underline ml-2" onClick={() => window.location.reload()}>Try again</button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-blue-200">
              <thead className="bg-blue-50">
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-blue-500 uppercase tracking-wider"
                    >
                      {header.label}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-blue-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-blue-200">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((appointment, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-blue-50 transition-colors duration-300"
                    >
                      {tableHeaders.map((header) => {
                        // Handle special rendering for different column types
                        if (header.id === 'status' || header.label.toLowerCase() === 'status') {
                          const status = appointment[header.id];
                          let statusClass = 'bg-gray-100 text-gray-800';
                          
                          if (status) {
                            if (status.toLowerCase().includes('confirm')) {
                              statusClass = 'bg-green-100 text-green-800';
                            } else if (status.toLowerCase().includes('pend')) {
                              statusClass = 'bg-yellow-100 text-yellow-800';
                            } else if (status.toLowerCase().includes('cancel')) {
                              statusClass = 'bg-red-100 text-red-800';
                            }
                          }
                          
                          return (
                            <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                                {status || '—'}
                              </span>
                            </td>
                          );
                        }
                        
                        // For client/name columns, use avatar style
                        if (header.label.toLowerCase().includes('client') || 
                            header.label.toLowerCase().includes('name')) {
                          return (
                            <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User size={16} className="text-blue-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-blue-900">
                                    {appointment[header.id] || '—'}
                                  </div>
                                </div>
                              </div>
                            </td>
                          );
                        }
                        
                        // For Service Price column, add rupee sign (₹)
                        if (header.label.toLowerCase().includes('service price') || 
                            header.label.toLowerCase().includes('price')) {
                          const price = appointment[header.id];
                          return (
                            <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-green-600">
                                {price ? `₹${price}` : '—'}
                              </div>
                            </td>
                          );
                        }
                        
                        // For date & time, special formatting with safer handling
                        if (header.type === 'date' || 
                            header.label.toLowerCase().includes('date')) {
                          let displayDate = '—'
                          
                          // Use the pre-formatted date if available
                          if (appointment[`${header.id}_formatted`]) {
                            displayDate = appointment[`${header.id}_formatted`]
                          } 
                          // For Google Sheets date format: Date(year,month,day)
                          else if (typeof appointment[header.id] === 'string' && 
                                  appointment[header.id].startsWith('Date(')) {
                            const match = /Date\((\d+),(\d+),(\d+)\)/.exec(appointment[header.id])
                            if (match) {
                              const year = parseInt(match[1], 10)
                              const month = parseInt(match[2], 10) // 0-indexed
                              const day = parseInt(match[3], 10)
                              
                              // Format as MM/DD/YYYY
                              displayDate = `${month+1}/${day}/${year}`
                            } else {
                              displayDate = appointment[header.id].toString()
                            }
                          }
                          // Otherwise try to format it safely as before
                          else if (appointment[header.id]) {
                            try {
                              const dateObj = new Date(appointment[header.id])
                              if (!isNaN(dateObj.getTime())) {
                                displayDate = dateObj.toLocaleDateString()
                              } else {
                                displayDate = appointment[header.id].toString()
                              }
                            } catch (e) {
                              // If date parsing fails, just show the raw value
                              displayDate = appointment[header.id].toString()
                            }
                          }
                          
                          return (
                            <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-blue-900">{displayDate}</div>
                            </td>
                          );
                        }
                        
                        // For time columns
                        if (header.label.toLowerCase().includes('time')) {
                          return (
                            <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-blue-500">
                                {appointment[header.id] || '—'}
                              </div>
                            </td>
                          );
                        }
                        
                        // Default rendering for other columns
                        return (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-blue-700">
                              {appointment[header.id] || '—'}
                            </div>
                          </td>
                        );
                      })}
                      
                      {/* Actions column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900 mr-3 transition-colors duration-300">
                          Edit
                        </a>
                        <a href="#" className="text-red-600 hover:text-red-900 transition-colors duration-300">
                          Cancel
                        </a>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={tableHeaders.length + 1} className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? "No appointments matching your search" : "No appointments found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Booking