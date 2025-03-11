"use client"

import { useState, useEffect } from "react"
import { Calendar, CheckCircle, XCircle, Users, X, Save, Edit, AlertCircle, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const StaffAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tableHeaders, setTableHeaders] = useState([])
  const [tableData, setTableData] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absentOrLate: 0
  })
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "" // "success" or "error"
  })

  // Google Sheet Details
  const sheetId = '1Kb-fhC1yiFJCyPO7TJDqnu-lQ1n1H6mLErlkSPc6yHc'
  const sheetName = 'Staff Attendance'
  
  // Google Apps Script Web App URL - REPLACE THIS WITH YOUR DEPLOYED SCRIPT URL
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbyhmDsXWRThVsJCfAirTsI3o9EGE-oCcw2HKz1ERe4qxNWfcVoxMUr3sGa6yHJm-ckt/exec'

  useEffect(() => {
    const fetchGoogleSheetData = async () => {
      try {
        setLoading(true)
        console.log("Starting to fetch Staff Attendance data...")
        
        // Create URL to fetch the sheet in JSON format (this method works for public sheets)
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
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
        
        // Extract headers from cols, filter to only include columns B to G (indexes 1-6)
        const headers = data.table.cols
          .slice(0, 7) // Columns B to G (indexes 1-6)
          .map(col => ({
            id: col.id,
            label: col.label || col.id,
            type: col.type
          }))
          .filter(header => header.label) // Filter out empty headers

          
        
        setTableHeaders(headers)
        
        // Extract and transform data rows, only keeping columns B to G
        const rowsData = data.table.rows.map((row, rowIndex) => {
          const rowData = { 
            id: rowIndex + 1,
            _rowIndex: rowIndex + 2 // +2 because Google Sheets is 1-indexed and we have a header row
          }
          
          // Process only cells B to G (indexes 1-6)
          row.c && row.c.slice(0, 7).forEach((cell, cellIndex) => {
            if (cellIndex < headers.length) {
              const header = headers[cellIndex]
              
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
            }
          })
          
          return rowData
        }).filter(row => Object.keys(row).length > 1) // Filter out rows with no useful data
        
        setTableData(rowsData)
        
        // Find attendance column - look for a column with "attendance" in its label
        const attendanceColumnIndex = headers.findIndex(header => 
          header.label.toLowerCase().includes('attendance')
        );
        
        // If attendance column found, use its ID, otherwise try to look for a status column,
        // or default to the fifth column (index 5, which is column F in spreadsheet)
        let statusColumnId;
        if (attendanceColumnIndex !== -1) {
          statusColumnId = headers[attendanceColumnIndex].id;
          console.log("Found Attendance column:", headers[attendanceColumnIndex].label);
        } else {
          // Try to find a status column as fallback
          const statusColumnIndex = headers.findIndex(header => 
            header.label.toLowerCase().includes('status')
          );
          
          if (statusColumnIndex !== -1) {
            statusColumnId = headers[statusColumnIndex].id;
            console.log("Found Status column:", headers[statusColumnIndex].label);
          } else if (headers[5]) {
            // Default to column F (index 5) if no other column is found
            statusColumnId = headers[5].id;
            console.log("Defaulting to column F:", headers[5].label);
          } else {
            // Last resort fallback
            statusColumnId = headers[headers.length - 1]?.id;
            console.log("Falling back to last column:", headers[headers.length - 1]?.label);
          }
        }
        
        console.log("Status column identified:", statusColumnId);
        
        if (statusColumnId) {
          // Debug log raw status values to see what we're working with
          console.log("Status values:", rowsData.map(row => {
            return {
              raw: row[statusColumnId],
              formatted: row[`${statusColumnId}_formatted`]
            };
          }));
          
          // Count present staff - Much more verbose debugging
          let presentCount = 0;
          let absentCount = 0;
          
          rowsData.forEach(row => {
            const rawStatus = row[statusColumnId];
            const formattedStatus = row[`${statusColumnId}_formatted`];
            
            console.log("Processing row:", row.id);
            console.log("  - Raw status:", rawStatus);
            console.log("  - Formatted status:", formattedStatus);
            
            // Check for "present" with explicit case-insensitive comparison
            const isPresent = 
              (rawStatus && String(rawStatus).toLowerCase().trim() === "present") ||
              (formattedStatus && String(formattedStatus).toLowerCase().trim() === "present");
            
            // Check for "absent" with explicit case-insensitive comparison  
            const isAbsent = 
              (rawStatus && String(rawStatus).toLowerCase().trim() === "absent") ||
              (formattedStatus && String(formattedStatus).toLowerCase().trim() === "absent");
              
            console.log("  - Is present?", isPresent);
            console.log("  - Is absent?", isAbsent);
            
            if (isPresent) presentCount++;
            if (isAbsent) absentCount++;
          });
          
          console.log("FINAL Stats calculation: Total =", rowsData.length, 
                      "Present =", presentCount, 
                      "Absent =", absentCount);
          
          setStats({
            total: rowsData.length,
            present: presentCount,
            absentOrLate: absentCount
          });
        } else {
          setStats({
            total: rowsData.length,
            present: 0,
            absentOrLate: 0
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching Google Sheet data:", error);
        setError("Failed to load staff attendance data");
        setLoading(false);
      }
    }

    fetchGoogleSheetData();
  }, [date]); // Refetch when date changes

  // Function to handle edit button click
  const handleEditClick = (record) => {
    console.log("Editing record:", record);
    
    // Create a copy of the record for editing
    const recordToEdit = { ...record };
    
    // Debug: Log headers to see what's available
    console.log("Table headers:", tableHeaders);
    
    // Format any date fields for the form
    tableHeaders.forEach(header => {
      console.log("Processing header:", header.label, "with id:", header.id);
      
      // Check if this is the status field (for debugging)
      if (header.label.toLowerCase().includes('status')) {
        console.log("Found status field:", header.label, "with value:", recordToEdit[header.id]);
      }
      
      if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
        if (recordToEdit[header.id]) {
          try {
            let dateValue = recordToEdit[header.id];
            
            // Try to format as YYYY-MM-DD for date input
            if (typeof dateValue === 'string' && dateValue.includes('/')) {
              const dateParts = dateValue.split('/');
              if (dateParts.length === 3) {
                const day = parseInt(dateParts[0], 10).toString().padStart(2, '0');
                const month = parseInt(dateParts[1], 10).toString().padStart(2, '0');
                const year = parseInt(dateParts[2], 10);
                
                // Format as YYYY-MM-DD
                recordToEdit[header.id] = `${year}-${month}-${day}`;
              }
            } else if (typeof dateValue === 'string' && dateValue.includes('-')) {
              // Already in YYYY-MM-DD format
              recordToEdit[header.id] = dateValue;
            } else if (typeof dateValue === 'object' && dateValue instanceof Date) {
              // It's a Date object
              const year = dateValue.getFullYear();
              const month = (dateValue.getMonth() + 1).toString().padStart(2, '0');
              const day = dateValue.getDate().toString().padStart(2, '0');
              
              recordToEdit[header.id] = `${year}-${month}-${day}`;
            } else if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
              // Handle Google Sheets date format: Date(year,month,day)
              const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateValue);
              if (match) {
                const year = parseInt(match[1], 10);
                const month = (parseInt(match[2], 10) + 1).toString().padStart(2, '0'); // Convert from 0-indexed to 1-indexed month
                const day = parseInt(match[3], 10).toString().padStart(2, '0');
                
                // Convert to YYYY-MM-DD for the date input
                recordToEdit[header.id] = `${year}-${month}-${day}`;
              }
            }
          } catch (error) {
            console.error("Error formatting date for edit:", error);
          }
        }
      }
    });
    
    // Log the record that will be edited (for debugging)
    console.log("Record to edit after processing:", recordToEdit);
    
    // Set the record to be edited
    setEditingRecord(recordToEdit);
    
    // Show the edit form
    setShowEditForm(true);
  };

  // Handle input change for edit form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingRecord(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format a date for the Google Sheet (DD/MM/YYYY)
  const formatDateForSheet = (value) => {
    if (!value) return '';
    
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      // Return the formatted date without the quote prefix
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      return value;
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Format any date values for the sheet
      const formattedRecord = { ...editingRecord };
      
      // Find date fields and format them
      tableHeaders.forEach(header => {
        if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
          if (formattedRecord[header.id]) {
            console.log(`Formatting date field: ${header.label} from:`, formattedRecord[header.id]);
            formattedRecord[header.id] = formatDateForSheet(formattedRecord[header.id]);
            console.log(`Formatted to:`, formattedRecord[header.id]);
          }
        }
      });
      
      // Get the row index for updating in the sheet
      const rowIndex = formattedRecord._rowIndex;
      
      if (!rowIndex) {
        throw new Error("Could not determine the row index for updating this record");
      }
      
      // Prepare data array for the sheet
      // We need to map our form values back to the sheet columns
      const rowData = Array(7).fill('');  // 7 columns to match the column count in the sheet
      
      // Map form values to the appropriate columns
      tableHeaders.forEach((header, index) => {
        rowData[index] = formattedRecord[header.id] || '';
      });
      
      console.log("Prepared row data for update:", rowData);
      console.log("Row index to update:", rowIndex);
      
      // Use FormData for compatibility with Google Apps Script
      const formData = new FormData();
      formData.append('sheetName', sheetName);
      formData.append('rowData', JSON.stringify(rowData));
      formData.append('rowIndex', rowIndex);
      formData.append('action', 'update'); // Specify that this is an update operation
      
      console.log("Submitting update to Google Apps Script...");
      
      // Make the fetch request with no-cors mode
      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });
      
      console.log("Update submitted successfully");
      
      // Update the record in the local state
      setTableData(prev => {
        return prev.map(record => {
          if (record.id === formattedRecord.id) {
            const updatedRecord = { ...record };
            
            // Update all fields
            tableHeaders.forEach((header, index) => {
              updatedRecord[header.id] = rowData[index];
              
              // For date fields, also set the formatted version
              if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
                updatedRecord[`${header.id}_formatted`] = rowData[index];
              }
            });
            
            return updatedRecord;
          }
          return record;
        });
      });
      
      // Recalculate stats based on status updates
      // First look for attendance column
      const attendanceColumnIndex = tableHeaders.findIndex(header => 
        header.label.toLowerCase().includes('attendance')
      );
      
      // If not found, try status column, or default to column F (index 5)
      let statusColumnIndex = attendanceColumnIndex;
      if (statusColumnIndex === -1) {
        statusColumnIndex = tableHeaders.findIndex(header => 
          header.label.toLowerCase().includes('status')
        );
      }
      if (statusColumnIndex === -1 && tableHeaders.length > 5) {
        // Default to column F (index 5)
        statusColumnIndex = 5;
      }
      
      if (statusColumnIndex !== -1) {
        const statusColumnId = tableHeaders[statusColumnIndex].id;
        
        // Count with more verbose approach
        let presentCount = 0;
        let absentCount = 0;
        
        tableData.forEach(row => {
          // Use updated status if this is the row being edited
          let status;
          let formattedStatus;
          
          if (row.id === formattedRecord.id) {
            status = formattedRecord[statusColumnId];
            formattedStatus = formattedRecord[`${statusColumnId}_formatted`];
          } else {
            status = row[statusColumnId];
            formattedStatus = row[`${statusColumnId}_formatted`];
          }
          
          console.log(`Checking row ${row.id} with status "${status}" and formatted "${formattedStatus}"`);
          
          // Check both raw and formatted value with explicit case-insensitive comparison
          const isPresent = 
            (status && String(status).toLowerCase().trim() === "present") ||
            (formattedStatus && String(formattedStatus).toLowerCase().trim() === "present");
          
          const isAbsent = 
            (status && String(status).toLowerCase().trim() === "absent") ||
            (formattedStatus && String(formattedStatus).toLowerCase().trim() === "absent");
          
          console.log(`  - Is present? ${isPresent}, Is absent? ${isAbsent}`);
          
          if (isPresent) presentCount++;
          if (isAbsent) absentCount++;
        });
        
        console.log("Updated stats: Total =", tableData.length, 
                     "Present =", presentCount, 
                     "Absent =", absentCount);
        
        setStats({
          total: tableData.length,
          present: presentCount,
          absentOrLate: absentCount
        });
      }
      
      // Close the form
      setShowEditForm(false);
      
      // Show success notification
      setNotification({
        show: true,
        message: "Staff attendance record updated successfully!",
        type: "success"
      });
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error updating staff attendance record:", error);
      // Show error notification
      setNotification({
        show: true,
        message: `Failed to update record: ${error.message}`,
        type: "error"
      });
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 5000);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Generate appropriate input field based on header type
  const renderFormField = (header) => {
    console.log("Rendering field for:", header.label, "with id:", header.id);
    
    // For date fields
    if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
      return (
        <input
          type="date"
          id={`edit-${header.id}`}
          name={header.id}
          value={editingRecord[header.id] || ''}
          onChange={handleEditInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring focus:ring-pink-500 focus:ring-opacity-50"
          required
        />
      );
    }
    
    // For status/attendance field - look for common variations in the field name
    if (
      header.label.toLowerCase().includes('status') || 
      header.label.toLowerCase().includes('attendance') ||
      header.id.toLowerCase().includes('status') || 
      header.id.toLowerCase().includes('attendance') ||
      header === tableHeaders[5] // Check if this is column F (index 5)
    ) {
      console.log("Rendering status dropdown for:", header.label);
      return (
        <select
          id={`edit-${header.id}`}
          name={header.id}
          value={editingRecord[header.id] || ''}
          onChange={handleEditInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring focus:ring-pink-500 focus:ring-opacity-50"
          required
        >
          <option value="">Select Status</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          {/* Removed the "Late" option as requested */}
        </select>
      );
    }
    
    // Default to text input for all other fields
    return (
      <input
        type="text"
        id={`edit-${header.id}`}
        name={header.id}
        value={editingRecord[header.id] || ''}
        onChange={handleEditInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring focus:ring-pink-500 focus:ring-opacity-50"
      />
    );
  };
  

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Staff Attendance</h2>
        <div className="mt-4 md:mt-0 flex items-center">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
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
            <p className="text-2xl font-bold text-gray-800">{stats.absentOrLate}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-pink-600">Loading staff attendance data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
          {error} <button className="underline ml-2" onClick={() => window.location.reload()}>Try again</button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">Staff Attendance Log</h3>
          </div>
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
              {tableData.length > 0 ? (
                tableData.map((row) => (
                  <tr key={row.id}>
                    {tableHeaders.map((header) => {
                      // Special handling for status column
                      if (header.label.toLowerCase().includes('status')) {
                        // Get status from either raw or formatted value
                        const status = row[`${header.id}_formatted`] || row[header.id];
                        let statusClass = 'bg-gray-100 text-gray-800';
                        
                        if (status) {
                          const statusLower = status.toString().toLowerCase();
                          if (statusLower === 'present') {
                            statusClass = 'bg-green-100 text-green-800';
                          } else if (statusLower === 'absent') {
                            statusClass = 'bg-red-100 text-red-800';
                          }
                        }
                        
                        return (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}
                            >
                              {status || 'Unknown'}
                            </span>
                          </td>
                        );
                      }
                      
                      // For staff member/name columns that might include an image
                      if (header.label.toLowerCase().includes('name') || 
                          header.label.toLowerCase().includes('staff')) {
                        return (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {/* Render image container only if an image exists */}
                              {row.imageUrl && (
                                <div className="h-10 w-10 rounded-full overflow-hidden">
                                  <img
                                    src={row.imageUrl}
                                    alt={row[header.id] || 'Staff'}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              <div className={row.imageUrl ? "ml-4" : ""}>
                                <div className="text-sm font-medium text-gray-900">
                                  {row[header.id] || ''}
                                </div>
                              </div>
                            </div>
                          </td>
                        );
                      }
                      
                      // Default cell rendering - Use formatted value if available (especially for dates)
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {row[`${header.id}_formatted`] || row[header.id] || ''}
                          </div>
                        </td>
                      );
                    })}
                    
                    {/* Actions column - with edit button functionality */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="text-pink-600 hover:text-pink-900 mr-3"
                        onClick={() => handleEditClick(row)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={tableHeaders.length + 1} className="px-6 py-4 text-center text-gray-500">
                    No staff attendance data found
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for editing staff attendance */}
      <AnimatePresence>
        {showEditForm && (
          <motion.div
            key="edit-attendance-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Update Staff Attendance</h3>
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
                        <label htmlFor={`edit-${header.id}`} className="block text-sm font-medium text-gray-700">
                          {header.label}
                        </label>
                        {renderFormField(header)}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                          Update Attendance
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
      
      {/* Notification popup */}
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
    </div>
  );
};

export default StaffAttendance;