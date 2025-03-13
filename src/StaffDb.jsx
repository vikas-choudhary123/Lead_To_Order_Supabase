"use client"

import React, { useState, useEffect } from 'react';
import { User, Search, Edit, Trash2, UserPlus, Save, X } from 'lucide-react';

const StaffDb = () => {
  // State for staff data and UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [tableHeaders, setTableHeaders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [newStaffMember, setNewStaffMember] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: ""
  });
  
  // Add state for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  
  // Add state for edit form modal
  const [showEditForm, setShowEditForm] = useState(false);

  // Google Sheet Details - Replace with your actual sheet ID
  const sheetId = '1Kb-fhC1yiFJCyPO7TJDqnu-lQ1n1H6mLErlkSPc6yHc';
  const sheetName = 'Staff DB';

  // Google Apps Script Web App URL - Replace with your actual script URL
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbyhmDsXWRThVsJCfAirTsI3o9EGE-oCcw2HKz1ERe4qxNWfcVoxMUr3sGa6yHJm-ckt/exec';

  // Fetch staff data from Google Sheet
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
          // Filter out column L (delete column)
          headers = data.table.cols
            .map((col, index) => ({
              id: `col${index}`,
              label: col.label || `Column ${index + 1}`,
              type: col.type || 'string',
              originalIndex: index // Store the original index for reference
            }))
            .filter((header, index) => {
              // Skip the 12th column (L) which is the delete flag column (0-indexed)
              return index !== 11; // Column L is index 11 (0-indexed)
            });
        } else if (allRows.length > 0 && allRows[0].c && allRows[0].c.some(cell => cell && cell.v)) {
          // Filter out column L (delete column)
          headers = allRows[0].c
            .map((cell, index) => ({
              id: `col${index}`,
              label: cell && cell.v ? String(cell.v) : `Column ${index + 1}`,
              type: data.table.cols[index]?.type || 'string',
              originalIndex: index // Store the original index for reference
            }))
            .filter((header, index) => {
              // Skip the 12th column (L) which is the delete flag column (0-indexed)
              return index !== 11; // Column L is index 11 (0-indexed)
            });
          allRows = allRows.slice(1);
        }

        setTableHeaders(headers);

        // Initialize new staff member with empty values for all headers
        const emptyStaff = {};
        headers.forEach(header => {
          emptyStaff[header.id] = '';
        });
        setNewStaffMember(emptyStaff);

        // Define the index for the "deleted" flag column (column L is index 11, 0-indexed)
        const deletedColumnIndex = 11;
        
        const staffData = allRows
          .filter((row) => {
            // Only include rows where column L is NOT "Yes" (exclude deleted staff)
            const isDeleted = row.c && 
                            row.c.length > deletedColumnIndex && 
                            row.c[deletedColumnIndex] && 
                            row.c[deletedColumnIndex].v === "Yes";
            
            return !isDeleted && row.c && row.c.some((cell) => cell && cell.v);
          })
          .map((row, rowIndex) => {
            const staffData = {
              _id: Math.random().toString(36).substring(2, 15),
              _rowIndex: rowIndex + 2, // +2 because of header row and 1-indexed
            };

            row.c && row.c.forEach((cell, index) => {
              // Skip column L (the delete column)
              if (index === deletedColumnIndex) return;

              // Find the corresponding header for this column
              const header = headers.find(h => h.originalIndex === index);
              if (!header) return;
              
              // Handle date values
              if (cell && cell.v && cell.v.toString().indexOf('Date') === 0) {
                const dateString = cell.v.toString();
                const dateParts = dateString.substring(5, dateString.length - 1).split(',');
                
                if (dateParts.length >= 3) {
                  const year = parseInt(dateParts[0]);
                  const month = parseInt(dateParts[1]) + 1;
                  const day = parseInt(dateParts[2]);
                  
                  // Format as DD/MM/YYYY
                  staffData[header.id] = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
                } else {
                  staffData[header.id] = cell.v;
                }
              } else {
                // Handle non-date values
                staffData[header.id] = cell ? cell.v : '';
                
                if (header.type === 'number' && !isNaN(staffData[header.id])) {
                  staffData[header.id] = Number(staffData[header.id]).toLocaleString();
                }
              }
            });

            return staffData;
          });

        setStaffList(staffData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching Google Sheet data:", error);
        setError("Failed to load staff data");
        setLoading(false);
      }
    };

    fetchGoogleSheetData();
  }, []);

  // Filter staff by search term
  const filteredStaff = staffList.filter(staff => {
    for (const key in staff) {
      if (staff[key] && String(staff[key]).toLowerCase().includes(searchTerm.toLowerCase())) {
        return true;
      }
    }
    return false;
  });

  // Handle input change for new staff member form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStaffMember({
      ...newStaffMember,
      [name]: value
    });
  };

  // Handle clicking "Add Staff" button - DEFINE THIS BEFORE IT'S USED IN JSX
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create a full array of data for all columns, including the hidden delete column (L)
      const fullRowData = [];
      
      // Loop through all possible column indexes and add data in the correct positions
      for (let i = 0; i < 13; i++) { // Assuming there are 13 columns total (A-M)
        // Find the header for this column index (if it exists in our filtered headers)
        const header = tableHeaders.find(h => h.originalIndex === i);
        
        if (header) {
          // If we have this header in our UI, use the value from the form
          fullRowData[i] = newStaffMember[header.id] || '';
        } else if (i === 11) {
          // Column L (index 11) is our hidden delete column, set it to "No" for new staff
          fullRowData[i] = "No";
        } else {
          // Any other hidden column gets an empty string
          fullRowData[i] = '';
        }
      }
      
      const formData = new FormData();
      formData.append('sheetName', sheetName);
      formData.append('rowData', JSON.stringify(fullRowData)); 
      formData.append('action', 'insert');

      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData  
      });
      
      console.log("Form submitted successfully");

      const newStaffWithId = {
        ...newStaffMember,
        _id: Math.random().toString(36).substring(2, 15)
      };
      
      setStaffList(prev => [newStaffWithId, ...prev]);
      
      setShowAddForm(false);
      
      // Reset form
      const emptyStaff = {};
      tableHeaders.forEach(header => {
        emptyStaff[header.id] = '';
      });
      
      setNewStaffMember(emptyStaff);
      
      setNotification({
        show: true,
        message: "Staff member added successfully!",
        type: "success"  
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error submitting new staff member:", error);
      
      setNotification({
        show: true,
        message: `Failed to add staff member: ${error.message}`, 
        type: "error"
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" }); 
      }, 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle clicking "Add Staff" button to open modal
  const handleAddStaffClick = () => {
    const emptyStaff = {};
    tableHeaders.forEach(header => {
      emptyStaff[header.id] = '';
    });
  
    // Auto-fill timestamp
    const timestampHeader = tableHeaders.find(header => 
      header.label.toLowerCase().includes('timestamp') || 
      header.label.toLowerCase().includes('date')
    );
    
    if (timestampHeader) {
      const today = new Date();
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      emptyStaff[timestampHeader.id] = `${day}/${month}/${year}`;
    }
  
    // Generate serial number
    const serialHeader = tableHeaders.find(header => 
      header.label.toLowerCase().includes('serial') || 
      header.label.toLowerCase().includes('id') ||
      header.label.toLowerCase().includes('staff id')
    );
  
    if (serialHeader) {
      const serialNumbers = staffList
        .map(staff => staff[serialHeader.id])
        .filter(sn => sn && typeof sn === 'string');
  
      let maxNumber = 0;
      serialNumbers.forEach(sn => {
        const match = sn.match(/SD-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) maxNumber = num;
        }
      });
      
      emptyStaff[serialHeader.id] = `SD-${(maxNumber + 1).toString().padStart(3, '0')}`;
    }
  
    setNewStaffMember(emptyStaff);
    setShowAddForm(true);
  };

  // Handle editing a staff member
  const handleEditStaff = (staff) => {
    setEditingStaffId(staff._id);
    setNewStaffMember({ ...staff });
    setShowEditForm(true);
  };

  // Handle updating a staff member
  const handleUpdateStaff = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    
    try {
      const rowIndex = newStaffMember._rowIndex;
      
      if (!rowIndex) {
        throw new Error("Could not determine the row index for updating this staff member");
      }
      
      // Create a full array of data for all columns, including the hidden delete column (L)
      const fullRowData = [];
      
      // Loop through all possible column indexes and add data in the correct positions
      for (let i = 0; i < 13; i++) { // Assuming there are 13 columns total (A-M)
        // Find the header for this column index (if it exists in our filtered headers)
        const header = tableHeaders.find(h => h.originalIndex === i);
        
        if (header) {
          // If we have this header in our UI, use the value from the form
          fullRowData[i] = newStaffMember[header.id] || '';
        } else if (i === 11) {
          // Column L (index 11) is our hidden delete column
          // Keep it as "No" during update to maintain visibility
          fullRowData[i] = "No";
        } else {
          // Any other hidden column gets an empty string
          fullRowData[i] = '';
        }
      }
      
      const formData = new FormData();
      formData.append('sheetName', sheetName);
      formData.append('rowData', JSON.stringify(fullRowData));
      formData.append('rowIndex', rowIndex);
      formData.append('action', 'update');
      
      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors', 
        body: formData
      });
      
      console.log("Update submitted successfully");
      
      setStaffList(prev => 
        prev.map(staff => 
          staff._id === newStaffMember._id ? newStaffMember : staff  
        )
      );
      
      setEditingStaffId(null);
      setShowEditForm(false);
      
      setNotification({
        show: true,
        message: "Staff member updated successfully!",
        type: "success"
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error updating staff member:", error);
        
      setNotification({
        show: true,
        message: `Failed to update staff member: ${error.message}`,
        type: "error" 
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" }); 
      }, 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle initiating delete confirmation
  const handleDeleteClick = (staff) => {
    setStaffToDelete(staff);
    setShowDeleteModal(true);
  };

  // Handle confirming and soft-deleting a staff member by marking column L as "Yes"
  const confirmDelete = async () => {
    try {
      setSubmitting(true);
      const staff = staffToDelete;
      const rowIndex = staff._rowIndex;
      
      if (!rowIndex) {
        throw new Error("Could not determine the row index for marking this staff member as deleted");
      }
      
      // Use column index 12 (column L) for StaffDb
      const deleteColumnIndex = 12; // L is the 12th column (1-indexed)
      
      const formData = new FormData();
      formData.append('sheetName', sheetName);
      formData.append('rowIndex', rowIndex);
      formData.append('action', 'markDeleted');
      formData.append('columnIndex', deleteColumnIndex);
      formData.append('value', 'Yes');
      
      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors', 
        body: formData
      });
      
      console.log("Mark as deleted submitted successfully");
      
      // Update staff list state - remove from UI
      setStaffList(prev => prev.filter(s => s._id !== staff._id));
      
      setNotification({
        show: true,
        message: "Staff member removed successfully!",
        type: "success"
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error marking staff member as deleted:", error);
        
      setNotification({
        show: true,
        message: `Failed to remove staff member: ${error.message}`,
        type: "error" 
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 5000);
    } finally {
      setSubmitting(false);
      setShowDeleteModal(false);
      setStaffToDelete(null);
    }
  };

  // Handle canceling delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setStaffToDelete(null);
  };

  // Generate form field based on header type
  const renderFormField = (header, isEdit = false) => {
    const handleChange = isEdit ? handleInputChange : handleInputChange;
    const formData = isEdit ? newStaffMember : newStaffMember;
    
    // For date fields, provide a date picker
    if (header.label.toLowerCase().includes('date') || header.label.toLowerCase().includes('join')) {
      // Convert the date format (DD/MM/YYYY) to YYYY-MM-DD for the date input
      let dateValue = formData[header.id] || '';
      if (dateValue && dateValue.includes('/')) {
        const [day, month, year] = dateValue.split('/');
        dateValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      return (
        <input
          type="date"
          id={`${isEdit ? 'edit-' : ''}${header.id}`}
          name={header.id}
          value={dateValue}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
        />
      );
    }
    
    // For email fields
    if (header.label.toLowerCase().includes('email')) {
      return (
        <input
          type="email"
          id={`${isEdit ? 'edit-' : ''}${header.id}`}
          name={header.id}
          value={formData[header.id] || ''}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
        />
      );
    }
    
    // For phone fields
    if (header.label.toLowerCase().includes('phone')) {
      return (
        <input
          type="tel"
          id={`${isEdit ? 'edit-' : ''}${header.id}`}
          name={header.id}
          value={formData[header.id] || ''}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
        />
      );
    }
    
    // Default to text input
    return (
      <input
        type="text"
        id={`${isEdit ? 'edit-' : ''}${header.id}`}
        name={header.id} 
        value={formData[header.id] || ''}
        onChange={handleChange}
        className="w-full p-2 border rounded-md"
      />
    );
  };

  // Function to get a friendly column name for display
  const getColumnName = (header) => {
    // Map column IDs to friendly names if needed
    return header.label;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Staff Database</h2>
      
      {/* Search and Add Bar */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search staff..."
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors duration-300"
          onClick={handleAddStaffClick}
        >
          <UserPlus size={18} />
          <span>Add Staff</span>
        </button>
      </div>
      
      {/* Staff List */}
      <div className="bg-white rounded-md shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-4"></div>
            <p className="text-pink-600">Loading staff data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
            {error} <button className="underline ml-2" onClick={() => window.location.reload()}>Try again</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {tableHeaders.map((header) => (
                    <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getColumnName(header)}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((staff) => (
                    <tr key={staff._id}>
                      {/* Display mode row */}
                      {tableHeaders.map((header, index) => (
                        <td key={`display-${staff._id}-${header.id}`} className="px-6 py-4 whitespace-nowrap">
                          {index === 0 ? (
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center">
                                <User className="text-pink-600" size={20} />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{staff[header.id]}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-900">{staff[header.id]}</div>
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-pink-600 hover:text-pink-800 mr-3"
                          onClick={() => handleEditStaff(staff)}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteClick(staff)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={tableHeaders.length + 1} className="px-6 py-4 text-center text-gray-500">
                      No staff members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for adding new staff */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-blue-800">Add New Staff Member</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowAddForm(false)}
                >
                  <X size={24} />
                </button>
              </div>
      
              <form onSubmit={handleAddStaff} className="space-y-6"> 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tableHeaders.map((header) => (
                    <div key={header.id}>
                      <label htmlFor={header.id} className="block text-sm font-medium text-blue-700">
                        {getColumnName(header)}
                      </label>
                      {renderFormField(header)}  
                    </div>
                  ))}
                </div>
          
                <div className="flex justify-end space-x-3 pt-4 border-t border-blue-100">
                  <button
                    type="button"
                    className="px-4 py-2 border border-blue-300 rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => setShowAddForm(false)}
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
                        Save Staff
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for editing staff */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-blue-800">Edit Staff Member</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingStaffId(null);
                  }}
                >
                  <X size={24} />
                </button>
              </div>
      
              <form onSubmit={handleUpdateStaff} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tableHeaders.map((header) => (
                    <div key={`edit-${header.id}`}>
                      <label htmlFor={`edit-${header.id}`} className="block text-sm font-medium text-blue-700">
                        {getColumnName(header)} 
                      </label>
                      {renderFormField(header, true)}
                    </div> 
                  ))}
                </div>
          
                <div className="flex justify-end space-x-3 pt-4 border-t border-blue-100">
                  <button
                    type="button"
                    className="px-4 py-2 border border-blue-300 rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingStaffId(null);
                    }}
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
                        Update Staff 
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>    
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-2 rounded-full mr-3">
                  <Trash2 className="text-red-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove this staff member? This action cannot be undone.
                {staffToDelete && (
                  <span className="font-medium block mt-2">
                    Staff Name: {staffToDelete[tableHeaders.find(h => h.label.toLowerCase().includes('name'))?.id]}
                  </span>
                )}
              </p>
        
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  onClick={cancelDelete}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 flex items-center"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                    <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} className="mr-2" />
                      Delete Staff
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification popup */}
      {notification.show && (
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${
          notification.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"  
        }`}>
          <p className="font-medium">{notification.message}</p>
        </div>
      )}
    </div>
  );
};

export default StaffDb;