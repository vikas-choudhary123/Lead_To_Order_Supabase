"use client"

// import { useState } from "react"
import { FileTextIcon, PlusIcon, TrashIcon, DownloadIcon, SaveIcon, ShareIcon, CopyIcon, EyeIcon } from "../components/Icons"
import { useState, useEffect } from "react"

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function Quotation() {
  const [activeTab, setActiveTab] = useState("edit")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quotationLink, setQuotationLink] = useState("")
  const [pdfUrl, setPdfUrl] = useState("")
  
  // Dynamic dropdown options
  const [stateOptions, setStateOptions] = useState(["Select State"])
  const [companyOptions, setCompanyOptions] = useState(["Select Company"])
  const [referenceOptions, setReferenceOptions] = useState(["Select Reference"])
  const [isRevising, setIsRevising] = useState(false);
const [existingQuotations, setExistingQuotations] = useState([]);
const [selectedQuotation, setSelectedQuotation] = useState("");
const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);
// Add these state variables near the top of your component with other state declarations
const [productCodes, setProductCodes] = useState([]);
const [productNames, setProductNames] = useState([]);
const [productData, setProductData] = useState({}); // To store code-name mappings

  
  // State for dropdown data
  const [dropdownData, setDropdownData] = useState({})

  // Initialize quotation data with empty/default values
  const [quotationData, setQuotationData] = useState({
    quotationNo: "IN-NBD-...", // Default initial value
    date: new Date().toLocaleDateString("en-GB"),
    
    // Consignor details
    consignorState: "",
    consignorName: "",
    consignorAddress: "",
    consignorMobile: "",
    consignorPhone: "",
    consignorGSTIN: "",
    consignorStateCode: "",
    
    // Consignee details
    companyName: "", 
    consigneeName: "",
    consigneeAddress: "",
    consigneeState: "",
    consigneeContactName: "",
    consigneeContactNo: "",
    consigneeGSTIN: "",
    consigneeStateCode: "",
    
    // MSME details
    msmeNumber: "",
    
    // Items
    items: [
      {
        id: 1,
        code: "",
        name: "",
        gst: 18,
        qty: 1,
        units: "Nos",
        rate: 0,
        discount: 0, // Percentage discount
        flatDiscount: 0, // Flat discount amount
        amount: 0,
      },
    ],
    
    // Totals
    subtotal: 0,
    totalFlatDiscount: 0,
    cgstRate: 9,
    sgstRate: 9,
    cgstAmount: 0,
    sgstAmount: 0,
    total: 0,
  
    
    // Terms
    validity: "The above quoted prices are valid up to 5 days from date of offer.",
    paymentTerms: "100% advance payment in the mode of NEFT, RTGS & DD",
    delivery: "Material is ready in our stock",
    freight: "Extra as per actual.",
    insurance: "Transit insurance for all shipment is at Buyer's risk.",
    taxes: "Extra as per actual.",
    
    // Bank details
    accountNo: "",
    bankName: "",
    bankAddress: "",
    ifscCode: "",
    email: "",
    website: "",
    pan: "",
    
    // Notes
    notes: [""],
    
    // Other fields
    preparedBy: "",
  });


  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const dropdownUrl = "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=DROPDOWN";
        const response = await fetch(dropdownUrl);
        const text = await response.text();
        
        // Extract JSON data
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonData = JSON.parse(text.substring(jsonStart, jsonEnd));
        
        // Process product data (Column BI - index 60 for Code, Column BJ - index 61 for Name)
        const codes = ["Select Code"];
        const names = ["Select Product"];
        const codeNameMap = {};
        
        if (jsonData && jsonData.table && jsonData.table.rows) {
          jsonData.table.rows.forEach((row) => {
            if (row.c && row.c[60] && row.c[62]) {
              const code = row.c[60].v;
              const name = row.c[62].v;
              
              if (code && !codes.includes(code)) {
                codes.push(code);
              }
              
              if (name && !names.includes(name)) {
                names.push(name);
              }
              
              // Create mapping in both directions
              codeNameMap[code] = name;
              codeNameMap[name] = code;
            }
          });
        }
        
        setProductCodes(codes);
        setProductNames(names);
        setProductData(codeNameMap);
      } catch (error) {
        console.error("Error fetching product data:", error);
        // Fallback data
        setProductCodes(["Select Code", "CODE1", "CODE2", "CODE3"]);
        setProductNames(["Select Product", "Product 1", "Product 2", "Product 3"]);
        setProductData({
          "CODE1": "Product 1",
          "Product 1": "CODE1",
          "CODE2": "Product 2",
          "Product 2": "CODE2",
          "CODE3": "Product 3",
          "Product 3": "CODE3"
        });
      }
    };
    
    fetchProductData();
  }, []);

  const handleInputChange = (field, value) => {
    setQuotationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle item changes with discount calculation
  const handleItemChange = (id, field, value) => {
  setQuotationData((prev) => {
    const newItems = prev.items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
  
        // Ensure numeric calculations
        if (field === "qty" || field === "rate" || field === "discount" || field === "flatDiscount") {
          const baseAmount = Number(updatedItem.qty) * Number(updatedItem.rate)
          const discountedAmount = baseAmount * (1 - (Number(updatedItem.discount) / 100))  // Added missing closing parenthesis
          updatedItem.amount = Math.max(0, discountedAmount - Number(updatedItem.flatDiscount))
        }
  
        return updatedItem
      }
      return item
    })
  
    // Ensure all calculations result in numbers
    const subtotal = Number(newItems.reduce((sum, item) => sum + item.amount, 0))
    const subtotalAfterDiscount = Math.max(0, subtotal - Number(prev.totalFlatDiscount))
    const cgstAmount = Number((subtotalAfterDiscount * (prev.cgstRate / 100)).toFixed(2))  // Added missing closing parenthesis
    const sgstAmount = Number((subtotalAfterDiscount * (prev.sgstRate / 100)).toFixed(2))  // Added missing closing parenthesis
    const total = Number((subtotalAfterDiscount + cgstAmount + sgstAmount).toFixed(2))  // Added missing closing parenthesis
  
    return {
      ...prev,
      items: newItems,
      subtotal,
      cgstAmount,
      sgstAmount,
      total,
    }
  })
}

  // Handle total flat discount change
  const handleFlatDiscountChange = (value) => {
    setQuotationData((prev) => {
      const numValue = Number(value)
      const subtotal = prev.items.reduce((sum, item) => sum + item.amount, 0)
      const subtotalAfterDiscount = Math.max(0, subtotal - numValue)
      const cgstAmount = Number((subtotalAfterDiscount * (prev.cgstRate / 100)).toFixed(2))
      const sgstAmount = Number((subtotalAfterDiscount * (prev.sgstRate / 100)).toFixed(2))
      const total = Number((subtotalAfterDiscount + cgstAmount + sgstAmount).toFixed(2))
    
      return {
        ...prev,
        totalFlatDiscount: numValue,
        subtotal: subtotal, // Use the calculated subtotal from prev.items
        cgstAmount,
        sgstAmount,
        total,
      }
    })
  }
  // Handle note changes
  const handleNoteChange = (index, value) => {
    setQuotationData((prev) => {
      const newNotes = [...prev.notes]
      newNotes[index] = value
      return {
        ...prev,
        notes: newNotes,
      }
    })
  }

  // This is the updated useEffect for fetching existing quotations
// Make sure to add this near the beginning of your component

useEffect(() => {
  const fetchExistingQuotations = async () => {
    try {
      console.log("Fetching existing quotations...");
      const scriptUrl = "https://script.google.com/macros/s/AKfycbzTPj_x_0Sh6uCNnMDi-KlwVzkGV3nC4tRF6kGUNA1vXG0Ykx4Lq6ccR9kYv6Cst108aQ/exec";
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          sheetName: "Make Quotation",
          action: "getQuotationNumbers"
        })
      });
      
      const result = await response.json();
      console.log("Quotation numbers result:", result);
      
      if (result.success && Array.isArray(result.quotationNumbers)) {
        setExistingQuotations(result.quotationNumbers);
      } else {
        console.error("Invalid response format:", result);
        setExistingQuotations([]);
      }
    } catch (error) {
      console.error("Error fetching quotation numbers:", error);
      setExistingQuotations([]);
    }
  };
  
  // Call immediately when component mounts
  fetchExistingQuotations();
  
  // Also refetch when isRevising changes to true
  if (isRevising) {
    fetchExistingQuotations();
  }
}, [isRevising]); // Add isRevising as a dependency

