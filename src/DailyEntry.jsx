"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, IndianRupee, TrendingUp, BarChart2, CreditCard, Scissors, History, X, Search, Edit, Save, CheckCircle2, AlertCircle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAuth } from "./Context/AuthContext" // Import useAuth hook

const DailyEntry = ({ hideHistoryButton = false }) => {
  // Get user data from AuthContext
  const { user } = useAuth()
  
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tableHeaders, setTableHeaders] = useState([])
  const [transactions, setTransactions] = useState([])
  const [allTransactions, setAllTransactions] = useState([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historySearchTerm, setHistorySearchTerm] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState({
    totalRevenue: 0,
    services: 0,
    cardPayments: 0,
    averageSale: 0
  })
  
  // Add state for edit functionality
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: ""
  })

  // Google Sheet Details
  const sheetId = '1Kb-fhC1yiFJCyPO7TJDqnu-lQ1n1H6mLErlkSPc6yHc'
  const sheetName = 'Daily Entry'
  
  // Google Apps Script Web App URL
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbyhmDsXWRThVsJCfAirTsI3o9EGE-oCcw2HKz1ERe4qxNWfcVoxMUr3sGa6yHJm-ckt/exec'

// Modify the useEffect block where you fetch and process data
// Find this section in your code and replace it

useEffect(() => {
  const fetchGoogleSheetData = async () => {
    try {
      setLoading(true)
      console.log("Starting to fetch Google Sheet data...")
      console.log("Current user data:", user) // Debug: Log user data
      
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
      const headers = data.table.cols.map((col, index) => ({
        id: `col${index}`,
        label: col.label || col.id,
        type: col.type
      })).filter(header => header.label) // Filter out empty headers
      
      setTableHeaders(headers)
      
      // Check if there are any rows of data
      if (!data.table.rows || data.table.rows.length === 0) {
        console.log("No data rows found in the sheet")
        // Set empty arrays for transactions and allTransactions
        setTransactions([])
        setAllTransactions([])
        // Reset stats
        setStats({
          totalRevenue: 0,
          services: 0,
          cardPayments: 0,
          averageSale: 0
        })
        setLoading(false)
        return
      }
      
      // Extract and transform data rows with safer handling
      const rowsData = data.table.rows.map((row, rowIndex) => {
        const rowData = {}
        
        // Add an internal unique ID and row index for updates
        rowData._id = Math.random().toString(36).substring(2, 15)
        rowData._rowIndex = rowIndex + 2 // +2 for header row and 1-indexing
        
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
        // Filter out rows with no actual data - more thorough check
        const hasActualData = Object.keys(rowData)
          .filter(key => !key.startsWith('_')) // Exclude our internal properties
          .some(key => rowData[key] !== '')
          
        return hasActualData ? rowData : null
      })
      .filter(row => row !== null && Object.keys(row).length > 1) // Filter out empty rows and nulls
      
      // Check if we actually have any valid rows after filtering
      if (rowsData.length === 0) {
        console.log("No valid data rows found after processing")
        setTransactions([])
        setAllTransactions([])
        setStats({
          totalRevenue: 0,
          services: 0,
          cardPayments: 0,
          averageSale: 0
        })
        setLoading(false)
        return
      }
      
      // Find the staff name column index (column J - index 9)
      const staffNameColumnIndex = 9 // Column J is typically index 9 (0-based indexing)
      const staffNameColumnId = headers[staffNameColumnIndex]?.id
      
      console.log("Using staff name column J with id:", staffNameColumnId)
      
      // Debug: Log staff names in the data
      if (user?.role === "staff") {
        const staffNames = rowsData.map(row => row[staffNameColumnId] || "").filter(Boolean)
        console.log("All staff names in data:", [...new Set(staffNames)])
        console.log("User's staff name:", user.staffName)
      }
      
      // Filter transactions for staff users (similar to Booking component)
      // For admin users, don't filter by staff
      let staffFilteredRows = rowsData
      if (user?.role === "staff" && staffNameColumnId) {
        staffFilteredRows = rowsData.filter(row => {
          const staffNameInTransaction = (row[staffNameColumnId] || "").toString().trim().toLowerCase()
          
          // User identifiers from login data - for matching
          const userStaffName = (user.staffName || "").toString().trim().toLowerCase()
          const userName = (user.name || "").toString().trim().toLowerCase()
          const userEmail = (user.email || "").toString().trim().toLowerCase()
          
          // Debug output for tracking staff name matching
          console.log(`Comparing transaction staff: "${staffNameInTransaction}" with user identifiers:`, {
            staffName: userStaffName,
            name: userName,
            email: userEmail
          })
          
          // Simple exact matching with case-insensitivity
          const isMatch = 
            staffNameInTransaction === userStaffName ||
            staffNameInTransaction === userName ||
            staffNameInTransaction === userEmail
          
          if (isMatch) {
            console.log(`✓ MATCH FOUND for transaction with staff: "${staffNameInTransaction}"`)
          }
          
          return isMatch
        })
        
        console.log(`After staff filtering: ${staffFilteredRows.length} transactions will be displayed from ${rowsData.length} total`)
      }
      
      // Save all transactions for history view (already filtered by staff)
      setAllTransactions(staffFilteredRows)
      
      // Find the date field
      const dateField = headers.find(h => h.label && h.label.toLowerCase().includes('date'))?.id
      
      const filteredTransactions = dateField 
        ? staffFilteredRows.filter(row => {
            if (!row[dateField]) return false
            
            // Try to match the date in different formats
            const rowDate = row[dateField]
            
            // Check formatted date
            if (row[`${dateField}_formatted`]) {
              const formattedDate = new Date(row[`${dateField}_formatted`])
              if (!isNaN(formattedDate.getTime())) {
                const formattedDateStr = formattedDate.toISOString().split('T')[0]
                if (formattedDateStr === date) return true
              }
            }
            
            // For Google Sheets date format: Date(year,month,day)
            if (typeof rowDate === 'string' && rowDate.startsWith('Date(')) {
              const match = /Date\((\d+),(\d+),(\d+)\)/.exec(rowDate)
              if (match) {
                const year = parseInt(match[1], 10)
                const month = parseInt(match[2], 10) // 0-indexed
                const day = parseInt(match[3], 10)
                
                const sheetDate = new Date(year, month, day)
                const selectedDate = new Date(date)
                
                // Compare year, month, and day
                if (sheetDate.getFullYear() === selectedDate.getFullYear() &&
                    sheetDate.getMonth() === selectedDate.getMonth() &&
                    sheetDate.getDate() === selectedDate.getDate()) {
                  return true
                }
              }
            }
            
            // Try direct comparison
            try {
              const rowDateObj = new Date(rowDate)
              if (!isNaN(rowDateObj.getTime())) {
                const rowDateStr = rowDateObj.toISOString().split('T')[0]
                return rowDateStr === date
              }
            } catch (e) {
              console.log("Date comparison error:", e)
            }
            
            return false
          })
        : staffFilteredRows
      
      setTransactions(filteredTransactions)
      
      // Calculate statistics for dashboard cards
      let totalAmount = 0
      let cardPayments = 0
      
      // Find field names in the data
      const amountField = headers.find(h => 
        h.label && (h.label.toLowerCase().includes('amount') || 
                    h.label.toLowerCase().includes('price') || 
                    h.label.toLowerCase().includes('revenue'))
      )?.id || 'amount'
      
      const paymentMethodField = headers.find(h => 
        h.label && (h.label.toLowerCase().includes('payment') || 
                   h.label.toLowerCase().includes('method'))
      )?.id || 'paymentMethod'
      
      // Calculate totals
      filteredTransactions.forEach(row => {
        if (row[amountField] && !isNaN(parseFloat(row[amountField]))) {
          const amount = parseFloat(row[amountField])
          totalAmount += amount
          
          // Check for card payments
          const paymentMethod = row[paymentMethodField]?.toString().toLowerCase() || ''
          if (paymentMethod.includes('card') || 
              paymentMethod.includes('credit') || 
              paymentMethod.includes('debit')) {
            cardPayments += amount
          }
        }
      })
      
      // Update the stats
      setStats({
        totalRevenue: totalAmount,
        services: filteredTransactions.length,
        cardPayments: cardPayments,
        averageSale: filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0
      })
      
      setLoading(false)
    } catch (error) {
      console.error("Error fetching Google Sheet data:", error)
      setError("Failed to load transaction data")
      setLoading(false)
    }
  }

  fetchGoogleSheetData()
}, [date, user]) // Add user to dependency array so it refetches when user changes

  // Filter transactions by search term (similar to Inventory)
  const filteredTransactions = searchTerm
    ? transactions.filter(transaction => 
        Object.values(transaction).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : transactions

  // Handle Edit Click - IMPROVED to preserve original date formats
  const handleEditClick = (transaction) => {
    console.log("Editing transaction with original values:", transaction)
    
    // Create a deep copy to avoid modifying the original transaction
    const transactionCopy = JSON.parse(JSON.stringify(transaction))
    
    // Special handling for timestamp field - set current date if empty
    const timestampHeader = tableHeaders.find(header => 
      header.label.toLowerCase().includes('timestamp') || 
      header.label.toLowerCase().includes('time stamp')
    )
    
    if (timestampHeader && !transactionCopy[timestampHeader.id]) {
      const today = new Date()
      const day = today.getDate().toString().padStart(2, '0')
      const month = (today.getMonth() + 1).toString().padStart(2, '0')
      const year = today.getFullYear()
      
      // Format date as DD/MM/YYYY to match the expected format
      transactionCopy[timestampHeader.id] = `${day}/${month}/${year}`
    }
    
    // Keep the original Google Sheets date format in a special property
    // This will be used when submitting the form
    tableHeaders.forEach(header => {
      if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
        // Store the original date value for submission
        transactionCopy[`${header.id}_original`] = transactionCopy[header.id]
        
        // Convert the date for display in the form fields
        if (transactionCopy[header.id]) {
          // For Google Sheets date format: Date(year,month,day)
          if (typeof transactionCopy[header.id] === 'string' && 
              transactionCopy[header.id].startsWith('Date(')) {
            const match = /Date\((\d+),(\d+),(\d+)\)/.exec(transactionCopy[header.id])
            if (match) {
              const year = parseInt(match[1], 10)
              const month = parseInt(match[2], 10) + 1 // Convert from 0-indexed to 1-indexed month
              const day = parseInt(match[3], 10)
              
              // Format as DD/MM/YYYY for display
              transactionCopy[`${header.id}_display`] = `${day}/${month}/${year}`
              
              // If this field is for a form input, also prepare the YYYY-MM-DD format
              if (header.label.toLowerCase().includes('date') && 
                  !header.label.toLowerCase().includes('timestamp')) {
                // For date input field, format as YYYY-MM-DD
                transactionCopy[header.id] = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
              }
            }
          }
        }
      }
    })
    
    console.log("Prepared transaction for editing:", transactionCopy)
    setEditingTransaction(transactionCopy)
    setShowEditForm(true)
  }
  
  // Handle Input Change for Edit Form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target
    setEditingTransaction(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Handle Edit Form Submit - IMPROVED to preserve date formats
  // Modified handleEditSubmit function to preserve DD/MM/YYYY date format
// Modified handleEditSubmit function to preserve DD/MM/YYYY date format
// Replace your current handleEditSubmit function with this one

const handleEditSubmit = async (e) => {
  e.preventDefault()
  setSubmitting(true)
  
  try {
    const rowIndex = editingTransaction._rowIndex
    
    if (!rowIndex) {
      throw new Error("Could not determine the row index for updating this transaction")
    }
    
    // Create a deep copy to avoid modifying the original
    const submissionData = JSON.parse(JSON.stringify(editingTransaction))
    
    // Remove the temporary properties we added
    tableHeaders.forEach(header => {
      delete submissionData[`${header.id}_original`]
      delete submissionData[`${header.id}_display`]
    })
    
    // Prepare row data for submission - preserve original date format
    const rowData = tableHeaders.map(header => {
      // Get the value from our editing transaction
      let value = submissionData[header.id] || ''
      
      // Special handling for date fields - keep the DD/MM/YYYY format instead of converting to Date()
      if ((header.type === 'date' || header.label.toLowerCase().includes('date')) && value) {
        // If the value is in YYYY-MM-DD format (from date input fields)
        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = value.split('-').map(part => parseInt(part, 10))
          // Convert to DD/MM/YYYY format
          value = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`
        }
      }
      
      // Special handling for timestamp column (column A)
      if (header.label.toLowerCase().includes('timestamp') || 
          (header.id === 'col0' && (header.label.toLowerCase().includes('date') || header.type === 'date'))) {
        // Ensure timestamp is always in DD/MM/YYYY format
        if (value) {
          // Handle various possible formats
          // If it's already in DD/MM/YYYY format, leave it
          if (value.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            // Already in the correct format
          } 
          // If it's in Date() format, convert it
          else if (value.startsWith('Date(') && value.endsWith(')')) {
            const match = /Date\((\d+),(\d+),(\d+)\)/.exec(value)
            if (match) {
              const year = parseInt(match[1], 10)
              const month = parseInt(match[2], 10) + 1 // Convert from 0-indexed to 1-indexed month
              const day = parseInt(match[3], 10)
              
              // Format as DD/MM/YYYY for display
              value = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`
            }
          }
          // If it's in YYYY-MM-DD format from a date input
          else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = value.split('-').map(part => parseInt(part, 10))
            value = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`
          }
        }
      }
      
      return value
    })
    
    console.log("Submitting data with preserved date formats:", rowData)
    
    const formData = new FormData()
    formData.append('sheetName', sheetName)
    formData.append('rowData', JSON.stringify(rowData))
    formData.append('rowIndex', rowIndex)
    formData.append('action', 'update')
    
    const response = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', 
      body: formData
    })
    
    console.log("Update submitted successfully")
    
    // For UI display, ensure the dates look correct
    const uiTransaction = { ...editingTransaction }
    
    // Make sure dates display correctly in the UI
    tableHeaders.forEach(header => {
      if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
        if (uiTransaction[header.id]) {
          // If it's a YYYY-MM-DD format from a date input
          if (uiTransaction[header.id].match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = uiTransaction[header.id].split('-').map(part => parseInt(part, 10))
            // Convert to DD/MM/YYYY format for display
            uiTransaction[`${header.id}_formatted`] = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`
            uiTransaction[header.id] = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`
          }
        }
      }
    })
    
    // Update transactions in state
    setTransactions(prev => 
      prev.map(transaction => 
        transaction._id === editingTransaction._id ? uiTransaction : transaction  
      )
    )
    
    // Update transaction in allTransactions
    setAllTransactions(prev =>
      prev.map(transaction =>
        transaction._id === editingTransaction._id ? uiTransaction : transaction
      )
    )
    
    // Recalculate stats if needed
    const amountField = tableHeaders.find(h => 
      h.label && (h.label.toLowerCase().includes('amount') || 
                  h.label.toLowerCase().includes('price') || 
                  h.label.toLowerCase().includes('revenue'))
    )?.id
    
    if (amountField) {
      let totalAmount = 0
      let cardPayments = 0
      
      const paymentMethodField = tableHeaders.find(h => 
        h.label && (h.label.toLowerCase().includes('payment') || 
                   h.label.toLowerCase().includes('method'))
      )?.id
      
      const updatedTransactions = transactions.map(transaction => 
        transaction._id === editingTransaction._id ? uiTransaction : transaction
      )
      
      updatedTransactions.forEach(row => {
        if (row[amountField] && !isNaN(parseFloat(row[amountField]))) {
          const amount = parseFloat(row[amountField])
          totalAmount += amount
          
          // Check for card payments
          if (paymentMethodField) {
            const paymentMethod = row[paymentMethodField]?.toString().toLowerCase() || ''
            if (paymentMethod.includes('card') || 
                paymentMethod.includes('credit') || 
                paymentMethod.includes('debit')) {
              cardPayments += amount
            }
          }
        }
      })
      
      setStats({
        totalRevenue: totalAmount,
        services: updatedTransactions.length,
        cardPayments: cardPayments,
        averageSale: updatedTransactions.length > 0 ? totalAmount / updatedTransactions.length : 0
      })
    }
    
    setShowEditForm(false)
    
    setNotification({
      show: true,
      message: "Transaction updated successfully!",
      type: "success"
    })
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" })
    }, 3000)
  } catch (error) {
    console.error("Error updating transaction:", error)
      
    setNotification({
      show: true,
      message: `Failed to update transaction: ${error.message}`,
      type: "error" 
    })
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" })
    }, 5000)
  } finally {
    setSubmitting(false)
  }
}
  
  // Function to render appropriate form field based on header type
  const renderFormField = (header) => {
    // For timestamp fields, render with DD/MM/YYYY format
    if (header.label.toLowerCase().includes('timestamp') || 
        header.label.toLowerCase().includes('time stamp')) {
      // Check if we have a pre-formatted display value
      const displayValue = editingTransaction[`${header.id}_display`] || editingTransaction[header.id] || ''
      
      return (
        <input
          type="text"
          id={`edit-${header.id}`}
          name={header.id}
          value={displayValue}
          onChange={handleEditInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
        />
      )
    }
    
    // Date fields (other than timestamp)
    if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
      // For date inputs, use YYYY-MM-DD format
      let dateValue = editingTransaction[header.id] || ''
      
      return (
        <input
          type="date"
          id={`edit-${header.id}`}
          name={header.id}
          value={dateValue}
          onChange={handleEditInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
        />
      )
    }
    
    // Amount/Price fields
    if (header.label.toLowerCase().includes('amount') || 
        header.label.toLowerCase().includes('price') || 
        header.label.toLowerCase().includes('revenue')) {
      return (
        <input 
          type="number"
          id={`edit-${header.id}`} 
          name={header.id}
          value={editingTransaction[header.id] || ''}
          onChange={handleEditInputChange}
          min={0}
          step="0.01"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500" 
        />
      )
    }
    
    // Payment method field with common options
    if (header.label.toLowerCase().includes('payment') || 
        header.label.toLowerCase().includes('method')) {
      return (
        <select
          id={`edit-${header.id}`}
          name={header.id}
          value={editingTransaction[header.id] || ''}
          onChange={handleEditInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
        >
          <option value="">Select Payment Method</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="UPI">UPI</option>
          <option value="Online">Online</option>
        </select>
      )
    }
    
    // Default text input for all other fields
    return (
      <input
        type="text"
        id={`edit-${header.id}`}
        name={header.id} 
        value={editingTransaction[header.id] || ''}
        onChange={handleEditInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
      />
    )
  }

  // Open history modal
  const handleHistoryClick = () => {
    setHistorySearchTerm("")
    setShowHistoryModal(true)
  }
  
  // Function to filter history transactions
  const filteredHistoryTransactions = historySearchTerm
    ? allTransactions.filter(transaction => 
        Object.values(transaction).some(
          value => value && value.toString().toLowerCase().includes(historySearchTerm.toLowerCase())
        )
      )
    : allTransactions

  // Helper function to format dates for display
  const formatDateForDisplay = (dateValue) => {
    if (!dateValue) return '—'
    
    // If it's already in DD/MM/YYYY format, return as is
    if (typeof dateValue === 'string' && dateValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      return dateValue
    }
    
    // For Google Sheets date format: Date(year,month,day)
    if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
      const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateValue)
      if (match) {
        const year = parseInt(match[1], 10)
        const month = parseInt(match[2], 10) + 1 // Convert from 0-indexed to 1-indexed month
        const day = parseInt(match[3], 10)
        
        // Format as DD/MM/YYYY
        return `${day}/${month}/${year}`
      }
    }
    
    // Try to parse as date object
    try {
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        
        return `${day}/${month}/${year}`
      }
    } catch (e) {
      console.log("Date parsing error:", e)
    }
    
    // Return original if all else fails
    return dateValue
  }

  return (
    <div className="space-y-6">
      {/* Header - Updated with search bar and style matching Inventory */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Daily Entry</h2>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search transactions..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}  
            />
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            
            {/* Only show history button if not hidden */}
            {!hideHistoryButton && (
              <button 
                className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                onClick={handleHistoryClick}
              >
                <History size={18} className="mr-2" />
                View History
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <IndianRupee size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-800">₹{stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <Scissors size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Services</p>
            <p className="text-2xl font-bold text-gray-800">{stats.services}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <CreditCard size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Card Payments</p>
            <p className="text-2xl font-bold text-gray-800">₹{stats.cardPayments.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-yellow-100 p-3 mr-4">
            <TrendingUp size={24} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Sale</p>
            <p className="text-2xl font-bold text-gray-800">₹{stats.averageSale.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Transactions Table - Updated with Inventory table style */}
      {/* Transactions Table - Modified to match Booking component style */}
<div className="bg-white rounded-lg shadow overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
    <h3 className="text-lg font-medium text-gray-800">Today's Transactions</h3>
  </div>
  {loading ? (
    <div className="text-center py-10">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-4"></div>
      <p className="text-pink-600">Loading transaction data...</p>
    </div>
  ) : error ? (
    <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
      {error} <button className="underline ml-2" onClick={() => window.location.reload()}>Try again</button>
    </div>
  ) : (
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
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <tr key={transaction._id}>
                {tableHeaders.map((header) => {
                  // Special handling for price/amount fields (but NOT serial numbers)
                  if ((header.label.toLowerCase().includes('amount') || 
                      header.label.toLowerCase().includes('price') || 
                      header.label.toLowerCase().includes('commission') || 
                      header.label.toLowerCase().includes('total')) && 
                      !header.label.toLowerCase().includes('serial') && 
                      !header.label.toLowerCase().includes('sr') && 
                      !header.label.toLowerCase().includes('no') && 
                      header.type !== 'string') {
                    const value = transaction[header.id]
                    let displayValue = value
                    
                    if (!isNaN(parseFloat(value))) {
                      displayValue = '₹' + parseFloat(value).toFixed(2)
                    }
                    
                    return (
                      <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">{displayValue || '—'}</div>
                      </td>
                    )
                  }
                  
                  // For date fields
                  if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
                    // Use our formatDateForDisplay helper for consistent formatting
                    const displayDate = formatDateForDisplay(transaction[header.id])
                    
                    return (
                      <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{displayDate}</div>
                      </td>
                    )
                  }
                  
                  // Default rendering for other columns
                  return (
                    <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transaction[header.id] || '—'}</div>
                    </td>
                  )
                })}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    className="text-pink-600 hover:text-pink-900" 
                    onClick={() => handleEditClick(transaction)}
                  >
                    <Edit size={16} className="inline mr-1" />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={tableHeaders.length + 1} className="px-6 py-10 text-center text-gray-500">
                {searchTerm ? "No transactions found matching the search" : "No transactions found for this date"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )}
</div>

      {/* Chart Section - Only display if not hidden */}
      {!hideHistoryButton && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Revenue Breakdown</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-4"></div>
            </div>
          ) : error ? (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Error loading chart data</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <BarChart2 size={48} className="text-gray-300" />
              <p className="ml-4 text-gray-500">No transaction data available for this date</p>
            </div>
          ) : (
            <RevenueChart transactions={transactions} tableHeaders={tableHeaders} />
          )}
        </div>
      )}

      {/* History Modal - Shows All Transaction Data */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Transaction History</h3>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setShowHistoryModal(false)}
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search all transactions..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent w-full"
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
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
                        <th
                          key="history-actions"
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredHistoryTransactions.length > 0 ? (
                        filteredHistoryTransactions.map((transaction) => (
                          <tr key={`history-row-${transaction._id}`} className="hover:bg-gray-50">
                            {tableHeaders.map((header) => {
                              // Special handling for price/amount fields
                              if ((header.label.toLowerCase().includes('amount') || 
                                  header.label.toLowerCase().includes('price') || 
                                  header.label.toLowerCase().includes('commission') || 
                                  header.label.toLowerCase().includes('total')) && 
                                  !header.label.toLowerCase().includes('serial') && 
                                  !header.label.toLowerCase().includes('sr') && 
                                  !header.label.toLowerCase().includes('no') && 
                                  header.type !== 'string') {
                                const value = transaction[header.id]
                                let displayValue = value
                                
                                if (!isNaN(parseFloat(value))) {
                                  displayValue = '₹' + parseFloat(value).toFixed(2)
                                }
                                
                                return (
                                  <td key={`history-cell-${header.id}`} className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-green-600">{displayValue || '—'}</div>
                                  </td>
                                )
                              }
                              
                              // For date fields
                              if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
                                // Use our formatDateForDisplay helper for consistent formatting
                                const displayDate = formatDateForDisplay(transaction[header.id])
                                
                                return (
                                  <td key={`history-cell-${header.id}`} className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{displayDate}</div>
                                  </td>
                                )
                              }
                              
                              // Default rendering for other columns
                              return (
                                <td key={`history-cell-${header.id}`} className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{transaction[header.id] || '—'}</div>
                                </td>
                              )
                            })}
                            {/* Add Edit button to history items */}
                            <td key="history-actions-cell" className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                className="text-pink-600 hover:text-pink-900"
                                onClick={() => {
                                  handleEditClick(transaction);
                                  setShowHistoryModal(false);
                                }}
                              >
                                <Edit size={16} className="inline mr-1" />
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={tableHeaders.length + 1} className="px-6 py-4 text-center text-gray-500">
                            {historySearchTerm ? "No transactions matching your search" : "No transaction history found"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 bg-pink-600 text-white rounded-md shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                    onClick={() => setShowHistoryModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Notification popup - Enhanced with animation and icon */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            key="notification"
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
            <p className={`font-medium ${
              notification.type === "success" ? "text-green-800" : "text-red-800"
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
      
      {/* Edit Form Modal - UPDATED with proper date handling */}
      <AnimatePresence>
        {showEditForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-pink-600">Edit Transaction</h3>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setShowEditForm(false)}
                  >
                    <X size={24} />
                  </button>
                </div>
        
                <form onSubmit={handleEditSubmit} className="space-y-6"> 
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tableHeaders.map((header) => (
                      <div key={`edit-${header.id}`}>
                        <label htmlFor={`edit-${header.id}`} className="block text-sm font-medium text-pink-700">
                          {header.label}
                        </label>
                        {renderFormField(header)}  
                      </div>
                    ))}
                  </div>
            
                  <div className="flex justify-end space-x-3 pt-4 border-t border-pink-100">
                    <button
                      type="button"
                      className="px-4 py-2 border border-pink-300 rounded-md shadow-sm text-pink-700 bg-white hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      onClick={() => setShowEditForm(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-pink-600 text-white rounded-md shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-300 flex items-center"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>  
                          <Save size={18} className="mr-2" />
                          Update Transaction
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}



// Revenue Chart Component
const RevenueChart = ({ transactions, tableHeaders }) => {
  // Find field names in the data
  const amountField = tableHeaders.find(h => 
    h.label && (h.label.toLowerCase().includes('amount') || 
                h.label.toLowerCase().includes('price') || 
                h.label.toLowerCase().includes('revenue'))
  )?.id || 'amount'

  const serviceField = tableHeaders.find(h => 
    h.label && (h.label.toLowerCase().includes('service') || 
                h.label.toLowerCase().includes('item'))
  )?.id || 'service'

  // Process data for the chart - group transactions by service
  const serviceData = transactions.reduce((acc, transaction) => {
    const service = transaction[serviceField] || 'Other'
    const amount = parseFloat(transaction[amountField]) || 0
    
    if (!acc[service]) {
      acc[service] = {
        name: service,
        value: 0,
        count: 0
      }
    }
    
    acc[service].value += amount
    acc[service].count += 1
    
    return acc
  }, {})
  
  // Convert to array and sort by value (highest first)
  const chartData = Object.values(serviceData)
    .sort((a, b) => b.value - a.value)
    .map(item => ({
      name: item.name,
      revenue: parseFloat(item.value.toFixed(2)),
      count: item.count
    }))

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded">
          <p className="font-bold">{label}</p>
          <p className="text-green-600">₹{payload[0].value.toFixed(2)} revenue</p>
          <p className="text-gray-600">{payload[1].value} services</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar yAxisId="left" dataKey="revenue" name="Revenue (₹)" fill="#8884d8" />
          <Bar yAxisId="right" dataKey="count" name="Number of Services" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}



export default DailyEntry
      
