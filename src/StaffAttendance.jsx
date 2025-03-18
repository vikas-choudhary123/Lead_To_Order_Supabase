"use client"

import { useState, useEffect } from "react"
import { Calendar, CheckCircle, XCircle, Users, X, Save, Edit, AlertCircle, CheckCircle2, Search, Download, FileText, Filter } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const StaffAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [staffData, setStaffData] = useState([])
  const [originalStaffData, setOriginalStaffData] = useState([]) // Keep original data for filtering
  const [selectedRows, setSelectedRows] = useState({})
  const [attendanceValues, setAttendanceValues] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "" // "success" or "error"
  })
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0
  })
  const [todayAttendance, setTodayAttendance] = useState({}) // Store today's attendance data
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all") // 'all', 'recorded', 'not-recorded'

  // Google Sheet Details
  const sheetId = '1Kb-fhC1yiFJCyPO7TJDqnu-lQ1n1H6mLErlkSPc6yHc'
  const staffDBSheet = 'Staff DB'
  const staffAttendanceSheet = 'Staff Attendance'
  
  // Google Apps Script Web App URL - REPLACE THIS WITH YOUR DEPLOYED SCRIPT URL
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbyhmDsXWRThVsJCfAirTsI3o9EGE-oCcw2HKz1ERe4qxNWfcVoxMUr3sGa6yHJm-ckt/exec'

  useEffect(() => {
    // First load staff data, then fetch today's attendance
    fetchStaffData();
  }, [date]) // Reload when date changes

  // Format date as DD/MM/YYYY for comparison
  const formatDateForComparison = (dateString) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Parse date from Google Sheets format to DD/MM/YYYY
  const parseGoogleSheetsDate = (dateCellValue) => {
    if (!dateCellValue) return null
    
    // Check if it's a Date object format from Google Sheets (e.g., "Date(2025,2,18)")
    if (typeof dateCellValue === 'string' && dateCellValue.startsWith('Date(')) {
      try {
        // Extract date parts
        const dateParts = dateCellValue.replace('Date(', '').replace(')', '').split(',')
        if (dateParts.length >= 3) {
          const year = parseInt(dateParts[0])
          // Google Sheets Date object is 0-indexed for months (0=Jan, 1=Feb, etc.)
          // So we add 1 to get the correct month number
          const month = parseInt(dateParts[1]) + 1
          const day = parseInt(dateParts[2])
          
          // Format as DD/MM/YYYY
          return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`
        }
      } catch (e) {
        console.error("Error parsing Google Sheets date:", e)
      }
    }
    
    // If it's already in DD/MM/YYYY format, return as is
    if (typeof dateCellValue === 'string' && 
        dateCellValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateCellValue
    }
    
    // If it's a date string in another format, try to parse and convert
    try {
      const date = new Date(dateCellValue)
      if (!isNaN(date.getTime())) {
        return formatDateForComparison(date)
      }
    } catch (e) {
      console.error("Failed to parse date:", dateCellValue)
    }
    
    // Return null if we couldn't parse the date
    return null
  }

  // Filter staff data based on search term and filter status
  const filterStaffData = () => {
    if (!originalStaffData.length) return;
    
    let filtered = [...originalStaffData];
    
    // Apply search filter if there's a search term
    if (searchTerm) {
      filtered = filtered.filter(staff => 
        (staff.col_2 && staff.col_2.toString().toLowerCase().includes(searchTerm.toLowerCase())) || // ID
        (staff.col_3 && staff.col_3.toString().toLowerCase().includes(searchTerm.toLowerCase()))    // Name
      );
    }
    
    // Apply status filter
    if (filterStatus === 'recorded') {
      filtered = filtered.filter(staff => todayAttendance[staff.col_2] !== undefined);
    } else if (filterStatus === 'not-recorded') {
      filtered = filtered.filter(staff => todayAttendance[staff.col_2] === undefined);
    }
    
    // Update the staffData state with filtered results
    setStaffData(filtered);
    
    // Update stats based on filtered data
    const present = filtered.filter(staff => 
      todayAttendance[staff.col_2] === 'Present'
    ).length;
    
    const absent = filtered.filter(staff => 
      todayAttendance[staff.col_2] === 'Absent'
    ).length;
    
    setStats({
      total: filtered.length,
      present,
      absent
    });
  }

  // Re-filter data when search term, filter status, or attendance data changes
  useEffect(() => {
    filterStaffData();
  }, [searchTerm, filterStatus, todayAttendance]);

  // Fetch attendance records for today's date
  
  const fetchTodayAttendance = async () => {
    try {
      console.log("Fetching today's attendance records...")
      
      // Format today's date as DD/MM/YYYY for comparison with sheet data
      const formattedToday = formatDateForComparison(date)
      console.log("Looking for records with date:", formattedToday)
      
      // Create URL to fetch the attendance sheet
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(staffAttendanceSheet)}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch attendance data: ${response.status}`)
      }
      
      // Extract the JSON part from the response
      const text = await response.text()
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}')
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)
      
      const attendanceRecords = {}
      
      // Process rows to find today's attendance
      if (data.table && data.table.rows) {
        console.log("Total attendance records found:", data.table.rows.length)
        
        data.table.rows.forEach((row, index) => {
          if (row.c && row.c.length > 4) {
            // Get the date cell value and parse it correctly
            const dateCellValue = row.c[0] && row.c[0].v ? row.c[0].v : null
            const parsedDate = parseGoogleSheetsDate(dateCellValue)
            
            const staffIdCell = row.c[2] && row.c[2].v ? row.c[2].v : null // Staff ID is in column C (index 2)
            const attendanceCell = row.c[4] && row.c[4].v ? row.c[4].v : null
            
            console.log(`Row ${index}: Original Date=${dateCellValue}, Parsed Date=${parsedDate}, StaffID=${staffIdCell}, Attendance=${attendanceCell}`);
            
            // Check if this is today's record and has valid data
            if (parsedDate === formattedToday && staffIdCell && attendanceCell) {
              console.log(`✓ Found attendance record for today: StaffID=${staffIdCell}, Attendance=${attendanceCell}`);
              // Store by staff ID
              attendanceRecords[staffIdCell] = attendanceCell
            }
          }
        })
      }
      
      console.log("Today's attendance records:", JSON.stringify(attendanceRecords))
      setTodayAttendance(attendanceRecords)
      
      // Update attendance values for staff that already have records today
      updateAttendanceValues(attendanceRecords)
      
    } catch (error) {
      console.error("Error fetching today's attendance:", error)
      // Don't set error state as this is a secondary function
    }
  }

  // Update attendance values based on today's records
  const updateAttendanceValues = (attendanceRecords) => {
    console.log("Updating attendance values based on today's records")
    
    // Only proceed if we have both staff data and attendance records
    if (originalStaffData.length === 0) {
      console.log("Staff data not loaded yet, skipping update")
      return
    }
    
    const newAttendanceValues = { ...attendanceValues }
    const newSelectedRows = { ...selectedRows }
    
    console.log(`Processing ${originalStaffData.length} staff records`)
    
    // For each staff member, check if there's attendance for today
    originalStaffData.forEach(staff => {
      const staffId = staff.col_2 // Staff ID is in column C (index 2) in Staff DB
      
      if (!staffId) {
        console.log(`Staff member at index ${staff.id} has no ID, skipping`)
        return
      }
      
      console.log(`Checking staff ${staff.col_3} (ID: ${staffId})`) // Staff name is in column D (index 3)
      
      if (attendanceRecords[staffId]) {
        console.log(`✓ Found attendance for ${staff.col_3}: ${attendanceRecords[staffId]}`)
        
        // Update attendance value
        newAttendanceValues[staff.id] = attendanceRecords[staffId]
        
        // Auto-select the row
        newSelectedRows[staff.id] = true
      } else {
        console.log(`✗ No attendance found for ${staff.col_3}`)
      }
    })
    
    // Update state with new values
    setAttendanceValues(newAttendanceValues)
    setSelectedRows(newSelectedRows)
    
    // Update stats based on attendance values
    calculateStats(newAttendanceValues)
  }

  const fetchStaffData = async () => {
    try {
      setLoading(true)
      console.log("Starting to fetch Staff DB data...")
      
      // Create URL to fetch the sheet in JSON format (this method works for public sheets)
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(staffDBSheet)}`
      console.log("Fetching from URL:", url)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }
      
      // Extract the JSON part from the response
      const text = await response.text()
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}')
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)
      
      // Extract all headers first to identify columns
      const allHeaders = data.table.cols
        .map((col, index) => ({
          id: `col_${index}`, // Create a consistent ID format
          originalId: col.id,
          label: col.label || col.id || `Column ${String.fromCharCode(65 + index)}`, // Fallback to A, B, C...
          type: col.type,
          index: index
        }))
        .filter(header => header.label) // Filter out empty headers
      
      console.log("All headers:", allHeaders)
      
      // Get columns C and D (indexes 2 and 3)
      const columnCIndex = 2 // Column C is index 2 - Staff ID
      const columnDIndex = 3 // Column D is index 3 - Staff Name
      const idHeader = allHeaders[columnCIndex] || { id: 'col_2', label: 'ID', type: 'string', index: 2 }
      const nameHeader = allHeaders[columnDIndex] || { id: 'col_3', label: 'Name', type: 'string', index: 3 }
      
      // Create our simplified headers
      const headers = [
        idHeader,
        nameHeader,
        {
          id: 'attendance',
          label: 'Attendance',
          type: 'string',
          index: 4
        }
      ]
      
      console.log("Using headers:", headers)
      
      // Extract and transform data rows
      const rowsData = data.table.rows.map((row, rowIndex) => {
        const rowData = { 
          id: rowIndex + 1,
          _rowIndex: rowIndex + 2 // +2 because Google Sheets is 1-indexed and we have a header row
        }
        
        // Extract value from column C (Staff ID)
        if (row.c && row.c.length > columnCIndex) {
          const cellC = row.c[columnCIndex]
          rowData[idHeader.id] = cellC && cellC.v !== undefined ? cellC.v : ''
        } else {
          rowData[idHeader.id] = ''
        }
        
        // Extract value from column D (Staff Name)
        if (row.c && row.c.length > columnDIndex) {
          const cellD = row.c[columnDIndex]
          rowData[nameHeader.id] = cellD && cellD.v !== undefined ? cellD.v : ''
        } else {
          rowData[nameHeader.id] = ''
        }
        
        // Initialize attendance as empty
        rowData['attendance'] = ''
        
        return rowData
      }).filter(row => row[idHeader.id]) // Filter out rows with no staff ID
      
      console.log(`Loaded ${rowsData.length} staff records`)
      
      // Store original data
      setOriginalStaffData(rowsData)
      // Initialize displayed data
      setStaffData(rowsData)
      
      // Set initial stats
      setStats({
        total: rowsData.length,
        present: 0,
        absent: 0
      })
      
      setLoading(false)
      
      // After loading staff data, fetch today's attendance
      fetchTodayAttendance()
      
    } catch (error) {
      console.error("Error fetching Staff DB data:", error)
      setError("Failed to load staff data")
      setLoading(false)
    }
  }

  // Handle checkbox change
  const handleCheckboxChange = (rowId) => {
    setSelectedRows(prev => {
      const newSelectedRows = { ...prev }
      newSelectedRows[rowId] = !prev[rowId]
      return newSelectedRows
    })
  }

  // Handle attendance dropdown change
  const handleAttendanceChange = (rowId, value) => {
    setAttendanceValues(prev => ({
      ...prev,
      [rowId]: value
    }))
    
    // Update stats on the fly
    calculateStats({
      ...attendanceValues,
      [rowId]: value
    })
  }

  // Calculate attendance stats
  const calculateStats = (attendanceData) => {
    const present = Object.values(attendanceData).filter(value => value === 'Present').length
    const absent = Object.values(attendanceData).filter(value => value === 'Absent').length
    
    setStats({
      total: staffData.length,
      present,
      absent
    })
  }

  // Get next serial number
  const getNextSerialNumber = async () => {
    try {
      // Create URL to fetch the attendance sheet to find last serial number
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(staffAttendanceSheet)}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch attendance data: ${response.status}`)
      }
      
      // Extract the JSON part from the response
      const text = await response.text()
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}')
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)
      
      let lastSerialNumber = "SV-000"
      
      // Find last serial number in column B (index 1)
      if (data.table && data.table.rows && data.table.rows.length > 0) {
        for (let i = data.table.rows.length - 1; i >= 0; i--) {
          const row = data.table.rows[i]
          if (row && row.c && row.c[1] && row.c[1].v) {
            const serialCell = row.c[1].v
            // Check if the value starts with 'SV-' and ignore any entries with hyphens after the 3-digit number
            if (serialCell && typeof serialCell === 'string' && serialCell.startsWith('SV-') && serialCell.length >= 6) {
              // Only take the part before any secondary hyphen (e.g., from "SV-001-2" take "SV-001")
              const mainPart = serialCell.split('-').slice(0, 2).join('-')
              if (mainPart && mainPart.length >= 6) {
                lastSerialNumber = mainPart
                break
              }
            }
          }
        }
      }
      
      // Extract number portion and increment
      const numPart = parseInt(lastSerialNumber.split('-')[1])
      const nextNum = numPart + 1
      
      // Format with leading zeros (e.g., SV-001)
      return `SV-${nextNum.toString().padStart(3, '0')}`
    } catch (error) {
      console.error("Error getting next serial number:", error)
      // Fallback to SV-001 if there's an error
      return "SV-001"
    }
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    document.querySelector('input[placeholder="Search staff by name or ID..."]').value = "";
    setFilterStatus("all");
    setStaffData([...originalStaffData]);
    
    // Reset stats based on original data
    const present = originalStaffData.filter(staff => 
      todayAttendance[staff.col_2] === 'Present'
    ).length;
    
    const absent = originalStaffData.filter(staff => 
      todayAttendance[staff.col_2] === 'Absent'
    ).length;
    
    setStats({
      total: originalStaffData.length,
      present,
      absent
    });
  }

  // Find existing attendance records and their row numbers
  const findExistingAttendanceRows = async () => {
    try {
      // Format today's date as DD/MM/YYYY
      const formattedToday = formatDateForComparison(date)
      
      // Create URL to fetch the attendance sheet
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(staffAttendanceSheet)}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch attendance data: ${response.status}`)
      }
      
      // Extract the JSON part from the response
      const text = await response.text()
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}')
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)
      
      const existingRecords = {}
      
      // Process rows to find today's attendance with row numbers
      if (data.table && data.table.rows) {
        data.table.rows.forEach((row, index) => {
          if (row.c && row.c.length > 4) {
            // Get the date cell value and parse it correctly
            const dateCellValue = row.c[0] && row.c[0].v ? row.c[0].v : null
            const parsedDate = parseGoogleSheetsDate(dateCellValue)
            
            const staffIdCell = row.c[2] && row.c[2].v ? row.c[2].v : null // Staff ID is in column C (index 2)
            
            // Check if this is today's record for the staff
            if (parsedDate === formattedToday && staffIdCell) {
              // Store by staff ID with row number (add 2 for header row and 0-indexing)
              existingRecords[staffIdCell] = index + 2
            }
          }
        })
      }
      
      return existingRecords
    } catch (error) {
      console.error("Error finding existing attendance rows:", error)
      return {}
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (Object.keys(selectedRows).filter(key => selectedRows[key]).length === 0) {
      setNotification({
        show: true,
        message: "Please select at least one staff member",
        type: "error"
      })
      
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 3000)
      return
    }
    
    // Check if all selected rows have attendance values
    const selectedRowIds = Object.keys(selectedRows).filter(key => selectedRows[key])
    const missingAttendance = selectedRowIds.some(id => !attendanceValues[id])
    
    if (missingAttendance) {
      setNotification({
        show: true,
        message: "Please select attendance status for all selected staff",
        type: "error"
      })
      
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 3000)
      return
    }
    
    try {
      setSubmitting(true)
      
      // Get existing attendance rows for today's date
      const existingRecords = await findExistingAttendanceRows()
      console.log("Existing attendance records for today:", existingRecords)
      
      // Format today's date as DD/MM/YYYY
      const formattedDate = formatDateForComparison(date)
      
      // For new records, we'll need a serial number
      let currentSerialNumber = await getNextSerialNumber()
      
      // Create a list to track which staff IDs we're submitting
      const submittedStaffIds = []
      const updatedStaffIds = []
      
      // Process each selected row
      for (let i = 0; i < selectedRowIds.length; i++) {
        const id = selectedRowIds[i]
        // Find staff in original data to ensure we get the correct record even when filtered
        const staffMember = originalStaffData.find(staff => staff.id.toString() === id)
        const staffId = staffMember.col_2 // Staff ID is in column C (index 2)
        
        // Check if the attendance value has changed
        const currentAttendance = todayAttendance[staffId]
        const newAttendance = attendanceValues[id]
        
        if (currentAttendance === newAttendance) {
          console.log(`Skipping submission for ${staffMember.col_3} (${staffId}) - attendance value unchanged`)
          continue
        }
        
        // Check if there's an existing record for this staff today
        if (existingRecords[staffId]) {
          // Update existing record
          const rowIndex = existingRecords[staffId]
          console.log(`Updating existing record for ${staffMember.col_3} (${staffId}) at row ${rowIndex}`)
          
          // Create row data array with only the attendance column
          const rowData = ['', '', '', '', newAttendance] // Only set the attendance column (Column E)
          
          // Use FormData for compatibility with Google Apps Script
          const formData = new FormData()
          formData.append('sheetName', staffAttendanceSheet)
          formData.append('action', 'update') // Use 'update' action
          formData.append('rowIndex', rowIndex.toString())
          formData.append('rowData', JSON.stringify(rowData))
          
          // Make the fetch request with no-cors mode
          await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
          })
          
          // Track that we've updated this staff ID
          updatedStaffIds.push(staffId)
        } else {
          // Create a new record
          console.log(`Creating new record for ${staffMember.col_3} (${staffId})`)
          
          // Create row data array [Date, Serial, ID, Name, Attendance]
          const rowData = [
            formattedDate,        // Column A - Submission Date
            currentSerialNumber,  // Column B - Serial Number
            staffId,              // Column C - Staff ID
            staffMember.col_3,    // Column D - Staff name
            newAttendance         // Column E - Attendance
          ]
          
          // Use FormData for compatibility with Google Apps Script
          const formData = new FormData()
          formData.append('sheetName', staffAttendanceSheet)
          formData.append('action', 'insert') // Use 'insert' for new records
          formData.append('rowData', JSON.stringify(rowData))
          
          // Make the fetch request with no-cors mode
          await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
          })
          
          // Track that we've submitted this staff ID
          submittedStaffIds.push(staffId)
          
          // Calculate next serial number for the next new record
          if (i < selectedRowIds.length - 1) {
            // Extract number portion and increment
            const numPart = parseInt(currentSerialNumber.split('-')[1])
            const nextNum = numPart + 1
            currentSerialNumber = `SV-${nextNum.toString().padStart(3, '0')}`
          }
        }
        
        // Update our local record of today's attendance
        const newTodayAttendance = { ...todayAttendance }
        newTodayAttendance[staffId] = newAttendance
        setTodayAttendance(newTodayAttendance)
      }
      
      // Show success notification
      const totalChanged = submittedStaffIds.length + updatedStaffIds.length;
      if (totalChanged > 0) {
        const newMsg = [];
        if (submittedStaffIds.length > 0) {
          newMsg.push(`Added ${submittedStaffIds.length} new records`);
        }
        if (updatedStaffIds.length > 0) {
          newMsg.push(`Updated ${updatedStaffIds.length} existing records`);
        }
        
        setNotification({
          show: true,
          message: `Success! ${newMsg.join(' and ')}`,
          type: "success"
        });
      } else {
        setNotification({
          show: true,
          message: "No changes to submit - attendance already recorded for today",
          type: "info"
        });
      }
      
      // Don't reset form - we want to keep the current state
      // But do reset selected rows
      setSelectedRows({});
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error submitting staff attendance:", error)
      
      // Show error notification
      setNotification({
        show: true,
        message: `Failed to submit attendance: ${error.message}`,
        type: "error"
      })
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 5000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Staff Attendance</h2>
        <div className="mt-4 md:mt-0 flex items-center">
          <div className="relative mr-4">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(selectedRows).filter(key => selectedRows[key]).length === 0}
            className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors disabled:bg-pink-400 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Submit Attendance
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <Users size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Staff</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <CheckCircle size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Present</p>
            <p className="text-2xl font-bold text-gray-800">{stats.present}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <XCircle size={24} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Absent</p>
            <p className="text-2xl font-bold text-gray-800">{stats.absent}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter section */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search staff by name or ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-3">
            <Filter size={18} className="text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="all">All Staff</option>
              <option value="recorded">Recorded Today</option>
              <option value="not-recorded">Not Recorded Today</option>
            </select>
            <button
              onClick={resetFilters}
              className="text-gray-500 hover:text-gray-700 underline text-sm"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Selection Tools */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-5 w-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 mr-3"
              onChange={(e) => {
                // Select/deselect all rows
                const newSelectedRows = {}
                if (e.target.checked) {
                  // Select all rows
                  staffData.forEach(staff => {
                    newSelectedRows[staff.id] = true
                  })
                }
                setSelectedRows(newSelectedRows)
              }}
              checked={
                staffData.length > 0 &&
                Object.keys(selectedRows).filter(key => selectedRows[key]).length === staffData.length
              }
              disabled={staffData.length === 0}
            />
            <span className="text-gray-700 font-medium">Select All Visible Staff</span>
            <span className="ml-2 text-sm text-gray-500">
              ({Object.keys(selectedRows).filter(key => selectedRows[key]).length} selected)
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
              disabled={Object.keys(selectedRows).filter(key => selectedRows[key]).length === 0}
              onClick={() => {
                // Set all selected rows to "Present"
                const newAttendanceValues = { ...attendanceValues }
                Object.keys(selectedRows).forEach(key => {
                  if (selectedRows[key]) {
                    newAttendanceValues[key] = 'Present'
                  }
                })
                setAttendanceValues(newAttendanceValues)
                calculateStats(newAttendanceValues)
              }}
            >
              Mark Selected as Present
            </button>
            <button
              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:bg-red-300"
              disabled={Object.keys(selectedRows).filter(key => selectedRows[key]).length === 0}
              onClick={() => {
                // Set all selected rows to "Absent"
                const newAttendanceValues = { ...attendanceValues }
                Object.keys(selectedRows).forEach(key => {
                  if (selectedRows[key]) {
                    newAttendanceValues[key] = 'Absent'
                  }
                })
                setAttendanceValues(newAttendanceValues)
                calculateStats(newAttendanceValues)
              }}
            >
              Mark Selected as Absent
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-pink-600">Loading staff data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
          {error} <button className="underline ml-2" onClick={() => fetchStaffData()}>Try again</button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Staff List</h3>
            <div className="text-sm text-gray-500">
              {Object.keys(todayAttendance).length > 0 ? 
                `${Object.keys(todayAttendance).length} staff attendance records for today` : 
                'No attendance records for today'}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Select
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Attendance
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {staffData.length > 0 ? (
                staffData.map((staff) => {
                  // Check if this staff has attendance today
                  const staffId = staff.col_2 // Staff ID is in column C (index 2)
                  const hasAttendanceToday = todayAttendance[staffId] !== undefined
                  
                  return (
                    <tr key={staff.id} className={selectedRows[staff.id] ? "bg-pink-50" : hasAttendanceToday ? "bg-green-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedRows[staff.id] || false}
                          onChange={() => handleCheckboxChange(staff.id)}
                          className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {staff.col_2 || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {staff.col_3 || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={attendanceValues[staff.id] || ''}
                          onChange={(e) => handleAttendanceChange(staff.id, e.target.value)}
                          disabled={!selectedRows[staff.id]}
                          className={`block w-full rounded-md border-gray-300 shadow-sm
                            focus:border-pink-500 focus:ring focus:ring-pink-500 focus:ring-opacity-50
                            ${!selectedRows[staff.id] ? 'bg-gray-100' : ''}
                            ${hasAttendanceToday ? 'border-green-500' : ''}`}
                        >
                          <option value="">Select Status</option>
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasAttendanceToday ? (
                          <div className="flex items-center">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mr-2">
                              Recorded
                            </span>
                            <span className="text-sm text-gray-700">
                              {todayAttendance[staffId]}
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Not recorded
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No staff data found
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Export Options */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Export Options</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
            onClick={() => {
              // Create CSV data
              const csvRows = [
                // Header row
                ['Date', 'Staff ID', 'Staff Name', 'Attendance'],
                // Data rows
                ...staffData.map(staff => [
                  formatDateForComparison(date),
                  staff.col_2,
                  staff.col_3,
                  todayAttendance[staff.col_2] || 'Not Recorded'
                ])
              ];
              
              // Convert to CSV string
              const csvContent = csvRows.map(row => row.join(',')).join('\n');
              
              // Create download link
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.setAttribute('href', url);
              a.setAttribute('download', `staff_attendance_${date}.csv`);
              a.click();
            }}
          >
            <Download size={18} className="mr-2" />
            Export to CSV
          </button>
          
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            onClick={() => {
              // Generate a summary report
              const presentCount = Object.values(todayAttendance).filter(value => value === 'Present').length;
              const absentCount = Object.values(todayAttendance).filter(value => value === 'Absent').length;
              const notRecordedCount = staffData.length - presentCount - absentCount;
              const presentPercentage = staffData.length > 0 ? Math.round((presentCount / staffData.length) * 100) : 0;
              
              const reportText = `
Staff Attendance Report for ${formatDateForComparison(date)}

Summary:
- Total Staff: ${staffData.length}
- Present: ${presentCount} (${presentPercentage}%)
- Absent: ${absentCount}
- Not Recorded: ${notRecordedCount}

Attendance Details:
${staffData.map(staff => `${staff.col_3} (${staff.col_2}): ${todayAttendance[staff.col_2] || 'Not Recorded'}`).join('\n')}
              `.trim();
              
              // Create download link
              const blob = new Blob([reportText], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.setAttribute('href', url);
              a.setAttribute('download', `attendance_report_${date}.txt`);
              a.click();
            }}
          >
            <FileText size={18} className="mr-2" />
            Generate Report
          </button>
        </div>
      </div>
      
      {/* Notification popup */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            key="notification"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center ${
              notification.type === "success" ? "bg-green-100" : 
              notification.type === "info" ? "bg-blue-100" : "bg-red-100"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="text-green-600 mr-3" size={20} />
            ) : notification.type === "info" ? (
              <Search className="text-blue-600 mr-3" size={20} />
            ) : (
              <AlertCircle className="text-red-600 mr-3" size={20} />
            )}
            <p className={`font-medium ${
              notification.type === "success" ? "text-green-800" : 
              notification.type === "info" ? "text-blue-800" : "text-red-800"
            }`}>
              {notification.message}
            </p>
            <button 
              onClick={() => setNotification({ show: false, message: "", type: "" })}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffAttendance;