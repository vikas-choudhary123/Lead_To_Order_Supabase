"use client"

import { useState } from "react"
import { FileTextIcon, PlusIcon, TrashIcon, DownloadIcon, SaveIcon, ShareIcon, CopyIcon, EyeIcon } from "../components/Icons"

function Quotation() {
  const [activeTab, setActiveTab] = useState("edit")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quotationLink, setQuotationLink] = useState("")
  const [pdfUrl, setPdfUrl] = useState("")
  
  // Mock data for dropdown options
  const stateOptions = ["Select State", "Andhra Pradesh", "Chhattisgarh", "Delhi", "Gujarat", "Karnataka", "Maharashtra", "Tamil Nadu"]
  const companyOptions = ["Select Company", "ABC Corp", "XYZ Industries", "PQR Ltd", "LMN Enterprises", "RST Solutions"]
  const referenceOptions = ["Select Reference", "John Doe", "Jane Smith", "Mike Johnson", "Sarah Williams", "David Brown"]

  // Initialize quotation data with empty/default values
  const [quotationData, setQuotationData] = useState({
    // Quotation details
    quotationNo: "IN-NBD-001",
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

  // Generate PDF
  const handleGeneratePDF = () => {
    setIsGenerating(true)
    
    // Simulate PDF generation
    setTimeout(() => {
      setIsGenerating(false)
      // In a real app, this would be a URL to the generated PDF
      setPdfUrl("https://example.com/quotation_" + quotationData.quotationNo + ".pdf")
      
      // Show success message
      alert("PDF generated successfully!")
    }, 1500)
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

  // Save quotation - Updated to match lead submission style
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
      // Script URL
      const scriptUrl = "https://script.google.com/macros/s/AKfycbxeo5tv3kAcSDDAheOCP07HaK76zSfq49jFGtZknseg7kPlj2G1O8U2PuiA2fQSuPvKqA/exec"
      
      // Data to be submitted (matching the columns in your sheet)
      const rowData = [
        new Date().toLocaleString(),
        quotationData.quotationNo,
        quotationData.date,
        quotationData.preparedBy,
        quotationData.consigneeName
      ]

      // Parameters for Google Apps Script
      const params = {
        sheetName: "Make Quotation",
        action: "insert",
        rowData: JSON.stringify(rowData)
      }

      // Create URL-encoded string for the parameters
      const urlParams = new URLSearchParams()
      for (const key in params) {
        urlParams.append(key, params[key])
      }
      
      // Send the data
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: urlParams
      })

      const result = await response.json()
      
      if (result.success) {
        alert("Quotation saved successfully!")
        
        // Reset form
        setQuotationData({
          // Keep quotation number but increment it
          quotationNo: getNextQuotationNumber(quotationData.quotationNo),
          date: new Date().toLocaleDateString("en-GB"),
          
          // Reset other fields
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
        alert("Error saving quotation: " + (result.error || "Unknown error"))
      }
    } catch (error) {
      alert("Error submitting form: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to increment quotation number
  const getNextQuotationNumber = (currentNo) => {
    const parts = currentNo.split("-")
    const num = parseInt(parts[2])
    return `IN-NBD-${String(num + 1).padStart(3, "0")}`
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
                        onChange={(e) => handleInputChange("consignorState", e.target.value)}
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
                        onChange={(e) => handleInputChange("consigneeName", e.target.value)}
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

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">MSME Number</label>
                      <input
                        type="text"
                        value={quotationData.msmeNumber}
                        onChange={(e) => handleInputChange("msmeNumber", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
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