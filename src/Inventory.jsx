"use client"

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion"
import { Package, Trash2, Search, AlertTriangle, ShoppingCart, Plus, Filter, Edit, X, Save, History, CheckSquare } from "lucide-react"
import { useAuth } from "./Context/AuthContext" // Import useAuth to check for staff role

// Add helper function to determine stock status based on quantity
const getStockStatusFromQuantity = (quantity) => {
  // Parse the quantity (remove commas and convert to number)
  const stockQty = parseInt(quantity.toString().replace(/,/g, ''), 10);
  
  // Check if it's a valid number
  if (isNaN(stockQty)) return '';
  
  // Determine status based on quantity
  if (stockQty <= 0) return 'Out of Stock';
  if (stockQty < 10) return 'Low';
  return 'Normal';
};

// Add helper function to find header IDs
const findHeaderId = (headers, searchTerms) => {
  return headers.find(h => 
    searchTerms.some(term => h.label.toLowerCase().includes(term.toLowerCase()))
  )?.id || null;
};

const Inventory = ({ hideHistoryButton = false }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tableHeaders, setTableHeaders] = useState([])
  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([]) // Store all products for history
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
  const [selectedPurchaseDate, setSelectedPurchaseDate] = useState(null);
  const [notification, setNotification] = useState({
    show: false, 
    message: "",
    type: ""
  })
  // Add state for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  // Add state for history modal
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historySearchTerm, setHistorySearchTerm] = useState("")
  const [stockMovementHistory, setStockMovementHistory] = useState([])
  const [stockMovementHeaders, setStockMovementHeaders] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  // Function to handle search
  const [searchTerm, setSearchTerm] = useState("")
  // Add state for stock in/out values
  const [stockInOut, setStockInOut] = useState({
    stockIn: "",
    stockOut: ""
  })
  // Add state for inline editing of stock in/out fields
  const [inlineEditing, setInlineEditing] = useState({})
  // Track which rows are currently being edited
  const [editableRows, setEditableRows] = useState({})
  // Track save in progress for each row
  const [savingRows, setSavingRows] = useState({})

  // Get auth context to check if user is staff
  const { user } = useAuth()
  const isStaff = user && user.role === "staff"

  // Google Sheet Details
  const sheetId = '1Kb-fhC1yiFJCyPO7TJDqnu-lQ1n1H6mLErlkSPc6yHc'
  const sheetName = 'Inventory DB'
  const stockInOutSheetName = 'Inventory IN and Out' // New sheet for stock in/out logs

  // Google Apps Script Web App URL
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbyhmDsXWRThVsJCfAirTsI3o9EGE-oCcw2HKz1ERe4qxNWfcVoxMUr3sGa6yHJm-ckt/exec'
  
  // Add this helper function for parsing dates - Move it OUTSIDE any other functions
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
    
    // Return null if we couldn't parse the date
    return null;
  };

  const fetchTodayStockMovements = async () => {
    try {
      console.log("Fetching today's stock movements...");
      
      // Format today's date as DD/MM/YYYY for comparison
      const today = new Date();
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      const formattedToday = `${day}/${month}/${year}`;
      
      console.log("Looking for records with date:", formattedToday);
      console.log("Total products:", products.length);
      
      // Create URL to fetch the stock in/out sheet
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(stockInOutSheetName)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch stock movement data: ${response.status}`);
      }
      
      // Extract the JSON part from the response
      const text = await response.text();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      const jsonString = text.substring(jsonStart, jsonEnd + 1);
      const data = JSON.parse(jsonString);
      
      // Initialize map to store today's stock movements
      const todayStockMovements = {};
      
      // Process rows to find today's stock movements
      if (data.table && data.table.rows) {
        console.log("Total stock movement records found:", data.table.rows.length);
        
        data.table.rows.forEach((row, index) => {
          if (row.c && row.c.length >= 7) {
            const dateCell = row.c[0] && row.c[0].v ? row.c[0].v : null;
            const parsedDate = parseDate(dateCell);
            
            const productIdCell = row.c[1] && row.c[1].v ? row.c[1].v : null;
            const stockInCell = row.c[4] && row.c[4].v !== undefined ? row.c[4].v : null;
            const stockOutCell = row.c[5] && row.c[5].v !== undefined ? row.c[5].v : null;
            
            console.log(`Row ${index}: 
              Date=${parsedDate}, 
              ProductID=${productIdCell}, 
              StockIn=${stockInCell}, 
              StockOut=${stockOutCell}`);
            
            // Check if this is today's record and has valid data
            if (parsedDate === formattedToday && productIdCell) {
              console.log(`✓ Found stock movement for today: 
                ProductID=${productIdCell}, 
                StockIn=${stockInCell}, 
                StockOut=${stockOutCell}`);
              
              // Accumulate stock movements for the same product on the same day
              if (!todayStockMovements[productIdCell]) {
                todayStockMovements[productIdCell] = {
                  stockIn: stockInCell || 0,
                  stockOut: stockOutCell || 0
                };
              } else {
                // If multiple entries exist, add them together
                todayStockMovements[productIdCell].stockIn += stockInCell || 0;
                todayStockMovements[productIdCell].stockOut += stockOutCell || 0;
              }
            }
          }
        });
      }
      
      console.log("Today's stock movements:", JSON.stringify(todayStockMovements));
      
      // Debugging: Print out product details
      console.log("Product details:");
      products.forEach(product => {
        const productIdHeader = tableHeaders.find(
          h => h.label.toLowerCase().includes('id') || h.label.toLowerCase().includes('serial')
        );
        
        if (!productIdHeader) {
          console.log("No product ID header found!");
          return;
        }
        
        const productId = product[productIdHeader.id];
        console.log(`Product: ${JSON.stringify(product)}`);
        console.log(`Product ID: ${productId}`);
      });
      
      // Apply the fetched values to the UI
      if (Object.keys(todayStockMovements).length > 0) {
        const newInlineEditing = {};
        const newEditableRows = {};
        
        // Find product rows matching the IDs in todayStockMovements
        products.forEach(product => {
          // Get the product ID header
          const productIdHeader = tableHeaders.find(
            h => h.label.toLowerCase().includes('id') || h.label.toLowerCase().includes('serial')
          );
          
          if (!productIdHeader) {
            console.log("No product ID header found for this product!");
            return;
          }
          
          const productId = product[productIdHeader.id];
          
          // Check if this product has stock movements today
          if (todayStockMovements[productId]) {
            console.log(`Applying stock movement data for product ${productId}`);
            
            // Ensure stockIn and stockOut are converted to strings and default to 0 if undefined
            const stockIn = todayStockMovements[productId].stockIn;
            const stockOut = todayStockMovements[productId].stockOut;
            
            // Initialize the inline editing state for this product
            newInlineEditing[product._id] = {
              stockIn: (stockIn || 0).toString(),
              stockOut: (stockOut || 0).toString()
            };
            
            // Set the row to editing mode
            newEditableRows[product._id] = true;
            
            console.log(`Updated inline editing for ${product._id}:`, newInlineEditing[product._id]);
          }
        });
        
        // Update the state
        setInlineEditing(newInlineEditing);
        setEditableRows(newEditableRows);
        
        console.log("Final inline editing state:", newInlineEditing);
        console.log("Final editable rows state:", newEditableRows);
        
        // Show notification
        setNotification({
          show: true,
          message: `Found ${Object.keys(todayStockMovements).length} product stock movements for today!`,
          type: "info"
        });
        setTimeout(() => {
          setNotification({ show: false, message: "", type: "" });
        }, 3000);
      }
      
    } catch (error) {
      console.error("Error fetching today's stock movements:", error);
      // Don't set error state as this is a secondary function
    }
  };
  // Fetch Google Sheet data when component mounts
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

        // Exclude the delete column (column H)
        const deleteColumnIndex = 7; // H is the 8th column (0-indexed)

        if (data.table.cols && data.table.cols.some(col => col.label)) {
          headers = data.table.cols
            .filter((_, index) => index !== deleteColumnIndex)
            .map((col, index) => ({
              id: `col${index}`,
              label: col.label || `Column ${index + 1}`,
              type: col.type || 'string',
              originalIndex: index // Store the original index
            }))
        } else if (allRows.length > 0 && allRows[0].c && allRows[0].c.some(cell => cell && cell.v)) {
          headers = allRows[0].c
            .filter((_, index) => index !== deleteColumnIndex)
            .map((cell, index) => ({
              id: `col${index}`,
              label: cell && cell.v ? String(cell.v) : `Column ${index + 1}`,
              type: data.table.cols[index]?.type || 'string',
              originalIndex: index // Store the original index
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

        // Modify the data processing part in the fetchGoogleSheetData function
        // Process all rows from the sheet
        const allProductsData = allRows
        .filter((row) => {
          // Skip rows with no data
          if (!row.c || !row.c.some((cell) => cell && cell.v)) return false;
          
          // Check if this product is marked as deleted (column H)
          // Column H is at index 7 (0-indexed)
          const isDeleted = row.c[deleteColumnIndex] && 
                          row.c[deleteColumnIndex].v && 
                          row.c[deleteColumnIndex].v.toString().toLowerCase() === 'yes';
          
          // Only include rows that are NOT marked as deleted
          return !isDeleted;
        })
        .map((row, rowIndex) => {
          const productData = {
            _id: Math.random().toString(36).substring(2, 15),
            _rowIndex: rowIndex + 2, // +2 for header row and 1-indexing
          }

          row.c && row.c.forEach((cell, index) => {
            // Skip the delete column 
            if (index === deleteColumnIndex) return;

            const adjustedIndex = index < deleteColumnIndex ? index : index - 1;
            const header = headers[adjustedIndex]
            
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
          })

          return productData
        })

        // Store all products for history
        setAllProducts(allProductsData)
        
        setProducts(allProductsData)

        // Initialize inline editing state and editable rows
        const initialInlineEditing = {}
        const initialEditableRows = {}
        const initialSavingRows = {}
        
        allProductsData.forEach(product => {
          initialInlineEditing[product._id] = {
            stockIn: "",
            stockOut: ""
          }
          initialEditableRows[product._id] = false
          initialSavingRows[product._id] = false
        })
        
        setInlineEditing(initialInlineEditing)
        setEditableRows(initialEditableRows)
        setSavingRows(initialSavingRows)

        // Modified stock tracking logic
        const stockField = headers.find(
          (h) =>
            h.label.toLowerCase().includes('stock') ||
            h.label.toLowerCase().includes('quantity')
        )

        const statusField = headers.find(
          (h) =>
            h.label.toLowerCase().includes('stock status') ||
            h.label.toLowerCase().includes('stockstatus')
        )

        const lowStockItems = allProductsData.filter((product) => {
          if (statusField) {
            // First, check the stock status field if it exists
            const status = (product[statusField.id] || '').toString().toLowerCase()
            return status === 'low'
          }

          // Fallback to stock number calculation
          if (stockField) {
            // Remove commas and parse the stock value
            const stock = parseInt(product[stockField.id].replace(/,/g, ''), 10)
            return !isNaN(stock) && stock > 0 && stock <= 10 
          }
          
          return false
        }).length

        const outOfStockItems = allProductsData.filter((product) => {
          if (statusField) {
            // First, check the stock status field if it exists
            const status = (product[statusField.id] || '').toString().toLowerCase()
            return status === 'out of stock'
          }

          // Fallback to stock number calculation
          if (stockField) {
            // Remove commas and parse the stock value
            const stock = parseInt(product[stockField.id].replace(/,/g, ''), 10)
            return !isNaN(stock) && stock === 0
          }
          
          return false
        }).length

        setStats({
          totalProducts: allProductsData.length,
          lowStockItems,
          outOfStock: outOfStockItems
        })
  
        setLoading(false)
        
        // After loading all product data, fetch today's stock movements
        fetchTodayStockMovements()
      } catch (error) {
        console.error("Error fetching Google Sheet data:", error)
        setError("Failed to load inventory data")
        setLoading(false)
      }
    }
  
    fetchGoogleSheetData()
  }, [])

  // Filter products by search term
  const filteredProducts = searchTerm
    ? products.filter(product => 
        Object.values(product).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : products

  // Function to filter history products
  const filteredHistoryProducts = historySearchTerm
    ? allProducts.filter(product => 
        Object.values(product).some(value => 
          value && value.toString().toLowerCase().includes(historySearchTerm.toLowerCase())
        )
      )
    : allProducts

  // Get the headers that should be displayed based on user role
  const getDisplayHeaders = () => {
    if (isStaff) {
      // For staff, only show columns B, C, D (indices 1, 2, 3 in 0-indexed array)
      // Plus the stock column if it's not part of B,C,D
      const staffColumnIndices = [1, 2, 3]; // B, C, D columns
      
      // Get column headers for B, C, D
      const staffHeaders = tableHeaders.filter(header => 
        staffColumnIndices.includes(header.originalIndex)
      );
      
      // Add stock column if not already included
      const stockHeader = tableHeaders.find(
        h => h.label.toLowerCase().includes('stock') && 
             !h.label.toLowerCase().includes('status') && 
             !staffColumnIndices.includes(h.originalIndex)
      );
      
      if (stockHeader) {
        staffHeaders.push(stockHeader);
      }
      
      return staffHeaders;
    } else {
      // For non-staff users, show all headers
      return tableHeaders;
    }
  };

  // Function to get column indices for staff
  const displayHeaders = getDisplayHeaders();

  // Toggle row edit mode
  const toggleRowEditMode = (productId) => {
    setEditableRows(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
    
    // Reset stock in/out values when toggling off
    if (editableRows[productId]) {
      setInlineEditing(prev => ({
        ...prev,
        [productId]: {
          stockIn: "",
          stockOut: ""
        }
      }));
    }
  };

  // Handle input change for new product form - MODIFIED FOR AUTO STOCK STATUS
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Update the form data with the new value
    setNewProduct(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
      // Check if this is the stock quantity field
      const stockQuantityId = findHeaderId(tableHeaders, ['stock', 'quantity']);
      const stockStatusId = findHeaderId(tableHeaders, ['stock status', 'stockstatus']);
      
      // If we changed the stock quantity and we have a stock status field
      if (name === stockQuantityId && stockStatusId) {
        // Auto-fill the stock status based on quantity
        updated[stockStatusId] = getStockStatusFromQuantity(value);
      }
      
      return updated;
    });
  };
  
  // Handle input change for edit product form - MODIFIED FOR AUTO STOCK STATUS
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    
    setEditingProduct(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
      // Check if this is the stock quantity field
      const stockQuantityId = findHeaderId(tableHeaders, ['stock', 'quantity']);
      const stockStatusId = findHeaderId(tableHeaders, ['stock status', 'stockstatus']);
      
      // If we changed the stock quantity and we have a stock status field
      if (name === stockQuantityId && stockStatusId) {
        // Auto-fill the stock status based on quantity
        updated[stockStatusId] = getStockStatusFromQuantity(value);
      }
      
      return updated;
    });
  };

  // Handle input change for stock in/out fields for inline editing
  const handleInlineStockChange = (productId, field, value) => {
    setInlineEditing(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }))
  }

  // Function to start editing a product
  const handleEditClick = (product) => {
    setEditingProduct(product)
    // Reset stock in/out values
    setStockInOut({
      stockIn: "",
      stockOut: ""
    })
    setShowEditProductForm(true)
  }

  // Function to handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const product = editingProduct
      const rowIndex = product._rowIndex
      
      if (!rowIndex) {
        throw new Error("Could not determine the row index for this product")
      }
      
      // Create row data for all columns
      const rowData = tableHeaders.map(header => 
        editingProduct[header.id] || ''
      )
      
      const formData = new FormData()
      formData.append('sheetName', sheetName)
      formData.append('action', 'update')
      formData.append('rowIndex', rowIndex)
      formData.append('rowData', JSON.stringify(rowData))
      
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      })
      
      console.log("Edit form submitted successfully")
      
      // Update product in products array
      setProducts(prev => 
        prev.map(p => 
          p._id === product._id ? { ...p, ...editingProduct } : p
        )
      )
      
      // Update product in allProducts array
      setAllProducts(prev => 
        prev.map(p => 
          p._id === product._id ? { ...p, ...editingProduct } : p
        )
      )
      
      // Close the edit form
      setShowEditProductForm(false)
      
      // Show success notification
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

  // Function to save stock changes inline - MODIFIED FOR AUTO STOCK STATUS
  const handleSaveStockInline = async (product) => {
    const productId = product._id;
    const inlineData = inlineEditing[productId];
    
    if (!inlineData || (!inlineData.stockIn && !inlineData.stockOut)) {
      return; // Nothing to save
    }
    
    try {
      // Set saving state for this row
      setSavingRows(prev => ({
        ...prev,
        [productId]: true
      }));
      
      // Get current stock value
      const stockHeader = tableHeaders.find(
        h => h.label.toLowerCase().includes('stock') && !h.label.toLowerCase().includes('status')
      );
      
      if (!stockHeader) {
        throw new Error("Could not find stock column");
      }
      
      // Parse current stock (remove commas)
      const currentStock = parseInt(product[stockHeader.id].toString().replace(/,/g, ''), 10) || 0;
      
      // Parse stock in/out values
      const stockInValue = parseInt(inlineData.stockIn, 10) || 0;
      const stockOutValue = parseInt(inlineData.stockOut, 10) || 0;
      
      // Calculate new stock value for local UI update (won't be sent to sheet)
      const newStockValue = currentStock + stockInValue - stockOutValue;
      
      // When saving stock updates, also determine the new stock status
      const stockStatusId = findHeaderId(tableHeaders, ['stock status', 'stockstatus']);
      const newStockStatus = getStockStatusFromQuantity(newStockValue);
      
      // Log values for debugging
      console.log(`Current stock: ${currentStock}, Stock In: ${stockInValue}, Stock Out: ${stockOutValue}, New Stock: ${newStockValue}, New Status: ${newStockStatus}`);
      
      // Check if trying to remove more than available
      if (stockOutValue > currentStock) {
        throw new Error("Cannot remove more stock than available");
      }
      
      // Prepare data for Inventory IN and Out sheet
      const today = new Date();
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      const timestamp = `${day}/${month}/${year}`;
      
      // Get product ID for reference
      const productIdHeader = tableHeaders.find(
        h => h.label.toLowerCase().includes('id') || h.label.toLowerCase().includes('serial')
      );
      const productIdentifier = product[productIdHeader?.id] || 'Unknown';
      
      // Get product name
      const productNameHeader = tableHeaders.find(
        h => h.label.toLowerCase().includes('name') || 
           h.label.toLowerCase().includes('product name') ||
           h.label.toLowerCase().includes('productname') ||
           h.label.toLowerCase().includes('description')
      );
      const productName = product[productNameHeader?.id] || 'Unknown Product';
      
      // Staff name from context
      const staffName = user?.staffName || user?.name || "Unknown Staff";
      
      // First, check if there's an existing record for today and this product
      // Fetch the stock movement sheet data
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(stockInOutInOutSheetName)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch stock movement data: ${response.status}`);
      }
      
      // Extract the JSON part from the response
      const text = await response.text();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      const jsonString = text.substring(jsonStart, jsonEnd + 1);
      const data = JSON.parse(jsonString);
      
      let existingRowIndex = null;
      
      // Look for a matching record (same date and product ID)
      if (data.table && data.table.rows) {
        for (let i = 0; i < data.table.rows.length; i++) {
          const row = data.table.rows[i];
          
          if (row.c && row.c.length >= 7) {
            const dateCell = row.c[0] && row.c[0].v ? row.c[0].v : null;
            const parsedDate = parseDate(dateCell);
            
            const productIdCell = row.c[1] && row.c[1].v ? row.c[1].v : null;
            
            // Check if this matches our criteria
            if (parsedDate === timestamp && productIdCell === productIdentifier) {
              // Add 2 for header row and 1-based indexing in Google Sheets
              existingRowIndex = i + 2;
              break;
            }
          }
        }
      }
      
      // If we found an existing record, update it instead of creating a new one
      if (existingRowIndex) {
        console.log(`Updating existing stock record for ${productName} (${productIdentifier}) at row ${existingRowIndex}`);
        
        // Create row data with only the necessary columns
        // We don't include a calculated new stock value - the sheet or external process will handle that
        const rowData = [
          '', // Date (keep existing)
          '', // Product ID (keep existing)
          '', // Product Name (keep existing)
          currentStock.toString(), // Previous Stock
          stockInValue.toString(), // Stock In
          stockOutValue.toString(), // Stock Out
          staffName // Staff Name
        ];
        
        // Use FormData for compatibility with Google Apps Script
        const formData = new FormData();
        formData.append('sheetName', stockInOutSheetName);
        formData.append('action', 'update'); // Use update action
        formData.append('rowIndex', existingRowIndex.toString());
        formData.append('rowData', JSON.stringify(rowData));
        
        // Make the fetch request with no-cors mode
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: formData
        });
      } else {
        // No existing record found, create a new one
        console.log(`Creating new stock log entry for ${productName} (${productIdentifier})`);
        
        const stockLogData = [
          timestamp,                    // Date
          productIdentifier,            // Product ID
          productName,                  // Product Name
          currentStock,                 // Previous Stock
          stockInValue,                 // Stock In
          stockOutValue,                // Stock Out
          staffName                     // Staff Name
        ];
        
        const formData = new FormData();
        formData.append('sheetName', stockInOutSheetName);
        formData.append('rowData', JSON.stringify(stockLogData));
        formData.append('action', 'insert');
        
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: formData
        });
      }
      
      // Update the main inventory sheet's stock value
      // This is an addition to update the stock status automatically based on the new stock value
      if (stockHeader) {
        console.log("Updating main inventory sheet with new stock value and status");
        
        // Create form data for updating the main inventory sheet
        const mainFormData = new FormData();
        mainFormData.append('sheetName', sheetName);
        mainFormData.append('action', 'updateCell');
        mainFormData.append('rowIndex', product._rowIndex.toString());
        mainFormData.append('columnIndex', (stockHeader.originalIndex + 1).toString()); // Convert to 1-based indexing
        mainFormData.append('value', newStockValue.toString());
        
        // Update the stock quantity in the main sheet
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: mainFormData
        });
        
        // Also update the stock status if we have that column
        if (stockStatusId) {
          const statusHeader = tableHeaders.find(h => h.id === stockStatusId);
          if (statusHeader) {
            console.log("Updating stock status to:", newStockStatus);
            
            const statusFormData = new FormData();
            statusFormData.append('sheetName', sheetName);
            statusFormData.append('action', 'updateCell');
            statusFormData.append('rowIndex', product._rowIndex.toString());
            statusFormData.append('columnIndex', (statusHeader.originalIndex + 1).toString()); // Convert to 1-based indexing
            statusFormData.append('value', newStockStatus);
            
            // Update the stock status in the main sheet
            await fetch(scriptUrl, {
              method: 'POST',
              mode: 'no-cors',
              body: statusFormData
            });
          }
        }
      }
      
      console.log("Stock movement logged successfully");
      
      // Update the local UI with the new stock value and status for immediate feedback
      setProducts(prev => 
        prev.map(p => {
          if (p._id === product._id) {
            const updatedProduct = {
              ...p,
              [stockHeader.id]: newStockValue.toLocaleString()
            };
            
            // Also update the stock status if available
            if (stockStatusId) {
              updatedProduct[stockStatusId] = newStockStatus;
            }
            
            return updatedProduct;
          }
          return p;
        })
      );
      
      // Also update allProducts state for consistency
      setAllProducts(prev => 
        prev.map(p => {
          if (p._id === product._id) {
            const updatedProduct = {
              ...p,
              [stockHeader.id]: newStockValue.toLocaleString()
            };
            
            if (stockStatusId) {
              updatedProduct[stockStatusId] = newStockStatus;
            }
            
            return updatedProduct;
          }
          return p;
        })
      );
      
      // Reset the inline editing for this product
      setInlineEditing(prev => ({
        ...prev,
        [productId]: {
          stockIn: "",
          stockOut: ""
        }
      }));
      
      // Turn off edit mode for this row
      setEditableRows(prev => ({
        ...prev,
        [productId]: false
      }));
      
      // Show success notification
      const actionText = existingRowIndex ? "updated" : "added";
      setNotification({
        show: true,
        message: `Stock ${actionText} successfully!`,
        type: "success"
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
      
    } catch (error) {
      console.error("Error updating stock:", error);
      
      setNotification({
        show: true,
        message: `Failed to update stock: ${error.message}`,
        type: "error"
      });
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 5000);
    } finally {
      // Reset saving state for this row
      setSavingRows(prev => ({
        ...prev,
        [productId]: false
      }));
    }
  };

  // Function to initiate delete confirmation
  const handleDeleteClick = (product) => {
    setProductToDelete(product)
    setShowDeleteModal(true)
  }

  // Function to open history modal
  const handleHistoryClick = async () => {
    setHistorySearchTerm("")
    setShowHistoryModal(true)
    setLoadingHistory(true)
    
    try {
      console.log("Fetching stock movement history...")
      
      // Create URL to fetch the stock in/out sheet
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(stockInOutSheetName)}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch stock movement data: ${response.status}`)
      }
      
      // Extract the JSON part from the response
      const text = await response.text()
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}')
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)
      
      // Process headers
      let headers = []
      
      if (data.table.cols && data.table.cols.some(col => col.label)) {
        headers = data.table.cols
          .filter((_, index) => index < 7) // Only include columns A-G (0-6)
          .map((col, index) => ({
            id: `col${index}`,
            label: col.label || `Column ${index + 1}`,
            type: col.type || 'string'
          }))
      } else if (data.table.rows && data.table.rows.length > 0 && data.table.rows[0].c) {
        headers = data.table.rows[0].c
          .filter((_, index) => index < 7) // Only include columns A-G (0-6)
          .map((cell, index) => ({
            id: `col${index}`,
            label: cell && cell.v ? String(cell.v) : `Column ${index + 1}`,
            type: data.table.cols[index]?.type || 'string'
          }))
        data.table.rows = data.table.rows.slice(1) // Remove header row
      }
      
      setStockMovementHeaders(headers)
      
      // Process rows
      const historyData = data.table.rows
        .filter((row) => row.c && row.c.some((cell) => cell && cell.v))
        .map((row, rowIndex) => {
          const movementData = {
            _id: Math.random().toString(36).substring(2, 15),
            _rowIndex: rowIndex + 2, // +2 for header row and 1-indexing
          }
          
          row.c && row.c.forEach((cell, index) => {
            // Only process columns A-G (0-6)
            if (index < 7) {
              const header = headers[index]
              
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
                  movementData[header.id] = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
                } else {
                  movementData[header.id] = cell.v;
                }
              } else {
                // Handle non-date values
                movementData[header.id] = cell ? cell.v : '';
                
                if (header.type === 'number' && !isNaN(movementData[header.id])) {
                  movementData[header.id] = Number(movementData[header.id]).toLocaleString();
                }
              }
            }
          })
          
          return movementData
        })
      
      // Sort by date (most recent first) if there's a date column
      const sortedData = historyData.sort((a, b) => {
        const dateCol = headers.findIndex(h => 
          h.label.toLowerCase().includes('date') || 
          h.label.toLowerCase().includes('timestamp')
        )
        
        if (dateCol >= 0) {
          const colId = `col${dateCol}`
          // Try to parse dates for comparison
          try {
            const dateA = a[colId] ? new Date(a[colId].split('/').reverse().join('-')) : new Date(0)
            const dateB = b[colId] ? new Date(b[colId].split('/').reverse().join('-')) : new Date(0)
            return dateB - dateA // Most recent first
          } catch (e) {
            return 0
          }
        }
        return 0
      })
      
      setStockMovementHistory(sortedData)
      
    } catch (error) {
      console.error("Error fetching stock movement history:", error)
      setNotification({
        show: true,
        message: `Failed to load history: ${error.message}`,
        type: "error"
      })
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 5000)
    } finally {
      setLoadingHistory(false)
    }
  }
  
  // Function to filter history products for stock movements
  const filteredStockMovementHistory = historySearchTerm
    ? stockMovementHistory.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(historySearchTerm.toLowerCase())
        )
      )
    : stockMovementHistory
  // Function to confirm and "soft delete" a product by marking column H as "Yes"
  const confirmDelete = async () => {
    try {
      setSubmitting(true)
      const product = productToDelete
      const rowIndex = product._rowIndex
      
      if (!rowIndex) {
        throw new Error("Could not determine the row index for marking this product as deleted")
      }
      
      // Use column index 8 (column H) for Inventory
      const deleteColumnIndex = 8; // H is the 8th column (1-indexed)
      
      const formData = new FormData()
      formData.append('sheetName', sheetName)
      formData.append('rowIndex', rowIndex)
      formData.append('action', 'markDeleted')
      formData.append('columnIndex', deleteColumnIndex)
      formData.append('value', 'Yes')
      
      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors', 
        body: formData
      })
      
      console.log("Mark as deleted submitted successfully")
      
      // Update products state - remove from UI
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
      
      // Update the product in allProducts to reflect it's been deleted (col7 is column H in 0-indexed array)
      setAllProducts(prev => 
        prev.map(p => 
          p._id === product._id ? { ...p, col7: 'Yes' } : p
        )
      )
      
      setNotification({
        show: true,
        message: "Product removed successfully!",
        type: "success"
      })
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 3000)
    } catch (error) {
      console.error("Error marking product as deleted:", error)
        
      setNotification({
        show: true,
        message: `Failed to remove product: ${error.message}`,
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

  const getStockStatusColor = (status) => {
    const lowercaseStatus = status ? status.toString().toLowerCase() : '';
    switch(lowercaseStatus) {
      case 'out of stock':
        return 'bg-red-100 text-red-800';
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'normal':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Function to cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false)
    setProductToDelete(null)
  }

  // MODIFIED function to set default values for new product, including stock status
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
    
    // Set default stock to 0
    const stockQuantityId = findHeaderId(tableHeaders, ['stock', 'quantity']);
    const stockStatusId = findHeaderId(tableHeaders, ['stock status', 'stockstatus']);
    
    if (stockQuantityId) {
      emptyProduct[stockQuantityId] = '0';
    }
    
    // Set default stock status based on stock quantity
    if (stockQuantityId && stockStatusId) {
      emptyProduct[stockStatusId] = getStockStatusFromQuantity(emptyProduct[stockQuantityId]);
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
      setAllProducts(prev => [newProductWithId, ...prev])
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalProducts: prev.totalProducts + 1
      }))
      
      // Find stock quantity
      const stockQuantityId = findHeaderId(tableHeaders, ['stock', 'quantity']);
      if (stockQuantityId) {
        const stockQty = parseInt(newProduct[stockQuantityId].toString().replace(/,/g, ''), 10) || 0;
        
        if (stockQty <= 0) {
          // Update out of stock count
          setStats(prev => ({
            ...prev,
            outOfStock: prev.outOfStock + 1
          }));
        } else if (stockQty < 10) {
          // Update low stock count
          setStats(prev => ({
            ...prev,
            lowStockItems: prev.lowStockItems + 1    
          }));
        }
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

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <div className="flex items-center space-x-2">
          {!isStaff && !hideHistoryButton && (
            <button
              onClick={handleHistoryClick}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
            >
              <History size={18} className="mr-2" />
              Product History
            </button>
          )}
          {!isStaff && (
            <button
              onClick={handleNewProductClick}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus size={18} className="mr-2" />
              Add Product
            </button>
          )}
        </div>
      </div>
      {!isStaff && (
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
      )}
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative flex">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-blue-600">Loading inventory data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Checkbox column for row editing */}
                  {isStaff && (

                  <th
                    scope="col"
                    className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"
                  >
                    Edit
                  </th>
                  )}
                  {/* Regular data columns */}
                  {displayHeaders.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.label}
                    </th>
                  ))}
                  
                  {/* Stock In column */}
                  {isStaff && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Stock Out
                  </th>
                  )}
                  
                  {/* Stock Out column */}
                  {isStaff && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Stock In
                  </th>
                  )}
                  
                  {/* Actions column */}
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product._id} className={editableRows[product._id] ? 'bg-blue-50' : ''}>
                      {/* Checkbox cell for row editing */}
                      {isStaff && (
                      <td className="px-2 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={editableRows[product._id] || false}
                          onChange={() => toggleRowEditMode(product._id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      )}
                      
                      {/* Regular data cells */}
                      {displayHeaders.map((header) => {
                        // Special rendering for stock status column
                        if (header.label.toLowerCase().includes('status')) {
                          return (
                            <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStockStatusColor(product[header.id])}`}>
                                {product[header.id] || 'Unknown'}
                              </span>
                            </td>
                          );
                        }
                        
                        // Default rendering for other columns
                        return (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product[header.id] || ''}
                            </div>
                          </td>
                        );
                      })}
                      {/* Stock In cell */}
                      {isStaff && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            placeholder="Add"
                            className={`w-20 px-2 py-1 text-sm border ${editableRows[product._id] ? 'border-green-300' : 'border-gray-200 bg-gray-100'} rounded-md`}
                            value={inlineEditing[product._id]?.stockIn || ''}
                            onChange={(e) => handleInlineStockChange(product._id, 'stockIn', e.target.value)}
                            disabled={!editableRows[product._id]}
                          />
                        </div>
                      </td>
                      )}
                      
                      {/* Stock Out cell */}
                      {isStaff && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            placeholder="Remove"
                            className={`w-20 px-2 py-1 text-sm border ${editableRows[product._id] ? 'border-red-300' : 'border-gray-200 bg-gray-100'} rounded-md`}
                            value={inlineEditing[product._id]?.stockOut || ''}
                            onChange={(e) => handleInlineStockChange(product._id, 'stockOut', e.target.value)}
                            disabled={!editableRows[product._id]}
                          />
                        </div>
                      </td>
                      )}
                      {/* Actions cell */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          {editableRows[product._id] && (
                            <button
                              onClick={() => handleSaveStockInline(product)}
                              disabled={savingRows[product._id] || (!inlineEditing[product._id]?.stockIn && !inlineEditing[product._id]?.stockOut)}
                              className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 flex items-center"
                            >
                              {savingRows[product._id] ? (
                                <div className="h-4 w-4 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin mr-1"></div>
                              ) : (
                                <Save size={16} className="mr-1" />
                              )}
                              Save
                            </button>
                          )}
                          {!isStaff && !editableRows[product._id] && (
                            <>
                              <button
                                onClick={() => handleEditClick(product)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(product)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={displayHeaders.length + 4} className="px-6 py-4 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Product Form Modal */}
      <AnimatePresence>
        {showNewProductForm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add New Product</h3>
                  <button
                    onClick={() => setShowNewProductForm(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {tableHeaders.map((header) => (
                    <div key={header.id}>
                      <label htmlFor={header.id} className="block text-sm font-medium text-gray-700">
                        {header.label}
                      </label>
                      <input
                        type={header.type === 'number' ? 'number' : 'text'}
                        name={header.id}
                        id={header.id}
                        value={newProduct[header.id] || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        // Disable the stock status field (it's auto-filled)
                        readOnly={header.label.toLowerCase().includes('stock status')}
                      />
                    </div>
                  ))}
                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowNewProductForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <span className="inline-block mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                          Saving...
                        </>
                      ) : (
                        'Save Product'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Product Form Modal */}
      <AnimatePresence>
        {showEditProductForm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Edit Product
                  </h3>
                  <button
                    onClick={() => setShowEditProductForm(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  {tableHeaders.map((header) => (
                    <div key={header.id}>
                      <label htmlFor={`edit-${header.id}`} className="block text-sm font-medium text-gray-700">
                        {header.label}
                      </label>
                      <input
                        type={header.type === 'number' ? 'number' : 'text'}
                        name={header.id}
                        id={`edit-${header.id}`}
                        value={editingProduct[header.id] || ''}
                        onChange={handleEditInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        // Disable the stock status field (it's auto-filled)
                        readOnly={header.label.toLowerCase().includes('stock status')}
                      />
                    </div>
                  ))}
                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEditProductForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <span className="inline-block mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-red-100 rounded-full p-2 mr-3">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
                </div>
                <p className="text-gray-500 mb-6">
                  Are you sure you want to delete this product? This action cannot be undone.
                </p>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={confirmDelete}
                  >
                    {submitting ? (
                      <>
                        <span className="inline-block mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={cancelDelete}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

     {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Inventory IN and OUT History</h3>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="mt-4 relative">
                  <input
                    type="text"
                    placeholder="Search stock movements..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  {historySearchTerm && (
                    <button
                      onClick={() => setHistorySearchTerm("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto flex-1 min-h-0">
                {loadingHistory ? (
                  <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                    <p className="text-purple-600">Loading inventory history data...</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {stockMovementHeaders.map((header) => (
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
                      {filteredStockMovementHistory.length > 0 ? (
                        filteredStockMovementHistory.map((item) => (
                          <tr key={item._id}>
                            {stockMovementHeaders.map((header) => (
                              <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {item[header.id] || ''}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={stockMovementHeaders.length} className="px-6 py-4 text-center text-gray-500">
                            No stock movements found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification popup */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center ${
              notification.type === "success" ? "bg-green-100" : 
              notification.type === "info" ? "bg-blue-100" : "bg-red-100"
            }`}
          >
            {notification.type === "success" ? (
              <CheckSquare className="text-green-600 mr-3" size={20} />
            ) : notification.type === "info" ? (
              <Search className="text-blue-600 mr-3" size={20} />
            ) : (
              <AlertTriangle className="text-red-600 mr-3" size={20} />
            )}
            <p className={`font-medium ${
              notification.type === "success" ? "text-green-800" : 
              notification.type === "info" ? "text-blue-800" : "text-red-800"
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

export default Inventory;