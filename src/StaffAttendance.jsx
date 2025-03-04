"use client"

import { useState, useEffect } from "react"
import { Calendar, CheckCircle, XCircle, Users } from "lucide-react"

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

  useEffect(() => {
    const fetchGoogleSheetData = async () => {
      try {
        setLoading(true)
        console.log("Starting to fetch Staff Attendance data...")
        
        // Google Sheet Details
        const sheetId = '1Kb-fhC1yiFJCyPO7TJDqnu-lQ1n1H6mLErlkSPc6yHc'
        const sheetName = 'Staff Attendance'
        
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
          .slice(1, 7) // Columns B to G (indexes 1-6)
          .map(col => ({
            id: col.id,
            label: col.label || col.id,
            type: col.type
          }))
          .filter(header => header.label) // Filter out empty headers
        
        setTableHeaders(headers)
        
        // Extract and transform data rows, only keeping columns B to G
        const rowsData = data.table.rows.map((row, rowIndex) => {
          const rowData = { id: rowIndex + 1 }
          
          // Process only cells B to G (indexes 1-6)
          row.c && row.c.slice(1, 7).forEach((cell, cellIndex) => {
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
        
        // Find status column - look for a column with "status" in its label
        const statusColumnIndex = headers.findIndex(header => 
          header.label.toLowerCase().includes('status')
        );
        
        // If status column found, use its ID, otherwise default to the third column (index 2)
        const statusColumnId = statusColumnIndex !== -1 
          ? headers[statusColumnIndex].id 
          : headers[2]?.id;
        
        console.log("Status column identified:", statusColumnId);
        
        if (statusColumnId) {
          // Debug log raw status values to see what we're working with
          console.log("Status values:", rowsData.map(row => row[statusColumnId]));
          
          // Count present staff
          const presentCount = rowsData.filter(row => {
            const status = row[statusColumnId];
            // Check both the raw value and formatted value (if available)
            const rawStatus = status ? status.toString().toLowerCase() : '';
            const formattedStatus = row[`${statusColumnId}_formatted`] 
              ? row[`${statusColumnId}_formatted`].toString().toLowerCase() 
              : '';
            
            return rawStatus === "present" || formattedStatus === "present";
          }).length;
          
          // Count absent or late staff
          const absentOrLateCount = rowsData.filter(row => {
            const status = row[statusColumnId];
            // Check both the raw value and formatted value (if available)
            const rawStatus = status ? status.toString().toLowerCase() : '';
            const formattedStatus = row[`${statusColumnId}_formatted`] 
              ? row[`${statusColumnId}_formatted`].toString().toLowerCase() 
              : '';
            
            return rawStatus === "absent" || rawStatus === "late" || 
                   formattedStatus === "absent" || formattedStatus === "late";
          }).length;
          
          console.log("Stats calculation: Total =", rowsData.length, 
                      "Present =", presentCount, 
                      "Absent/Late =", absentOrLateCount);
          
          setStats({
            total: rowsData.length,
            present: presentCount,
            absentOrLate: absentOrLateCount
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
            <p className="text-sm text-gray-500">Absent/Late</p>
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
                            } else if (statusLower === 'late') {
                              statusClass = 'bg-yellow-100 text-yellow-800';
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
                      
                      {/* Actions column - manually added */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-pink-600 hover:text-pink-900 mr-3">Edit</button>
                        <button className="text-blue-600 hover:text-blue-900">Details</button>
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
    </div>
  );
};

export default StaffAttendance;