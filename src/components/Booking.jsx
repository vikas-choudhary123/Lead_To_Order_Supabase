"use client"

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, User, Search, Plus, X, Save, Edit, CheckCircle2, AlertCircle, History } from "lucide-react"
import { useAuth } from "../Context/AuthContext.jsx" // Import the useAuth hook

const Booking = ({ hideHistoryButton = false }) => {
  const { user } = useAuth(); // Get the user data from AuthContext
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tableHeaders, setTableHeaders] = useState([])
  const [appointments, setAppointments] = useState([])
  const [allAppointments, setAllAppointments] = useState([]) // Store all appointments including past ones
  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    totalClients: 0
  })
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false)
  const [showEditAppointmentForm, setShowEditAppointmentForm] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false) // New state for history modal
  const [newAppointment, setNewAppointment] = useState({})
  const [editingAppointment, setEditingAppointment] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "" // "success" or "error"
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [historySearchTerm, setHistorySearchTerm] = useState("") // Search term for history modal

  // Google Sheet Details
  const sheetId = '1Kb-fhC1yiFJCyPO7TJDqnu-lQ1n1H6mLErlkSPc6yHc'
  const sheetName = 'Booking DB'
  
  // Google Apps Script Web App URL - REPLACE THIS WITH YOUR DEPLOYED SCRIPT URL
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbyhmDsXWRThVsJCfAirTsI3o9EGE-oCcw2HKz1ERe4qxNWfcVoxMUr3sGa6yHJm-ckt/exec'

  useEffect(() => {
    const fetchGoogleSheetData = async () => {
      try {
        setLoading(true);
        console.log("Starting to fetch Google Sheet data...");
        console.log("Current user data:", user); // Debug: Log user data
        
        // Create URL to fetch the sheet in JSON format (this method works for public sheets)
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
        console.log("Fetching from URL:", url);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        // Extract the JSON part from the response (Google returns a weird format)
        const text = await response.text();
        // The response is like: google.visualization.Query.setResponse({...})
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        const jsonString = text.substring(jsonStart, jsonEnd + 1);
        const data = JSON.parse(jsonString);
        
        // Extract headers from cols
        const headers = data.table.cols.map(col => ({
          id: col.id,
          label: col.label || col.id,
          type: col.type
        })).filter(header => header.label); // Filter out empty headers
        
        setTableHeaders(headers);
        
        // Initialize new appointment object with empty values for all headers
        const emptyAppointment = {};
        headers.forEach(header => {
          emptyAppointment[header.id] = '';
        });
        setNewAppointment(emptyAppointment);
        
        // Calculate today's date for comparison
        const today = new Date();
        const todayMonth = today.getMonth(); // JS months are 0-indexed (0-11)
        const todayDay = today.getDate();
        const todayYear = today.getFullYear();
        today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison
        
        console.log(`Today is ${todayDay}/${todayMonth+1}/${todayYear} (d/m/yyyy format)`);
        
        // Extract and transform data rows with safer handling
        const rowsData = data.table.rows.map((row, rowIndex) => {
          const rowData = {};
          
          // Add an internal unique ID
          rowData._id = Math.random().toString(36).substring(2, 15);
          
          // Store the row index from the Google Sheet for update operations
          rowData._rowIndex = rowIndex + 2; // +2 because Google Sheets is 1-indexed and we have a header row
          
          // Process each cell carefully
          row.c && row.c.forEach((cell, index) => {
            if (index < headers.length) {
              const header = headers[index];
              
              // Handle null or undefined cell
              if (!cell) {
                rowData[header.id] = '';
                return;
              }
              
              // Get the value, with fallbacks
              const value = cell.v !== undefined && cell.v !== null ? cell.v : '';
              rowData[header.id] = value;
              
              // Store formatted version if available
              if (cell.f) {
                rowData[`${header.id}_formatted`] = cell.f;
              }
              
              // Special handling for dates
              if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
                if (cell.f) {
                  // Use the formatted date string if available
                  rowData[`${header.id}_formatted`] = cell.f;
                } else if (value) {
                  try {
                    // Try to format the date value
                    const dateObj = new Date(value);
                    if (!isNaN(dateObj.getTime())) {
                      rowData[`${header.id}_formatted`] = dateObj.toLocaleDateString();
                    }
                  } catch (e) {
                    console.log("Date formatting error:", e);
                  }
                }
              }
            }
          });
          return rowData;
        }).filter(row => Object.keys(row).length > 1); // Filter out empty rows (more than just _id)
        
        // Store all appointments including past ones
        setAllAppointments(rowsData);
        
        // Column F (index 5) is the date column we need to check
        const columnF = 5;
        const dateColumnId = headers[columnF]?.id;
        
        console.log("Using date column F with id:", dateColumnId);
        
        if (!dateColumnId) {
          console.error("Column F not found in headers");
        }
        
        // Find the staff name column index (column I - index 8)
        const staffNameColumnIndex = 8;
        const staffNameColumnId = headers[staffNameColumnIndex]?.id;
        
        console.log("Using staff name column I with id:", staffNameColumnId);
        
        // Debug: Log staff names in the data
        if (user?.role === "staff") {
          const staffNames = rowsData.map(row => row[staffNameColumnId] || "").filter(Boolean);
          console.log("All staff names in data:", [...new Set(staffNames)]);
          console.log("User's staff name:", user.staffName);
        }
        if (user) {
          console.log("Dashboard - Current user:", user);
          console.log("Is admin?", user.role === "admin");
          console.log("Is staff?", user.role === "staff");
          console.log("Staff name:", user.staffName);
        }
        
        // Filter out past appointments and if user is staff, only show their appointments
        const filteredRowsData = rowsData.filter(row => {
          try {
            // Skip if no date column found or no value in the cell
            if (!dateColumnId || !row[dateColumnId]) return false;
            
            // Get the date value from column F
            const dateValue = row[dateColumnId];
            
            // Handle DD/MM/YYYY format (like 8/3/2025)
            if (typeof dateValue === 'string') {
              // Try parsing with regex to handle various formats
              const dateParts = dateValue.split('/');
              if (dateParts.length === 3) {
                // Format: DD/MM/YYYY
                const day = parseInt(dateParts[0], 10);
                const month = parseInt(dateParts[1], 10) - 1; // Convert to 0-indexed month
                const year = parseInt(dateParts[2], 10);
                
                // Create appointment date object and reset time for comparison
                const appointmentDate = new Date(year, month, day);
                appointmentDate.setHours(0, 0, 0, 0);
                
                // Keep this appointment if it's today or in the future
                const isCurrentOrFutureDate = appointmentDate >= today;
                
                // In your filtering logic in Booking.jsx

// For staff users, only show their own appointments
// Find this section in Booking.jsx and replace it with this improved comparison code
// This should be around line 190-200

// Find this section in Booking.jsx and replace it with this improved comparison code
// This should be around line 190-200 in your Booking.jsx file

// Replace this section in your Booking.jsx file (around line 190-200)

// Replace this section in your Booking.jsx file (around line 190-200)

// For staff users, only show their own appointments
// For admin users, show ALL appointments
if (user?.role === "staff") {
  // Only apply staff filtering for staff members (not admins)
  // Appointment staff name from the booking sheet column I
  const staffNameInAppointment = (row[staffNameColumnId] || "").toString().trim().toLowerCase();
  
  // User identifiers from login data
  const userStaffName = (user.staffName || "").toString().trim().toLowerCase();
  const userName = (user.name || "").toString().trim().toLowerCase();
  const userEmail = (user.email || "").toString().trim().toLowerCase();
  
  // Debug output for tracking staff name matching
  console.log(`Comparing appointment staff: "${staffNameInAppointment}" with:`, {
    staffName: userStaffName,
    userId: userName,
    userEmail: userEmail
  });
  
  // Simple exact matching with case-insensitivity
  // This matches either the staffName (from column C), userId (from column A), or email
  const isMatch = 
    staffNameInAppointment === userStaffName ||
    staffNameInAppointment === userName ||
    staffNameInAppointment === userEmail;
  
  if (isMatch) {
    console.log(`✓ MATCH FOUND for appointment with staff: "${staffNameInAppointment}"`);
  } else {
    console.log(`✗ NO MATCH for appointment with staff: "${staffNameInAppointment}"`);
  }
  
  // Only keep appointments for this staff member that are current or future
  return isCurrentOrFutureDate && isMatch;
} else {
  // For admin users, show all current or future appointments
  // No staff filtering - return all appointments that meet the date criteria
  return isCurrentOrFutureDate;
}
                
                // For admin users, show all current or future appointments
                return isCurrentOrFutureDate;
              }
            }
            
            // Fallback to original Google Sheets date format check
            if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
              // Extract the year, month, day using regex
              const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateValue);
              if (match) {
                const year = parseInt(match[1], 10);
                const month = parseInt(match[2], 10); // Month is 0-indexed in JS Date
                const day = parseInt(match[3], 10);
                
                // Create appointment date object and reset time for comparison
                const appointmentDate = new Date(year, month, day);
                appointmentDate.setHours(0, 0, 0, 0);
                
                // Keep this appointment if it's today or in the future
                const isCurrentOrFutureDate = appointmentDate >= today;
                
                // For staff users, only show their own appointments
                if (user?.role === "staff" && staffNameColumnId) {
                  const staffName = (row[staffNameColumnId] || "").toString().trim();
                  const userStaffName = (user.staffName || "").toString().trim();
                  
                  // Try flexible matching
                  const exactMatch = staffName.toLowerCase() === userStaffName.toLowerCase();
                  const containsMatch = staffName.toLowerCase().includes(userStaffName.toLowerCase()) || 
                                       userStaffName.toLowerCase().includes(staffName.toLowerCase());
                  
                  const isStaffAppointment = exactMatch || containsMatch;
                  
                  // Only keep appointments for this staff member that are current or future
                  return isCurrentOrFutureDate && isStaffAppointment;
                }
                
                // For admin users, show all current or future appointments
                return isCurrentOrFutureDate;
              }
            }
            
            return false;
          } catch (error) {
            console.log("Date comparison error:", error);
            return false;
          }
        });
        
        console.log(`After filtering: ${filteredRowsData.length} appointments will be displayed`);
        
        // Set the filtered appointments
        setAppointments(filteredRowsData);
        
        // Count today's appointments (only those where column F has today's date)
        const todaysAppts = filteredRowsData.filter(row => {
          try {
            if (!dateColumnId || !row[dateColumnId]) return false;
            
            // Get the date value from the row
            const dateValue = row[dateColumnId];
            
            // Handle DD/MM/YYYY format
            if (typeof dateValue === 'string') {
              const dateParts = dateValue.split('/');
              if (dateParts.length === 3) {
                const day = parseInt(dateParts[0], 10);
                const month = parseInt(dateParts[1], 10) - 1; // Convert to 0-indexed month
                const year = parseInt(dateParts[2], 10);
                
                // Check if it's today
                const isToday = day === todayDay && month === todayMonth && year === todayYear;
                
                return isToday;
              }
            }
            
            // Fallback to Google Sheets date format
            if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
              const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateValue);
              if (match) {
                const year = parseInt(match[1], 10);
                const month = parseInt(match[2], 10); // Month is 0-indexed in JS Date
                const day = parseInt(match[3], 10);
                
                // Check if it's today
                const isToday = day === todayDay && month === todayMonth && year === todayYear;
                
                return isToday;
              }
            }
            
            return false;
          } catch (error) {
            console.log("Date comparison error:", error);
            return false;
          }
        }).length;
        
        // Count upcoming appointments (dates after today)
        const upcomingAppts = filteredRowsData.filter(row => {
          try {
            if (!dateColumnId || !row[dateColumnId]) return false;
            
            // Get the date value
            const dateValue = row[dateColumnId];
            
            // Handle DD/MM/YYYY format
            if (typeof dateValue === 'string') {
              const dateParts = dateValue.split('/');
              if (dateParts.length === 3) {
                const day = parseInt(dateParts[0], 10);
                const month = parseInt(dateParts[1], 10) - 1; // Convert to 0-indexed month
                const year = parseInt(dateParts[2], 10);
                
                // Create date objects for comparison
                const appointmentDate = new Date(year, month, day);
                const todayDate = new Date(todayYear, todayMonth, todayDay);
                
                // Reset time parts for accurate date comparison
                appointmentDate.setHours(0, 0, 0, 0);
                todayDate.setHours(0, 0, 0, 0);
                
                // Is this date in the future?
                const isFuture = appointmentDate > todayDate;
                
                return isFuture;
              }
            }
            
            // Fallback to Google Sheets date format
            if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
              const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateValue);
              if (match) {
                const year = parseInt(match[1], 10);
                const month = parseInt(match[2], 10); // Month is 0-indexed in JS Date
                const day = parseInt(match[3], 10);
                
                // Create date objects for comparison
                const appointmentDate = new Date(year, month, day);
                const todayDate = new Date(todayYear, todayMonth, todayDay);
                
                // Reset time parts for accurate date comparison
                appointmentDate.setHours(0, 0, 0, 0);
                todayDate.setHours(0, 0, 0, 0);
                
                // Is this date in the future?
                const isFuture = appointmentDate > todayDate;
                
                return isFuture;
              }
            }
            
            return false;
          } catch (error) {
            console.log("Date comparison error:", error);
            return false;
          }
        }).length;
        
        // Total clients count (for staff, only count their clients)
        const totalClients = user?.role === "staff" 
          ? filteredRowsData.length  // For staff, count only their filtered appointments
          : rowsData.length;         // For admin, count all appointments
        
        setStats({
          today: todaysAppts,
          upcoming: upcomingAppts,
          totalClients: totalClients
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching Google Sheet data:", error);
        setError("Failed to load appointment data");
        setLoading(false);
      }
    };
  
    fetchGoogleSheetData();
  }, [user]); // Add user to dependency array so it refetches when user changes


  // Modify the handleInputChange function to handle the 'New Appointment' button click
