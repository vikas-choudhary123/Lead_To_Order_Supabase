"use client"

import { useState, useEffect } from "react"
import { DownloadIcon, SaveIcon, ShareIcon } from "../../components/Icons"
import image1 from "../../assests/WhatsApp Image 2025-05-14 at 4.11.43 PM.jpeg"
import imageform from "../../assests/WhatsApp Image 2025-05-14 at 4.11.54 PM.jpeg"
import QuotationHeader from "./quotation-header"
import QuotationForm from "./quotation-form"
import QuotationPreview from "./quotation-preview"
import { generatePDFFromData } from "./pdf-generator"
import { useQuotationData } from "./use-quotation-data"
import supabase from "../../utils/supabase"

export const getNextQuotationNumber = async (companyPrefix = "NBD") => {
  try {
    // Get the latest quotation number with the given prefix
    const { data, error } = await supabase
      .from('Make_Quotation')
      .select('Quotation_No')
      .ilike('Quotation_No', `${companyPrefix}-%`)
      .order('Timestamp', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching quotation numbers:', error)
      return `${companyPrefix}-001`
    }

    if (!data || data.length === 0) {
      return `${companyPrefix}-001`
    }

    const lastQuotationNo = data[0].Quotation_No
    const parts = lastQuotationNo.split('-')
    
    if (parts.length >= 2) {
      const lastNumber = parseInt(parts[parts.length - 1]) || 0
      const newNumber = (lastNumber + 1).toString().padStart(3, '0')
      return `${companyPrefix}-${newNumber}`
    }

    return `${companyPrefix}-001`
  } catch (error) {
    console.error("Error getting next quotation number:", error)
    return `${companyPrefix}-001`
  }
}

// Function to get company prefix from leads_to_order or enquiry_to_order tables
export const getCompanyPrefix = async (companyName) => {
  try {
    // First try leads_to_order table
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads_to_order')
      .select('Company_Name')
      .eq('Company_Name', companyName)
      .limit(1)

    if (!leadsError && leadsData && leadsData.length > 0) {
      // Generate prefix from company name (first 3 letters uppercase)
      const prefix = companyName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '')
      return prefix || "NBD"
    }

    // If not found, try enquiry_to_order table
    const { data: enquiryData, error: enquiryError } = await supabase
      .from('enquiry_to_order')
      .select('company_name')
      .eq('company_name', companyName)
      .limit(1)

    if (!enquiryError && enquiryData && enquiryData.length > 0) {
      // Generate prefix from company name (first 3 letters uppercase)
      const prefix = companyName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '')
      return prefix || "NBD"
    }

    console.log("No company found, using default NBD prefix")
    return "NBD" // Default fallback
  } catch (error) {
    console.error("Error getting company prefix:", error)
    return "NBD" // Default fallback
  }
}

function Quotation() {
  const [activeTab, setActiveTab] = useState("edit")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quotationLink, setQuotationLink] = useState("")
  const [pdfUrl, setPdfUrl] = useState("")
  const [isRevising, setIsRevising] = useState(false)
  const [existingQuotations, setExistingQuotations] = useState([])
  const [selectedQuotation, setSelectedQuotation] = useState("")
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false)
  const [specialDiscount, setSpecialDiscount] = useState(0)
  const [selectedReferences, setSelectedReferences] = useState([])

  // Check if we're in view mode
  const params = new URLSearchParams(window.location.search)
  const isViewMode = params.has("view")

  // Use the custom hook for quotation data
  const {
    quotationData,
    setQuotationData,
    handleInputChange,
    handleItemChange,
    handleFlatDiscountChange,
    handleSpecialDiscountChange,
    handleAddItem,
    handleNoteChange,
    addNote,
    removeNote,
    hiddenFields,
    toggleFieldVisibility,
    addSpecialOffer,
    removeSpecialOffer,
    handleSpecialOfferChange,
  } = useQuotationData(specialDiscount)

  const handleSpecialDiscountChangeWrapper = (value) => {
    const discount = Number(value) || 0
    setSpecialDiscount(discount)
    handleSpecialDiscountChange(discount)
  }

  // Fetch existing quotations when component mounts or when revising
  useEffect(() => {
    const fetchExistingQuotations = async () => {
      try {
        console.log("Fetching existing quotations...")
        const scriptUrl =
          "https://script.google.com/macros/s/AKfycbzTPj_x_0Sh6uCNnMDi-KlwVzkGV3nC4tRF6kGUNA1vXG0Ykx4Lq6ccR9kYv6Cst108aQ/exec"
        const response = await fetch(scriptUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            sheetName: "Make Quotation",
            action: "getQuotationNumbers",
          }),
        })

        const result = await response.json()
        console.log("Quotation numbers result:", result)

        if (result.success && Array.isArray(result.quotationNumbers)) {
          setExistingQuotations(result.quotationNumbers)
        } else {
          console.error("Invalid response format:", result)
          setExistingQuotations([])
        }
      } catch (error) {
        console.error("Error fetching quotation numbers:", error)
        setExistingQuotations([])
      }
    }

    fetchExistingQuotations()

    if (isRevising) {
      fetchExistingQuotations()
    }
  }, [isRevising])

  // Initialize quotation number
  useEffect(() => {
    const initializeQuotationNumber = async () => {
      try {
        const nextQuotationNumber = await getNextQuotationNumber()
        setQuotationData((prev) => ({
          ...prev,
          quotationNo: nextQuotationNumber,
        }))
      } catch (error) {
        console.error("Error initializing quotation number:", error)
      }
    }

    initializeQuotationNumber()
  }, [setQuotationData])

  // Load quotation data from URL if in view mode
  useEffect(() => {
    const viewId = params.get("view")

    if (viewId) {
      const savedQuotation = localStorage.getItem(viewId)

      if (savedQuotation) {
        try {
          const parsedData = JSON.parse(savedQuotation)
          setQuotationData(parsedData)
          setActiveTab("preview")
        } catch (error) {
          console.error("Error loading quotation data:", error)
        }
      }
    }
  }, [setQuotationData])

  const toggleRevising = () => {
    const newIsRevising = !isRevising
    setIsRevising(newIsRevising)

    if (newIsRevising) {
      setSelectedQuotation("")
    }
  }

  const handleQuotationSelect = async (quotationNo) => {
    if (!quotationNo) return

    setIsLoadingQuotation(true)
    setSelectedQuotation(quotationNo)

    try {
      const scriptUrl =
        "https://script.google.com/macros/s/AKfycbzTPj_x_0Sh6uCNnMDi-KlwVzkGV3nC4tRF6kGUNA1vXG0Ykx4Lq6ccR9kYv6Cst108aQ/exec"
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          sheetName: "Make Quotation",
          action: "getQuotationData",
          quotationNo: quotationNo,
        }),
      })

      const result = await response.json()
      console.log("Loaded quotation data:", result)

      if (result.success) {
        const loadedData = result.quotationData

        const references = loadedData.consignorName
          ? loadedData.consignorName
              .split(",")
              .map((r) => r.trim())
              .filter((r) => r)
          : []
        setSelectedReferences(references)

        let items = []
        const specialDiscountFromItems = loadedData.specialDiscount || 0

        if (loadedData.items && Array.isArray(loadedData.items) && loadedData.items.length > 0) {
          items = loadedData.items.map((item, index) => ({
            id: index + 1,
            ...item,
          }))
        }

        const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0)
        const totalFlatDiscount = Number(loadedData.totalFlatDiscount) || 0
        const cgstRate = Number(loadedData.cgstRate) || 9
        const sgstRate = Number(loadedData.sgstRate) || 9
        const taxableAmount = Math.max(0, subtotal - totalFlatDiscount)
        const cgstAmount = Number((taxableAmount * (cgstRate / 100)).toFixed(2))
        const sgstAmount = Number((taxableAmount * (sgstRate / 100)).toFixed(2))
        const total = Number((taxableAmount + cgstAmount + sgstAmount - specialDiscountFromItems).toFixed(2))

        // Parse special offers from loaded data
        let specialOffers = [""]
        if (loadedData.specialOffers) {
          if (typeof loadedData.specialOffers === "string") {
            // If it's a string, split by delimiter
            specialOffers = loadedData.specialOffers.split("|").filter((offer) => offer.trim())
            if (specialOffers.length === 0) specialOffers = [""]
          } else if (Array.isArray(loadedData.specialOffers)) {
            specialOffers = loadedData.specialOffers
          }
        }

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
          shipTo: loadedData.shipTo || "",
          consigneeState: loadedData.consigneeState || "",
          consigneeContactName: loadedData.consigneeContactName || "",
          consigneeContactNo: loadedData.consigneeContactNo || "",
          consigneeGSTIN: loadedData.consigneeGSTIN || "",
          consigneeStateCode: loadedData.consigneeStateCode || "",
          msmeNumber: loadedData.msmeNumber || "",
          preparedBy: loadedData.preparedBy || "",
          specialOffers: specialOffers,
          notes: Array.isArray(loadedData.notes) ? loadedData.notes : loadedData.notes ? [loadedData.notes] : [""],
        })

        setSpecialDiscount(specialDiscountFromItems)
      }
    } catch (error) {
      console.error("Error fetching quotation data:", error)
      alert("Failed to load quotation data")
    } finally {
      setIsLoadingQuotation(false)
    }
  }

  const handleGeneratePDF = () => {
    setIsGenerating(true)

    try {
      const base64Data = generatePDFFromData(quotationData, selectedReferences, specialDiscount)

      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "application/pdf" })

      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `Quotation_${quotationData.quotationNo}.pdf`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(link.href)

      setIsGenerating(false)
      alert("PDF generated and downloaded successfully!")
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF")
      setIsGenerating(false)
    }
  }

  const handleGenerateLink = () => {
    setIsGenerating(true)

    const quotationId = `quotation_${Date.now()}`
    localStorage.setItem(quotationId, JSON.stringify(quotationData))

    const link = `${window.location.origin}${window.location.pathname}?view=${quotationId}`

    setQuotationLink(link)
    setIsGenerating(false)
    alert("Quotation link has been successfully generated and is ready to share.")
  }

  const handleSaveQuotation = async () => {
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
      const base64Data = generatePDFFromData(quotationData, selectedReferences, specialDiscount)

      let finalQuotationNo = quotationData.quotationNo
      if (isRevising && selectedQuotation) {
        if (!finalQuotationNo.match(/-\d{2}$/)) {
          finalQuotationNo = `${finalQuotationNo}-01`
        } else {
          const parts = finalQuotationNo.split("-")
          const lastPart = parts[parts.length - 1]
          const revisionNumber = Number.parseInt(lastPart, 10)
          const newRevision = (revisionNumber + 1).toString().padStart(2, "0")
          parts[parts.length - 1] = newRevision
          finalQuotationNo = parts.join("-")
        }
      }

      const fileName = `Quotation_${finalQuotationNo}.pdf`

      const scriptUrl =
        "https://script.google.com/macros/s/AKfycbzTPj_x_0Sh6uCNnMDi-KlwVzkGV3nC4tRF6kGUNA1vXG0Ykx4Lq6ccR9kYv6Cst108aQ/exec"

      const pdfParams = {
        action: "uploadPDF",
        pdfData: base64Data,
        fileName: fileName,
      }

      const pdfUrlParams = new URLSearchParams()
      for (const key in pdfParams) {
        pdfUrlParams.append(key, pdfParams[key])
      }

      const pdfResponse = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: pdfUrlParams,
      })

      const pdfResult = await pdfResponse.json()

      if (!pdfResult.success) {
        throw new Error("Failed to upload PDF: " + (pdfResult.error || "Unknown error"))
      }

      const pdfUrl = pdfResult.fileUrl

      const quotationDetails = [
        new Date().toLocaleString(),
        finalQuotationNo,
        quotationData.date,
        quotationData.preparedBy,
      ]

      const consignorDetails = [
        quotationData.consignorState,
        quotationData.consignorName,
        quotationData.consignorAddress,
        quotationData.consignorMobile,
        quotationData.consignorPhone,
        quotationData.consignorGSTIN,
        quotationData.consignorStateCode,
      ]

      const consigneeDetails = [
        quotationData.consigneeName,
        quotationData.consigneeAddress,
        quotationData.shipTo || quotationData.consigneeAddress,
        quotationData.consigneeState,
        quotationData.consigneeContactName,
        quotationData.consigneeContactNo,
        quotationData.consigneeGSTIN,
        quotationData.consigneeStateCode,
        quotationData.msmeNumber,
      ]

      const termsDetails = [
        quotationData.validity,
        quotationData.paymentTerms,
        quotationData.delivery,
        quotationData.freight,
        quotationData.insurance,
        quotationData.taxes,
        quotationData.notes.filter((note) => note.trim()).join("|"),
      ]

      const bankDetails = [
        quotationData.accountNo,
        quotationData.bankName,
        quotationData.bankAddress,
        quotationData.ifscCode,
        quotationData.email,
        quotationData.website,
        quotationData.pan,
      ]

      const itemsString = quotationData.items
        .map((item) => {
          return [
            item.code || "",
            item.name || "",
            item.description || "",
            item.gst || 0,
            item.qty || 0,
            item.units || "Nos",
            item.rate || 0,
            item.discount || 0,
            item.flatDiscount || 0,
            item.amount || 0,
            specialDiscount.toString(),
          ].join("|")
        })
        .join(";")

      // Convert special offers array to string for database storage
      const specialOffersString = quotationData.specialOffers
        ? quotationData.specialOffers.filter((offer) => offer.trim()).join("|")
        : ""

      const mainRowData = [
        ...quotationDetails,
        ...consignorDetails,
        ...consigneeDetails,
        ...termsDetails,
        ...bankDetails,
        itemsString,
        specialOffersString, // Add special offers before PDF URL
        pdfUrl,
      ]

      const sheetParams = {
        sheetName: "Make Quotation",
        action: "insert",
        rowData: JSON.stringify(mainRowData),
      }

      const sheetUrlParams = new URLSearchParams()
      for (const key in sheetParams) {
        sheetUrlParams.append(key, sheetParams[key])
      }

      const sheetResponse = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: sheetUrlParams,
      })

      const sheetResult = await sheetResponse.json()

      if (!sheetResult.success) {
        throw new Error("Error saving quotation: " + (sheetResult.error || "Unknown error"))
      }

      const itemPromises = quotationData.items.map(async (item) => {
        const itemData = [
          finalQuotationNo,
          item.code,
          item.name,
          item.description,
          item.gst,
          item.qty,
          item.units,
          item.rate,
          item.discount,
          item.flatDiscount,
          item.amount,
        ]

        const itemParams = {
          sheetName: "Quotation Items",
          action: "insert",
          rowData: JSON.stringify(itemData),
        }

        const itemUrlParams = new URLSearchParams()
        for (const key in itemParams) {
          itemUrlParams.append(key, itemParams[key])
        }

        return fetch(scriptUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: itemUrlParams,
        })
      })

      await Promise.all(itemPromises)

      setPdfUrl(pdfUrl)

      if (isRevising && selectedQuotation) {
        setQuotationData((prev) => ({
          ...prev,
          quotationNo: finalQuotationNo,
        }))
      }

      alert("Quotation saved successfully with all items!")

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
        specialOffers: [""],
      })
    } catch (error) {
      alert("Error: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <QuotationHeader image={image1} isRevising={isRevising} toggleRevising={toggleRevising} />

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
              disabled={isViewMode}
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
            <QuotationForm
              quotationData={quotationData}
              handleInputChange={handleInputChange}
              handleItemChange={handleItemChange}
              handleFlatDiscountChange={handleFlatDiscountChange}
              handleAddItem={handleAddItem}
              handleNoteChange={handleNoteChange}
              addNote={addNote}
              removeNote={removeNote}
              hiddenFields={hiddenFields}
              toggleFieldVisibility={toggleFieldVisibility}
              isRevising={isRevising}
              existingQuotations={existingQuotations}
              selectedQuotation={selectedQuotation}
              handleQuotationSelect={handleQuotationSelect}
              isLoadingQuotation={isLoadingQuotation}
              handleSpecialDiscountChange={handleSpecialDiscountChangeWrapper}
              specialDiscount={specialDiscount}
              setSpecialDiscount={setSpecialDiscount}
              selectedReferences={selectedReferences}
              setSelectedReferences={setSelectedReferences}
              imageform={imageform}
              addSpecialOffer={addSpecialOffer}
              removeSpecialOffer={removeSpecialOffer}
              handleSpecialOfferChange={handleSpecialOfferChange}
              //   handleSpecialDiscountChange={handleSpecialDiscountChangeWrapper}
            />
          ) : (
            <QuotationPreview
              quotationData={quotationData}
              quotationLink={quotationLink}
              pdfUrl={pdfUrl}
              selectedReferences={selectedReferences}
              specialDiscount={specialDiscount}
              imageform={imageform}
              handleGenerateLink={handleGenerateLink}
              handleGeneratePDF={handleGeneratePDF}
              isGenerating={isGenerating}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>

      {activeTab === "edit" && (
        <div className="flex justify-between mt-4">
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
      )}
    </div>
  )
}

export default Quotation
