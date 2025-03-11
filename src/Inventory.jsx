"use client"

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion"
import { Package, Trash2, Search, AlertTriangle, ShoppingCart, Plus, Filter, Edit, X, Save } from "lucide-react"

const Inventory = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tableHeaders, setTableHeaders] = useState([])
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    outOfStock: 0
  })
  const [showNewProductForm, setShowNewProductForm] = useState(false)
  const [showEditProductForm, setShowEditProductForm] = useState(false)
  const [newProduct, setNewProduct] = useState({})
  const [editingProduct, setEditingProduct] = useState({}) 
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState({
    show: false, 
    message: "",
    type: ""
  })
  // Add state for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)

  // Google Sheet Details
  const sheetId = '1Kb-fhC1yiFJCyPO7TJDqnu-lQ1n1H6mLErlkSPc6yHc'
  const sheetName = 'Inventory DB'

  // Google Apps Script Web App URL
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbyhmDsXWRThVsJCfAirTsI3o9EGE-oCcw2HKz1ERe4qxNWfcVoxMUr3sGa6yHJm-ckt/exec'

  useEffect(() => {
    const fetchGoogleSheetData = async () => {
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

        if (data.table.cols && data.table.cols.some(col => col.label)) {
          headers = data.table.cols.map((col, index) => ({
            id: `col${index}`,
            label: col.label || `Column ${index + 1}`,
            type: col.type || 'string'
          }))
        } else if (allRows.length > 0 && allRows[0].c && allRows[0].c.some(cell => cell && cell.v)) {
          headers = allRows[0].c.map((cell, index) => ({
            id: `col${index}`,
            label: cell && cell.v ? String(cell.v) : `Column ${index + 1}`,
            type: data.table.cols[index]?.type || 'string'
          }))
          allRows = allRows.slice(1)
        }

        setTableHeaders(headers)

        // Initialize new product with empty values for all headers
        const emptyProduct = {}
        headers.forEach(header => {
          emptyProduct[header.id] = ''
        })
        setNewProduct(emptyProduct)

        const productsData = allRows
          .filter((row) => row.c && row.c.some((cell) => cell && cell.v))
          .map((row, rowIndex) => {
            const productData = {
              _id: Math.random().toString(36).substring(2, 15),
              _rowIndex: rowIndex + 2,
            }

            row.c &&
  row.c.forEach((cell, index) => {
    if (index < headers.length) {
      const header = headers[index]
      
      // Handle date values
      if (cell && cell.v && cell.v.toString().indexOf('Date') === 0) {
        // Parse the date string: Date(2025,2,10)
        const dateString = cell.v.toString();
        const dateParts = dateString.substring(5, dateString.length - 1).split(',');
        
        if (dateParts.length >= 3) {
          const year = parseInt(dateParts[0]);
          // Month is 0-based in JavaScript Date objects, so add 1
          const month = parseInt(dateParts[1]) + 1;
          const day = parseInt(dateParts[2]);
          
          // Format as DD/MM/YYYY
          productData[header.id] = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        } else {
          productData[header.id] = cell.v;
        }
      } else {
        // Handle non-date values
        productData[header.id] = cell ? cell.v : '';
        
        if (header.type === 'number' && !isNaN(productData[header.id])) {
          productData[header.id] = Number(productData[header.id]).toLocaleString();
        }
      }
    }
  })

            return productData
          })

        setProducts(productsData)

        const lowStockItems = productsData.filter((product) => {
          const stockField = headers.find(
            (h) =>
              h.label.toLowerCase().includes('stock') ||
              h.label.toLowerCase().includes('quantity')
          )

          if (stockField) {
            const stock = parseInt(product[stockField.id].replace(/,/g, ''))
            return !isNaN(stock) && stock > 0 && stock <= 10 
          }
          return false
        }).length

        const outOfStockItems = productsData.filter((product) => {
          const stockField = headers.find(
            (h) =>
              h.label.toLowerCase().includes('stock') ||
              h.label.toLowerCase().includes('quantity')
          )

          if (stockField) {
            const stock = parseInt(product[stockField.id].replace(/,/g, ''))
            return !isNaN(stock) && stock === 0
          }
          return false
        }).length

        setStats({
          totalProducts: productsData.length,
          lowStockItems,
          outOfStock: outOfStockItems
        })

        setLoading(false)
      } catch (error) {
        console.error("Error fetching Google Sheet data:", error)
        setError("Failed to load inventory data")
        setLoading(false)
      }
    }

    fetchGoogleSheetData()
  }, [])

  // Function to handle search
  const [searchTerm, setSearchTerm] = useState("")
  const filteredProducts = searchTerm
    ? products.filter(product => 
        Object.values(product).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : products

  // Handle input change for new product form 
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewProduct(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Handle input change for edit product form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target  
    setEditingProduct(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Function to start editing a product
  const handleEditClick = (product) => {
    setEditingProduct(product)
    setShowEditProductForm(true)
  }

  // Function to initiate delete confirmation
  const handleDeleteClick = (product) => {
    setProductToDelete(product)
    setShowDeleteModal(true)
  }

  // Function to confirm and actually delete a product
  const confirmDelete = async () => {
    try {
      setSubmitting(true)
      const product = productToDelete
      const rowIndex = product._rowIndex
      
      if (!rowIndex) {
        throw new Error("Could not determine the row index for deleting this product")
      }
      
      const formData = new FormData()
      formData.append('sheetName', sheetName)
      formData.append('rowIndex', rowIndex)
      formData.append('action', 'delete')
      
      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors', 
        body: formData
      })
      
      console.log("Delete submitted successfully")
      
      // Update products state
      setProducts(prev => prev.filter(p => p._id !== product._id))
      
      // Update stats
      const stockField = tableHeaders.find(
        (h) =>
          h.label.toLowerCase().includes('stock') ||
          h.label.toLowerCase().includes('quantity')
      )
      
      if (stockField) {
        const stock = parseInt(product[stockField.id]?.toString().replace(/,/g, '') || '0')
        
        setStats(prev => ({
          ...prev,
          totalProducts: prev.totalProducts - 1,
          lowStockItems: (stock > 0 && stock <= 10) ? prev.lowStockItems - 1 : prev.lowStockItems,
          outOfStock: (stock === 0) ? prev.outOfStock - 1 : prev.outOfStock
        }))
      } else {
        setStats(prev => ({
          ...prev,
          totalProducts: prev.totalProducts - 1
        }))
      }
      
      setNotification({
        show: true,
        message: "Product deleted successfully!",
        type: "success"
      })
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 3000)
    } catch (error) {
      console.error("Error deleting product:", error)
        
      setNotification({
        show: true,
        message: `Failed to delete product: ${error.message}`,
        type: "error" 
      })
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 5000)
    } finally {
      setSubmitting(false)
      setShowDeleteModal(false)
      setProductToDelete(null)
    }
  }

  // Function to cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false)
    setProductToDelete(null)
  }

  const handleNewProductClick = () => {
    const emptyProduct = {};
    tableHeaders.forEach(header => {
      emptyProduct[header.id] = '';
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
      emptyProduct[timestampHeader.id] = `${day}/${month}/${year}`;
    }
  
    // Generate serial number
    const serialHeader = tableHeaders.find(header => 
      header.label.toLowerCase().includes('serial') || 
      header.label.toLowerCase().includes('product id')
    );
  
    if (serialHeader) {
      const serialNumbers = products
        .map(p => p[serialHeader.id])
        .filter(sn => sn && typeof sn === 'string');
  
      let maxNumber = 0;
      serialNumbers.forEach(sn => {
        const match = sn.match(/PR-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) maxNumber = num;
        }
      });
      
      emptyProduct[serialHeader.id] = `PR-${(maxNumber + 1).toString().padStart(3, '0')}`;
    }
  
    setNewProduct(emptyProduct);
    setShowNewProductForm(true);
  };
  
  // Handle form submission for new products
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const rowData = tableHeaders.map(header => 
        newProduct[header.id] || ''  
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

      const newProductWithId = {
        ...newProduct,
        _id: Math.random().toString(36).substring(2, 15)
      }
      
      setProducts(prev => [newProductWithId, ...prev])
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalProducts: prev.totalProducts + 1
      }))
      
      if (newProduct[tableHeaders.find(h => h.label.toLowerCase().includes('stock'))?.id] <= 10) {
        setStats(prev => ({
          ...prev,
          lowStockItems: prev.lowStockItems + 1    
        }))
      }
      
      if (newProduct[tableHeaders.find(h => h.label.toLowerCase().includes('stock'))?.id] == 0) {
        setStats(prev => ({
          ...prev,
          outOfStock: prev.outOfStock + 1
        })) 
      }
      
      setShowNewProductForm(false)
      setNewProduct(Object.fromEntries(tableHeaders.map(h => [h.id, ''])))
      
      setNotification({
        show: true,
        message: "Product added successfully!",
        type: "success"  
      })
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 3000)
    } catch (error) {
      console.error("Error submitting new product:", error)
      
      setNotification({
        show: true,
        message: `Failed to add product: ${error.message}`, 
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
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const rowIndex = editingProduct._rowIndex
      
      if (!rowIndex) {
        throw new Error("Could not determine the row index for updating this product")
      }
      
      const rowData = tableHeaders.map(header => 
        editingProduct[header.id] || ''
      )
      
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
      
      setProducts(prev => 
        prev.map(product => 
          product._id === editingProduct._id ? editingProduct : product  
        )
      )
      
      setShowEditProductForm(false)
      
      setNotification({
        show: true,
        message: "Product updated successfully!",
        type: "success"
      })
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 3000)
    } catch (error) {
      console.error("Error updating product:", error)
        
      setNotification({
        show: true,
        message: `Failed to update product: ${error.message}`,
        type: "error" 
      })
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" }) 
      }, 5000)
    } finally {
      setSubmitting(false)
    }
  }

  // Generate appropriate input field based on header type
  // Modify the renderFormField function to handle stock status with a dropdown
  const renderFormField = (header, isEdit = false) => {
    const handleChange = isEdit ? handleEditInputChange : handleInputChange
    const formData = isEdit ? editingProduct : newProduct
    
    const isSerial = header.label.toLowerCase().includes('serial') || 
      header.label.toLowerCase().includes('product id');
    const isTimestamp = header.label.toLowerCase().includes('timestamp') || 
      header.label.toLowerCase().includes('date');
    const isStockStatus = header.label.toLowerCase().includes('stockstatus') || 
      header.label.toLowerCase().includes('stock status');

    // For date fields, provide a date picker
    if (isTimestamp) {
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      );
    }

    // For stock status fields, provide a dropdown
    if (isStockStatus) {
      return (
        <select
          id={`${isEdit ? 'edit-' : ''}${header.id}`}
          name={header.id}
          value={formData[header.id] || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">Select Status</option>
          <option value="Normal">Normal</option>
          <option value="Low">Low</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      );
    }

    // For read-only serial number fields
    if (isSerial) {
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

    // For stock/quantity fields
    if (header.label.toLowerCase().includes('stock') || 
        header.label.toLowerCase().includes('quantity')) {
      return (
        <input 
          type="number"
          id={`${isEdit ? 'edit-' : ''}${header.id}`} 
          name={header.id}
          value={formData[header.id] || ''}
          onChange={handleChange}
          min={0}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
        />
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
          min={0}
          step="0.01"
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}  
            />
          </div>
          <button 
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={handleNewProductClick}
          >
            <Plus size={18} className="mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats */}  
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <Package size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-yellow-100 p-3 mr-4">
            <AlertTriangle size={24} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Low Stock Items</p>
            <p className="text-2xl font-bold text-gray-800">{stats.lowStockItems}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <ShoppingCart size={24} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Out of Stock</p>
            <p className="text-2xl font-bold text-gray-800">{stats.outOfStock}</p>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Product Inventory</h3>
          <button className="flex items-center text-gray-600 hover:text-gray-900">
            <Filter size={16} className="mr-2" />
            Filter
          </button>
        </div>
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-blue-600">Loading product data...</p>
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
              {filteredProducts.length > 0 ? (
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product._id}>
                      {tableHeaders.map((header) => (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product[header.id]}</div>
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          className="text-blue-600 hover:text-blue-900 mr-3" 
                          onClick={() => handleEditClick(product)}
                        >
                          <Edit size={16} className="inline mr-1" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteClick(product)}
                        >
                          <Trash2 size={16} className="inline mr-1" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  <tr>
                    <td colSpan={tableHeaders.length + 1} className="px-6 py-10 text-center text-gray-500">
                      No products found matching the search
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Modal for adding new product */}
      <AnimatePresence>
        {showNewProductForm && (
          <motion.div
            key="newProductModal"
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
                  <h3 className="text-xl font-bold text-blue-800">Add New Product</h3>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setShowNewProductForm(false)}
                  >
                    <X size={24} />
                  </button>
                </div>
        
                <form onSubmit={handleSubmit} className="space-y-6"> 
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tableHeaders.map((header) => (
                      <div key={header.id}>
                        <label htmlFor={header.id} className="block text-sm font-medium text-blue-700">
                          {header.label}
                        </label>
                        {renderFormField(header)}  
                      </div>
                    ))}
                  </div>
            
                  <div className="flex justify-end space-x-3 pt-4 border-t border-blue-100">
                    <button
                      type="button"
                      className="px-4 py-2 border border-blue-300 rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => setShowNewProductForm(false)}
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
                          Saving...
                        </>
                      ) : (
                        <>  
                          <Save size={18} className="mr-2" />
                          Save Product
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
      
      {/* Modal for editing product */}  
      <AnimatePresence>
        {showEditProductForm && (
          <motion.div
            key="editProductModal"
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
                  <h3 className="text-xl font-bold text-blue-800">Edit Product</h3>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setShowEditProductForm(false)}
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
                      onClick={() => setShowEditProductForm(false)}
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
                          Update Product 
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
                  Are you sure you want to delete this product? This action cannot be undone.
                  {productToDelete && (
                    <span className="font-medium block mt-2">
                      Product ID: {productToDelete[tableHeaders.find(h => h.label.toLowerCase().includes('id') || h.label.toLowerCase().includes('serial'))?.id]}
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
                        Delete Product
                      </>
                    )}
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

export default Inventory;