// Find the part where you set the initial newAppointment state and modify it

// Updated handleNewAppointmentClick function with fixes for both timestamp and serial number
const handleNewAppointmentClick = async () => {
  // Create a copy of the empty appointment template
  const emptyAppointment = {};
  tableHeaders.forEach(header => {
    emptyAppointment[header.id] = '';
  });
  
  // Find the timestamp field - IMPROVED to check for more possible matches
  const timestampHeader = tableHeaders.find(header => 
    header.label.toLowerCase().includes('timestamp') || 
    header.label.toLowerCase().includes('time stamp') ||
    (header.label.toLowerCase().includes('time') && header.label.toLowerCase().includes('stamp'))
  );
  
  console.log("Timestamp header found:", timestampHeader);
  
  // Find the serial number field
  const serialNoHeader = tableHeaders.find(header => 
    header.label.toLowerCase().includes('serial')
  );

  // Find the staff name field
  const staffNameHeader = tableHeaders.find(header => 
    (header.label.toLowerCase().includes('staff') && header.label.toLowerCase().includes('name'))
  );
  
  // For staff users, pre-fill their name in the staff name field
  if (staffNameHeader && user?.role === "staff" && user?.staffName) {
    emptyAppointment[staffNameHeader.id] = user.staffName;
  }
  
  // Set today's date in the timestamp field if found
  if (timestampHeader) {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    
    // Format date as DD/MM/YYYY to match the expected format in the app
    const todayFormatted = `${day}/${month}/${year}`;
    console.log("Setting timestamp to:", todayFormatted);
    
    // Set the timestamp in the appointment object
    emptyAppointment[timestampHeader.id] = todayFormatted;
  } else {
    console.warn("No timestamp field found in headers", tableHeaders);
    
    // Alternative approach: Check column A (index 0) which is typically the timestamp
    if (tableHeaders.length > 0) {
      const firstHeader = tableHeaders[0];
      console.log("Using first column as timestamp:", firstHeader);
      
      const today = new Date();
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      
      // Format date as DD/MM/YYYY
      const todayFormatted = `${day}/${month}/${year}`;
      emptyAppointment[firstHeader.id] = todayFormatted;
    }
  }
  
  // Fetch all serial numbers directly from the Google Sheet
  try {
    // Set loading state to indicate to the user that something is happening
    setSubmitting(true);
    
    // Fetch the entire sheet data to get all serial numbers (including past appointments)
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
    
    // Get all rows
    const rows = data.table.rows;
    
    // Find the column index for the serial number
    let serialColumnIndex = -1;
    data.table.cols.forEach((col, index) => {
      if (col.label && col.label.toLowerCase().includes('serial')) {
        serialColumnIndex = index;
      }
    });
    
    if (serialColumnIndex !== -1) {
      // Extract all serial numbers from the sheet
      const allSerialNumbers = [];
      
      rows.forEach(row => {
        if (row.c && row.c[serialColumnIndex] && row.c[serialColumnIndex].v) {
          const serialValue = row.c[serialColumnIndex].v.toString();
          if (serialValue.trim() !== '') {
            allSerialNumbers.push(serialValue);
          }
        }
      });
      
      console.log("All serial numbers from sheet:", allSerialNumbers);
      
      if (allSerialNumbers.length > 0) {
        // Find the highest serial number
        let highestNumber = 0;
        let serialFormat = '';
        
        for (const serialNum of allSerialNumbers) {
          // Extract the prefix and number parts (e.g., "SN-004" → "SN-" and "004")
          const match = /^([A-Za-z\-]+)(\d+)$/.exec(serialNum);
          if (match) {
            const prefix = match[1];  // e.g., "SN-"
            const numberPart = parseInt(match[2], 10);
            
            // Update if this is the highest number we've seen
            if (numberPart > highestNumber) {
              highestNumber = numberPart;
              serialFormat = prefix;
            }
          }
        }
        
        if (highestNumber > 0) {
          // Get the number of digits in the highest serial number
          const digits = allSerialNumbers
            .filter(sn => /^[A-Za-z\-]+\d+$/.test(sn))
            .map(sn => {
              const match = /^[A-Za-z\-]+(\d+)$/.exec(sn);
              return match ? match[1].length : 0;
            })
            .reduce((max, len) => Math.max(max, len), 0);
          
          // Generate the next serial number
          const nextNumber = highestNumber + 1;
          const nextNumberFormatted = nextNumber.toString().padStart(digits, '0');
          
          // Set the next serial number
          emptyAppointment[serialNoHeader.id] = `${serialFormat}${nextNumberFormatted}`;
          
          console.log("Generated next serial number:", emptyAppointment[serialNoHeader.id]);
        } else {
          // Fallback if no valid serial number format was found
          emptyAppointment[serialNoHeader.id] = 'SN-001';
        }
      } else {
        // No existing serial numbers, start with SN-001
        emptyAppointment[serialNoHeader.id] = 'SN-001';
      }
    }
    
    // Set the newAppointment with prefilled values and show the form
    console.log("Final appointment object to set:", emptyAppointment);
    setNewAppointment(emptyAppointment);
    setShowNewAppointmentForm(true);
  } catch (error) {
    console.error("Error fetching serial numbers:", error);
    
    // Fallback: use the existing appointments data as before
    if (serialNoHeader && appointments.length > 0) {
      const serialNumbers = appointments
        .map(appt => appt[serialNoHeader.id])
        .filter(serial => serial && typeof serial === 'string' && serial.trim() !== '');
      
      if (serialNumbers.length > 0) {
        // Same logic as before for fallback
        let highestSerialNumber = '';
        let highestNumber = 0;
        
        for (const serialNum of serialNumbers) {
          const match = /^([A-Za-z\-]+)(\d+)$/.exec(serialNum);
          if (match) {
            const numberPart = parseInt(match[2], 10);
            
            if (numberPart > highestNumber) {
              highestNumber = numberPart;
              highestSerialNumber = serialNum;
            }
          }
        }
        
        if (highestSerialNumber) {
          const match = /^([A-Za-z\-]+)(\d+)$/.exec(highestSerialNumber);
          if (match) {
            const prefix = match[1];
            const numberPart = match[2];
            const nextNumber = (parseInt(numberPart, 10) + 1);
            
            const nextNumberFormatted = nextNumber.toString().padStart(numberPart.length, '0');
            
            emptyAppointment[serialNoHeader.id] = `${prefix}${nextNumberFormatted}`;
          }
        } else {
          // No valid format found, use default
          emptyAppointment[serialNoHeader.id] = 'SN-001';
        }
      } else {
        // No serial numbers found in appointments
        emptyAppointment[serialNoHeader.id] = 'SN-001';
      }
    } else {
      // No serial header found or no appointments
      emptyAppointment[serialNoHeader.id] = 'SN-001';
    }
    
    // Set the appointment data and show the form
    setNewAppointment(emptyAppointment);
    setShowNewAppointmentForm(true);
  } finally {
    setSubmitting(false);
  }
};

  // Function to handle search
  const filteredAppointments = searchTerm
    ? appointments.filter(appointment => 
        Object.values(appointment).some(
          value => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : appointments

  // Function to filter history appointments - modified to filter by staff for staff users
const filteredHistoryAppointments = (() => {
  // First filter by staff for staff users
  let roleFilteredAppointments = allAppointments;
  
  if (user?.role === "staff" && user?.staffName) {
    // Find staff name column
    const staffNameHeader = tableHeaders.find(header => 
      (header.label.toLowerCase().includes('staff') && header.label.toLowerCase().includes('name'))
    );
    
    if (staffNameHeader) {
      roleFilteredAppointments = allAppointments.filter(appointment => {
        const appointmentStaffName = (appointment[staffNameHeader.id] || "").toString().trim();
        const userStaffName = (user.staffName || "").toString().trim();
        
        // Use the same flexible matching as in the main filter
        const exactMatch = appointmentStaffName.toLowerCase() === userStaffName.toLowerCase();
        const containsMatch = appointmentStaffName.toLowerCase().includes(userStaffName.toLowerCase()) || 
                             userStaffName.toLowerCase().includes(appointmentStaffName.toLowerCase());
        
        return exactMatch || containsMatch;
      });
    }
  }
  
  // Then apply search filter
  if (historySearchTerm) {
    return roleFilteredAppointments.filter(appointment => 
      Object.values(appointment).some(
        value => value && value.toString().toLowerCase().includes(historySearchTerm.toLowerCase())
      )
    );
  }
  
  return roleFilteredAppointments;
})();

  // Handle input change for new appointment form
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewAppointment(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle input change for edit appointment form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target
    setEditingAppointment(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Function to handle the history button click
  const handleHistoryClick = () => {
    setHistorySearchTerm("")
    setShowHistoryModal(true)
  }

  // Function to start editing an appointment
  const handleEditClick = (appointment) => {
    console.log("Editing appointment:", appointment)
    
    // Convert date fields to format compatible with input[type=date]
    const preparedAppointment = { ...appointment }
    
    tableHeaders.forEach(header => {
      // For date fields, convert to YYYY-MM-DD format for the date input
      if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
        if (preparedAppointment[header.id]) {
          try {
            let dateValue = preparedAppointment[header.id]
            
            // Handle DD/MM/YYYY format
            if (typeof dateValue === 'string' && dateValue.includes('/')) {
              const dateParts = dateValue.split('/')
              if (dateParts.length === 3) {
                const day = parseInt(dateParts[0], 10).toString().padStart(2, '0')
                const month = parseInt(dateParts[1], 10).toString().padStart(2, '0')
                const year = parseInt(dateParts[2], 10)
                
                // Convert to YYYY-MM-DD for the date input
                preparedAppointment[header.id] = `${year}-${month}-${day}`
              }
            }
            // Handle Google Sheets date format: Date(year,month,day)
            else if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
              const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateValue)
              if (match) {
                const year = parseInt(match[1], 10)
                const month = (parseInt(match[2], 10) + 1).toString().padStart(2, '0') // Convert from 0-indexed to 1-indexed month
                const day = parseInt(match[3], 10).toString().padStart(2, '0')
                
                // Convert to YYYY-MM-DD for the date input
                preparedAppointment[header.id] = `${year}-${month}-${day}`
              }
            }
            else {
              // Try to parse as a regular Date
              const date = new Date(dateValue)
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear()
                const month = (date.getMonth() + 1).toString().padStart(2, '0')
                const day = date.getDate().toString().padStart(2, '0')
                
                // Convert to YYYY-MM-DD for the date input
                preparedAppointment[header.id] = `${year}-${month}-${day}`
              }
            }
          } catch (error) {
            console.error("Error formatting date for edit:", error)
          }
        }
      }
      
      // For time fields, convert to HH:MM format for the time input
      if (header.label.toLowerCase().includes('time') && !header.label.toLowerCase().includes('timestamp')) {
        if (preparedAppointment[header.id]) {
          try {
            let timeValue = preparedAppointment[header.id]
            
            // Handle "1:30 PM" format
            if (typeof timeValue === 'string' && (timeValue.includes('AM') || timeValue.includes('PM'))) {
              const isPM = timeValue.includes('PM')
              timeValue = timeValue.replace(/\s*(AM|PM)/i, '')
              
              let [hours, minutes] = timeValue.split(':')
              hours = parseInt(hours, 10)
              
              // Convert to 24-hour format
              if (isPM && hours < 12) hours += 12
              if (!isPM && hours === 12) hours = 0
              
              // Format for the time input
              preparedAppointment[header.id] = `${hours.toString().padStart(2, '0')}:${minutes}`
            }
            // Handle Google Sheets time format: Date(1899,11,30,13,53,0)
            else if (typeof timeValue === 'string' && timeValue.startsWith('Date(')) {
              const timeMatch = /Date\((\d+),(\d+),(\d+),(\d+),(\d+)(?:,(\d+))?\)/.exec(timeValue)
              if (timeMatch) {
                const hours = parseInt(timeMatch[4], 10).toString().padStart(2, '0')
                const minutes = parseInt(timeMatch[5], 10).toString().padStart(2, '0')
                
                // Format for the time input
                preparedAppointment[header.id] = `${hours}:${minutes}`
              }
            }
          } catch (error) {
            console.error("Error formatting time for edit:", error)
          }
        }
      }
    })
    
    setEditingAppointment(preparedAppointment)
    setShowEditAppointmentForm(true)
  }

  // This is your original function that needs to be updated
  const formatDateForSheet = (value, isTime = false) => {
    if (!value) return '';
    
    try {
      if (isTime) {
        // For time values, return them in the format HH:MM AM/PM
        const timeParts = value.split(':');
        if (timeParts.length === 2) {
          const hours = parseInt(timeParts[0], 10);
          const minutes = timeParts[1];
          
          // Format as 12-hour time with AM/PM
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
          
          return `${hours12}:${minutes} ${ampm}`;
        }
        
        return value; // Return original if can't parse
      } else {
        // For date values, format as DD/MM/YYYY
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
      }
    } catch (error) {
      console.error("Date/time formatting error:", error);
      return value;
    }
  };

  const formatTimeFromGoogleSheets = (timeValue) => {
    if (!timeValue) return '—';
    
    // If it already has AM/PM format, keep it as is
    if (typeof timeValue === 'string' && 
       (timeValue.endsWith('AM') || timeValue.endsWith('PM') || 
        timeValue.endsWith('am') || timeValue.endsWith('pm'))) {
      return timeValue;
    }
    
    // If it's already in a readable format like "13:45", convert to 12-hour format
    if (typeof timeValue === 'string' && timeValue.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
      const [hours, minutes] = timeValue.split(':');
      const hrs = parseInt(hours, 10);
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      const hours12 = hrs % 12 || 12; // Convert 0 to 12 for 12 AM
      return `${hours12}:${minutes} ${ampm}`;
    }
    
    // Check if it's in Google Sheets date format: Date(1899,11,30,13,53,0)
    const timeMatch = /Date\((\d+),(\d+),(\d+),(\d+),(\d+)(?:,(\d+))?\)/.exec(timeValue);
    if (timeMatch) {
      const hours = parseInt(timeMatch[4], 10);
      const minutes = parseInt(timeMatch[5], 10);
      
      // Format as 12-hour time with AM/PM
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    // Try to parse as Date object if it's a timestamp
    try {
      const date = new Date(timeValue);
      if (!isNaN(date.getTime())) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        
        // Format as 12-hour time with AM/PM
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      }
    } catch (e) {
      console.log("Time parsing error:", e);
    }
    
    // If all else fails, return the original value
    return timeValue.toString();
  }
  
  // Handle form submission for new appointments
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Format any date and time values in the appointment data
      const formattedAppointment = { ...newAppointment };
      
      // Find date and time fields and format them
      tableHeaders.forEach(header => {
        if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
          if (formattedAppointment[header.id]) {
            formattedAppointment[header.id] = formatDateForSheet(formattedAppointment[header.id], false);
          }
        } else if (header.label.toLowerCase().includes('time')) {
          if (formattedAppointment[header.id]) {
            formattedAppointment[header.id] = formatDateForSheet(formattedAppointment[header.id], true);
          }
        }
      });
      
      // Prepare data array that matches your sheet structure
      // The array must match the exact column order of your Google Sheet:
      // [TimeStamp, Serial No., Booking ID, Mobile Number, Customer Name, Slot Date, Slot Number, Slot Time, Staff Name, Staff Number, Services, Service Price, Booking Status]
      
      // Generate current timestamp with only date (no time)
      const now = new Date();
      const formattedTimestamp = now.toLocaleDateString(); // Format: MM/DD/YYYY
      
      // Initialize with empty values for all columns
      const rowData = Array(13).fill(''); // Updating to 13 columns based on your sheet structure
      
      // Set initial values for system-generated fields
      rowData[0] = formattedTimestamp; // TimeStamp - this should be the current time, not the appointment date
      
      // Serial No. (index 1) will be auto-generated in the script
      // We'll initialize it with a temporary value that will be replaced by the server
      // Find the Serial No. field
      const serialNoHeader = tableHeaders.find(header => 
        header.label.toLowerCase().includes('serial')
      );
      
      if (serialNoHeader) {
        // Use the serial number that was already generated and displayed in the form
        rowData[1] = formattedAppointment[serialNoHeader.id] || '';
        
        // Fallback only if no serial number was provided
        if (!rowData[1]) {
          rowData[1] = 'SN-001';  // Default value as fallback
        }
        
        console.log("Using serial number from form:", rowData[1]);
      }
      
      // Map form values to the appropriate columns based on field names
      tableHeaders.forEach(header => {
        const value = formattedAppointment[header.id] || '';
        const headerLabel = header.label.toLowerCase();
        
        // Map each form field to the correct column
        if (headerLabel.includes('booking id') || headerLabel.includes('id') && !headerLabel.includes('serial')) {
          rowData[2] = value;
        } else if (headerLabel.includes('mobile') || headerLabel.includes('phone')) {
          // Ensure mobile number is treated as a single value
          rowData[3] = value.toString().trim();
        } else if (headerLabel.includes('customer') || (headerLabel.includes('name') && !headerLabel.includes('staff'))) {
          rowData[4] = value;
        } else if (headerLabel.includes('date')) {
          rowData[5] = value;
        } else if (headerLabel.includes('slot number') || headerLabel.includes('slot no')) {
          rowData[6] = value;
        } else if (headerLabel.includes('time')) {
          rowData[7] = value; // Now properly formatted time value
        } else if (headerLabel.includes('staff') && headerLabel.includes('name')) {
          rowData[8] = value;
        } else if (headerLabel.includes('staff') && headerLabel.includes('number')) {
          // Ensure staff number is treated as a single value
          rowData[9] = value.toString().trim();
        } else if (headerLabel.includes('services') && !headerLabel.includes('number') && !headerLabel.includes('price')) {
          rowData[10] = value;
        } else if (headerLabel.includes('price')) {
          rowData[11] = value;
        } else if (headerLabel.includes('status')) {
          rowData[12] = value;
        }
      });
      
      console.log("Prepared row data:", rowData);
      
      // Use FormData for compatibility with Google Apps Script
      const formData = new FormData();
      formData.append('sheetName', sheetName);
      formData.append('rowData', JSON.stringify(rowData));
      formData.append('action', 'insert'); // Specify that this is an insert operation
      
      console.log("Submitting to Google Apps Script...");
      console.log("URL:", scriptUrl);
      
      // Make the fetch request with no-cors mode
      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });
      
      console.log("Form submitted successfully");
      
      // Create a new appointment for local state with complete data including the correct timestamp
      const newAppointmentWithId = {
        ...formattedAppointment,
        _id: Math.random().toString(36).substring(2, 15)
      };
      
      // IMPORTANT: Map all columns from rowData to the newAppointmentWithId
      // This ensures we have the Serial No. in the UI
      tableHeaders.forEach((header, index) => {
        const headerLabel = header.label.toLowerCase();
        let columnIndex = -1;
        
        if (headerLabel.includes('timestamp') || headerLabel.includes('time stamp')) {
          columnIndex = 0;
        } else if (headerLabel.includes('serial')) {
          columnIndex = 1; // This is the key one we need to fix!
        } else if (headerLabel.includes('booking id') || (headerLabel.includes('id') && !headerLabel.includes('serial'))) {
          columnIndex = 2;
        } else if (headerLabel.includes('mobile') || headerLabel.includes('phone')) {
          columnIndex = 3;
        } else if (headerLabel.includes('customer') || (headerLabel.includes('name') && !headerLabel.includes('staff'))) {
          columnIndex = 4;
        } else if (headerLabel.includes('date')) {
          columnIndex = 5;
        } else if (headerLabel.includes('slot number') || headerLabel.includes('slot no')) {
          columnIndex = 6;
        } else if (headerLabel.includes('time') && !headerLabel.includes('timestamp')) {
          columnIndex = 7;
        } else if (headerLabel.includes('staff') && headerLabel.includes('name')) {
          columnIndex = 8;
        } else if (headerLabel.includes('staff') && headerLabel.includes('number')) {
          columnIndex = 9;
        } else if (headerLabel.includes('services') && !headerLabel.includes('number') && !headerLabel.includes('price')) {
          columnIndex = 10;
        } else if (headerLabel.includes('price')) {
          columnIndex = 11;
        } else if (headerLabel.includes('status')) {
          columnIndex = 12;
        }
        
        if (columnIndex !== -1) {
          newAppointmentWithId[header.id] = rowData[columnIndex];
          
          // For date fields, also set the formatted version
          if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
            newAppointmentWithId[`${header.id}_formatted`] = rowData[columnIndex];
          }
          
          // For time fields, also set the formatted version
          if (header.label.toLowerCase().includes('time') && !headerLabel.includes('timestamp')) {
            newAppointmentWithId[`${header.id}_formatted`] = rowData[columnIndex];
          }
        }
      });
      
      // Add to the appointments list
      setAppointments(prev => [newAppointmentWithId, ...prev]);
      
      // Update stats based on appointment date
      let isToday = false;
      let isFuture = false;
      
      const slotDate = rowData[5]; // Slot Date is at index 5
      if (slotDate) {
        try {
          const dateParts = slotDate.split('/');
          if (dateParts.length === 3) {
            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1; // 0-indexed month
            const year = parseInt(dateParts[2], 10);
            
            const apptDate = new Date(year, month, day);
            apptDate.setHours(0, 0, 0, 0);
            
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            
            isToday = apptDate.getTime() === todayDate.getTime();
            isFuture = apptDate > todayDate;
          }
        } catch (error) {
          console.error("Date parsing error:", error);
        }
      }
      
      // Update stats accordingly
      setStats(prev => ({
        today: prev.today + (isToday ? 1 : 0),
        upcoming: prev.upcoming + (isFuture ? 1 : 0),
        totalClients: prev.totalClients + 1
      }));
      
      // Close the form and reset
      setShowNewAppointmentForm(false);
      
      // Reset the form for next time
      const emptyAppointment = {};
      tableHeaders.forEach(header => {
        emptyAppointment[header.id] = '';
      });
      setNewAppointment(emptyAppointment);
      
      // Show success notification instead of alert
      setNotification({
        show: true,
        message: "Appointment added successfully!",
        type: "success"
      });
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error submitting appointment:", error);
      
      // Show error notification instead of alert
      setNotification({
        show: true,
        message: `Failed to add appointment: ${error.message}`,
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
  
    // Handle edit form submission
    const handleEditSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      
      try {
        // Format any date and time values in the appointment data
        const formattedAppointment = { ...editingAppointment };
        
        // Find date and time fields and format them
        tableHeaders.forEach(header => {
          if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
            if (formattedAppointment[header.id]) {
              formattedAppointment[header.id] = formatDateForSheet(formattedAppointment[header.id], false);
            }
          } else if (header.label.toLowerCase().includes('time') && !header.label.toLowerCase().includes('timestamp')) {
            if (formattedAppointment[header.id]) {
              formattedAppointment[header.id] = formatDateForSheet(formattedAppointment[header.id], true);
            }
          }
        });
        
        // Get the row index from the original appointment
        const rowIndex = formattedAppointment._rowIndex;
        
        if (!rowIndex) {
          throw new Error("Could not determine the row index for updating this appointment");
        }
        
        // Prepare data array that matches your sheet structure
        // [TimeStamp, Serial No., Booking ID, Mobile Number, Customer Name, Slot Date, Slot Number, Slot Time, Staff Name, Staff Number, Services, Service Price, Booking Status]
        
        // Initialize with empty values for all columns
        const rowData = Array(13).fill('');
        
        // Map form values to the appropriate columns based on field names
        tableHeaders.forEach(header => {
          const value = formattedAppointment[header.id] || '';
          const headerLabel = header.label.toLowerCase();
          
          // Map each form field to the correct column
          if (headerLabel.includes('timestamp') || headerLabel.includes('time stamp')) {
            rowData[0] = value;
          } else if (headerLabel.includes('serial')) {
            rowData[1] = value;
          } else if (headerLabel.includes('booking id') || (headerLabel.includes('id') && !headerLabel.includes('serial'))) {
            rowData[2] = value;
          } else if (headerLabel.includes('mobile') || headerLabel.includes('phone')) {
            rowData[3] = value.toString().trim();
          } else if (headerLabel.includes('customer') || (headerLabel.includes('name') && !headerLabel.includes('staff'))) {
            rowData[4] = value;
          } else if (headerLabel.includes('date')) {
            rowData[5] = value;
          } else if (headerLabel.includes('slot number') || headerLabel.includes('slot no')) {
            rowData[6] = value;
          } else if (headerLabel.includes('time') && !headerLabel.includes('timestamp')) {
            rowData[7] = value;
          } else if (headerLabel.includes('staff') && headerLabel.includes('name')) {
            rowData[8] = value;
          } else if (headerLabel.includes('staff') && headerLabel.includes('number')) {
            rowData[9] = value.toString().trim();
          } else if (headerLabel.includes('services') && !headerLabel.includes('number') && !headerLabel.includes('price')) {
            rowData[10] = value;
          } else if (headerLabel.includes('price')) {
            rowData[11] = value;
          } else if (headerLabel.includes('status')) {
            rowData[12] = value;
          }
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
        
        // Update the appointment in the local state
        setAppointments(prev => {
          return prev.map(appointment => {
            if (appointment._id === formattedAppointment._id) {
              // Update all fields including formatted versions
              const updatedAppointment = { ...appointment };
              
              tableHeaders.forEach(header => {
                const headerLabel = header.label.toLowerCase();
                
                // Find the column index for this header
                let columnIndex = -1;
                
                if (headerLabel.includes('timestamp') || headerLabel.includes('time stamp')) {
                  columnIndex = 0;
                } else if (headerLabel.includes('serial')) {
                  columnIndex = 1;
                } else if (headerLabel.includes('booking id') || (headerLabel.includes('id') && !headerLabel.includes('serial'))) {
                  columnIndex = 2;
                } else if (headerLabel.includes('mobile') || headerLabel.includes('phone')) {
                  columnIndex = 3;
                } else if (headerLabel.includes('customer') || (headerLabel.includes('name') && !headerLabel.includes('staff'))) {
                  columnIndex = 4;
                } else if (headerLabel.includes('date')) {
                  columnIndex = 5;
                } else if (headerLabel.includes('slot number') || headerLabel.includes('slot no')) {
                  columnIndex = 6;
                } else if (headerLabel.includes('time') && !headerLabel.includes('timestamp')) {
                  columnIndex = 7;
                } else if (headerLabel.includes('staff') && headerLabel.includes('name')) {
                  columnIndex = 8;
                } else if (headerLabel.includes('staff') && headerLabel.includes('number')) {
                  columnIndex = 9;
                } else if (headerLabel.includes('services') && !headerLabel.includes('number') && !headerLabel.includes('price')) {
                  columnIndex = 10;
                } else if (headerLabel.includes('price')) {
                  columnIndex = 11;
                } else if (headerLabel.includes('status')) {
                  columnIndex = 12;
                }
                
                if (columnIndex !== -1) {
                  updatedAppointment[header.id] = rowData[columnIndex];
                  
                  // For date fields, also set the formatted version
                  if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
                    updatedAppointment[`${header.id}_formatted`] = rowData[columnIndex];
                  }
                  
                  // For time fields, also set the formatted version
                  if (header.label.toLowerCase().includes('time') && !headerLabel.includes('timestamp')) {
                    updatedAppointment[`${header.id}_formatted`] = rowData[columnIndex];
                  }
                }
              });
              
              return updatedAppointment;
            }
            return appointment;
          });
        });
        
        // Close the form
        setShowEditAppointmentForm(false);
        
        // Show success notification instead of alert
        setNotification({
          show: true,
          message: "Appointment updated successfully!",
          type: "success"
        });
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
          setNotification({ show: false, message: "", type: "" });
        }, 3000);
      } catch (error) {
        console.error("Error updating appointment:", error);
        
        // Show error notification instead of alert
        setNotification({
          show: true,
          message: `Failed to update appointment: ${error.message}`,
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
    const renderFormField = (header, isEdit = false) => {
      const handleChange = isEdit ? handleEditInputChange : handleInputChange;
      const formData = isEdit ? editingAppointment : newAppointment;
      
      // For date fields
      if (header.label.toLowerCase().includes('timestamp') || header.label.toLowerCase().includes('time stamp')) {
        return (
          <input
            type="text"  // Use text instead of date to display in DD/MM/YYYY format
            id={`${isEdit ? 'edit-' : ''}${header.id}`}
            name={header.id}
            value={formData[header.id] || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        );
      }
      
      // For other date fields (like slot date) - keep this as is
      if (header.type === 'date' || (header.label.toLowerCase().includes('date') && !header.label.toLowerCase().includes('timestamp'))) {
        return (
          <input
            type="date"
            id={`${isEdit ? 'edit-' : ''}${header.id}`}
            name={header.id}
            value={formData[header.id] || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            required
          />
        );
      }
      
      // For time fields
      if (header.label.toLowerCase().includes('time') && !header.label.toLowerCase().includes('timestamp')) {
        return (
          <input
            type="time"
            id={`${isEdit ? 'edit-' : ''}${header.id}`}
            name={header.id}
            value={formData[header.id] || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            required
          />
        )
      }
      
      // For status field - dropdown
      // Find this function in your code and replace it with this updated version
// This adds the "Complete" option to the status dropdown

// For status field - dropdown
if (header.id === 'status' || header.label.toLowerCase() === 'status' || 
header.label.toLowerCase().includes('booking status')) {
return (
<select
  id={`${isEdit ? 'edit-' : ''}${header.id}`}
  name={header.id}
  value={formData[header.id] || ''}
  onChange={handleChange}
  className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
  required
>
  <option value="">Select Status</option>
  <option value="Confirmed">Confirmed</option>
  <option value="Complete">Complete</option>
  <option value="Pending">Pending</option>
  <option value="Canceled">Canceled</option>
</select>
)
}
      
      // For price fields
      if (header.label.toLowerCase().includes('price')) {
        return (
          <input
            type="number"
            id={`${isEdit ? 'edit-' : ''}${header.id}`}
            name={header.id}
            value={formData[header.id] || ''}
            onChange={handleChange}
            placeholder="₹"
            className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            required
          />
        )
      }
      
      // For staff name field
      if (header.label.toLowerCase().includes('staff') && header.label.toLowerCase().includes('name')) {
        // If user is staff, make the field read-only with their name
        if (user?.role === "staff" && user?.staffName && !isEdit) {
          return (
            <input
              type="text"
              id={`${isEdit ? 'edit-' : ''}${header.id}`}
              name={header.id}
              value={user.staffName}
              readOnly
              className="mt-1 block w-full rounded-md border-blue-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          );
        }
      }

      
      
      // Default to text input for all other fields
      return (
        <input
          type="text"
          id={`${isEdit ? 'edit-' : ''}${header.id}`}
          name={header.id}
          value={formData[header.id] || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          required={!header.label.toLowerCase().includes('timestamp')} // Make timestamp field not required as it's auto-generated
        />
      )
    }
  
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
          <div className="flex space-x-2">
            <button 
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
              onClick={handleNewAppointmentClick}
            >
              <Plus size={18} className="mr-2" />
              New Appointment
            </button>
            
            {/* Only show history button if not hidden */}
            {!hideHistoryButton && (
              <button 
              className="flex items-center justify-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300"
              onClick={handleHistoryClick}
            >
              <History size={18} className="mr-2" />
              History
            </button>
          )}
        </div>
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
                {!hideHistoryButton && (
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-blue-500 uppercase tracking-wider"
                >
                  Actions
                </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-200">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment, index) => (
                  <motion.tr
                  key={appointment._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-blue-50 transition-colors duration-300"
                >
                  {tableHeaders.map((header) => {
                    // Handle special rendering for different column types
                    // Also improve the status display in the table to include the "Complete" status
// Find the section in your code that handles the status display in the table cells
// and update it to include the "Complete" status with a distinctive color

// For example, in the main table rendering code:
if (header.id === 'status' || header.label.toLowerCase() === 'status' || header.label.toLowerCase().includes('status')) {
  const status = appointment[header.id];
  let statusClass = 'bg-gray-100 text-gray-800';
  
  if (status) {
    if (status.toLowerCase().includes('confirm')) {
      statusClass = 'bg-green-100 text-green-800';
    } else if (status.toLowerCase().includes('pend')) {
      statusClass = 'bg-yellow-100 text-yellow-800';
    } else if (status.toLowerCase().includes('cancel')) {
      statusClass = 'bg-red-100 text-red-800';
    } else if (status.toLowerCase().includes('complete')) {
      statusClass = 'bg-blue-100 text-blue-800'; // Different color for "Complete" status
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

// Also update the same logic in the history modal section
// For example, in the history table cell rendering code:
if (header.id === 'status' || header.label.toLowerCase() === 'status' || header.label.toLowerCase().includes('status')) {
  const status = appointment[header.id];
  let statusClass = 'bg-gray-100 text-gray-800';
  
  if (status) {
    if (status.toLowerCase().includes('confirm')) {
      statusClass = 'bg-green-100 text-green-800';
    } else if (status.toLowerCase().includes('pend')) {
      statusClass = 'bg-yellow-100 text-yellow-800';
    } else if (status.toLowerCase().includes('cancel')) {
      statusClass = 'bg-red-100 text-red-800';
    } else if (status.toLowerCase().includes('complete')) {
      statusClass = 'bg-blue-100 text-blue-800'; // Same color scheme for consistency
    }
  }
  
  return (
    <td key={`history-cell-${header.id}-${index}`} className="px-6 py-4 whitespace-nowrap">
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
                              <User size={16} className="text-black-600" />
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
                          <div className="text-sm text-black-500">{displayDate}</div>
                        </td>
                      );
                    }
                    
                    if (header.label.toLowerCase().includes('time')) {
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-black-500">
                            {formatTimeFromGoogleSheets(appointment[header.id])}
                          </div>
                        </td>
                      );
                    }
                    
                    // Default rendering for other columns
                    return (
                      <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black-500">
                          {appointment[header.id] || '—'}
                        </div>
                      </td>
                    );
                  })}
                  
                  {/* Actions column */}
                  {!hideHistoryButton && (
  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
    <button 
      className="text-pink-600 hover:text-pink-900" 
      onClick={() => handleEditClick(appointment)}
    >
      <Edit size={16} className="inline mr-1" />
    </button>
  </td>
)}
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
    
    {/* Modal for adding new appointment */}
    <AnimatePresence>
      {showNewAppointmentForm && (
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
                <h3 className="text-xl font-bold text-pink-600">Add New Appointment</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowNewAppointmentForm(false)}
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tableHeaders.map((header) => (
                    <div key={header.id}>
                      <label htmlFor={header.id} className="block text-sm font-medium text-pink-700">
                        {header.label}
                      </label>
                      {renderFormField(header)}
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-blue-100">
                  <button
                    type="button"
                    className="px-4 py-2 border border-blue-300 rounded-md shadow-sm text-pink-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    onClick={() => setShowNewAppointmentForm(false)}
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
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="mr-2" />
                        Save Appointment
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
            
    {/* Modal for editing appointment */}
    <AnimatePresence>
      {showEditAppointmentForm && (
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
                <h3 className="text-xl font-bold text-blue-800">Edit Appointment</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowEditAppointmentForm(false)}
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tableHeaders.map((header) => (
                    <div key={`edit-${header.id}`}>
                      <label htmlFor={`edit-${header.id}`} className="block text-sm font-medium text-blue-700">
                        {header.label}
                      </label>
                      {renderFormField(header, true)}
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-blue-100">
                  <button
                    type="button"
                    className="px-4 py-2 border border-blue-300 rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => setShowEditAppointmentForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 flex items-center"
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
                        Update Appointment
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

    {/* History Modal - Shows All Booking Data */}
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
                <h3 className="text-xl font-bold text-indigo-800">Booking History</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowHistoryModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search all appointments..."
                    className="pl-10 pr-4 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full transition-all duration-300"
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-indigo-200">
                  <thead className="bg-indigo-50">
                    <tr>
                      {tableHeaders.map((header) => (
                        <th
                          key={`history-${header.id}`}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-indigo-500 uppercase tracking-wider"
                        >
                          {header.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-indigo-200">
                    {filteredHistoryAppointments.length > 0 ? (
                      filteredHistoryAppointments.map((appointment, index) => (
                        <tr 
                          key={`history-row-${appointment._id}`}
                          className="hover:bg-indigo-50 transition-colors duration-300"
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
                                <td key={`history-cell-${header.id}-${index}`} className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                                    {status || '—'}
                                  </span>
                                </td>
                              );
                            }
                            
                            // For client/name columns
                            if (header.label.toLowerCase().includes('client') || 
                                header.label.toLowerCase().includes('name')) {
                              return (
                                <td key={`history-cell-${header.id}-${index}`} className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-indigo-900">
                                    {appointment[header.id] || '—'}
                                  </div>
                                </td>
                              );
                            }
                            
                            // For Service Price column, add rupee sign (₹)
                            if (header.label.toLowerCase().includes('service price') || 
                                header.label.toLowerCase().includes('price')) {
                              const price = appointment[header.id];
                              return (
                                <td key={`history-cell-${header.id}-${index}`} className="px-6 py-4 whitespace-nowrap">
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
                                <td key={`history-cell-${header.id}-${index}`} className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-indigo-900">{displayDate}</div>
                                </td>
                              );
                            }
                            
                            if (header.label.toLowerCase().includes('time')) {
                              return (
                                <td key={`history-cell-${header.id}-${index}`} className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-indigo-500">
                                    {formatTimeFromGoogleSheets(appointment[header.id])}
                                  </div>
                                </td>
                              );
                            }
                            
                            // Default rendering for other columns
                            return (
                              <td key={`history-cell-${header.id}-${index}`} className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-indigo-700">
                                  {appointment[header.id] || '—'}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={tableHeaders.length} className="px-6 py-4 text-center text-gray-500">
                          {historySearchTerm ? "No appointments matching your search" : "No appointments found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300"
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
  </motion.div>
);
};
            
export default Booking;