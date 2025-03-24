"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CalendarIcon, ChevronLeft, ChevronRight, Filter, Plus, Search, X } from "lucide-react"
import { format } from "date-fns"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
}

export default function BookingsPage() {
  // State management
  const [date, setDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [bookings, setBookings] = useState([])
  const [error, setError] = useState(null)
  const [tableHeaders, setTableHeaders] = useState([])
  const [savingRows, setSavingRows] = useState({})
  const [editableRows, setEditableRows] = useState({})
  const [editedData, setEditedData] = useState({})
  const [notification, setNotification] = useState({
    show: false, 
    message: "",
    type: ""
  })

  // Google Sheet Details
  const sheetId = '1iWKm5EXHPFbhmIQpCDBEjYLsKPmVWEfeYqBjczZUDIw'
  const sheetName = 'Booking DB'
  
  // Google Apps Script Web App URL
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbyTQO4XsGX-4e4cLVjHgd7iZ563tfBbXBh3ja6tTArwoZvRMfw1C7BhsrrQxoHg5P1nmQ/exec'

  // Function to parse dates from Google Sheets format
  const parseDate = (dateCellValue) => {
    if (!dateCellValue) return null;
    
    // Check if it's a Date object format from Google Sheets (e.g., "Date(2025,2,18)")
    if (typeof dateCellValue === 'string' && dateCellValue.startsWith('Date(')) {
      try {
        // Extract date parts
        const dateParts = dateCellValue.replace('Date(', '').replace(')', '').split(',');
        if (dateParts.length >= 3) {
          const year = parseInt(dateParts[0]);
          // Google Sheets Date object is 0-indexed for months (0=Jan, 1=Feb, etc.)
          const month = parseInt(dateParts[1]) + 1;
          const day = parseInt(dateParts[2]);
          
          // Format as DD/MM/YYYY
          return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        }
      } catch (e) {
        console.error("Error parsing Google Sheets date:", e);
      }
    }
    
    // If it's already in DD/MM/YYYY format, return as is
    if (typeof dateCellValue === 'string' && 
        dateCellValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateCellValue;
    }
    
    // If it's a date string in another format, try to parse and convert
    try {
      const date = new Date(dateCellValue);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (e) {
      console.error("Failed to parse date:", dateCellValue);
    }
    
    // Return the original value if we couldn't parse the date
    return dateCellValue;
  };

  // Function to toggle row edit mode
  const toggleRowEditMode = (bookingId) => {
    setEditableRows(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  // Function to handle input change in editable row
  const handleInputChange = (bookingId, fieldId, value) => {
    setEditedData(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        [fieldId]: value
      }
    }));
  };

  // Function to handle row save
  const handleSaveRow = async (bookingId) => {
    try {
      // Get the edited booking data
      const booking = editedData[bookingId];
      
      // Find the serial number column (column 2)
      const serialNumberHeader = tableHeaders.find((header, index) => index === 1);
      if (!serialNumberHeader) {
        throw new Error("Could not find serial number column");
      }
      
      const serialNumber = booking[serialNumberHeader.id];
      if (!serialNumber) {
        throw new Error("No serial number found for this booking");
      }
      
      // Set saving state for this row
      setSavingRows(prev => ({
        ...prev,
        [bookingId]: true
      }));
      
      const rowIndex = booking._rowIndex;
      if (!rowIndex) {
        throw new Error("Could not determine the row index for this booking");
      }
      
      console.log(`Updating booking with serial number ${serialNumber} at row ${rowIndex}`);
      
      // Create row data for all columns
      const rowData = [];
      tableHeaders.forEach((header) => {
        // Get the value from editedData
        let value = booking[header.id];
        
        // For amount/price fields, remove the $ if present
        if (header.label.toLowerCase().includes('amount') || 
            header.label.toLowerCase().includes('price') || 
            header.label.toLowerCase().includes('cost')) {
          if (value && typeof value === 'string' && value.startsWith('$')) {
            value = value.substring(1);
          }
        }
        
        rowData.push(value || '');
      });
      
      // Log the data we're about to send
      console.log("Sending data to Google Apps Script:", {
        sheetName: sheetName,
        action: 'update',
        rowIndex: rowIndex,
        rowData: rowData
      });
      
      // Create a FormData object
      const formData = new FormData();
      formData.append('sheetName', sheetName);
      formData.append('action', 'update');
      formData.append('rowIndex', rowIndex.toString());
      formData.append('rowData', JSON.stringify(rowData));
      
      // Make the request
      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: formData
      });
      
      console.log("Response status:", response.status);
      
      // Check if response was successful
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Try to get the response text (might fail in no-cors mode)
      try {
        const responseText = await response.text();
        console.log("Response text:", responseText);
      } catch (e) {
        console.log("Could not read response text");
      }
      
      console.log("Booking saved successfully");
      
      // Update the bookings state with the edited data
      setBookings(prev => 
        prev.map(b => 
          b._id === bookingId ? {...booking} : b
        )
      );
      
      // Turn off edit mode for this row
      setEditableRows(prev => ({
        ...prev,
        [bookingId]: false
      }));
      
      // Show success notification
      setNotification({
        show: true,
        message: "Booking updated successfully!",
        type: "success"
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
      
    } catch (error) {
      console.error("Error updating booking:", error);
      
      // Show error notification
      setNotification({
        show: true,
        message: `Failed to update booking: ${error.message}`,
        type: "error"
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 5000);
    } finally {
      // Reset saving state for this row
      setSavingRows(prev => ({
        ...prev,
        [bookingId]: false
      }));
    }
  };

  // Fetch Google Sheet data when component mounts
  useEffect(() => {
    const fetchGoogleSheetData = async () => {
      try {
        setLoading(true);
        console.log("Starting to fetch Google Sheet data...");
  
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
      
        const text = await response.text();
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        const jsonString = text.substring(jsonStart, jsonEnd + 1);
        const data = JSON.parse(jsonString);
  
        if (!data.table || !data.table.cols || data.table.cols.length === 0) {
          setError("No data found in the sheet");
          setLoading(false);
          return;
        }

        // Process headers
        let headers = [];
        let allRows = data.table.rows || [];

        if (data.table.cols && data.table.cols.some(col => col.label)) {
          headers = data.table.cols.map((col, index) => ({
            id: `col${index}`,
            label: col.label || `Column ${index + 1}`,
            type: col.type || 'string',
            originalIndex: index
          }));
        } else if (allRows.length > 0 && allRows[0].c && allRows[0].c.some(cell => cell && cell.v)) {
          headers = allRows[0].c.map((cell, index) => ({
            id: `col${index}`,
            label: cell && cell.v ? String(cell.v) : `Column ${index + 1}`,
            type: data.table.cols[index]?.type || 'string',
            originalIndex: index
          }));
          allRows = allRows.slice(1);
        }

        setTableHeaders(headers);
        
        // Process rows data
        const bookingsData = allRows
          .filter((row) => {
            // Skip rows with no data
            return row.c && row.c.some((cell) => cell && cell.v);
          })
          .map((row, rowIndex) => {
            const bookingData = {
              _id: Math.random().toString(36).substring(2, 15),
              _rowIndex: rowIndex + 2, // +2 for header row and 1-indexing
            };
            
            row.c && row.c.forEach((cell, index) => {
              const header = headers[index];
              
              // Handle date values
              if (cell && cell.v && cell.v.toString().indexOf('Date') === 0) {
                bookingData[header.id] = parseDate(cell.v);
              } else {
                // Handle non-date values
                bookingData[header.id] = cell ? cell.v : '';
                
                if (header.type === 'number' && !isNaN(bookingData[header.id])) {
                  bookingData[header.id] = Number(bookingData[header.id]).toLocaleString();
                }
              }
            });

            return bookingData;
          });

        console.log("Bookings data fetched:", bookingsData);
        setBookings(bookingsData);
        
        // Initialize state objects
        const initialStates = {};
        bookingsData.forEach(booking => {
          initialStates[booking._id] = false;
        });
        setSavingRows({...initialStates});
        setEditableRows({...initialStates});
        
        // Initialize edited data with original values
        const initialEditedData = {};
        bookingsData.forEach(booking => {
          initialEditedData[booking._id] = {...booking};
        });
        setEditedData(initialEditedData);
        
        setLoading(false);
        
      } catch (error) {
        console.error("Error fetching Google Sheet data:", error);
        setError("Failed to load bookings data");
        setLoading(false);
      }
    };
  
    fetchGoogleSheetData();
  }, []);

  // Find status column for filtering
  const statusHeader = tableHeaders.find(header => 
    header.label.toLowerCase().includes('status') ||
    header.label.toLowerCase().includes('state')
  );
  
  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "all") return true;
    
    // Use the status field from the dynamically found header
    if (statusHeader) {
      const status = booking[statusHeader.id];
      return status && status.toLowerCase().replace(/\s+/g, "-") === activeTab;
    }
    
    return true;
  });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6">
      {/* Header section */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Bookings</h1>
          <p className="text-gray-400">Manage all your service bookings in one place</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <button
              className="inline-flex w-full justify-between items-center rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700"
              onClick={() => setCalendarOpen(!calendarOpen)}
            >
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP")}
              </div>
            </button>
            {calendarOpen && (
              <div className="absolute z-10 mt-1 w-auto rounded-md border border-gray-700 bg-gray-900 p-4 shadow-lg">
                {/* Simple calendar UI */}
                <div className="grid grid-cols-7 gap-1">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div key={day} className="text-center text-xs text-gray-400">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <button
                      key={day}
                      className={`rounded-md p-1 text-center text-sm ${
                        day === date.getDate() ? "bg-blue-600 text-white" : "hover:bg-gray-800 text-gray-300"
                      }`}
                      onClick={() => {
                        const newDate = new Date(date)
                        newDate.setDate(day)
                        setDate(newDate)
                        setCalendarOpen(false)
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> New Booking
          </button>
        </div>
      </motion.div>

      {/* Bookings List */}
      <motion.div variants={itemVariants} className="w-full">
        <div className="rounded-lg border border-gray-800 bg-gray-900">
          {/* Booking header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Bookingsssss for {format(date, "MMMM d, yyyy")}</h2>
                <p className="text-sm text-gray-400">Manage your bookings and appointments</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search bookings..."
                    className="rounded-md border border-gray-700 bg-gray-800 pl-8 pr-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none w-full sm:w-[200px]"
                  />
                </div>
                <button className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 p-2 text-gray-300 hover:bg-gray-700">
                  <Filter className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="p-6">
            {/* Status filter tabs */}
            <div className="flex border-b border-gray-800 mb-6">
              <button
                className={`px-4 py-2 font-medium text-sm ${activeTab === "all" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
                onClick={() => setActiveTab("all")}
              >
                All
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${activeTab === "pending" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
                onClick={() => setActiveTab("pending")}
              >
                Pending
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${activeTab === "in-progress" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
                onClick={() => setActiveTab("in-progress")}
              >
                In Progress
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${activeTab === "completed" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
                onClick={() => setActiveTab("completed")}
              >
                Completed
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${activeTab === "scheduled" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
                onClick={() => setActiveTab("scheduled")}
              >
                Scheduled
              </button>
            </div>

            {/* Data table or loading/error states */}
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="border-t-2 border-b-2 border-blue-500 rounded-full h-8 w-8 animate-spin"></div>
              </div>
            ) : error ? (
              <div className="bg-red-900/20 p-4 rounded-md text-red-400 text-center">
                {error}
              </div>
            ) : (
              <div className="border border-gray-800 overflow-hidden rounded-md">
                <div className="bg-gray-900" style={{ height: "calc(100vh - 380px)", overflow: "auto" }}>
                  <table className="w-full border-collapse bg-gray-900">
                    <thead className="bg-gray-900 sticky top-0 z-10">
                      <tr className="border-b border-gray-800">
                        {/* Checkbox column */}
                        <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-900">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        {/* Dynamic headers from Google Sheet */}
                        {tableHeaders.map((header) => (
                          <th 
                            key={header.id} 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-900 whitespace-nowrap"
                          >
                            {header.label}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-900 sticky right-0">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900">
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                          <tr key={booking._id} className={`border-b border-gray-800 ${editableRows[booking._id] ? 'bg-gray-800' : 'bg-gray-900'}`}>
                            {/* Checkbox cell */}
                            <td className="w-12 px-4 py-4 whitespace-nowrap text-center">
                              <input
                                type="checkbox"
                                checked={editableRows[booking._id] || false}
                                onChange={() => toggleRowEditMode(booking._id)}
                                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            {tableHeaders.map((header, index) => {
                              // Special handling for status column
                              if (header.label.toLowerCase().includes('status')) {
                                return (
                                  <td key={header.id} className="px-4 py-4 whitespace-nowrap">
                                    {editableRows[booking._id] ? (
                                      <select
                                        value={editedData[booking._id][header.id] || ""}
                                        onChange={(e) => handleInputChange(booking._id, header.id, e.target.value)}
                                        className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
                                      >
                                        <option value="Completed">Completed</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Scheduled">Scheduled</option>
                                      </select>
                                    ) : (
                                      <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                                        ${booking[header.id]?.toLowerCase() === "completed" ? "bg-green-900/50 text-green-400" : ""}
                                        ${booking[header.id]?.toLowerCase() === "in progress" ? "bg-blue-900/50 text-blue-400" : ""}
                                        ${booking[header.id]?.toLowerCase() === "pending" ? "bg-yellow-900/50 text-yellow-400" : ""}
                                        ${booking[header.id]?.toLowerCase() === "scheduled" ? "bg-purple-900/50 text-purple-400" : ""}
                                      `}
                                      >
                                        {booking[header.id] || "Unknown"}
                                      </span>
                                    )}
                                  </td>
                                );
                              }
                              
                              // Special handling for price/amount column
                              if (header.label.toLowerCase().includes('amount') || 
                                  header.label.toLowerCase().includes('price') || 
                                  header.label.toLowerCase().includes('cost')) {
                                return (
                                  <td key={header.id} className="px-4 py-4 whitespace-nowrap text-sm text-blue-400">
                                    {editableRows[booking._id] ? (
                                      <input
                                        type="text"
                                        value={editedData[booking._id][header.id] || ""}
                                        onChange={(e) => handleInputChange(booking._id, header.id, e.target.value)}
                                        className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-blue-400 focus:border-blue-500 focus:outline-none"
                                      />
                                    ) : (
                                      booking[header.id] ? `$${booking[header.id]}` : '-'
                                    )}
                                  </td>
                                );
                              }
                              
                              // Special handling for date column
                              if (header.label.toLowerCase().includes('date')) {
                                return (
                                  <td key={header.id} className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {editableRows[booking._id] ? (
                                      <input
                                        type="text"
                                        value={editedData[booking._id][header.id] || ""}
                                        onChange={(e) => handleInputChange(booking._id, header.id, e.target.value)}
                                        className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
                                      />
                                    ) : (
                                      booking[header.id] || ''
                                    )}
                                  </td>
                                );
                              }
                              
                              // Special handling for ID column - first column should be in bold white (non-editable)
                              if (index === 0) {
                                return (
                                  <td key={header.id} className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                                    {booking[header.id]}
                                  </td>
                                );
                              }

                              // Special handling for serial number column (column 2) - also non-editable
                              if (index === 1) {
                                return (
                                  <td key={header.id} className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {booking[header.id] || ''}
                                  </td>
                                );
                              }
                              
                              // Default rendering for other columns
                              return (
                                <td key={header.id} className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {editableRows[booking._id] ? (
                                    <input
                                      type="text"
                                      value={editedData[booking._id][header.id] || ""}
                                      onChange={(e) => handleInputChange(booking._id, header.id, e.target.value)}
                                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
                                    />
                                  ) : (
                                    booking[header.id] || ''
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-4 whitespace-nowrap text-right sticky right-0 bg-gray-900">
                              <button 
                                className={`px-3 py-1 text-white text-sm font-medium rounded-md flex items-center justify-center w-20 ${
                                  editableRows[booking._id] 
                                    ? "bg-blue-600 hover:bg-blue-700" 
                                    : "bg-gray-600 cursor-not-allowed"
                                }`}
                                onClick={() => handleSaveRow(booking._id)}
                                disabled={!editableRows[booking._id] || savingRows[booking._id]}
                              >
                                {savingRows[booking._id] ? (
                                  <>
                                    <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-1"></div>
                                    Saving...
                                  </>
                                ) : (
                                  'Save'
                                )}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={tableHeaders.length + 2} className="px-4 py-4 text-center text-gray-400">
                            No bookings found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination controls */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-400">
                Showing <strong>1-{filteredBookings.length}</strong> of <strong>{filteredBookings.length}</strong>{" "}
                records
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                  disabled
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </button>
                <button className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700">
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
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
              <div className="text-green-600 mr-3">✓</div>
            ) : (
              <div className="text-red-600 mr-3">⚠</div>
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
    </motion.div>
  )
}