"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Edit2, Trash2, X, Save, Filter, AlertTriangle, Edit, History } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const Services = ({ isAdmin = false }) => {
  // State management
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddServiceForm, setShowAddServiceForm] = useState(false)
  const [showEditServiceForm, setShowEditServiceForm] = useState(false)
  const [newService, setNewService] = useState({})
  const [editingService, setEditingService] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: ""
  })
  const [tableHeaders, setTableHeaders] = useState([])
  const [stats, setStats] = useState({
    totalServices: 0,
    avgPrice: 0,
    mostPopular: ""
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historySearchTerm, setHistorySearchTerm] = useState("")
  const [allServices, setAllServices] = useState([]) // Store all services for history

  // Google Sheet Details
  const sheetId = '1Kb-fhC1yiFJCyPO7TJDqnu-lQ1n1H6mLErlkSPc6yHc'
  const sheetName = 'Service DB'

  // Google Apps Script Web App URL
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbyhmDsXWRThVsJCfAirTsI3o9EGE-oCcw2HKz1ERe4qxNWfcVoxMUr3sGa6yHJm-ckt/exec'

  useEffect(() => {
    fetchServiceData()
  }, [])
  
  // Modified function to process headers (similar to inventory)
  const processHeaders = (headers) => {
    // Custom sorting to ensure Serial No. is first, then Service ID
    headers.sort((a, b) => {
      const serialNoPatterns = ['serial no', 'serial', 'sno', 'sr no', 'sr.no']
      const serviceIdPatterns = ['service id', 'serviceid', 'service_id']
      
      const aLower = a.label.toLowerCase()
      const bLower = b.label.toLowerCase()
      
      const aIsSerialNo = serialNoPatterns.some(pattern => aLower.includes(pattern))
      const bIsSerialNo = serialNoPatterns.some(pattern => bLower.includes(pattern))
      
      const aIsServiceId = serviceIdPatterns.some(pattern => aLower.includes(pattern))
      const bIsServiceId = serviceIdPatterns.some(pattern => bLower.includes(pattern))
      
      // Prioritize Serial No. to be first
      if (aIsSerialNo) return -1
      if (bIsSerialNo) return 1
      
      // Then prioritize Service ID
      if (aIsServiceId) return -1
      if (bIsServiceId) return 1
      
      // Maintain original order for other columns
      return 0
    })
    
    return headers
  }

  const fetchServiceData = async () => {
    try {
      setLoading(true)
      console.log("Starting to fetch Google Sheet data...")

      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }

      const text = await response.text()
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}')
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)

      if (!data.table || !data.table.cols || data.table.cols.length === 0) {
        setError("No data found in the sheet")
        setLoading(false)
        return
      }

      let headers = []
      let allRows = data.table.rows || []

      // Exclude the delete column (column G) - 6 is index for column G (0-indexed)
      const deleteColumnIndex = 6;  // This corresponds to column G

      if (data.table.cols && data.table.cols.some(col => col.label)) {
        headers = data.table.cols
          .filter((_, index) => index !== deleteColumnIndex)
          .map((col, index) => ({
            id: `col${index}`,
            label: col.label || `Column ${index + 1}`,
            type: col.type || 'string'
          }))
      } else if (allRows.length > 0 && allRows[0].c && allRows[0].c.some(cell => cell && cell.v)) {
        headers = allRows[0].c
          .filter((_, index) => index !== deleteColumnIndex)
          .map((cell, index) => ({
            id: `col${index}`,
            label: cell && cell.v ? String(cell.v) : `Column ${index + 1}`,
            type: data.table.cols[index]?.type || 'string'
          }))
        allRows = allRows.slice(1)
      }

      // Process headers
      const processedHeaders = processHeaders(headers)
      setTableHeaders(processedHeaders)

      // Initialize new service with empty values for all headers
      const emptyService = {}
      processedHeaders.forEach(header => {
        emptyService[header.id] = ''
      })
      setNewService(emptyService)

      const servicesData = allRows
        .filter((row) => row.c && row.c.some((cell) => cell && cell.v))
        .map((row, rowIndex) => {
          const serviceData = {
            _id: Math.random().toString(36).substring(2, 15),
            _rowIndex: rowIndex + 2, // +2 accounts for header row and 1-indexing in spreadsheets
          }

          row.c && row.c.forEach((cell, index) => {
            // Skip the delete column 
            if (index === deleteColumnIndex) {
              // Store delete status but don't include it as a visible column
              serviceData['_deleted'] = cell && cell.v === 'Yes';
              return;
            }

            // Adjust the index for columns after the delete column
            let adjustedIndex = index;
            if (index > deleteColumnIndex) {
              adjustedIndex = index - 1;
            }

            const header = headers[adjustedIndex];
            if (!header) return; // Skip if no matching header
            
            // Handle date values
            if (cell && cell.v && cell.v.toString().indexOf('Date') === 0) {
              const dateString = cell.v.toString();
              const dateParts = dateString.substring(5, dateString.length - 1).split(',');
              
              if (dateParts.length >= 3) {
                const year = parseInt(dateParts[0]);
                // Month is 0-based in JavaScript Date objects, so add 1
                const month = parseInt(dateParts[1]) + 1;
                const day = parseInt(dateParts[2]);
                
                // Format as DD/MM/YYYY
                serviceData[header.id] = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
              } else {
                serviceData[header.id] = cell.v;
              }
            } else {
              // Handle non-date values
              serviceData[header.id] = cell ? cell.v : '';
              
              if (header.type === 'number' && !isNaN(serviceData[header.id])) {
                serviceData[header.id] = Number(serviceData[header.id]).toLocaleString();
              }
            }
          })

          return serviceData
        })

      // Filter out "deleted" services
      const activeServices = servicesData.filter(service => !service._deleted);
      
      // Store all services for history view
      setAllServices(servicesData);
      
      // Only display active services in the main list
      setServices(activeServices);

      // Extract categories from services
      const categorySet = new Set()
      activeServices.forEach(service => {
        const categoryHeader = processedHeaders.find(h => h.label.toLowerCase().includes('category'))
        if (categoryHeader && service[categoryHeader.id]) {
          categorySet.add(service[categoryHeader.id])
        }
      })

      const categoryArray = Array.from(categorySet)
      const categoriesWithCount = categoryArray.map((categoryName, index) => {
        const count = activeServices.filter(service => {
          const categoryHeader = processedHeaders.find(h => h.label.toLowerCase().includes('category'))
          return categoryHeader && service[categoryHeader.id] === categoryName
        }).length

        return {
          id: index + 1,
          name: categoryName,
          count: count
        }
      })

      setCategories(categoriesWithCount)

      // Calculate statistics
      const priceHeader = processedHeaders.find(h => h.label.toLowerCase().includes('price'))
      let avgPrice = 0
      if (priceHeader) {
        const totalPrice = activeServices.reduce((sum, service) => {
          const price = parseFloat(service[priceHeader.id]?.toString().replace(/,/g, '') || '0')
          return !isNaN(price) ? sum + price : sum
        }, 0)
        avgPrice = activeServices.length > 0 ? totalPrice / activeServices.length : 0;
      }

      // Find most popular category (category with most services)
      let mostPopular = categoriesWithCount.reduce(
        (max, category) => (category.count > max.count ? category : max),
        { count: 0, name: "None" }
      ).name

      setStats({
        totalServices: activeServices.length,
        avgPrice: avgPrice,
        mostPopular: mostPopular
      })

      setLoading(false)
    } catch (error) {
      console.error("Error fetching Google Sheet data:", error)
      setError("Failed to load service data")
      setLoading(false)
    }
  }

  // Filter services based on selected category and search term
  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === "All" || 
      (service.category === selectedCategory || 
       service[tableHeaders.find(h => h.label.toLowerCase().includes('category'))?.id] === selectedCategory)
    
    const matchesSearch = searchTerm === "" || 
      Object.values(service).some(value => 
        value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    return matchesCategory && matchesSearch
  })

  // Function to filter history services
  const filteredHistoryServices = historySearchTerm
    ? allServices.filter(service => 
        Object.values(service).some(value => 
          value && value.toString().toLowerCase().includes(historySearchTerm.toLowerCase())
        )
      )
    : allServices

  // Handle input change for new service form
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewService(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle input change for edit service form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target
    setEditingService(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle edit click
  const handleEditClick = (service) => {
    // Make sure we're correctly capturing the rowIndex from the original service
    setEditingService({
      ...service,
      _rowIndex: service._rowIndex // Ensure this property is explicitly passed
    });
    setShowEditServiceForm(true);
  }

  // Function to initiate delete confirmation
  const handleDeleteClick = (service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  }

  // Function to open history modal
  const handleHistoryClick = () => {
    setHistorySearchTerm("");
    setShowHistoryModal(true);
  }

  const handleAddServiceClick = () => {
    const emptyService = {};
    tableHeaders.forEach(header => {
      emptyService[header.id] = '';
    });
  
    // Find the Serial No. column
    const serialNoHeader = tableHeaders.find(header => 
      ['serial no', 'serial', 'sno', 'sr no', 'sr.no'].some(pattern => 
        header.label.toLowerCase().includes(pattern)
      )
    );
    
    if (serialNoHeader) {
      // Get all existing Serial Nos from the current services
      const serialNos = services
        .map(s => s[serialNoHeader.id])
        .filter(id => id && typeof id === 'string');
      
      // Find the maximum existing Serial No
      let maxId = 0;
      serialNos.forEach(id => {
        // Use regex to extract the numeric part of the Serial No
        const match = id.toString().match(/(\d+)/);
        if (match) {
          // Convert the matched number to an integer
          const num = parseInt(match[1], 10);
          // Update maxId if this number is larger
          if (num > maxId) maxId = num;
        }
      });
      
      // Generate a new Serial No with SD- prefix and padded to 3 digits
      emptyService[serialNoHeader.id] = `SD-${(maxId + 1).toString().padStart(3, '0')}`;
    }
  
    setNewService(emptyService);
    setShowAddServiceForm(true);
  };

  // Handle form submission for new services
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const rowData = tableHeaders.map(header => 
        newService[header.id] || ''  
      )
      
      const formData = new FormData()
      formData.append('sheetName', sheetName)
      formData.append('rowData', JSON.stringify(rowData)) 
      formData.append('action', 'insert')

      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData  
      })
      
      console.log("Form submitted successfully")

      const newServiceWithId = {
        ...newService,
        _id: Math.random().toString(36).substring(2, 15)
      }
      
      setServices(prev => [newServiceWithId, ...prev])
      setAllServices(prev => [newServiceWithId, ...prev])
      
      // Update categories if new category added
      const categoryHeader = tableHeaders.find(h => h.label.toLowerCase().includes('category'))
      if (categoryHeader && newService[categoryHeader.id]) {
        const newCategory = newService[categoryHeader.id]
        const existingCategory = categories.find(c => c.name === newCategory)
        
        if (existingCategory) {
          setCategories(prev => 
            prev.map(c => c.name === newCategory ? {...c, count: c.count + 1} : c)
          )
        } else {
          setCategories(prev => [
            ...prev, 
            { id: prev.length + 1, name: newCategory, count: 1 }
          ])
        }
      }
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalServices: prev.totalServices + 1,
      }))
      
      setShowAddServiceForm(false)
      setNewService(Object.fromEntries(tableHeaders.map(h => [h.id, ''])))
      
      setNotification({
        show: true,
        message: "Service added successfully!",
        type: "success"  
      })
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 3000)
    } catch (error) {
      console.error("Error submitting new service:", error)
      
      setNotification({
        show: true,
        message: `Failed to add service: ${error.message}`, 
        type: "error"
      })
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" }) 
      }, 5000)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Get the row index from the editingService state
      const rowIndex = editingService._rowIndex;
      
      // Add debug logging to see what's happening
      console.log("Updating service with row index:", rowIndex);
      console.log("Editing service data:", editingService);
      
      if (!rowIndex) {
        throw new Error("Could not determine the row index for updating this service");
      }
      
      const rowData = tableHeaders.map(header => 
        editingService[header.id] || ''
      );
      
      const formData = new FormData();
      formData.append('sheetName', sheetName);
      formData.append('rowData', JSON.stringify(rowData));
      formData.append('rowIndex', rowIndex);
      formData.append('action', 'update');
      
      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors', 
        body: formData
      });
      
      console.log("Update submitted successfully");
      
      setServices(prev => 
        prev.map(service => 
          service._id === editingService._id ? editingService : service  
        )
      );
      
      // Update allServices for history view
      setAllServices(prev => 
        prev.map(service => 
          service._id === editingService._id ? editingService : service  
        )
      );
      
      setShowEditServiceForm(false);
      
      setNotification({
        show: true,
        message: "Service updated successfully!",
        type: "success"
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error updating service:", error);
        
      setNotification({
        show: true,
        message: `Failed to update service: ${error.message}`,
        type: "error" 
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 5000);
    } finally {
      setSubmitting(false);
    }
  }

  // Function to confirm and "soft delete" a service by marking the delete column as "Yes"
  const confirmDelete = async () => {
    try {
      setSubmitting(true);
      const service = serviceToDelete;
      const rowIndex = service._rowIndex;
      
      if (!rowIndex) {
        throw new Error("Could not determine the row index for marking this service as deleted");
      }
      
      // Use column index 7 (column G) for Service DB - 1-indexed for the API
      const deleteColumnIndex = 7; // G is the 7th column (1-indexed)
      
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
      
      // Update services state - remove from UI
      setServices(prev => prev.filter(s => s._id !== service._id));
      
      // Update allServices for history view - mark as deleted
      setAllServices(prev => 
        prev.map(s => 
          s._id === service._id ? { ...s, _deleted: true } : s
        )
      );
      
      // Update categories
      const categoryHeader = tableHeaders.find(h => h.label.toLowerCase().includes('category'));
      if (categoryHeader && service[categoryHeader.id]) {
        const categoryName = service[categoryHeader.id];
        setCategories(prev => 
          prev.map(c => {
            if (c.name === categoryName) {
              const newCount = c.count - 1;
              return newCount > 0 ? {...c, count: newCount} : null;
            }
            return c;
          }).filter(Boolean)
        );
      }
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalServices: prev.totalServices - 1
      }));
      
      setNotification({
        show: true,
        message: "Service removed successfully!",
        type: "success"
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error marking service as deleted:", error);
        
      setNotification({
        show: true,
        message: `Failed to remove service: ${error.message}`,
        type: "error" 
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" }); 
      }, 5000);
    } finally {
      setSubmitting(false);
      setShowDeleteModal(false);
      setServiceToDelete(null);
    }
  };

  // Function to cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setServiceToDelete(null);
  };

  // Render form field based on header type
  const renderFormField = (header, isEdit = false) => {
    const handleChange = isEdit ? handleEditInputChange : handleInputChange
    const formData = isEdit ? editingService : newService
    
    const isId = header.label.toLowerCase().includes('no') || 
      header.label.toLowerCase() === 'serial no';
    
    // For read-only ID fields
    if (isId) {
      return (
        <input
          type="text"
          id={`${isEdit ? 'edit-' : ''}${header.id}`}
          name={header.id}
          value={formData[header.id] || ''}
          readOnly
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-100"
        />
      );
    }
    
    // For duration fields
    if (header.label.toLowerCase().includes('duration')) {
      // Custom handler for duration to add 'min' automatically
      const handleDurationChange = (e) => {
        const { name, value } = e.target;
        // Remove non-numeric characters
        const numericValue = value.replace(/[^0-9]/g, '');
        
        // Create the formatted value with 'min' if we have a number
        const formattedValue = numericValue ? `${numericValue} min` : '';
        
        if (isEdit) {
          setEditingService(prev => ({
            ...prev,
            [name]: formattedValue
          }));
        } else {
          setNewService(prev => ({
            ...prev,
            [name]: formattedValue
          }));
        }
      };
      
      // Extract numeric value for the input
      const numericValue = formData[header.id] ? 
        formData[header.id].replace(/[^0-9]/g, '') : '';
      
      return (
        <div className="flex items-center">
          <input 
            type="number"
            id={`${isEdit ? 'edit-' : ''}${header.id}`} 
            name={header.id}
            value={numericValue}
            onChange={handleDurationChange}
            placeholder="45"
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
          />
          <span className="ml-2 text-gray-500">min</span>
        </div>
      )
    }
    
    // For price fields
    if (header.label.toLowerCase().includes('price')) {
      return (
        <input
          type="number"  
          id={`${isEdit ? 'edit-' : ''}${header.id}`}
          name={header.id}
          value={formData[header.id]?.toString().replace(/,/g, '') || ''}
          onChange={handleChange}
          min={0}
          step="0.01"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      )
    }
    
    // For category field (dropdown if categories exist)
    if (header.label.toLowerCase().includes('category') && categories.length > 0) {
      return (
        <select
          id={`${isEdit ? 'edit-' : ''}${header.id}`}
          name={header.id}
          value={formData[header.id] || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">Select Category</option>
          {categories.map(category => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
          <option value="new-category">+ Add New Category</option>
        </select>
      )
    }
    
    // For description fields (textarea)
    if (header.label.toLowerCase().includes('description')) {
      return (
        <textarea
          id={`${isEdit ? 'edit-' : ''}${header.id}`}
          name={header.id}
          value={formData[header.id] || ''}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      )
    }
    
    // Default to text input
    return (
      <input
        type="text"
        id={`${isEdit ? 'edit-' : ''}${header.id}`}
        name={header.id} 
        value={formData[header.id] || ''}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Services Management</h2>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search services..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            {isAdmin && (
              <button 
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                onClick={handleAddServiceClick}
              >
                <Plus size={18} className="mr-2" />
                Add Service
              </button>
            )}
            {isAdmin && (
              <button 
                className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-indigo-700"
                onClick={handleHistoryClick}
              >
                <History size={18} className="mr-2" />
                View History
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Service Categories</h3>
          <div className="space-y-4">
            <button
              className={`w-full text-left px-4 py-3 rounded-md ${
                selectedCategory === "All" ? "bg-pink-50 text-blue-600" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setSelectedCategory("All")}
            >
              All Services ({services.length})
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`w-full text-left px-4 py-3 rounded-md ${
                  selectedCategory === category.name
                    ? "bg-pink-50 text-pink-600"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedCategory(category.name)}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
          {isAdmin && (
            <div className="mt-6">
              <button 
                className="flex items-center text-pink-600 hover:text-pink-700"
                onClick={() => {
                  const categoryName = prompt("Enter new category name:")
                  if (categoryName && !categories.some(c => c.name === categoryName)) {
                    setCategories(prev => [
                      ...prev,
                      { id: prev.length + 1, name: categoryName, count: 0 }
                    ])
                  }
                }}
              >
                <Plus size={16} className="mr-2" />
                Add New Category
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Service Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Total Services</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalServices}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Categories</p>
              <p className="text-2xl font-bold text-gray-800">{categories.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Avg. Price</p>
              <p className="text-2xl font-bold text-gray-800">
              ₹{stats.avgPrice.toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Most Popular</p>
              <p className="text-2xl font-bold text-gray-800">{stats.mostPopular}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">
            {selectedCategory === "All" ? "All Services" : `${selectedCategory} Services`}
          </h3>
        </div>
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-blue-600">Loading services data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
            {error} <button className="underline ml-2" onClick={() => fetchServiceData()}>Try again</button>
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
                  {/* Only add Actions column for admin users */}
                  {isAdmin && (
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.length > 0 ? (
                  filteredServices.map((service) => (
                    <tr key={service._id}>
                      {tableHeaders.map((header) => (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                          {header.label.toLowerCase() === 'description' ? (
                            <div className="text-sm text-gray-900 max-w-xs break-words whitespace-normal">{service[header.id]}</div>
                          ) : (
                            <div className="text-sm text-gray-900">{service[header.id]}</div>
                          )}
                        </td>
                      ))}
                      {/* Admin actions column */}
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            className="text-blue-600 hover:text-blue-900 mr-3" 
                            onClick={() => handleEditClick(service)}
                          >
                            <Edit size={16} className="inline mr-1" />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteClick(service)}
                          >
                            <Trash2 size={16} className="inline mr-1" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? tableHeaders.length + 1 : tableHeaders.length} className="px-6 py-10 text-center text-gray-500">
                      No services found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
  
      {/* Modal for adding new service */}
      <AnimatePresence>
        {showAddServiceForm && (
          <motion.div
            key="newServiceModal"
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
                  <h3 className="text-xl font-bold text-pink-600">Add New Service</h3>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setShowAddServiceForm(false)}
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
            
                  <div className="flex justify-end space-x-3 pt-4 border-t border-pink-100">
                    <button
                      type="button"
                      className="px-4 py-2 border border-pink-300 rounded-md shadow-sm text-pink-700 bg-white hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      onClick={() => setShowAddServiceForm(false)}
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
                            Save Service
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

        {/* Delete confirmation modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              key="deleteModal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-red-100 p-2 rounded-full mr-3">
                      <AlertTriangle className="text-red-600" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this service? This action cannot be undone.
                    {serviceToDelete && (
                      <span className="font-medium block mt-2">
                        Service ID: {serviceToDelete[tableHeaders.find(h => h.label.toLowerCase().includes('id') || h.label.toLowerCase().includes('serial'))?.id]}
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
                          Delete Service
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
          
        {/* History Modal - Shows All Services */}
        <AnimatePresence>
          {showHistoryModal && (
            <motion.div
              key="historyModal"
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
                    <h3 className="text-xl font-bold text-gray-800">Services History</h3>
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
                        placeholder="Search all services..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
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
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredHistoryServices.length > 0 ? (
                          filteredHistoryServices.map((service) => (
                            <tr key={`history-${service._id}`} className={service._deleted ? 'bg-red-50' : 'hover:bg-gray-50'}>
                              {tableHeaders.map((header) => (
                                <td key={`history-${service._id}-${header.id}`} className="px-6 py-4 whitespace-nowrap">
                                  {header.label.toLowerCase() === 'description' ? (
                                    <div className="text-sm text-gray-900 max-w-xs break-words whitespace-normal">{service[header.id]}</div>
                                  ) : (
                                    <div className="text-sm text-gray-900">{service[header.id]}</div>
                                  )}
                                </td>
                              ))}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  service._deleted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {service._deleted ? 'Deleted' : 'Active'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={tableHeaders.length + 1} className="px-6 py-4 text-center text-gray-500">
                              {historySearchTerm ? "No services matching your search" : "No service history found"}
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

        <AnimatePresence>
          {showEditServiceForm && (
            <motion.div
              key="editServiceModal"
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
                    <h3 className="text-xl font-bold text-pink-600">Edit Service</h3>
                    <button 
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => setShowEditServiceForm(false)}
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
                          {renderFormField(header, true)}
                        </div> 
                      ))}
                    </div>
              
                    <div className="flex justify-end space-x-3 pt-4 border-t border-pink-100">
                      <button
                        type="button"
                        className="px-4 py-2 border border-pink-300 rounded-md shadow-sm text-pink-700 bg-white hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        onClick={() => setShowEditServiceForm(false)}
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
                            Update Service 
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
              className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${
                notification.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"  
              }`}
            >
              <p className="font-medium">{notification.message}</p>
            </motion.div>
          )}  
        </AnimatePresence>
      </div>
    );
  };
  
  export default Services;