// Update the revising button click handler to ensure it fetches quotations
const toggleRevising = () => {
  const newIsRevising = !isRevising;
  setIsRevising(newIsRevising);
  
  // When switching to revising mode, clear the selected quotation
  if (newIsRevising) {
    setSelectedQuotation("");
  }
};

// Then update your JSX for the revise button to use this handler
// Replace the onClick in the button with:
// onClick={toggleRevising}

const handleQuotationSelect = async (quotationNo) => {
  if (!quotationNo) return;
  
  setIsLoadingQuotation(true);
  setSelectedQuotation(quotationNo);

  try {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbzTPj_x_0Sh6uCNnMDi-KlwVzkGV3nC4tRF6kGUNA1vXG0Ykx4Lq6ccR9kYv6Cst108aQ/exec";
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        sheetName: "Make Quotation",
        action: "getQuotationData",
        quotationNo: quotationNo
      })
    });
    
    const result = await response.json();
    console.log("Loaded quotation data:", result);

    if (result.success) {
      const loadedData = result.quotationData;
      
      // Parse the items string into proper items array
      let items = [];
      if (loadedData.items && Array.isArray(loadedData.items) && loadedData.items.length > 0) {
        items = loadedData.items.map((item, index) => ({
          id: index + 1,
          ...item
        }));
      } else if (loadedData.items && typeof loadedData.items === 'string') {
        items = loadedData.items.split(';').filter(itemStr => itemStr.trim()).map((itemStr, index) => {
          const itemParts = itemStr.split('|');
          return {
            id: index + 1,
            code: itemParts[0] || "",
            name: itemParts[1] || "",
            gst: Number(itemParts[2]) || 18,
            qty: Number(itemParts[3]) || 1,
            units: itemParts[4] || "Nos",
            rate: Number(itemParts[5]) || 0,
            discount: Number(itemParts[6]) || 0,
            flatDiscount: Number(itemParts[7]) || 0,
            amount: Number(itemParts[8]) || 0
          };
        });
      } else {
        items = [{
          id: 1,
          code: "",
          name: "",
          gst: 18,
          qty: 1,
          units: "Nos",
          rate: 0,
          discount: 0,
          flatDiscount: 0,
          amount: 0
        }];
      }

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
      const totalFlatDiscount = Number(loadedData.totalFlatDiscount) || 0;
      const cgstRate = Number(loadedData.cgstRate) || 9;
      const sgstRate = Number(loadedData.sgstRate) || 9;
      const taxableAmount = Math.max(0, subtotal - totalFlatDiscount);
      const cgstAmount = Number((taxableAmount * (cgstRate / 100)).toFixed(2));
      const sgstAmount = Number((taxableAmount * (sgstRate / 100)).toFixed(2));
      const total = Number((taxableAmount + cgstAmount + sgstAmount).toFixed(2));

      // Set the quotationData state with all fields
      setQuotationData({
        ...loadedData,
        items,
        subtotal,
        totalFlatDiscount,
        cgstRate,
        sgstRate,
        cgstAmount,
        sgstAmount,
        total,
        // Make sure to include all fields, especially shipTo and state
        accountNo: loadedData.accountNo || "",
        bankName: loadedData.bankName || "",
        bankAddress: loadedData.bankAddress || "",
        ifscCode: loadedData.ifscCode || "",
        email: loadedData.email || "",
        website: loadedData.website || "",
        pan: loadedData.pan || "",
        consignorState: loadedData.consignorState || "",
        consignorName: loadedData.consignorName || "",
        consignorAddress: loadedData.consignorAddress || "",
        consignorMobile: loadedData.consignorMobile || "",
        consignorPhone: loadedData.consignorPhone || "",
        consignorGSTIN: loadedData.consignorGSTIN || "",
        consignorStateCode: loadedData.consignorStateCode || "",
        consigneeName: loadedData.consigneeName || "",
        consigneeAddress: loadedData.consigneeAddress || "",
        shipTo: loadedData.shipTo || loadedData.consigneeAddress || "", // Use shipTo if exists, otherwise consigneeAddress
        consigneeState: loadedData.consigneeState || "",
        consigneeContactName: loadedData.consigneeContactName || "",
        consigneeContactNo: loadedData.consigneeContactNo || "",
        consigneeGSTIN: loadedData.consigneeGSTIN || "",
        consigneeStateCode: loadedData.consigneeStateCode || "",
        msmeNumber: loadedData.msmeNumber || "",
        preparedBy: loadedData.preparedBy || "",
        notes: Array.isArray(loadedData.notes) ? loadedData.notes : 
              (loadedData.notes ? [loadedData.notes] : [""])
      });
    }
  } catch (error) {
    console.error("Error fetching quotation data:", error);
    alert("Failed to load quotation data");
  } finally {
    setIsLoadingQuotation(false);
  }
};
  
  

  // Add a new note
  const addNote = () => {
    setQuotationData((prev) => ({
      ...prev,
      notes: [...prev.notes, ""],
    }))
  }

  // Remove a note
  const removeNote = (index) => {
    setQuotationData((prev) => {
      const newNotes = [...prev.notes]
      newNotes.splice(index, 1)
      return {
        ...prev,
        notes: newNotes,
      }
    })
  }

  // Add a new item with discount fields
  const handleAddItem = () => {
    const newId = Math.max(0, ...quotationData.items.map((item) => item.id)) + 1
    setQuotationData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: newId,
          code: "",
          name: "",
          gst: 18,
          qty: 1,
          units: "Nos",
          rate: 0,
          discount: 0, // Percentage discount
          flatDiscount: 0, // Flat discount
          amount: 0,
        },
      ],
    }))
  }

  // Fetch dropdown data for states and corresponding details
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Fetch data from Dropdown sheet
        const dropdownUrl = "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=DROPDOWN"
        const dropdownResponse = await fetch(dropdownUrl)
        const dropdownText = await dropdownResponse.text()
        
        // Extract the JSON part from the Dropdown sheet response
        const dropdownJsonStart = dropdownText.indexOf('{')
        const dropdownJsonEnd = dropdownText.lastIndexOf('}') + 1
        const dropdownJsonData = dropdownText.substring(dropdownJsonStart, dropdownJsonEnd)
        
        const dropdownData = JSON.parse(dropdownJsonData)
        
        // Process Dropdown sheet data
        if (dropdownData && dropdownData.table && dropdownData.table.rows) {
          // For state options (Column AA - index 26)
          const stateOptionsData = ["Select State"]
          const stateDetailsMap = {}
          
          // For company options (Column M - index 12)
          const companyOptionsData = ["Select Company"]
          const companyDetailsMap = {}
          
          // For reference options (Column V - index 21)
          const referenceOptionsData = ["Select Reference"]
          const referenceDetailsMap = {} // Add this to store reference details including mobile number
          
          dropdownData.table.rows.slice(0).forEach((row) => {
            if (row.c) {
              // Extract state name and details (Column AA - index 26)
              const stateName = row.c[26] ? row.c[26].v : ""
              if (stateName && !stateOptionsData.includes(stateName)) {
                stateOptionsData.push(stateName)
                
                // Parse bank details from column AB (index 27)
                let bankDetails = ""
                if (row.c[27] && row.c[27].v) {
                  bankDetails = row.c[27].v
                }
                
                // Store associated data
                stateDetailsMap[stateName] = {
                  bankDetails: bankDetails, // Column AB - Bank Details
                  consignerAddress: row.c[28] ? row.c[28].v : "", // Column AC - Consigner Address
                  stateCode: row.c[30] ? row.c[30].v : "", // Column AE - State Code
                  gstin: row.c[31] ? row.c[31].v : "" // Column AF - GSTIN
                }
              }
              
              // Extract company name (Column M - index 12)
              const companyName = row.c[12] ? row.c[12].v : ""
              if (companyName && !companyOptionsData.includes(companyName)) {
                companyOptionsData.push(companyName)
                
                // Store company details
                companyDetailsMap[companyName] = {
                  address: row.c[15] ? row.c[15].v : "",     // Column P - Address
                  state: row.c[16] ? row.c[16].v : "",       // Column Q - State
                  contactName: row.c[13] ? row.c[13].v : "", // Column N - Contact Name
                  contactNo: row.c[14] ? row.c[14].v : "",   // Column O - Contact No
                  gstin: row.c[17] ? row.c[17].v : "",       // Column R - GSTIN
                  stateCode: row.c[18] ? row.c[18].v : ""    // Column S - State Code
                }
              }
              
              // Extract reference name (Column V - index 21)
              const referenceName = row.c[21] ? row.c[21].v : ""
              if (referenceName && !referenceOptionsData.includes(referenceName)) {
                referenceOptionsData.push(referenceName)
                
                // Store reference details including mobile number (Column W - index 22)
                referenceDetailsMap[referenceName] = {
                  mobile: row.c[22] ? row.c[22].v : ""  // Mobile number from Column W
                }
              }
            }
          })
          
          // Update all dropdown options and data
          setStateOptions(stateOptionsData)
          setCompanyOptions(companyOptionsData)
          setReferenceOptions(referenceOptionsData)
          
          // Update dropdown data
          setDropdownData({
            states: stateDetailsMap,
            companies: companyDetailsMap,
            references: referenceDetailsMap  // Add reference details to dropdown data
          })
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error)
        
        // Fallback mock data for dropdowns
        setStateOptions(["Select State", "Chhattisgarh", "Maharashtra", "Delhi"])
        setCompanyOptions(["Select Company", "ABC Corp", "XYZ Industries", "PQR Ltd"])
        setReferenceOptions(["Select Reference", "John Doe", "Jane Smith", "Mike Johnson"])
        
        // Fallback mock data for state details, company details, and reference details
        setDropdownData({
          states: {
            "Chhattisgarh": {
              bankDetails: "Account No.: 438605000447\nBank Name: ICICI BANK\nBank Address: FAFADIH, RAIPUR\nIFSC CODE: ICIC0004386\nEmail: Support@thedivineempire.com\nWebsite: www.thedivineempire.com",
              consignerAddress: "Divine Empire Private Limited, Raipur, Chhattisgarh",
              stateCode: "22",
              gstin: "22AAKCD1234M1Z5"
            },
            "Maharashtra": {
              bankDetails: "Account No.: 878705000123\nBank Name: HDFC BANK\nBank Address: ANDHERI, MUMBAI\nIFSC CODE: HDFC0001234\nEmail: Support@thedivineempire.com\nWebsite: www.thedivineempire.com",
              consignerAddress: "Divine Empire Private Limited, Mumbai, Maharashtra",
              stateCode: "27",
              gstin: "27AAKCD1234M1Z5"
            },
            "Delhi": {
              bankDetails: "Account No.: 912305000789\nBank Name: SBI BANK\nBank Address: CONNAUGHT PLACE, DELHI\nIFSC CODE: SBIN0005678\nEmail: Support@thedivineempire.com\nWebsite: www.thedivineempire.com",
              consignerAddress: "Divine Empire Private Limited, New Delhi, Delhi",
              stateCode: "07",
              gstin: "07AAKCD1234M1Z5"
            }
          },
          companies: {
            "ABC Corp": {
              address: "123 Main Street, Mumbai, Maharashtra",
              state: "Maharashtra",
              contactName: "Rajesh Kumar",
              contactNo: "9876543210",
              gstin: "27ABCDE1234F1Z5",
              stateCode: "27"
            },
            "XYZ Industries": {
              address: "456 Industrial Area, Delhi",
              state: "Delhi",
              contactName: "Amit Singh",
              contactNo: "8765432109",
              gstin: "07FGHIJ5678K1Z5",
              stateCode: "07"
            },
            "PQR Ltd": {
              address: "789 Business Park, Raipur, Chhattisgarh",
              state: "Chhattisgarh",
              contactName: "Priya Sharma",
              contactNo: "7654321098",
              gstin: "22KLMNO9101P1Z5",
              stateCode: "22"
            }
          },
          references: {
            "John Doe": {
              mobile: "9898989898"
            },
            "Jane Smith": {
              mobile: "8787878787"
            },
            "Mike Johnson": {
              mobile: "7676767676"
            }
          }
        })
      }
    }
    
    fetchDropdownData()
  }, [])

  // Handle reference name change and auto-fill mobile number
  const handleReferenceChange = (e) => {
    const selectedReference = e.target.value
    handleInputChange("consignorName", selectedReference)
    
    if (selectedReference && dropdownData.references && dropdownData.references[selectedReference]) {
      const referenceDetails = dropdownData.references[selectedReference]
      
      // Auto-fill mobile number from reference details
      if (referenceDetails.mobile) {
        handleInputChange("consignorMobile", referenceDetails.mobile)
      }
    } else {
      // Clear mobile field when no reference is selected or data is not available
      handleInputChange("consignorMobile", "")
    }
  }

  // Handle company change and auto-fill consignee details
  const handleCompanyChange = (e) => {
    const selectedCompany = e.target.value
    handleInputChange("consigneeName", selectedCompany)
    
    if (selectedCompany && dropdownData.companies && dropdownData.companies[selectedCompany]) {
      const companyDetails = dropdownData.companies[selectedCompany]
      
      // Auto-fill company details
      handleInputChange("consigneeAddress", companyDetails.address)      // Column P - Address
      handleInputChange("consigneeState", companyDetails.state)          // Column Q - State
      handleInputChange("consigneeContactName", companyDetails.contactName) // Column N - Contact Name
      handleInputChange("consigneeContactNo", companyDetails.contactNo)  // Column O - Contact No
      handleInputChange("consigneeGSTIN", companyDetails.gstin)          // Column R - GSTIN
      handleInputChange("consigneeStateCode", companyDetails.stateCode)  // Column S - State Code
    } else {
      // Clear fields when no company is selected or data is not available
      handleInputChange("consigneeAddress", "")
      handleInputChange("consigneeState", "")
      handleInputChange("consigneeContactName", "")
      handleInputChange("consigneeContactNo", "")
      handleInputChange("consigneeGSTIN", "")
      handleInputChange("consigneeStateCode", "")
    }
  }

  // Handle state change and auto-fill related fields
  const handleStateChange = (e) => {
    const selectedState = e.target.value
    handleInputChange("consignorState", selectedState)
    
    if (selectedState && dropdownData.states && dropdownData.states[selectedState]) {
      const stateDetails = dropdownData.states[selectedState]
      
      // Parse bank details (from column AB)
      if (stateDetails.bankDetails) {
        const bankDetailsText = stateDetails.bankDetails
        
        // Extract bank details using regex patterns
        const accountNoMatch = bankDetailsText.match(/Account No\.: ([^\n]+)/)
        const bankNameMatch = bankDetailsText.match(/Bank Name: ([^\n]+)/)
        const bankAddressMatch = bankDetailsText.match(/Bank Address: ([^\n]+)/)
        const ifscMatch = bankDetailsText.match(/IFSC CODE: ([^\n]+)/)
        const emailMatch = bankDetailsText.match(/Email: ([^\n]+)/)
        const websiteMatch = bankDetailsText.match(/Website: ([^\n]+)/)
        const panMatch = bankDetailsText.match(/PAN: ([^\n]+)/) // Add PAN extraction
        
        // Update bank details fields
        if (accountNoMatch) handleInputChange("accountNo", accountNoMatch[1])
        if (bankNameMatch) handleInputChange("bankName", bankNameMatch[1])
        if (bankAddressMatch) handleInputChange("bankAddress", bankAddressMatch[1])
        if (ifscMatch) handleInputChange("ifscCode", ifscMatch[1])
        if (emailMatch) handleInputChange("email", emailMatch[1])
        if (websiteMatch) handleInputChange("website", websiteMatch[1])
        if (panMatch) handleInputChange("pan", panMatch[1]) // Add PAN handling
      }
      
      // Update consigner address from column AC
      if (stateDetails.consignerAddress) {
        handleInputChange("consignorAddress", stateDetails.consignerAddress)
      }
      
      // Update state code from column AE
      if (stateDetails.stateCode) {
        handleInputChange("consignorStateCode", stateDetails.stateCode)
      }
      
      // Update GSTIN from column AF
      if (stateDetails.gstin) {
        handleInputChange("consignorGSTIN", stateDetails.gstin)
      }
    } else {
      // Clear fields when no state is selected or data is not available
      handleInputChange("accountNo", "")
      handleInputChange("bankName", "")
      handleInputChange("bankAddress", "")
      handleInputChange("ifscCode", "")
      handleInputChange("email", "")
      handleInputChange("website", "")
      handleInputChange("pan", "") // Clear PAN field
      handleInputChange("consignorAddress", "")
      handleInputChange("consignorStateCode", "")
      handleInputChange("consignorGSTIN", "")
    }
  }

  useEffect(() => {
    const initializeQuotationNumber = async () => {
      try {
        const nextQuotationNumber = await getNextQuotationNumber();
        setQuotationData(prev => ({
          ...prev,
          quotationNo: nextQuotationNumber
        }));
      } catch (error) {
        console.error("Error initializing quotation number:", error);
      }
    };
  
    initializeQuotationNumber();
  }, []);

  // Generate PDF
  const handleGeneratePDF = () => {
    setIsGenerating(true)
    
    try {
      // Generate the PDF base64 data
      const base64Data = generatePDFFromData()
      
      // Convert base64 to Blob
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      
      // Create a link element to trigger download
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `Quotation_${quotationData.quotationNo}.pdf`
      
      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the URL object
      URL.revokeObjectURL(link.href)
      
      setIsGenerating(false)
      alert("PDF generated and downloaded successfully!")
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF")
      setIsGenerating(false)
    }
  }

  // Generate shareable link
  const handleGenerateLink = () => {
    setIsGenerating(true)

    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false)
      setQuotationLink(`https://leadtoorder.example.com/quotations/${quotationData.quotationNo}`)

      // Show success message
      alert("Quotation link has been successfully generated and is ready to share.")
    }, 1000)
  }
  
  // Generate PDF
  // Generate PDF
