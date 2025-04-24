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
        amount: 0,
      },
    ],
    
    // Totals
    subtotal: 0,
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

  const handleInputChange = (field, value) => {
    setQuotationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle item changes
  const handleItemChange = (id, field, value) => {
    setQuotationData((prev) => {
      const newItems = prev.items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }

          // Recalculate amount if quantity or rate changes
          if (field === "qty" || field === "rate") {
            updatedItem.amount = Number(updatedItem.qty) * Number(updatedItem.rate)
          }

          return updatedItem
        }
        return item
      })

      // Recalculate totals
      const subtotal = newItems.reduce((sum, item) => sum + item.amount, 0)
      const cgstAmount = subtotal * (prev.cgstRate / 100)
      const sgstAmount = subtotal * (prev.sgstRate / 100)
      const total = subtotal + cgstAmount + sgstAmount

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

  // Add a new item
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
          amount: 0,
        },
      ],
    }))
  }

  // Fetch dropdown data for states and corresponding details
// Enhanced fetchDropdownData function that includes company details mapping
useEffect(() => {
  const fetchDropdownData = async () => {
    try {
      // Fetch data from Dropdown sheet
      const dropdownUrl = "https://docs.google.com/spreadsheets/d/14n58u8M3NYiIjW5vT_dKrugmWwOiBsk-hnYB4e3Oyco/gviz/tq?tqx=out:json&sheet=DROPDOWN"
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
          companies: companyDetailsMap
        })
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error)
      
      // Fallback mock data for dropdowns
      setStateOptions(["Select State", "Chhattisgarh", "Maharashtra", "Delhi"])
      setCompanyOptions(["Select Company", "ABC Corp", "XYZ Industries", "PQR Ltd"])
      setReferenceOptions(["Select Reference", "John Doe", "Jane Smith", "Mike Johnson"])
      
      // Fallback mock data for state details and company details
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
        }
      })
    }
  }
  
  fetchDropdownData()
}, [])

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
      
      // Update bank details fields
      if (accountNoMatch) handleInputChange("accountNo", accountNoMatch[1])
      if (bankNameMatch) handleInputChange("bankName", bankNameMatch[1])
      if (bankAddressMatch) handleInputChange("bankAddress", bankAddressMatch[1])
      if (ifscMatch) handleInputChange("ifscCode", ifscMatch[1])
      if (emailMatch) handleInputChange("email", emailMatch[1])
      if (websiteMatch) handleInputChange("website", websiteMatch[1])
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
  const generatePDFFromData = () => {
    // Create a new jsPDF instance 
    const doc = new jsPDF('p', 'mm', 'a4')
  
    // Page dimensions
    const pageWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const margin = 10
    let currentY = 20 // Starting Y position
  
    // Utility function to wrap text
    const wrapText = (text, maxWidth) => {
      return doc.splitTextToSize(text || '', maxWidth)
    }
  
    // Utility function to format currency
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value).replace('₹', '').trim()
    }
  
    // Enhanced ensure space or add new page function
    const ensureSpaceOrNewPage = (requiredSpace) => {
      // If less than 30mm of space left on the page, add a new page
      if (currentY + requiredSpace > pageHeight - 30) {
        doc.addPage()
        addPageHeader()
        currentY = 40
        return true
      }
      return false
    }
  
    // Enhanced text rendering with automatic page breaks
    const renderTextWithBreaks = (lines, startX, startY, lineHeight = 5, maxWidth = pageWidth - margin * 2) => {
      let y = startY;
      lines.forEach(line => {
        // Wrap the text
        const wrappedLines = wrapText(line, maxWidth);
        
        wrappedLines.forEach(wrappedLine => {
          // Check if we need a new page
          if (y + lineHeight > pageHeight - 30) {
            doc.addPage();
            addPageHeader();
            y = 40;
          }
          
          // Render the line
          doc.text(wrappedLine, startX, y);
          y += lineHeight;
        });
      });
      
      return y;
    }
  
    // Set document properties
    doc.setProperties({
      title: `Quotation ${quotationData.quotationNo}`,
      author: quotationData.preparedBy
    })
  
    // Set font
    doc.setFont('helvetica')
  
    // Function to add page header
    const addPageHeader = () => {
      doc.setTextColor(0, 0, 0) // Black text
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('TAX INVOICE / QUOTATION', pageWidth / 2, 15, { align: 'center' })
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Quotation No: ${quotationData.quotationNo}`, margin, 25)
      doc.text(`Date: ${quotationData.date}`, pageWidth - margin - 50, 25, { align: 'right' })
      
      currentY = 35
    }
  
    // Add initial page header
    addPageHeader()
  
    // Prepare consignor and consignee details
    const consignorDetailsData = [
      { label: 'Name:', value: quotationData.consignorName },
      { label: 'Address:', value: quotationData.consignorAddress },
      { label: 'GSTIN:', value: quotationData.consignorGSTIN },
      { label: 'State Code:', value: quotationData.consignorStateCode }
    ]
  
    const consigneeDetailsData = [
      { label: 'Name:', value: quotationData.consigneeName },
      { label: 'Address:', value: quotationData.consigneeAddress },
      { label: 'GSTIN:', value: quotationData.consigneeGSTIN },
      { label: 'State Code:', value: quotationData.consigneeStateCode }
    ]
  
    // Render Consignor & Consignee Details
    doc.setFont('helvetica', 'bold')
    doc.text('Consignor Details', margin, currentY)
    doc.text('Consignee Details', pageWidth / 2 + margin, currentY)
    doc.setFont('helvetica', 'normal')
    currentY += 6
  
    // Function to render details with dynamic page breaks
    const renderDetailsSection = (detailsData, startX, maxWidth) => {
      let localY = currentY;
      
      detailsData.forEach((detail) => {
        // Wrap value text
        const wrappedText = wrapText(
          `${detail.label} ${detail.value}`, 
          maxWidth
        )
        
        // Check if we need a new page
        if (localY + wrappedText.length * 5 > pageHeight - 30) {
          doc.addPage()
          addPageHeader()
          localY = 40
        }
        
        // Render wrapped text
        doc.text(wrappedText, startX, localY)
        
        // Move to next position
        localY += wrappedText.length * 5
      })
  
      return localY;
    }
  
    // Render details with text wrapping
    const consignorSectionY = renderDetailsSection(
      consignorDetailsData, 
      margin, 
      pageWidth / 2 - margin * 2
    )
    const consigneeSectionY = renderDetailsSection(
      consigneeDetailsData, 
      pageWidth / 2 + margin, 
      pageWidth / 2 - margin * 2
    )
  
    // Update current Y to the max of both sections
    currentY = Math.max(consignorSectionY, consigneeSectionY) + 5
  
    // Prepare items data
    const itemsData = quotationData.items.map((item, index) => [
      index + 1,
      item.code,
      item.name,
      `${item.gst}%`,
      item.qty,
      item.units,
      formatCurrency(item.rate),
      formatCurrency(item.amount)
    ])
  
    // Ensure space for table
    ensureSpaceOrNewPage(20 + (itemsData.length * 10))
  
    // Use autoTable method with professional styling
    autoTable(doc, {
      startY: currentY,
      head: [['S.No', 'Code', 'Product Name', 'GST %', 'Qty', 'Units', 'Rate', 'Amount']],
      body: itemsData,
      theme: 'plain',
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        lineColor: [200, 200, 200],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 50, cellOverflow: 'linebreak' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 25, halign: 'right' },
        7: { cellWidth: 25, halign: 'right' }
      },
      didParseCell: function(data) {
        // Ensure consistent styling
        if (data.section === 'body') {
          data.cell.styles.halign = data.column.index >= 6 ? 'right' : 
                                     data.column.index <= 1 ? 'center' : 
                                     data.column.index === 2 ? 'left' : 'center'
        }
      }
    })
  
    // Get the final Y position of the table
    const finalY = doc.previousAutoTable ? doc.previousAutoTable.finalY : currentY + 30
  
    // Ensure space for Financial Summary
    ensureSpaceOrNewPage(60)
  
    // Financial Summary Section
    let summaryY = finalY + 20
    const financialSummaryItems = [
      { label: 'Subtotal:', value: formatCurrency(quotationData.subtotal) },
      { label: `CGST (${quotationData.cgstRate}%):`, value: formatCurrency(quotationData.cgstAmount) },
      { label: `SGST (${quotationData.sgstRate}%):`, value: formatCurrency(quotationData.sgstAmount) },
      { label: 'Total:', value: formatCurrency(quotationData.total) }
    ]
  
    doc.setFont('helvetica', 'bold')
    doc.text('Financial Summary', margin, summaryY - 10)
    doc.setFont('helvetica', 'normal')
  
    financialSummaryItems.forEach((item) => {
      // Check and add page if needed
      if (currentY + 10 > pageHeight - 30) {
        doc.addPage()
        addPageHeader()
        summaryY = 40
      }
  
      doc.text(item.label, margin, summaryY)
      doc.text(item.value, pageWidth - margin - 20, summaryY, { align: 'right' })
      summaryY += 7
      currentY = summaryY
    })
  
    // Terms & Conditions Section
    ensureSpaceOrNewPage(50)
    
    doc.setFont('helvetica', 'bold')
    doc.text('Terms & Conditions', margin, currentY + 10)
    doc.setFont('helvetica', 'normal')
  
    const termsLines = [
      `Validity: ${quotationData.validity}`,
      `Payment Terms: ${quotationData.paymentTerms}`,
      `Delivery: ${quotationData.delivery}`,
      `Freight: ${quotationData.freight}`,
      `Insurance: ${quotationData.insurance}`,
      `Taxes: ${quotationData.taxes}`
    ]
  
    currentY = renderTextWithBreaks(termsLines, margin, currentY + 20)
  
    // Notes Section
    if (quotationData.notes && quotationData.notes.length > 0) {
      ensureSpaceOrNewPage(30)
      
      doc.setFont('helvetica', 'bold')
      doc.text('Notes', margin, currentY + 10)
      doc.setFont('helvetica', 'normal')
  
      const noteLines = quotationData.notes
        .filter(note => note.trim())
        .map(note => `• ${note}`);
      
      currentY = renderTextWithBreaks(noteLines, margin, currentY + 20)
    }
  
    // Bank Details Section
    ensureSpaceOrNewPage(50)
    
    doc.setFont('helvetica', 'bold')
    doc.text('Bank Details', margin, currentY + 10)
    doc.setFont('helvetica', 'normal')
  
    const bankDetailLines = [
      `Account No.: ${quotationData.accountNo}`,
      `Bank Name: ${quotationData.bankName}`,
      `Bank Address: ${quotationData.bankAddress}`,
      `IFSC Code: ${quotationData.ifscCode}`,
      `Email: ${quotationData.email}`,
      `Website: ${quotationData.website}`,
      `Company PAN: ${quotationData.pan}`
    ]
  
    currentY = renderTextWithBreaks(bankDetailLines, margin, currentY + 20)
    
    // Declaration Section
    ensureSpaceOrNewPage(40)
    
    doc.setFont('helvetica', 'bold')
    doc.text('Declaration', margin, currentY + 10)
    doc.setFont('helvetica', 'normal')
  
    const declarationLines = [
      'We declare that this Quotation shows the actual price of the goods described',
      'and that all particulars are true and correct.'
    ]
  
    renderTextWithBreaks(declarationLines, margin, currentY + 20)
  
    doc.setFont('helvetica', 'bold')
    doc.text(`Prepared By: ${quotationData.preparedBy}`, margin, currentY + 40)
  
    // Digital Signature Space
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, currentY + 60, pageWidth - margin, currentY + 60)
    doc.text('Signature', margin, currentY + 67)
  
    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' })
    }
  
    // Generate Base64 PDF
    const base64Data = doc.output('datauristring').split(',')[1]
    return base64Data
  }
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
      const fileName = `Quotation_${quotationData.quotationNo}.pdf`
      
      // Script URL
      const scriptUrl = "https://script.google.com/macros/s/AKfycbxeo5tv3kAcSDDAheOCP07HaK76zSfq49jFGtZknseg7kPlj2G1O8U2PuiA2fQSuPvKqA/exec"
      
      // Data to be submitted
      const rowData = [
        new Date().toLocaleString(),
        quotationData.quotationNo,
        quotationData.date,
        quotationData.preparedBy,
        quotationData.consigneeName,
        "" // Empty placeholder for PDF URL
      ]
  
      // Prepare sheet parameters for initial submission
      const sheetParams = {
        sheetName: "Make Quotation",
        action: "insert",
        rowData: JSON.stringify(rowData)
      }
  
      // Create URL-encoded string for the parameters
      const sheetUrlParams = new URLSearchParams()
      for (const key in sheetParams) {
        sheetUrlParams.append(key, sheetParams[key])
      }
      
      // Send the data to sheet
      const sheetResponse = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: sheetUrlParams
      })
  
      const sheetResult = await sheetResponse.json()
      
      if (sheetResult.success) {
        // Upload PDF to Google Drive
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
        
        if (pdfResult.success) {
          // Update the last row with the PDF URL
          const updateParams = {
            sheetName: "Make Quotation",
            action: "update",
            rowIndex: "0", // This will trigger using the last row in the script
            rowData: JSON.stringify([
              "", // Leave timestamp as is
              "", // Leave quotation number as is
              "", // Leave date as is
              "", // Leave prepared by as is
              "", // Leave company name as is
              pdfResult.fileUrl // Add PDF URL
            ])
          }
          
          const updateUrlParams = new URLSearchParams()
          for (const key in updateParams) {
            updateUrlParams.append(key, updateParams[key])
          }
          
          const updateResponse = await fetch(scriptUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: updateUrlParams
          })
          
          const updateResult = await updateResponse.json()
          
          if (updateResult.success) {
            alert("Quotation saved, PDF uploaded, and URL added successfully!")
            
            // Reset form (same as before)
            setQuotationData({
              quotationNo: getNextQuotationNumber(quotationData.quotationNo),
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
                  amount: 0,
                },
              ],
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
          } else {
            alert("Error updating PDF URL: " + (updateResult.error || "Unknown error"))
          }
        } else {
          alert("Error uploading PDF: " + (pdfResult.error || "Unknown error"))
        }
      } else {
        alert("Error saving quotation: " + (sheetResult.error || "Unknown error"))
      }
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
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        Make Quotation
      </h1>

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
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Quotation No.</label>
                        <input
                          type="text"
                          value={quotationData.quotationNo}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                        />
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
                        onChange={(e) => handleInputChange("consignorName", e.target.value)}
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

                    {/* <div className="space-y-2">
                      <label className="block text-sm font-medium">MSME Number</label>
                      <input
                        type="text"
                        value={quotationData.msmeNumber}
                        onChange={(e) => handleInputChange("msmeNumber", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div> */}
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
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {quotationData.items.map((item, index) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2">{index + 1}</td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={item.code}
                                onChange={(e) => handleItemChange(item.id, "code", e.target.value)}
                                className="w-24 p-1 border border-gray-300 rounded-md"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded-md"
                                placeholder="Enter item name"
                                required
                              />
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
                                  const cgstAmount = subtotal * (quotationData.cgstRate / 100)
                                  const sgstAmount = subtotal * (quotationData.sgstRate / 100)
                                  const total = subtotal + cgstAmount + sgstAmount

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
                          <td colSpan="7" className="px-4 py-2 text-right font-medium">
                            Subtotal:
                          </td>
                          <td className="px-4 py-2">₹{quotationData.subtotal.toFixed(2)}</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan="7" className="px-4 py-2 text-right font-medium">
                            CGST ({quotationData.cgstRate}%):
                          </td>
                          <td className="px-4 py-2">₹{quotationData.cgstAmount.toFixed(2)}</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan="7" className="px-4 py-2 text-right font-medium">
                            SGST ({quotationData.sgstRate}%):
                          </td>
                          <td className="px-4 py-2">₹{quotationData.sgstAmount.toFixed(2)}</td>
                          <td></td>
                        </tr>
                        <tr className="font-bold">
                          <td colSpan="7" className="px-4 py-2 text-right">
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

                <h3 className="text-lg font-medium mt-6 mb-4">Notes</h3>
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
                  {/* <button
                    className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md flex items-center inline-flex"
                    onClick={handleGenerateLink}
                    disabled={isGenerating || isSubmitting}
                  >
                    <ShareIcon className="h-4 w-4 mr-2" />
                    Generate Link
                  </button> */}
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
                    <p>
                      GSTIN: {quotationData.consignorGSTIN} State Code: {quotationData.consignorStateCode}
                    </p>
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
                    <p>{quotationData.consigneeAddress || "Please enter address"}</p>
                  </div>
                </div>

                {/* Items Table */}
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
                          <td className="border p-2">₹{item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border">
                        <td colSpan="7" className="border p-2 text-right font-bold">
                          TOTAL
                        </td>
                        <td className="border p-2 font-bold">₹{quotationData.subtotal.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Tax Details */}
                <div className="grid grid-cols-2 gap-4">
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
                        Rupees only
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Grand Total:</p>
                      <p className="text-xl font-bold">₹{quotationData.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div>
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
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <h3 className="font-bold mb-2">For Physical assistance</h3>
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
                      This Quotation Is computerized generated, hence doesn't required any seal & signature.
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