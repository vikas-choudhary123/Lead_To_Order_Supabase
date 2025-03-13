"use client"

import React, { useState, useEffect } from 'react';
import { Calendar, User, Clock, Filter, ChevronDown, Download, Search, CheckCircle, XCircle } from 'lucide-react';

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

  // Google Sheet Details
  const sheetId = '1Kb-fhC1yiFJCyPO7TJDqnu-lQ1n1H6mLErlkSPc6yHc';
  const sheetName = 'Copy of Staff Attendance';

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

        // Initialize date filters with the earliest and latest dates from the data
        initializeDateFilters(headers, allRows);

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
  const initializeDateFilters = (headers, rows) => {
    try {
      // Find the date column index
      const dateHeaderIndex = headers.findIndex(h => 
        h.label.toLowerCase().includes('date')
      );
      
      if (dateHeaderIndex === -1) return;
      
      let dates = [];
      
      rows.forEach(row => {
        if (row.c && row.c[dateHeaderIndex] && row.c[dateHeaderIndex].v) {
          let dateValue = row.c[dateHeaderIndex].v;
          
          if (typeof dateValue === 'string' && dateValue.indexOf('Date') === 0) {
            const dateParts = dateValue.substring(5, dateValue.length - 1).split(',');
            if (dateParts.length >= 3) {
              const year = parseInt(dateParts[0]);
              const month = parseInt(dateParts[1]) + 1;
              const day = parseInt(dateParts[2]);
              dates.push(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
            }
          }
        }
      });
      
      if (dates.length > 0) {
        dates.sort();
        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];
        
        setFilters(prev => ({
          ...prev,
          dateFrom: firstDate,
          dateTo: lastDate
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

  const nameColumnId = getColumnIndex('name');
  const dateColumnId = getColumnIndex('date');
  // FIXED: Look for 'attendance' column instead of 'status'
  const statusColumnId = getColumnIndex('attendance');

  // Apply filters to attendance records
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesName = !filters.staffName || 
      (nameColumnId && record[nameColumnId] && 
       record[nameColumnId].toString().toLowerCase().includes(filters.staffName.toLowerCase()));
    
    let dateInRange = true;
    if (dateColumnId && filters.dateFrom && filters.dateTo) {
      const recordDate = record[dateColumnId] ? new Date(record[dateColumnId]) : null;
      const fromDate = new Date(filters.dateFrom);
      const toDate = new Date(filters.dateTo);
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

  // Generate staff attendance report
  const exportAttendanceReport = () => {
    // In a real application, you would generate a CSV or PDF here
    alert('Exporting attendance report...');
  };

  // Group records by date
  const groupedByDate = filteredRecords.reduce((acc, record) => {
    if (dateColumnId && record[dateColumnId]) {
      const date = record[dateColumnId];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(record);
    }
    return acc;
  }, {});

  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

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

  // Add debug console logs
  useEffect(() => {
    if (tableHeaders.length > 0) {
      console.log("All headers:", tableHeaders);
      console.log("Status column ID:", statusColumnId);
      
      if (statusColumnId && attendanceRecords.length > 0) {
        // Log a few records to see what the status values actually look like
        console.log("Sample attendance values:", 
          attendanceRecords.slice(0, 3).map(r => r[statusColumnId])
        );
      }
    }
  }, [tableHeaders, attendanceRecords, statusColumnId]);

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
      ) : sortedDates.length > 0 ? (
        /* Attendance History Table */
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-800 flex items-center">
                  <Calendar size={18} className="mr-2 text-pink-600" />
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
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
                      {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th> */}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupedByDate[date].map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        {tableHeaders.map((header) => (
                          <td key={`${record._id}-${header.id}`} className="px-6 py-4 whitespace-nowrap">
                            {header.id === nameColumnId ? (
                              // Special formatting for name column
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center">
                                  <User className="text-pink-600" size={20} />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{record[header.id] || '—'}</div>
                                </div>
                              </div>
                            ) : header.id === statusColumnId ? (
                              // Special formatting for status column
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record[header.id])}`}>
                                {record[header.id]?.toString().toLowerCase() === 'present' ? (
                                  <CheckCircle size={14} className="mr-1" />
                                ) : record[header.id]?.toString().toLowerCase() === 'absent' ? (
                                  <XCircle size={14} className="mr-1" />
                                ) : null}
                                {record[header.id] || '—'}
                              </span>
                            ) : (
                              // Default formatting for other columns
                              <div className="text-sm text-gray-900">{formatCellData(header.id, record[header.id])}</div>
                            )}
                          </td>
                        ))}
                        {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-pink-600 hover:text-pink-800">
                            View
                          </button>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-500">No attendance records found matching your filters</div>
        </div>
      )}
    </div>
  );
};

export default StaffHistory;