const generatePDFFromData = () => {
  // Create a new jsPDF instance with landscape orientation for more width
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Page dimensions
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const margin = 10;
  let currentY = 20; // Starting Y position

  // Utility function to wrap text
  const wrapText = (text, maxWidth) => {
    return doc.splitTextToSize(text || '', maxWidth);
  };

  // Utility function to format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value).replace('₹', '').trim();
  };

  // Function to check space and add new page if needed
  const checkSpace = (requiredHeight) => {
    if (currentY + requiredHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      addPageHeader();
      return true;
    }
    return false;
  };

  // Function to add page header
  const addPageHeader = () => {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION', pageWidth / 2, currentY, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Quotation No: ${quotationData.quotationNo}`, margin, currentY + 10);
    doc.text(`Date: ${quotationData.date}`, pageWidth - margin, currentY + 10, { align: 'right' });
    
    currentY += 20;
  };

  // Add initial page header
  addPageHeader();

  // Prepare consignor and consignee details
  const consignorDetails = [
    `Name: ${quotationData.consignorName}`,
    `Address: ${quotationData.consignorAddress}`,
    `GSTIN: ${quotationData.consignorGSTIN || 'N/A'}`,
    `State Code: ${quotationData.consignorStateCode || 'N/A'}`
  ];

  const consigneeDetails = [
    `Name: ${quotationData.consigneeName}`,
    `Address: ${quotationData.consigneeAddress}`,
    `GSTIN: ${quotationData.consigneeGSTIN || 'N/A'}`,
    `State Code: ${quotationData.consigneeStateCode || 'N/A'}`
  ];

  // Render Consignor & Consignee Details
  doc.setFont('helvetica', 'bold');
  doc.text('Consignor Details', margin, currentY);
  doc.text('Consignee Details', pageWidth / 2 + margin, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 6;

  // Calculate required height for details
  const detailsHeight = Math.max(
    consignorDetails.length * 5,
    consigneeDetails.length * 5
  );

  checkSpace(detailsHeight + 20);

  // Render consignor details with text wrapping
  let consignorY = currentY;
  consignorDetails.forEach((line) => {
    const wrappedLines = wrapText(line, pageWidth / 2 - margin * 2);
    wrappedLines.forEach((wrappedLine) => {
      if (consignorY + 5 > pageHeight - margin) {
        doc.addPage();
        consignorY = margin + 20;
      }
      doc.text(wrappedLine, margin, consignorY);
      consignorY += 5;
    });
  });

  // Render consignee details with text wrapping
  let consigneeY = currentY;
  consigneeDetails.forEach((line) => {
    const wrappedLines = wrapText(line, pageWidth / 2 - margin * 2);
    wrappedLines.forEach((wrappedLine) => {
      if (consigneeY + 5 > pageHeight - margin) {
        doc.addPage();
        consigneeY = margin + 20;
      }
      doc.text(wrappedLine, pageWidth / 2 + margin, consigneeY);
      consigneeY += 5;
    });
  });

  // Update current Y to the max of both sections
  currentY = Math.max(consignorY, consigneeY) + 10;

  // Prepare items data for the table
  const itemsData = quotationData.items.map((item, index) => [
    index + 1,
    item.code,
    item.name,
    `${item.gst}%`,
    item.qty,
    item.units,
    formatCurrency(item.rate),
    `${item.discount}%`,
    formatCurrency(item.flatDiscount),
    formatCurrency(item.amount)
  ])

  // Calculate required height for the table
  const rowHeight = 10;
  const tableHeight = (itemsData.length + 1) * rowHeight; // +1 for header row

  // Check space and add new page if needed
  checkSpace(tableHeight + 50);

  // Use autoTable with custom settings
  autoTable(doc, {
    startY: currentY,
    head: [['S.No', 'Code', 'Product Name', 'GST %', 'Qty', 'Units', 'Rate', 'Disc %', 'Flat Disc', 'Amount']],
    body: itemsData,
    margin: { top: currentY },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
      lineColor: [200, 200, 200],
      lineWidth: 0.3
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 10, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 15, halign: 'right' },
      7: { cellWidth: 12, halign: 'center' },
      8: { cellWidth: 15, halign: 'right' },
      9: { cellWidth: 15, halign: 'right' }
    },
    didDrawPage: function(data) {
      // Reset Y position after table is drawn
      currentY = data.cursor.y;
    }
  });

  // Get the final Y position after the table
  currentY = doc.lastAutoTable.finalY + 10;

  // Financial Summary
  checkSpace(50);
  
  const summaryItems = [
    { label: 'Subtotal:', value: formatCurrency(quotationData.subtotal) },
    { label: 'Total Flat Discount:', value: `-${formatCurrency(quotationData.totalFlatDiscount)}` },
    { label: 'Taxable Amount:', value: formatCurrency(quotationData.subtotal - quotationData.totalFlatDiscount) },
    { label: `CGST (${quotationData.cgstRate}%):`, value: formatCurrency(quotationData.cgstAmount) },
    { label: `SGST (${quotationData.sgstRate}%):`, value: formatCurrency(quotationData.sgstAmount) },
    { label: 'Total:', value: formatCurrency(quotationData.total) }
  ];

  doc.setFont('helvetica', 'bold');
  doc.text('Financial Summary', margin, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 7;

  summaryItems.forEach(item => {
    checkSpace(7);
    doc.text(item.label, margin, currentY);
    doc.text(item.value, pageWidth - margin - 10, currentY, { align: 'right' });
    currentY += 7;
  });

  // Terms & Conditions
  checkSpace(50);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions', margin, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 7;

  const terms = [
    `Validity: ${quotationData.validity}`,
    `Payment Terms: ${quotationData.paymentTerms}`,
    `Delivery: ${quotationData.delivery}`,
    `Freight: ${quotationData.freight}`,
    `Insurance: ${quotationData.insurance}`,
    `Taxes: ${quotationData.taxes}`
  ];

  terms.forEach(term => {
    const wrappedLines = wrapText(term, pageWidth - margin * 2);
    wrappedLines.forEach(line => {
      checkSpace(7);
      doc.text(line, margin, currentY);
      currentY += 7;
    });
  });

  // Notes
  if (quotationData.notes && quotationData.notes.length > 0) {
    checkSpace(20);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Notes', margin, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 7;

    quotationData.notes.filter(note => note.trim()).forEach(note => {
      const wrappedLines = wrapText(`• ${note}`, pageWidth - margin * 2);
      wrappedLines.forEach(line => {
        checkSpace(7);
        doc.text(line, margin, currentY);
        currentY += 7;
      });
    });
  }

  // Bank Details
  checkSpace(50);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Bank Details', margin, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 7;

  const bankDetails = [
    `Account No.: ${quotationData.accountNo}`,
    `Bank Name: ${quotationData.bankName}`,
    `Bank Address: ${quotationData.bankAddress}`,
    `IFSC Code: ${quotationData.ifscCode}`,
    `Email: ${quotationData.email}`,
    `Website: ${quotationData.website}`,
    `Company PAN: ${quotationData.pan}`
  ];

  bankDetails.forEach(detail => {
    const wrappedLines = wrapText(detail, pageWidth - margin * 2);
    wrappedLines.forEach(line => {
      checkSpace(7);
      doc.text(line, margin, currentY);
      currentY += 7;
    });
  });

  // Declaration
  checkSpace(40);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Declaration', margin, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 7;

  const declaration = [
    'We declare that this Quotation shows the actual price of the goods described',
    'and that all particulars are true and correct.'
  ];

  declaration.forEach(line => {
    const wrappedLines = wrapText(line, pageWidth - margin * 2);
    wrappedLines.forEach(wrappedLine => {
      checkSpace(7);
      doc.text(wrappedLine, margin, currentY);
      currentY += 7;
    });
  });

  // Prepared By
  doc.setFont('helvetica', 'bold');
  doc.text(`Prepared By: ${quotationData.preparedBy}`, margin, currentY + 10);

  // Add page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
  }

  // Generate Base64 PDF
  return doc.output('datauristring').split(',')[1];
};

  // Modified handleSaveQuotation function to submit data in specified order
