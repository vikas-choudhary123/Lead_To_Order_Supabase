"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  DollarSign,
  Search,
  History,
  X,
  Filter,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { useAuth } from "./Context/AuthContext" // Import useAuth to check for staff role

const PaymentCommission = ({ isAdmin = false }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tableHeaders, setTableHeaders] = useState([])
  const [payments, setPayments] = useState([])
  const [allPayments, setAllPayments] = useState([]) // Store all payments for history
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalCommission: 0,
    pendingPayments: 0,
  })
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historySearchTerm, setHistorySearchTerm] = useState("")
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  })
  const [staffFilter, setStaffFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [staffList, setStaffList] = useState([])

  // Get auth context to check if user is staff - with null safety
  const { user } = useAuth()
  const isStaff = user?.role === "staff"

  // Google Sheet Details
  const sheetId = "1Kb-fhC1yiFJCyPO7TJDqnu-lQ1n1H6mLErlkSPc6yHc"
  const sheetName = "Payment + Commission"
  const staffSheetName = "Staff DB"

  // Google Apps Script Web App URL
  const scriptUrl =
    "https://script.google.com/macros/s/AKfycbyhmDsXWRThVsJCfAirTsI3o9EGE-oCcw2HKz1ERe4qxNWfcVoxMUr3sGa6yHJm-ckt/exec"

  // Helper function to parse dates from Google Sheets format
  const parseDate = (dateCellValue) => {
    if (!dateCellValue) return null

    // Check if it's a Date object format from Google Sheets (e.g., "Date(2025,2,18)")
    if (typeof dateCellValue === "string" && dateCellValue.startsWith("Date(")) {
      try {
        // Extract date parts
        const dateParts = dateCellValue.replace("Date(", "").replace(")", "").split(",")
        if (dateParts.length >= 3) {
          const year = Number.parseInt(dateParts[0])
          // Google Sheets Date object is 0-indexed for months (0=Jan, 1=Feb, etc.)
          const month = Number.parseInt(dateParts[1]) + 1
          const day = Number.parseInt(dateParts[2])

          // Format as DD/MM/YYYY
          return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`
        }
      } catch (e) {
        console.error("Error parsing Google Sheets date:", e)
      }
    }

    // If it's already in DD/MM/YYYY format, return as is
    if (typeof dateCellValue === "string" && dateCellValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const parts = dateCellValue.split("/")
      return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[2]}`
    }

    // If it's a date string in another format, try to parse and convert
    try {
      const date = new Date(dateCellValue)
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, "0")
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      }
    } catch (e) {
      console.error("Failed to parse date:", dateCellValue)
    }

    // Return null if we couldn't parse the date
    return null
  }

  // Function to fetch staff data
  const fetchStaffData = async () => {
    try {
      // Create URL to fetch the Staff DB sheet in JSON format
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(staffSheetName)}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch staff data: ${response.status}`)
      }

      // Extract the JSON part from the response
      const text = await response.text()
      const jsonStart = text.indexOf("{")
      const jsonEnd = text.lastIndexOf("}")
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)

      // Extract staff names (column D - index 3)
      const staffNames = []

      data.table.rows.forEach((row) => {
        if (row.c && row.c[3] && row.c[3].v) {
          // Check column D (staff name)
          const staffName = row.c[3].v.toString().trim()

          if (staffName !== "" && !staffNames.includes(staffName)) {
            staffNames.push(staffName)
          }
        }
      })

      setStaffList(staffNames)
      console.log("Fetched staff data:", staffNames)
    } catch (error) {
      console.error("Error fetching staff data:", error)
    }
  }

  // Fetch Google Sheet data when component mounts
  useEffect(() => {
    const fetchGoogleSheetData = async () => {
      try {
        setLoading(true)
        console.log("Starting to fetch Payment + Commission data...")
  
        // Fetch staff data for filtering
        await fetchStaffData()
  
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
  
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`)
        }
  
        const text = await response.text()
        const jsonStart = text.indexOf("{")
        const jsonEnd = text.lastIndexOf("}")
        const jsonString = text.substring(jsonStart, jsonEnd + 1)
        const data = JSON.parse(jsonString)
  
        if (!data.table || !data.table.cols || data.table.cols.length === 0) {
          setError("No data found in the sheet")
          setLoading(false)
          return
        }
  
        // Process headers
        let headers = []
        if (data.table.cols && data.table.cols.some((col) => col.label)) {
          headers = data.table.cols.map((col, index) => ({
            id: `col${index}`,
            label: col.label || `Column ${index + 1}`,
            type: col.type || "string",
            originalIndex: index,
          }))
        } else if (data.table.rows.length > 0 && data.table.rows[0].c) {
          headers = data.table.rows[0].c.map((cell, index) => ({
            id: `col${index}`,
            label: cell && cell.v ? String(cell.v) : `Column ${index + 1}`,
            type: data.table.cols[index]?.type || "string",
            originalIndex: index,
          }))
          data.table.rows = data.table.rows.slice(1)
        }
  
        setTableHeaders(headers)
  
        // Process all rows from the sheet
        const allPaymentsData = data.table.rows
          .filter((row) => {
            // Skip rows with no data
            return row.c && row.c.some((cell) => cell && cell.v)
          })
          .map((row, rowIndex) => {
            const paymentData = {
              _id: Math.random().toString(36).substring(2, 15),
              _rowIndex: rowIndex + 2, // +2 for header row and 1-indexing
            }
  
            row.c &&
              row.c.forEach((cell, index) => {
                const header = headers[index]
  
                // Handle date values
                if (cell && cell.v && cell.v.toString().indexOf("Date") === 0) {
                  paymentData[header.id] = parseDate(cell.v)
                } else {
                  // Handle non-date values
                  paymentData[header.id] = cell ? cell.v : ""
  
                  // Format numbers with commas
                  if (header.type === "number" && !isNaN(paymentData[header.id])) {
                    paymentData[header.id] = Number(paymentData[header.id]).toLocaleString()
                  }
                }
              })
  
            return paymentData
          })
  
        // Store all payments for history
        setAllPayments(allPaymentsData)
        setPayments(allPaymentsData)
  
        // Calculate stats - with the new specific column requirements
        const totalPayments = allPaymentsData.length
  
        // Look for "Status" in column H (index 7)
        const statusColumnId = "col7"  // This corresponds to column H (0-indexed)
        
        // Count paid and pending payments specifically from column H
        let paidPayments = 0
        let pendingPayments = 0
        
        allPaymentsData.forEach(payment => {
          const status = payment[statusColumnId]
          
          if (status && status.toString().toLowerCase().includes("paid")) {
            paidPayments++
          } else {
            // Count as pending if status is null, empty, or doesn't include "paid"
            pendingPayments++
          }
        })
  
        // Calculate total commission from column F (index 5)
        const commissionColumnId = "col5"  // This corresponds to column F (0-indexed)
        let totalCommission = 0
  
        allPaymentsData.forEach(payment => {
          const commissionValue = payment[commissionColumnId]
          
          if (commissionValue) {
            // Remove commas and convert to number
            const commission = Number.parseFloat(commissionValue.toString().replace(/,/g, ""))
            if (!isNaN(commission)) {
              totalCommission += commission
            }
          }
        })
  
        setStats({
          totalPayments: paidPayments,  // Show only paid payments in total payments
          totalCommission: totalCommission.toLocaleString(),
          pendingPayments: pendingPayments,
        })
  
        setLoading(false)
      } catch (error) {
        console.error("Error fetching Google Sheet data:", error)
        setError("Failed to load payment data")
        setLoading(false)
      }
    }
  
    fetchGoogleSheetData()
  }, [])

  // Apply filters to payments
  const filteredPayments = () => {
    let filtered = [...payments]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((payment) =>
        Object.values(payment).some(
          (value) => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )
    }

    // Apply date range filter
    if (dateFilter.startDate || dateFilter.endDate) {
      // Find date column
      const dateColumn = tableHeaders.findIndex(
        (h) => h.label.toLowerCase().includes("date") && !h.label.toLowerCase().includes("timestamp"),
      )

      if (dateColumn >= 0) {
        const dateId = `col${dateColumn}`

        filtered = filtered.filter((payment) => {
          const paymentDate = payment[dateId]
          if (!paymentDate) return false

          // Convert to Date object for comparison
          try {
            // Parse DD/MM/YYYY format
            const [day, month, year] = paymentDate.split("/").map(Number)
            const date = new Date(year, month - 1, day)

            // Apply start date filter
            if (dateFilter.startDate) {
              const [startDay, startMonth, startYear] = dateFilter.startDate.split("/").map(Number)
              const startDate = new Date(startYear, startMonth - 1, startDay)
              if (date < startDate) return false
            }

            // Apply end date filter
            if (dateFilter.endDate) {
              const [endDay, endMonth, endYear] = dateFilter.endDate.split("/").map(Number)
              const endDate = new Date(endYear, endMonth - 1, endDay)
              if (date > endDate) return false
            }

            return true
          } catch (e) {
            console.error("Date filtering error:", e)
            return true // Include if date parsing fails
          }
        })
      }
    }

    // Apply staff filter
    if (staffFilter) {
      // Find staff column
      const staffColumn = tableHeaders.findIndex(
        (h) => h.label.toLowerCase().includes("staff") && h.label.toLowerCase().includes("name"),
      )

      if (staffColumn >= 0) {
        const staffId = `col${staffColumn}`

        filtered = filtered.filter((payment) => {
          const paymentStaff = payment[staffId]
          if (!paymentStaff) return false

          return paymentStaff.toString().toLowerCase() === staffFilter.toLowerCase()
        })
      }
    }

    // Apply status filter
    if (statusFilter) {
      // Find status column
      const statusColumn = tableHeaders.findIndex((h) => h.label.toLowerCase().includes("status"))

      if (statusColumn >= 0) {
        const statusId = `col${statusColumn}`

        filtered = filtered.filter((payment) => {
          const paymentStatus = payment[statusId]
          if (!paymentStatus) return false

          return paymentStatus.toString().toLowerCase() === statusFilter.toLowerCase()
        })
      }
    }

    return filtered
  }

  // Function to filter history payments
  const filteredHistoryPayments = historySearchTerm
    ? allPayments.filter((payment) =>
        Object.values(payment).some(
          (value) => value && value.toString().toLowerCase().includes(historySearchTerm.toLowerCase()),
        ),
      )
    : allPayments

  // Function to handle history button click
  const handleHistoryClick = () => {
    setHistorySearchTerm("")
    setShowHistoryModal(true)
  }

  // Function to reset filters
  const resetFilters = () => {
    setDateFilter({
      startDate: "",
      endDate: "",
    })
    setStaffFilter("")
    setStatusFilter("")
  }

  // Function to export data to CSV
  const exportToCSV = () => {
    try {
      const filtered = filteredPayments()

      // Create CSV header row
      const headers = tableHeaders.map((header) => header.label)
      let csvContent = headers.join(",") + "\n"

      // Add data rows
      filtered.forEach((payment) => {
        const row = tableHeaders.map((header) => {
          const value = payment[header.id]
          // Wrap values with commas in quotes
          return value ? `"${value}"` : ""
        })
        csvContent += row.join(",") + "\n"
      })

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `payment_commission_${new Date().toISOString().slice(0, 10)}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Show success notification
      setNotification({
        show: true,
        message: "CSV exported successfully!",
        type: "success",
      })
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 3000)
    } catch (error) {
      console.error("Error exporting to CSV:", error)

      setNotification({
        show: true,
        message: `Failed to export CSV: ${error.message}`,
        type: "error",
      })
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 5000)
    }
  }

  // Function to print data
  const printData = () => {
    try {
      const filtered = filteredPayments()

      // Create a printable version of the table
      let printContent = `
        <html>
        <head>
          <title>Payment & Commission Report</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .date { text-align: right; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment & Commission Report</h1>
          </div>
          <div class="date">
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                ${tableHeaders.map((header) => `<th>${header.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
      `

      // Add data rows
      filtered.forEach((payment) => {
        printContent += "<tr>"
        tableHeaders.forEach((header) => {
          printContent += `<td>${payment[header.id] || ""}</td>`
        })
        printContent += "</tr>"
      })

      printContent += `
            </tbody>
          </table>
        </body>
        </html>
      `

      // Open print window
      const printWindow = window.open("", "_blank")
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()

      // Show success notification
      setNotification({
        show: true,
        message: "Print preview opened successfully!",
        type: "success",
      })
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 3000)
    } catch (error) {
      console.error("Error printing data:", error)

      setNotification({
        show: true,
        message: `Failed to print: ${error.message}`,
        type: "error",
      })
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 5000)
    }
  }

  // First, let's update the updatePaymentStatus function to actually update the Google Sheet
// Fixed updatePaymentStatus function that sends the right request to Google Apps Script
// Updated updatePaymentStatus function that uses the markDeleted action
const updatePaymentStatus = async (rowIndex, newStatus) => {
    try {
      // Show loading notification
      setNotification({
        show: true,
        message: "Updating payment status...",
        type: "info",
      });
  
      // Find the status column index
      const statusColumn = tableHeaders.findIndex((h) => h.label.toLowerCase().includes("status"));
      const statusId = statusColumn >= 0 ? `col${statusColumn}` : "col7"; // Default to col7 if not found
      const statusColumnNumber = statusColumn >= 0 ? tableHeaders[statusColumn].originalIndex + 1 : 8;
      
      // Create a form element that will submit to a hidden iframe
      const formId = `update-form-${Date.now()}`;
      const iframeId = `update-iframe-${Date.now()}`;
      
      // Create a hidden iframe to target the form
      const iframe = document.createElement("iframe");
      iframe.id = iframeId;
      iframe.name = iframeId;
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      
      // Create the form to submit the data
      const form = document.createElement("form");
      form.id = formId;
      form.method = "POST";
      form.target = iframeId; // Target the hidden iframe
      form.action = scriptUrl;
      form.style.display = "none";
      
      // Helper function to add form fields
      const addField = (name, value) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };
      
      // Add form fields with the data - using the markDeleted action that already exists
      addField("action", "markDeleted");
      addField("sheetName", sheetName);
      addField("rowIndex", rowIndex);
      addField("columnIndex", statusColumnNumber);
      addField("value", newStatus); // Use "Paid" as the value
      
      // Add the form to the document and submit it
      document.body.appendChild(form);
      
      // Log what we're sending for debugging
      console.log("Sending update to Google Sheet:", {
        action: "markDeleted",
        sheetName,
        rowIndex,
        columnIndex: statusColumnNumber,
        value: newStatus
      });
      
      form.submit();
      
      // Clean up form and iframe after submission (give it time to complete)
      setTimeout(() => {
        if (document.getElementById(formId)) {
          document.body.removeChild(document.getElementById(formId));
        }
        if (document.getElementById(iframeId)) {
          document.body.removeChild(document.getElementById(iframeId));
        }
      }, 5000);
      
      // Update the local data (optimistically)
      const updatedPayments = payments.map((payment) => {
        if (payment._rowIndex === rowIndex) {
          return { ...payment, [statusId]: newStatus };
        }
        return payment;
      });
  
      setPayments(updatedPayments);
  
      // Also update allPayments for history
      const updatedAllPayments = allPayments.map((payment) => {
        if (payment._rowIndex === rowIndex) {
          return { ...payment, [statusId]: newStatus };
        }
        return payment;
      });
  
      setAllPayments(updatedAllPayments);
  
      // Update stats if status was changed from pending to paid
      setStats((prevStats) => {
        // Get the old status
        const oldStatus = payments.find(p => p._rowIndex === rowIndex)?.[statusId] || "";
        
        // Only decrement pending count if it was pending before
        if (oldStatus.toString().toLowerCase().includes("pending")) {
          return {
            ...prevStats,
            pendingPayments: Math.max(0, prevStats.pendingPayments - 1),
          };
        }
        return prevStats;
      });
  
      // Show success notification
      setNotification({
        show: true,
        message: "Payment status updated successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
  
      // Show error notification
      setNotification({
        show: true,
        message: `Failed to update status: ${error.message}`,
        type: "error",
      });
    } finally {
      // Hide notification after 5 seconds
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 5000);
    }
  };

  // Update the getStatusColor function to handle null values as Pending
  const getStatusColor = (status) => {
    if (!status) return "bg-yellow-100 text-yellow-800" // Changed from gray to yellow for null values

    const statusLower = status.toString().toLowerCase()
    if (statusLower.includes("paid") || statusLower.includes("complete")) {
      return "bg-green-100 text-green-800"
    } else if (statusLower.includes("pending")) {
      return "bg-yellow-100 text-yellow-800"
    } else if (statusLower.includes("cancel")) {
      return "bg-red-100 text-red-800"
    }

    return "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Payment & Commission</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleHistoryClick}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
          >
            <History size={18} className="mr-2" />
            Payment History
          </button>
          {!isStaff && (
            <>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <Download size={18} className="mr-2" />
                Export CSV
              </button>
              <button
                onClick={printData}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
              >
                <Printer size={18} className="mr-2" />
                Print
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <DollarSign size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Payments</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalPayments}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <DollarSign size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Commission</p>
            <p className="text-2xl font-bold text-gray-800">₹{stats.totalCommission}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-yellow-100 p-3 mr-4">
            <AlertCircle size={24} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending Payments</p>
            <p className="text-2xl font-bold text-gray-800">{stats.pendingPayments}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search payments..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-0 flex items-center pr-3">
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          {/* <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
          >
            <Filter size={18} className="mr-2" />
            Filters
            {filterOpen ? <ChevronUp size={18} className="ml-2" /> : <ChevronDown size={18} className="ml-2" />}
          </button> */}
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={dateFilter.startDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                  />
                  <span className="flex items-center text-gray-500">to</span>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={dateFilter.endDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                >
                  <option value="">All Staff</option>
                  {staffList.map((staff, index) => (
                    <option key={index} value={staff}>
                      {staff}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-blue-600">Loading payment data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.label}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments().length > 0 ? (
                  filteredPayments().map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      {tableHeaders.map((header) => {
                        // Special rendering for status column
                        if (header.label.toLowerCase().includes("status")) {
                          return (
                            <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment[header.id])}`}
                              >
                                {payment[header.id] || "Pending"}
                              </span>
                            </td>
                          )
                        }

                        // Special rendering for amount/price columns
                        if (
                          header.label.toLowerCase().includes("amount") ||
                          header.label.toLowerCase().includes("price") ||
                          header.label.toLowerCase().includes("commission")
                        ) {
                          return (
                            <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-green-600">
                                {payment[header.id] ? `₹${payment[header.id]}` : "—"}
                              </div>
                            </td>
                          )
                        }

                        // Special rendering for date columns
                        if (header.label.toLowerCase().includes("date")) {
                          return (
                            <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{payment[header.id] || "—"}</div>
                            </td>
                          )
                        }

                        // Default rendering for other columns
                        return (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{payment[header.id] || "—"}</div>
                          </td>
                        )
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  {(() => {
    const statusColumn = tableHeaders.findIndex((h) => h.label.toLowerCase().includes("status"))
    const statusId = statusColumn >= 0 ? `col${statusColumn}` : null
    const status = statusId ? payment[statusId] : null
    
    // Only show the button if status is null or not paid/complete
    if (!status || 
        (!status.toString().toLowerCase().includes("paid") && 
         !status.toString().toLowerCase().includes("complete"))) {
      return (
        <button
          onClick={() => updatePaymentStatus(payment._rowIndex, "Paid")}
          className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors"
        >
          Mark Paid
        </button>
      )
    }
    return null
  })()}
</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={tableHeaders.length + 1} className="px-6 py-4 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Payment & Commission History</h3>
                  <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-500">
                    <X size={20} />
                  </button>
                </div>
                <div className="mt-4 relative">
                  <input
                    type="text"
                    placeholder="Search payment history..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  {historySearchTerm && (
                    <button
                      onClick={() => setHistorySearchTerm("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto flex-1 min-h-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {tableHeaders.map((header) => (
                        <th
                          key={`history-${header.id}`}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header.label}
                        </th>
                      ))}
                      {/* <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th> */}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHistoryPayments.length > 0 ? (
                      filteredHistoryPayments.map((payment) => (
                        <tr key={`history-${payment._id}`} className="hover:bg-gray-50">
                          {tableHeaders.map((header) => {
                            // Special rendering for status column
                            if (header.label.toLowerCase().includes("status")) {
                              return (
                                <td key={`history-${header.id}`} className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment[header.id])}`}
                                  >
                                    {payment[header.id] || "Pending"}
                                  </span>
                                </td>
                              )
                            }

                            // Special rendering for amount/price columns
                            if (
                              header.label.toLowerCase().includes("amount") ||
                              header.label.toLowerCase().includes("price") ||
                              header.label.toLowerCase().includes("commission")
                            ) {
                              return (
                                <td key={`history-${header.id}`} className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-green-600">
                                    {payment[header.id] ? `₹${payment[header.id]}` : "—"}
                                  </div>
                                </td>
                              )
                            }

                            // Default rendering for other columns
                            return (
                              <td key={`history-${header.id}`} className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{payment[header.id] || "—"}</div>
                              </td>
                            )
                          })}
                          {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  {(() => {
    const statusColumn = tableHeaders.findIndex((h) => h.label.toLowerCase().includes("status"))
    const statusId = statusColumn >= 0 ? `col${statusColumn}` : null
    const status = statusId ? payment[statusId] : null
    
    // Only show the button if status is null or not paid/complete
    if (!status || 
        (!status.toString().toLowerCase().includes("paid") && 
         !status.toString().toLowerCase().includes("complete"))) {
      return (
        <button
          onClick={() => updatePaymentStatus(payment._rowIndex, "Paid")}
          className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors"
        >
          Mark Paid
        </button>
      )
    }
    return null
  })()}
</td> */}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={tableHeaders.length + 1} className="px-6 py-4 text-center text-gray-500">
                          No payment history found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification popup */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center ${
              notification.type === "success" ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="text-green-600 mr-3" size={20} />
            ) : (
              <AlertCircle className="text-red-600 mr-3" size={20} />
            )}
            <p className={`font-medium ${notification.type === "success" ? "text-green-800" : "text-red-800"}`}>
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
  )
}

export default PaymentCommission

