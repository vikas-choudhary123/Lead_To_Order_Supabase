"use client"

import React, { useState, useEffect } from 'react';
import { Calendar, User, Clock, Filter, ChevronDown, Download, Search, CheckCircle, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StaffHistory = () => {
  // State for attendance data and UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [tableHeaders, setTableHeaders] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    staffName: '',
    dateFrom: '',
    dateTo: '',
    status: 'all'
  });

  // Show filters panel state
  const [showFilters, setShowFilters] = useState(false);

  // Add notification state to your component
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "" // "success", "error", or "info"
  });

  // Google Sheet Details
  const sheetId = '1Kb-fhC1yiFJCyPO7TJDqnu-lQ1n1H6mLErlkSPc6yHc';
  const sheetName = 'Staff Attendance';

  // Fetch attendance data from Google Sheet
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

        let headers = [];
        let allRows = data.table.rows || [];

        // Determine headers
        if (data.table.cols && data.table.cols.some(col => col.label)) {
          headers = data.table.cols.map((col, index) => ({
            id: `col${index}`,
            label: col.label || `Column ${index + 1}`,
            type: col.type || 'string'
          }));
        } else if (allRows.length > 0 && allRows[0].c && allRows[0].c.some(cell => cell && cell.v)) {
          headers = allRows[0].c.map((cell, index) => ({
            id: `col${index}`,
            label: cell && cell.v ? String(cell.v) : `Column ${index + 1}`,
            type: data.table.cols[index]?.type || 'string'
          }));
          allRows = allRows.slice(1);
        }

        setTableHeaders(headers);

        // Process rows
        const attendanceData = allRows
          .filter((row) => row.c && row.c.some((cell) => cell && cell.v))
          .map((row, rowIndex) => {
            const attendanceRecord = {
              _id: Math.random().toString(36).substring(2, 15),
              _rowIndex: rowIndex + 2,
            };

            row.c && row.c.forEach((cell, index) => {
              if (index < headers.length) {
                const header = headers[index];
                
                // Handle date values
                if (cell && cell.v && cell.v.toString().indexOf('Date') === 0) {
                  const dateString = cell.v.toString();
                  const dateParts = dateString.substring(5, dateString.length - 1).split(',');
                  
                  if (dateParts.length >= 3) {
                    const year = parseInt(dateParts[0]);
                    const month = parseInt(dateParts[1]) + 1;
                    const day = parseInt(dateParts[2]);
                    
                    // Format as YYYY-MM-DD for date fields
                    attendanceRecord[header.id] = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  } else {
                    attendanceRecord[header.id] = cell.v;
                  }
                } else {
                  // Handle non-date values
                  attendanceRecord[header.id] = cell ? cell.v : '';
                }
              }
            });

            return attendanceRecord;
          });

        setAttendanceRecords(attendanceData);
        
        // Initialize date filters with min/max dates from data
        if (attendanceData.length > 0) {
          initializeDateFilters(attendanceData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching Google Sheet data:", error);
        setError("Failed to load attendance data");
        setLoading(false);
      }
    };

    fetchGoogleSheetData();
  }, []);

  // Initialize date filters with the earliest and latest dates from the data
  const initializeDateFilters = (records) => {
    try {
      if (!records || records.length === 0) return;
      
      // Find date column id
      const dateCol = getColumnIndex('date');
      if (!dateCol) return;
      
      // Extract all valid dates
      const dates = records
        .map(record => record[dateCol])
        .filter(date => date && !isNaN(new Date(date).getTime()));
      
      if (dates.length > 0) {
        // Sort dates to find min and max
        dates.sort((a, b) => new Date(a) - new Date(b));
        
        setFilters(prev => ({
          ...prev,
          dateFrom: dates[0],
          dateTo: dates[dates.length - 1]
        }));
      }
    } catch (error) {
      console.error("Error initializing date filters:", error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Find column indexes for specific data fields
  const getColumnIndex = (fieldName) => {
    const index = tableHeaders.findIndex(header => 
      header.label.toLowerCase().includes(fieldName.toLowerCase())
    );
    return index !== -1 ? tableHeaders[index].id : null;
  };

  // For Column A matching, use the first column (index 0)
  const nameColumnId = 'col0'; // Always use the first column
  const dateColumnId = getColumnIndex('date');
  const statusColumnId = getColumnIndex('attendance');

  // Apply filters to attendance records
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesName = !filters.staffName || 
      (record[nameColumnId] && 
       record[nameColumnId].toString().toLowerCase().includes(filters.staffName.toLowerCase()));
    
    let dateInRange = true;
    if (dateColumnId && filters.dateFrom && filters.dateTo) {
      const recordDate = record[dateColumnId] ? new Date(record[dateColumnId]) : null;
      const fromDate = new Date(filters.dateFrom);
      const toDate = new Date(filters.dateTo);
      
      // Set hours to 0 for proper date comparison
      if (recordDate) recordDate.setHours(0, 0, 0, 0);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(0, 0, 0, 0);
      
      dateInRange = recordDate && recordDate >= fromDate && recordDate <= toDate;
    }
    
    let matchesStatus = true;
    if (filters.status !== 'all' && statusColumnId) {
      matchesStatus = record[statusColumnId] && 
        record[statusColumnId].toString().toLowerCase() === filters.status.toLowerCase();
    }
    
    return matchesName && dateInRange && matchesStatus;
  });

  // Calculate attendance statistics
  const calculateStats = () => {
    if (!statusColumnId) return { present: { count: 0, percentage: 0 }, absent: { count: 0, percentage: 0 } };
    
    const totalRecords = filteredRecords.length;
    const presentCount = filteredRecords.filter(r => 
      r[statusColumnId] && r[statusColumnId].toString().toLowerCase() === 'present'
    ).length;
    const absentCount = filteredRecords.filter(r => 
      r[statusColumnId] && r[statusColumnId].toString().toLowerCase() === 'absent'
    ).length;
    
    return {
      present: {
        count: presentCount,
        percentage: totalRecords ? Math.round((presentCount / totalRecords) * 100) : 0
      },
      absent: {
        count: absentCount,
        percentage: totalRecords ? Math.round((absentCount / totalRecords) * 100) : 0
      }
    };
  };

  const stats = calculateStats();

  const exportAttendanceReport = () => {
    try {
      // Show loading notification
      setNotification({
        show: true,
        message: "Generating PDF report...",
        type: "info"
      });
  
      // Create a new PDF
      const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' for landscape orientation
      
      // Add a title to the PDF
      pdf.setFontSize(18);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Staff Attendance History Report', 14, 20);
      
      // Add date range if available
      if (filters.dateFrom && filters.dateTo) {
        pdf.setFontSize(12);
        pdf.text(`Period: ${new Date(filters.dateFrom).toLocaleDateString()} to ${new Date(filters.dateTo).toLocaleDateString()}`, 14, 30);
      }
      
      // Add summary statistics
      pdf.text(`Total Records: ${filteredRecords.length}`, 14, 40);
      pdf.text(`Present: ${stats.present.count} (${stats.present.percentage}%)`, 14, 48);
      pdf.text(`Absent: ${stats.absent.count} (${stats.absent.percentage}%)`, 14, 56);
      
      // Prepare data for the table
      const headers = tableHeaders.map(header => header.label);
      
      // Format the data rows for PDF
      const data = filteredRecords.map(record => {
        return tableHeaders.map(header => {
          // Handle date columns
          if (header.label.toLowerCase().includes('date') && record[header.id]) {
            try {
              const date = new Date(record[header.id]);
              if (!isNaN(date.getTime())) {
                return date.toLocaleDateString();
              }
            } catch (error) {}
          }
          
          // Handle other columns
          return record[header.id] || 'N/A';
        });
      });
      
      // Define custom styles for different status values
      const statusIndex = headers.findIndex(h => h.toLowerCase().includes('attendance'));
      
      // Use autoTable function with the pdf instance
      autoTable(pdf, {
        head: [headers],
        body: data,
        startY: 65,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [100, 100, 100],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [220, 220, 220],
          textColor: [40, 40, 40],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        // Style specific cells based on their content
        didParseCell: function(data) {
          // Style the status column
          if (data.section === 'body' && data.column.index === statusIndex) {
            const value = data.cell.raw ? data.cell.raw.toString().toLowerCase() : '';
            
            if (value === 'present') {
              data.cell.styles.fillColor = [220, 250, 220]; // Light green
              data.cell.styles.textColor = [0, 100, 0]; // Dark green
              data.cell.styles.fontStyle = 'bold';
            } else if (value === 'absent') {
              data.cell.styles.fillColor = [250, 220, 220]; // Light red
              data.cell.styles.textColor = [100, 0, 0]; // Dark red
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        // Add page number at the bottom
        didDrawPage: function(data) {
          // Footer with page numbers
          const pageCount = pdf.internal.getNumberOfPages();
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Page ${pdf.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`, 
                   pdf.internal.pageSize.getWidth() - 20, 
                   pdf.internal.pageSize.getHeight() - 10);
          
          // Add generation date in footer
          const today = new Date();
          pdf.text(`Generated on: ${today.toLocaleDateString()} ${today.toLocaleTimeString()}`, 
                   14, 
                   pdf.internal.pageSize.getHeight() - 10);
        }
      });
      
      // Generate filename with date
      const date = new Date();
      const filename = `staff_attendance_report_${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.pdf`;
      
      // Save the PDF
      pdf.save(filename);
      
      // Show success notification
      setNotification({
        show: true,
        message: "PDF report generated successfully!",
        type: "success"
      });
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setNotification({
        show: true,
        message: `Failed to generate PDF: ${error.message}`,
        type: "error"
      });
      
      // Auto-hide error notification after 5 seconds
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 5000);
    }
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toString().toLowerCase()) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format cell data for display
  const formatCellData = (columnId, value) => {
    if (value === null || value === undefined || value === '') return '—';
    
    const header = tableHeaders.find(h => h.id === columnId);
    
    // Format date columns
    if (header && header.label.toLowerCase().includes('date') && value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      } catch (error) {}
    }
    
    return value.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Staff Attendance History</h2>
        <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter size={18} className="mr-2" />
            Filters
            <ChevronDown size={16} className="ml-2" />
          </button>
          <button
            onClick={exportAttendanceReport}
            className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
          >
            <Download size={18} className="mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff Name</label>
              <input
                type="text"
                name="staffName"
                value={filters.staffName}
                onChange={handleFilterChange}
                placeholder="Search by name"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">All</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <User className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Present</p>
              <div className="flex items-baseline">
                <h3 className="text-2xl font-bold text-gray-800 mr-2">{stats.present.count}</h3>
                <span className="text-sm text-gray-500">{stats.present.percentage}%</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="rounded-full bg-red-100 p-3 mr-4">
              <User className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Absent</p>
              <div className="flex items-baseline">
                <h3 className="text-2xl font-bold text-gray-800 mr-2">{stats.absent.count}</h3>
                <span className="text-sm text-gray-500">{stats.absent.percentage}%</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <Clock className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Records</p>
              <h3 className="text-2xl font-bold text-gray-800">{filteredRecords.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-4"></div>
          <div className="text-pink-600">Loading attendance data...</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
          {error} <button className="underline ml-2" onClick={() => window.location.reload()}>Try again</button>
        </div>
      ) : (
        /* Attendance History Table */
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    {tableHeaders.map((header) => (
                      <td 
                        key={`${record._id}-${header.id}`} 
                        className="px-6 py-4 whitespace-nowrap"
                      >
                        {header.id === nameColumnId ? (
                          // Special formatting for name column
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center">
                              <User className="text-pink-600" size={20} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {record[header.id] || '—'}
                              </div>
                            </div>
                          </div>
                        ) : header.id === statusColumnId ? (
                          // Special formatting for status column
                          <span 
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record[header.id])}`}
                          >
                            {record[header.id]?.toString().toLowerCase() === 'present' ? (
                              <CheckCircle size={14} className="mr-1" />
                            ) : record[header.id]?.toString().toLowerCase() === 'absent' ? (
                              <XCircle size={14} className="mr-1" />
                            ) : null}
                            {record[header.id] || '—'}
                          </span>
                        ) : (
                          // Default formatting for other columns
                          <div className="text-sm text-gray-900">
                            {formatCellData(header.id, record[header.id])}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notification component */}
      {notification.show && (
        <div 
          className={`fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center ${
            notification.type === "success" ? "bg-green-100" : 
            notification.type === "info" ? "bg-blue-100" : "bg-red-100"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="text-green-600 mr-3" size={20} />
          ) : notification.type === "info" ? (
            <Search className="text-blue-600 mr-3" size={20} />
          ) : (
            <XCircle className="text-red-600 mr-3" size={20} />
          )}
          <p className={`font-medium ${
            notification.type === "success" ? "text-green-800" : 
            notification.type === "info" ? "text-blue-800" : "text-red-800"
          }`}>
            {notification.message}
          </p>
        </div>
      )}
    </div>
  );
};

export default StaffHistory;