// Modified handleSaveQuotation function to include item data after bank details
const handleSaveQuotation = async () => {
  // Validate required fields
  if (!quotationData.consigneeName) {
    alert("Please select a company name")
    return
  }
  
  if (!quotationData.preparedBy) {
    alert("Please enter prepared by name")
    return
  }
  
  setIsSubmitting(true)

  try {
    // Generate PDF
    const base64Data = generatePDFFromData()
    
    // Handle revision numbering
    let finalQuotationNo = quotationData.quotationNo;
    if (isRevising && selectedQuotation) {
      // Check if this is the first revision (no -## suffix)
      if (!finalQuotationNo.match(/-\d{2}$/)) {
        finalQuotationNo = `${finalQuotationNo}-01`;
      } else {
        // Increment the revision number
        const parts = finalQuotationNo.split('-');
        const lastPart = parts[parts.length - 1];
        const revisionNumber = parseInt(lastPart, 10);
        const newRevision = (revisionNumber + 1).toString().padStart(2, '0');
        parts[parts.length - 1] = newRevision;
        finalQuotationNo = parts.join('-');
      }
    }
    
    const fileName = `Quotation_${finalQuotationNo}.pdf`
    
    // Script URL
    const scriptUrl = "https://script.google.com/macros/s/AKfycbxeo5tv3kAcSDDAheOCP07HaK76zSfq49jFGtZknseg7kPlj2G1O8U2PuiA2fQSuPvKqA/exec"
    
    // 1. Upload PDF to Google Drive and get URL
    const pdfParams = {
      action: "uploadPDF",
      pdfData: base64Data,
      fileName: fileName
    }
    
    const pdfUrlParams = new URLSearchParams()
    for (const key in pdfParams) {
      pdfUrlParams.append(key, pdfParams[key])
    }
    
    const pdfResponse = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: pdfUrlParams
    })
    
    const pdfResult = await pdfResponse.json()
    
    if (!pdfResult.success) {
      throw new Error("Failed to upload PDF: " + (pdfResult.error || "Unknown error"))
    }
    
    // Get the PDF URL to include in the main data submission
    const pdfUrl = pdfResult.fileUrl
    
    // 2. Prepare the main quotation data in the specified order
    // Quotation Details
    const quotationDetails = [
      new Date().toLocaleString(), // timestamp
      finalQuotationNo,
      quotationData.date,
      quotationData.preparedBy
    ]
    
    // Consignor Details
    const consignorDetails = [
      quotationData.consignorState,
      quotationData.consignorName,
      quotationData.consignorAddress,
      quotationData.consignorMobile,
      quotationData.consignorPhone,
      quotationData.consignorGSTIN,
      quotationData.consignorStateCode
    ]
    
    // Consignee Details
    const consigneeDetails = [
      quotationData.consigneeName,
      quotationData.consigneeAddress,
      quotationData.shipTo || quotationData.consigneeAddress, 
      quotationData.consigneeState,
      quotationData.consigneeContactName,
      quotationData.consigneeContactNo,
      quotationData.consigneeGSTIN,
      quotationData.consigneeStateCode,
      quotationData.msmeNumber
    ]
    
    // Terms and Conditions
    const termsDetails = [
      quotationData.validity,
      quotationData.paymentTerms,
      quotationData.delivery,
      quotationData.freight,
      quotationData.insurance,
      quotationData.taxes,
      quotationData.notes.join("|") // Join notes with a separator
    ]
    
    // Bank Details
    const bankDetails = [
      quotationData.accountNo,
      quotationData.bankName,
      quotationData.bankAddress,
      quotationData.ifscCode,
      quotationData.email,
      quotationData.website,
      quotationData.pan
    ]
    
    // Format item data as a single string to include in the main row data
    const itemsString = quotationData.items.map(item => {
      return [
        item.code || "",
        item.name || "",
        item.gst || 0,
        item.qty || 0,
        item.units || "Nos",
        item.rate || 0,
        item.discount || 0,
        item.flatDiscount || 0,
        item.amount || 0
      ].join("|");
    }).join(";");
    
    // Combine all data in one array with PDF URL as the last element
    const mainRowData = [
      ...quotationDetails,
      ...consignorDetails,
      ...consigneeDetails,
      ...termsDetails,
      ...bankDetails,
      itemsString,
      pdfUrl
    ]
    
    // 3. Submit main quotation data with items and PDF URL
    const sheetParams = {
      sheetName: "Make Quotation",
      action: "insert",
      rowData: JSON.stringify(mainRowData)
    }
    
    const sheetUrlParams = new URLSearchParams()
    for (const key in sheetParams) {
      sheetUrlParams.append(key, sheetParams[key])
    }
    
    const sheetResponse = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: sheetUrlParams
    })

    const sheetResult = await sheetResponse.json()
    
    if (!sheetResult.success) {
      throw new Error("Error saving quotation: " + (sheetResult.error || "Unknown error"))
    }
    
    // 4. Also submit each item to the Items sheet separately if needed
    const itemPromises = quotationData.items.map(async (item) => {
      const itemData = [
        finalQuotationNo,   // Use the final quotation number
        item.code,
        item.name,
        item.gst,
        item.qty,
        item.units,
        item.rate,
        item.discount,
        item.flatDiscount,
        item.amount
      ]
      
      const itemParams = {
        sheetName: "Quotation Items",
        action: "insert",
        rowData: JSON.stringify(itemData)
      }
      
      const itemUrlParams = new URLSearchParams()
      for (const key in itemParams) {
        itemUrlParams.append(key, itemParams[key])
      }
      
      return fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: itemUrlParams
      })
    })
    
    // Wait for all item submissions to complete
    await Promise.all(itemPromises)
    
    // Set the PDF URL for preview
    setPdfUrl(pdfUrl)
    
    // Update the quotation number in state if we revised
    if (isRevising && selectedQuotation) {
      setQuotationData(prev => ({
        ...prev,
        quotationNo: finalQuotationNo
      }));
    }
    
    alert("Quotation saved successfully with all items!")
    
    // Reset form to prepare for new quotation
    const nextQuotationNumber = await getNextQuotationNumber()
    setQuotationData({
      quotationNo: nextQuotationNumber,
      date: new Date().toLocaleDateString("en-GB"),
      consignorState: "",
      consignorName: "",
      consignorAddress: "",
      consignorMobile: "",
      consignorPhone: "",
      consignorGSTIN: "",
      consignorStateCode: "",
      companyName: "", 
      consigneeName: "",
      consigneeAddress: "",
      consigneeState: "",
      consigneeContactName: "",
      consigneeContactNo: "",
      consigneeGSTIN: "",
      consigneeStateCode: "",
      msmeNumber: "",
      items: [
        {
          id: 1,
          code: "",
          name: "",
          gst: 18,
          qty: 1,
          units: "Nos",
          rate: 0,
          discount: 0,
          flatDiscount: 0,
          amount: 0,
        },
      ],
      totalFlatDiscount: 0,
      subtotal: 0,
      cgstRate: 9,
      sgstRate: 9,
      cgstAmount: 0,
      sgstAmount: 0,
      total: 0,
      validity: "The above quoted prices are valid up to 5 days from date of offer.",
      paymentTerms: "100% advance payment in the mode of NEFT, RTGS & DD",
      delivery: "Material is ready in our stock",
      freight: "Extra as per actual.",
      insurance: "Transit insurance for all shipment is at Buyer's risk.",
      taxes: "Extra as per actual.",
      accountNo: "",
      bankName: "",
      bankAddress: "",
      ifscCode: "",
      email: "",
      website: "",
      pan: "",
      notes: [""],
      preparedBy: "",
    })
  } catch (error) {
    alert("Error: " + error.message)
  } finally {
    setIsSubmitting(false)
  }
}


  // Helper function to increment quotation number
  const getNextQuotationNumber = async () => {
    // Script URL
    const scriptUrl = "https://script.google.com/macros/s/AKfycbxeo5tv3kAcSDDAheOCP07HaK76zSfq49jFGtZknseg7kPlj2G1O8U2PuiA2fQSuPvKqA/exec"
    
    try {
      // Prepare parameters to get the last quotation number
      const params = {
        sheetName: "Make Quotation",
        action: "getNextQuotationNumber"
      }
      
      // Create URL-encoded string for the parameters
      const urlParams = new URLSearchParams()
      for (const key in params) {
        urlParams.append(key, params[key])
      }
      
      // Send request to get last quotation number
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: urlParams
      })
      
      const result = await response.json()
      
      if (result.success) {
        return result.nextQuotationNumber
      } else {
        // Fallback to default if there's an error
        return "IN-NBD-001"
      }
    } catch (error) {
      console.error("Error getting next quotation number:", error)
      // Fallback to default in case of any error
      return "IN-NBD-001"
    }
  }
  

  return (
    <div className="container mx-auto py-6 px-4">
    <div className="flex justify-between items-center mb-6">
  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
    Make Quotation
  </h1>
  <button
    className={`px-4 py-2 rounded-md ${isRevising ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
    onClick={() => setIsRevising(!isRevising)}
  >
    {isRevising ? 'Cancel Revise' : 'Revise'}
  </button>
</div>


      <div className="bg-white rounded-lg shadow border">
        <div className="border-b">
          <div className="flex">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "edit"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-tl-lg"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("edit")}
            >
              Edit Quotation
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "preview" ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white" : "text-gray-600"
              }`}
              onClick={() => setActiveTab("preview")}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="p-4">
          {activeTab === "edit" ? (
            <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <h3 className="text-lg font-medium mb-4">Quotation Details</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                  {/* Replace the existing Quotation No input field with this upgraded version */}
<div className="space-y-2">
  <label className="block text-sm font-medium">Quotation No.</label>
  {isRevising ? (
    <div className="flex items-center">
      <select
        value={selectedQuotation}
        onChange={(e) => handleQuotationSelect(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md"
      >
        <option value="">Select Quotation to Revise</option>
        {existingQuotations && existingQuotations.length > 0 ? (
          existingQuotations.map((quotation) => (
            <option key={quotation} value={quotation}>
              {quotation}
            </option>
          ))
        ) : (
          <option value="" disabled>Loading quotations...</option>
        )}
      </select>
      {isLoadingQuotation && (
        <div className="ml-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  ) : (
    <input
      type="text"
      value={quotationData.quotationNo}
      readOnly
      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
    />
  )}
</div>


                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Date</label>
                        <input
                          type="date"
                          value={quotationData.date.split("/").reverse().join("-")}
                          onChange={(e) => {
                            // Convert from YYYY-MM-DD to DD/MM/YYYY format
                            const dateValue = e.target.value
                            if (dateValue) {
                              const [year, month, day] = dateValue.split("-")
                              handleInputChange("date", `${day}/${month}/${year}`)
                            }
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Prepared By</label>
                      <input
                        type="text"
                        value={quotationData.preparedBy}
                        onChange={(e) => handleInputChange("preparedBy", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Enter name of person preparing this quotation"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">State</label>
                      <select
                        value={quotationData.consignorState}
                        onChange={handleStateChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {stateOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium mt-6 mb-4">Consignor Details</h3>
                  <div className="space-y-4">
                  <div className="space-y-2">
  <label className="block text-sm font-medium">Reference Name</label>
  <select
    value={quotationData.consignorName}
    onChange={handleReferenceChange}  // Use the new handler here
    className="w-full p-2 border border-gray-300 rounded-md"
  >
    {referenceOptions.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>
</div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Address</label>
                      <textarea
                        value={quotationData.consignorAddress}
                        onChange={(e) => handleInputChange("consignorAddress", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Mobile</label>
                        <input
                          type="text"
                          value={quotationData.consignorMobile}
                          onChange={(e) => handleInputChange("consignorMobile", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Phone</label>
                        <input
                          type="text"
                          value={quotationData.consignorPhone}
                          onChange={(e) => handleInputChange("consignorPhone", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">GSTIN</label>
                        <input
                          type="text"
                          value={quotationData.consignorGSTIN}
                          onChange={(e) => handleInputChange("consignorGSTIN", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">State Code</label>
                        <input
                          type="text"
                          value={quotationData.consignorStateCode}
                          onChange={(e) => handleInputChange("consignorStateCode", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
  <label className="block text-sm font-medium">MSME No.</label>
  <input
    type="text"
    value={quotationData.msmeNumber || ""}
    onChange={(e) => handleInputChange("msmeNumber", e.target.value)}
    className="w-full p-2 border border-gray-300 rounded-md"
  />
</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <h3 className="text-lg font-medium mb-4">Consignee Details</h3>
                  <div className="space-y-4">
                  <div className="space-y-2">
  <label className="block text-sm font-medium">Company Name</label>
  <select
    value={quotationData.consigneeName}
    onChange={handleCompanyChange}
    className="w-full p-2 border border-gray-300 rounded-md"
    required
  >
    {companyOptions.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>
</div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Address</label>
                      <textarea
                        value={quotationData.consigneeAddress}
                        onChange={(e) => handleInputChange("consigneeAddress", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="Enter address"
                      />
                    </div>
                    <div className="space-y-2">
  <label className="block text-sm font-medium">Ship To</label>
  <textarea
    value={quotationData.shipTo || ""}
    onChange={(e) => handleInputChange("shipTo", e.target.value)}
    className="w-full p-2 border border-gray-300 rounded-md"
    rows={3}
    placeholder="Enter shipping address if different from billing address"
  />
</div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">State</label>
                      <input
                        type="text"
                        value={quotationData.consigneeState}
                        onChange={(e) => handleInputChange("consigneeState", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Enter State"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Contact Name</label>
                        <input
                          type="text"
                          value={quotationData.consigneeContactName}
                          onChange={(e) => handleInputChange("consigneeContactName", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Contact No.</label>
                        <input
                          type="text"
                          value={quotationData.consigneeContactNo}
                          onChange={(e) => handleInputChange("consigneeContactNo", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">GSTIN</label>
                        <input
                          type="text"
                          value={quotationData.consigneeGSTIN}
                          onChange={(e) => handleInputChange("consigneeGSTIN", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">State Code</label>
                        <input
                          type="text"
                          value={quotationData.consigneeStateCode}
                          onChange={(e) => handleInputChange("consigneeStateCode", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Items</h3>
                    <button
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                      onClick={handleAddItem}
                    >
                      <PlusIcon className="h-4 w-4 inline mr-1" /> Add Item
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">S No.</th>
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">GST %</th>
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty.</th>
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Units</th>
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Disc %</th>
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Flat Disc</th>
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {quotationData.items.map((item, index) => (
      <tr key={item.id}>
        <td className="px-4 py-2">{index + 1}</td>
        <td className="px-4 py-2">
  <div className="relative">
    <input
      type="text"
      value={item.code}
      onChange={(e) => {
        handleItemChange(item.id, "code", e.target.value);
        // Auto-fill product name if code exists in mapping
        if (productData[e.target.value]) {
          handleItemChange(item.id, "name", productData[e.target.value]);
        }
      }}
      list={`code-list-${item.id}`}
      className="w-24 p-1 border border-gray-300 rounded-md"
    />
    <datalist id={`code-list-${item.id}`}>
      {productCodes.map((code) => (
        <option key={code} value={code} />
      ))}
    </datalist>
  </div>
</td>
<td className="px-4 py-2">
  <div className="relative">
    <input
      type="text"
      value={item.name}
      onChange={(e) => {
        handleItemChange(item.id, "name", e.target.value);
        // Auto-fill code if product name exists in mapping
        if (productData[e.target.value]) {
          handleItemChange(item.id, "code", productData[e.target.value]);
        }
      }}
      list={`name-list-${item.id}`}
      className="w-full p-1 border border-gray-300 rounded-md"
      placeholder="Enter item name"
      required
    />
    <datalist id={`name-list-${item.id}`}>
      {productNames.map((name) => (
        <option key={name} value={name} />
      ))}
    </datalist>
  </div>
</td>
        <td className="px-4 py-2">
          <select
            value={item.gst}
            onChange={(e) => handleItemChange(item.id, "gst", Number.parseInt(e.target.value))}
            className="w-20 p-1 border border-gray-300 rounded-md"
          >
            <option value="0">0%</option>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            value={item.qty}
            onChange={(e) => handleItemChange(item.id, "qty", Number.parseInt(e.target.value) || 0)}
            className="w-16 p-1 border border-gray-300 rounded-md"
            placeholder="0"
            required
          />
        </td>
        <td className="px-4 py-2">
          <select
            value={item.units}
            onChange={(e) => handleItemChange(item.id, "units", e.target.value)}
            className="w-20 p-1 border border-gray-300 rounded-md"
          >
            <option value="Nos">Nos</option>
            <option value="Pcs">Pcs</option>
            <option value="Kg">Kg</option>
            <option value="Set">Set</option>

            </select>
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            value={item.rate}
            onChange={(e) => handleItemChange(item.id, "rate", Number.parseFloat(e.target.value) || 0)}
            className="w-24 p-1 border border-gray-300 rounded-md"
            placeholder="0.00"
            required
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            value={item.discount}
            onChange={(e) => handleItemChange(item.id, "discount", Number.parseFloat(e.target.value) || 0)}
            className="w-20 p-1 border border-gray-300 rounded-md"
            placeholder="0%"
            min="0"
            max="100"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            value={item.flatDiscount}
            onChange={(e) => handleItemChange(item.id, "flatDiscount", Number.parseFloat(e.target.value) || 0)}
            className="w-24 p-1 border border-gray-300 rounded-md"
            placeholder="0.00"
            min="0"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            value={item.amount}
            className="w-24 p-1 border border-gray-300 rounded-md bg-gray-50"
            readOnly
          />
        </td>
        <td className="px-4 py-2">
          <button
            className="text-red-500 hover:text-red-700 p-1 rounded-md"
            onClick={() => {
              // Remove item
              const newItems = quotationData.items.filter((i) => i.id !== item.id)
              if (newItems.length === 0) return // Don't remove the last item

              // Recalculate totals
              const subtotal = newItems.reduce((sum, i) => sum + i.amount, 0)
              const subtotalAfterDiscount = Math.max(0, subtotal - quotationData.totalFlatDiscount)
              const cgstAmount = subtotalAfterDiscount * (quotationData.cgstRate / 100)
              const sgstAmount = subtotalAfterDiscount * (quotationData.sgstRate / 100)
              const total = subtotalAfterDiscount + cgstAmount + sgstAmount

              setQuotationData({
                ...quotationData,
                items: newItems,
                subtotal,
                cgstAmount,
                sgstAmount,
                total,
              })
            }}
            disabled={quotationData.items.length <= 1}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </td>
      </tr>
    ))}
  </tbody>
  <tfoot>
    <tr>
      <td colSpan="9" className="px-4 py-2 text-right font-medium">
        Subtotal:
      </td>
      <td className="border p-2">₹{typeof quotationData.subtotal === 'number' ? quotationData.subtotal.toFixed(2) : '0.00'}</td>
      <td></td>
    </tr>
    <tr>
      <td colSpan="9" className="px-4 py-2 text-right font-medium">
        Total Flat Discount:
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          value={quotationData.totalFlatDiscount}
          onChange={(e) => handleFlatDiscountChange(e.target.value)}
          className="w-24 p-1 border border-gray-300 rounded-md"
          min="0"
        />
      </td>
      <td></td>
    </tr>
    <tr>
      <td colSpan="9" className="px-4 py-2 text-right font-medium">
        Taxable Amount:
      </td>
      <td className="px-4 py-2">₹{(quotationData.subtotal - quotationData.totalFlatDiscount).toFixed(2)}</td>
      <td></td>
    </tr>
    <tr>
      <td colSpan="9" className="px-4 py-2 text-right font-medium">
        CGST ({quotationData.cgstRate}%):
      </td>
      <td className="px-4 py-2">₹{quotationData.cgstAmount.toFixed(2)}</td>
      <td></td>
    </tr>
    <tr>
      <td colSpan="9" className="px-4 py-2 text-right font-medium">
        SGST ({quotationData.sgstRate}%):
      </td>
      <td className="px-4 py-2">₹{quotationData.sgstAmount.toFixed(2)}</td>
      <td></td>
    </tr>
    <tr className="font-bold">
      <td colSpan="9" className="px-4 py-2 text-right">
        Total:
      </td>
      <td className="px-4 py-2">₹{quotationData.total.toFixed(2)}</td>
      <td></td>
    </tr>
  </tfoot>
</table>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-medium mb-4">Terms & Conditions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Validity</label>
                    <input
                      type="text"
                      value={quotationData.validity}
                      onChange={(e) => handleInputChange("validity", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Payment Terms</label>
                    <input
                      type="text"
                      value={quotationData.paymentTerms}
                      onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Delivery</label>
                    <input
                      type="text"
                      value={quotationData.delivery}
                      onChange={(e) => handleInputChange("delivery", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Freight</label>
                    <input
                      type="text"
                      value={quotationData.freight}
                      onChange={(e) => handleInputChange("freight", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Insurance</label>
                    <input
                      type="text"
                      value={quotationData.insurance}
                      onChange={(e) => handleInputChange("insurance", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Taxes</label>
                    <input
                      type="text"
                      value={quotationData.taxes}
                      onChange={(e) => handleInputChange("taxes", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4 shadow-sm">
  <h3 className="text-lg font-medium mb-4">Notes</h3>
  <div className="space-y-4">
    {quotationData.notes.map((note, index) => (
      <div key={index} className="flex items-start gap-2">
        <textarea
          value={note}
          onChange={(e) => handleNoteChange(index, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          rows={2}
        />
        <button
          type="button"
          onClick={() => removeNote(index)}
          disabled={quotationData.notes.length <= 1}
          className="text-red-500 hover:text-red-700 p-1 rounded-md"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    ))}
    <button
      type="button"
      className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
      onClick={addNote}
    >
      <PlusIcon className="h-4 w-4 inline mr-1" /> Add Note
    </button>
  </div>
</div>


                <div className="bg-white border rounded-lg p-4 shadow-sm">
  <h3 className="text-lg font-medium mt-6 mb-4">Bank Details</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <label className="block text-sm font-medium">Account No.</label>
      <input
        type="text"
        value={quotationData.accountNo}
        onChange={(e) => handleInputChange("accountNo", e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md"
      />
    </div>
    <div className="space-y-2">
      <label className="block text-sm font-medium">Bank Name</label>
      <input
        type="text"
        value={quotationData.bankName}
        onChange={(e) => handleInputChange("bankName", e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md"
      />
    </div>
    <div className="space-y-2">
      <label className="block text-sm font-medium">Bank Address</label>
      <input
        type="text"
        value={quotationData.bankAddress}
        onChange={(e) => handleInputChange("bankAddress", e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md"
      />
    </div>
    <div className="space-y-2">
      <label className="block text-sm font-medium">IFSC Code</label>
      <input
        type="text"
        value={quotationData.ifscCode}
        onChange={(e) => handleInputChange("ifscCode", e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md"
      />
    </div>
    <div className="space-y-2">
      <label className="block text-sm font-medium">Email</label>
      <input
        type="text"
        value={quotationData.email}
        onChange={(e) => handleInputChange("email", e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md"
      />
    </div>
    <div className="space-y-2">
      <label className="block text-sm font-medium">Website</label>
      <input
        type="text"
        value={quotationData.website}
        onChange={(e) => handleInputChange("website", e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md"
      />
    </div>
    <div className="space-y-2">
      <label className="block text-sm font-medium">PAN</label>
      <input
        type="text"
        value={quotationData.pan}
        onChange={(e) => handleInputChange("pan", e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md"
      />
    </div>
  </div>
</div>
</div>

              <div className="flex justify-between">
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
                  onClick={handleSaveQuotation}
                  disabled={isSubmitting || isGenerating}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4 mr-2" />
                      Save Quotation
                    </>
                  )}
                </button>
                <div className="space-x-2">
                  <button
                    className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md flex items-center inline-flex"
                    onClick={handleGenerateLink}
                    disabled={isGenerating || isSubmitting}
                  >
                    <ShareIcon className="h-4 w-4 mr-2" />
                    Generate Link
                  </button>
                  <button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center inline-flex"
                    onClick={handleGeneratePDF}
                    disabled={isGenerating || isSubmitting}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generating..." : "Generate PDF"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* The main quotation preview that will be captured for PDF */}
              <div id="quotation-preview" className="bg-white border p-6 rounded-lg">
                <div className="flex justify-between items-start border-b pb-4">
                  <div className="w-1/3">
                    <p className="font-bold">{quotationData.consignorName}</p>
                    <p className="text-sm">{quotationData.consignorAddress}</p>
                    <p className="text-sm">Mobile: {quotationData.consignorMobile}</p>
                    <p className="text-sm">Phone: {quotationData.consignorPhone}</p>
                  </div>
                  <div className="w-1/3 text-center">
                    <h1 className="text-xl font-bold">QUOTATION</h1>
                  </div>
                  <div className="w-1/3 text-right">
                    <p className="font-bold">Quo No: {quotationData.quotationNo}</p>
                    <p>Date: {quotationData.date}</p>
                  </div>
                </div>

                {/* Consignor and Consignee Details */}
                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <h3 className="font-bold mb-2">Consignor Details</h3>
                    <p>{quotationData.consignorName}</p>
                    <p>{quotationData.consignorAddress}</p>
                    <p>GSTIN: {quotationData.consignorGSTIN || "N/A"} State Code: {quotationData.consignorStateCode || "N/A"}</p>

                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Consignee Details</h3>
                    <p>Reference Name: {quotationData.consigneeName || "Please enter company name"}</p>
                    <p>Contact Name: {quotationData.consigneeContactName || "Not specified"}</p>
                    <p>Contact No.: {quotationData.consigneeContactNo || "Not specified"}</p>
                    <p>{quotationData.consigneeState}</p>
                    <p>MSME Number- {quotationData.msmeNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <h3 className="font-bold mb-2">Bill To</h3>
                    <p>{quotationData.consigneeAddress || "Please enter address"}</p>
                    <p>
                      GSTIN: {quotationData.consigneeGSTIN || "N/A"} State Code: {quotationData.consigneeStateCode}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Ship To</h3>
                    <p>{quotationData.shipTo || quotationData.consigneeAddress || "Please enter address"}</p>
                  </div>
                </div>

                {/* Items Table with Discount Columns */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border">
                        <th className="border p-2 text-left">S No.</th>
                        <th className="border p-2 text-left">Code</th>
                        <th className="border p-2 text-left">Product Name</th>
                        <th className="border p-2 text-left">GST</th>
                        <th className="border p-2 text-left">Qty.</th>
                        <th className="border p-2 text-left">Units</th>
                        <th className="border p-2 text-left">Rate</th>
                        <th className="border p-2 text-left">Disc %</th>
                        <th className="border p-2 text-left">Flat Disc</th>
                        <th className="border p-2 text-left">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotationData.items.map((item, index) => (
                        <tr key={item.id} className="border">
                          <td className="border p-2">{index + 1}</td>
                          <td className="border p-2">{item.code}</td>
                          <td className="border p-2">{item.name || "No name specified"}</td>
                          <td className="border p-2">{item.gst}%</td>
                          <td className="border p-2">{item.qty}</td>
                          <td className="border p-2">{item.units}</td>
                          <td className="border p-2">₹{item.rate.toFixed(2)}</td>
                          <td className="border p-2">{item.discount}%</td>
                          <td className="border p-2">₹{item.flatDiscount.toFixed(2)}</td>
                          {/* <td className="border p-2">₹{item.amount.toFixed(2)}</td> */}
                          <td className="border p-2">₹{(item.amount || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border">
                        <td colSpan="9" className="border p-2 text-right font-bold">
                          SUBTOTAL
                        </td>
                        <td className="border p-2 font-bold">₹{quotationData.subtotal.toFixed(2)}</td>
                      </tr>
                      <tr className="border">
                        <td colSpan="9" className="border p-2 text-right">
                          Total Flat Discount
                        </td>
                        <td className="border p-2">-₹{quotationData.totalFlatDiscount.toFixed(2)}</td>
                      </tr>
                      <tr className="border">
                        <td colSpan="9" className="border p-2 text-right">
                          Taxable Amount
                        </td>
                        <td className="border p-2">₹{(quotationData.subtotal - quotationData.totalFlatDiscount).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Tax Details */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <h3 className="font-bold mb-2">Total Taxes</h3>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border">
                          <th className="border p-2 text-left">Tax%</th>
                          <th className="border p-2 text-left">CGST</th>
                          <th className="border p-2 text-left">SGST</th>
                          <th className="border p-2 text-left">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border">
                          <td className="border p-2">{quotationData.cgstRate + quotationData.sgstRate}%</td>
                          <td className="border p-2">₹{quotationData.cgstAmount.toFixed(2)}</td>
                          <td className="border p-2">₹{quotationData.sgstAmount.toFixed(2)}</td>
                          <td className="border p-2">
                            ₹{(quotationData.cgstAmount + quotationData.sgstAmount).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col justify-between">
                    <div>
                      <p className="font-bold">Amount Chargeable (in words)</p>
                      <p className="capitalize">
                        Rupees {quotationData.total > 0 ? 'only' : 'zero only'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Grand Total:</p>
                      <p className="text-xl font-bold">₹{quotationData.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="mt-4">
                  <h3 className="font-bold mb-2">Terms & Conditions</h3>
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="py-1">Validity-</td>
                        <td className="py-1">{quotationData.validity}</td>
                      </tr>
                      <tr>
                        <td className="py-1">Payment Terms-</td>
                        <td className="py-1">{quotationData.paymentTerms}</td>
                      </tr>
                      <tr>
                        <td className="py-1">Delivery-</td>
                        <td className="py-1">{quotationData.delivery}</td>
                      </tr>
                      <tr>
                        <td className="py-1">Freight-</td>
                        <td className="py-1">{quotationData.freight}</td>
                      </tr>
                      <tr>
                        <td className="py-1">Insurance-</td>
                        <td className="py-1">{quotationData.insurance}</td>
                      </tr>
                      <tr>
                        <td className="py-1">Taxes-</td>
                        <td className="py-1">{quotationData.taxes}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 className="font-bold mt-4 mb-2">Note</h4>
                  <ul className="list-disc pl-5">
                    {quotationData.notes.map((note, index) => (
                      <li key={index} className="py-1">
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bank Details and Footer */}
                <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4">
                  <div>
                    <h3 className="font-bold mb-2">Bank Details</h3>
                    <p>Account No.: {quotationData.accountNo}</p>
                    <p>Bank Name: {quotationData.bankName}</p>
                    <p>Bank Address: {quotationData.bankAddress}</p>
                    <p>IFSC CODE: {quotationData.ifscCode}</p>
                    <p>Email: {quotationData.email}</p>
                    <p>Website: {quotationData.website}</p>
                    <p>Company PAN: {quotationData.pan}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold mb-2">Declaration:</h3>
                    <p>
                      We declare that this Quotation shows the actual price of the goods described and that all
                      particulars are true and correct.
                    </p>
                    <p className="mt-4">Prepared By- {quotationData.preparedBy}</p>
                    <p className="mt-4 text-sm italic">
                      This Quotation is computerized generated, hence doesn't require any seal & signature.
                    </p>
                  </div>
                </div>
              </div>

              {quotationLink && (
                <div className="p-4 border rounded-md bg-gray-50">
                  <p className="font-medium mb-2">Quotation Link:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={quotationLink}
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    <button
                      className="border border-gray-300 hover:bg-gray-100 p-2 rounded-md"
                      onClick={() => {
                        navigator.clipboard.writeText(quotationLink)
                        alert("Quotation link copied to clipboard")
                      }}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </button>
                    <button className="border border-gray-300 hover:bg-gray-100 p-2 rounded-md">
                      <ShareIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Share this link with the client. They can view and request updates to the quotation.
                  </p>
                </div>
              )}

              {pdfUrl && (
                <div className="p-4 border rounded-md bg-gray-50">
                  <p className="font-medium mb-2">PDF Document:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={pdfUrl}
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    <button
                      className="border border-gray-300 hover:bg-gray-100 p-2 rounded-md"
                      onClick={() => {
                        navigator.clipboard.writeText(pdfUrl)
                        alert("PDF URL copied to clipboard")
                      }}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </button>
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-gray-300 hover:bg-gray-100 p-2 rounded-md"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md flex items-center">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View as Client
                </button>
                <div className="space-x-2">
                  <button
                    className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md flex items-center inline-flex"
                    onClick={handleGenerateLink}
                    disabled={isGenerating || isSubmitting}
                  >
                    <ShareIcon className="h-4 w-4 mr-2" />
                    Generate Link
                  </button>
                  <button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center inline-flex"
                    onClick={handleGeneratePDF}
                    disabled={isGenerating || isSubmitting} 
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generating..." : "Download PDF"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Quotation