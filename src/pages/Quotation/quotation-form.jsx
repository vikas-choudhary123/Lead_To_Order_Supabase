"use client"

import { useState, useEffect } from "react"
import QuotationDetails from "./quotation-details"
import ConsignorDetails from "./consignor-details"
import ConsigneeDetails from "./consignee-details"
import ItemsTable from "./items-table"
import TermsAndConditions from "./terms and conditions"
import BankDetails from "./bank-details"
import NotesSection from "./notes-section"
import SpecialOfferSection from "./special-offer-section"

const QuotationForm = ({
  quotationData,
  handleInputChange,
  handleItemChange,
  handleFlatDiscountChange,
  handleAddItem,
  handleNoteChange,
  addNote,
  removeNote,
  hiddenFields,
  toggleFieldVisibility,
  isRevising,
  existingQuotations,
  selectedQuotation,
  handleSpecialDiscountChange,
  handleQuotationSelect,
  isLoadingQuotation,
  specialDiscount,
  setSpecialDiscount,
  selectedReferences,
  setSelectedReferences,
  imageform,
  addSpecialOffer,
  removeSpecialOffer,
  handleSpecialOfferChange,
}) => {
  const [dropdownData, setDropdownData] = useState({})
  const [stateOptions, setStateOptions] = useState(["Select State"])
  const [companyOptions, setCompanyOptions] = useState(["Select Company"])
  const [referenceOptions, setReferenceOptions] = useState(["Select Reference"])
  const [preparedByOptions, setPreparedByOptions] = useState([""])
  const [productCodes, setProductCodes] = useState([])
  const [productNames, setProductNames] = useState([])
  const [productData, setProductData] = useState({})

  // Fetch dropdown data for states and corresponding details
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const dropdownUrl =
          "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=DROPDOWN"
        const dropdownResponse = await fetch(dropdownUrl)
        const dropdownText = await dropdownResponse.text()

        const dropdownJsonStart = dropdownText.indexOf("{")
        const dropdownJsonEnd = dropdownText.lastIndexOf("}") + 1
        const dropdownJsonData = dropdownText.substring(dropdownJsonStart, dropdownJsonEnd)

        const dropdownData = JSON.parse(dropdownJsonData)

        if (dropdownData && dropdownData.table && dropdownData.table.rows) {
          const stateOptionsData = ["Select State"]
          const stateDetailsMap = {}
          const preparedByOptionsData = [""]
          const companyOptionsData = ["Select Company"]
          const companyDetailsMap = {}
          const referenceOptionsData = ["Select Reference"]
          const referenceDetailsMap = {}

          dropdownData.table.rows.slice(0).forEach((row) => {
            if (row.c) {
              const preparedByName = row.c[79] ? row.c[79].v : ""
              if (preparedByName && !preparedByOptionsData.includes(preparedByName)) {
                preparedByOptionsData.push(preparedByName)
              }

              const stateName = row.c[26] ? row.c[26].v : ""
              if (stateName && !stateOptionsData.includes(stateName)) {
                stateOptionsData.push(stateName)

                let bankDetails = ""
                if (row.c[27] && row.c[27].v) {
                  bankDetails = row.c[27].v
                }

                const pan = row.c[25] ? row.c[25].v : ""
                const msmeNumber = row.c[33] ? row.c[33].v : ""

                stateDetailsMap[stateName] = {
                  bankDetails: bankDetails,
                  consignerAddress: row.c[28] ? row.c[28].v : "",
                  stateCode: row.c[30] ? row.c[30].v : "",
                  gstin: row.c[31] ? row.c[31].v : "",
                  pan: pan,
                  msmeNumber: msmeNumber,
                }
              }

              const companyName = row.c[12] ? row.c[12].v : ""
              if (companyName && !companyOptionsData.includes(companyName)) {
                companyOptionsData.push(companyName)

                companyDetailsMap[companyName] = {
                  address: row.c[15] ? row.c[15].v : "",
                  state: row.c[16] ? row.c[16].v : "",
                  contactName: row.c[13] ? row.c[13].v : "",
                  contactNo: row.c[14] ? row.c[14].v : "",
                  gstin: row.c[17] ? row.c[17].v : "",
                  stateCode: row.c[18] ? row.c[18].v : "",
                }
              }

              const referenceName = row.c[21] ? row.c[21].v : ""
              if (referenceName && !referenceOptionsData.includes(referenceName)) {
                referenceOptionsData.push(referenceName)

                referenceDetailsMap[referenceName] = {
                  mobile: row.c[22] ? row.c[22].v : "",
                  phone: row.c[83] ? row.c[83].v : "", // Add phone number from column CF
                }
              }
            }
          })

          setStateOptions(stateOptionsData)
          setCompanyOptions(companyOptionsData)
          setReferenceOptions(referenceOptionsData)
          setPreparedByOptions(preparedByOptionsData)

          setDropdownData({
            states: stateDetailsMap,
            companies: companyDetailsMap,
            references: referenceDetailsMap,
          })
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error)

        setStateOptions(["Select State", "Chhattisgarh", "Maharashtra", "Delhi"])
        setCompanyOptions(["Select Company", "ABC Corp", "XYZ Industries", "PQR Ltd"])
        setReferenceOptions(["Select Reference", "John Doe", "Jane Smith", "Mike Johnson"])

        setDropdownData({
          states: {
            Chhattisgarh: {
              bankDetails:
                "Account No.: 438605000447\nBank Name: ICICI BANK\nBank Address: FAFADIH, RAIPUR\nIFSC CODE: ICIC0004386\nEmail: Support@thedivineempire.com\nWebsite: www.thedivineempire.com",
              consignerAddress: "Divine Empire Private Limited, Raipur, Chhattisgarh",
              stateCode: "22",
              gstin: "22AAKCD1234M1Z5",
            },
          },
          companies: {
            "ABC Corp": {
              address: "123 Main Street, Mumbai, Maharashtra",
              state: "Maharashtra",
              contactName: "Rajesh Kumar",
              contactNo: "9876543210",
              gstin: "27ABCDE1234F1Z5",
              stateCode: "27",
            },
          },
          references: {
            "John Doe": {
              mobile: "9898989898",
            },
          },
        })
      }
    }

    fetchDropdownData()
  }, [])

  const handleSpecialDiscountChangeWrapper = (value) => {
    const discount = Number(value) || 0
    setSpecialDiscount(discount)
    handleSpecialDiscountChange(discount)
  }

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const dropdownUrl =
          "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=DROPDOWN"
        const response = await fetch(dropdownUrl)
        const text = await response.text()

        const jsonStart = text.indexOf("{")
        const jsonEnd = text.lastIndexOf("}") + 1
        const jsonData = JSON.parse(text.substring(jsonStart, jsonEnd))

        const codes = ["Select Code"]
        const names = ["Select Product"]
        const productDataMap = {}

        if (jsonData && jsonData.table && jsonData.table.rows) {
          jsonData.table.rows.forEach((row) => {
            if (row.c && row.c[60] && row.c[62]) {
              const code = row.c[60].v
              const name = row.c[62].v
              const description = row.c[78] ? row.c[78].v : ""
              const rate = row.c[77] ? row.c[77].v : 0

              if (code && !codes.includes(code)) {
                codes.push(code)
              }

              if (name && !names.includes(name)) {
                names.push(name)
              }

              productDataMap[code] = {
                name: name,
                description: description,
                rate: rate,
              }

              productDataMap[name] = {
                code: code,
                description: description,
                rate: rate,
              }
            }
          })
        }

        setProductCodes(codes)
        setProductNames(names)
        setProductData(productDataMap)
      } catch (error) {
        console.error("Error fetching product data:", error)
        setProductCodes(["Select Code", "CODE1", "CODE2", "CODE3"])
        setProductNames(["Select Product", "Product 1", "Product 2", "Product 3"])
        setProductData({
          CODE1: { name: "Product 1", description: "Description 1", rate: 100 },
          "Product 1": { code: "CODE1", description: "Description 1", rate: 100 },
        })
      }
    }

    fetchProductData()
  }, [])

  // NEW: Function to handle quotation number updates
  const handleQuotationNumberUpdate = (newQuotationNumber) => {
    handleInputChange("quotationNo", newQuotationNumber)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <QuotationDetails
            quotationData={quotationData}
            handleInputChange={handleInputChange}
            isRevising={isRevising}
            existingQuotations={existingQuotations}
            selectedQuotation={selectedQuotation}
            handleQuotationSelect={handleQuotationSelect}
            isLoadingQuotation={isLoadingQuotation}
            preparedByOptions={preparedByOptions}
            stateOptions={stateOptions}
            dropdownData={dropdownData}
          />

          <ConsignorDetails
            quotationData={quotationData}
            handleInputChange={handleInputChange}
            referenceOptions={referenceOptions}
            selectedReferences={selectedReferences}
            setSelectedReferences={setSelectedReferences}
            dropdownData={dropdownData}
          />
        </div>

        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <ConsigneeDetails
            quotationData={quotationData}
            handleInputChange={handleInputChange}
            companyOptions={companyOptions}
            dropdownData={dropdownData}
            onQuotationNumberUpdate={handleQuotationNumberUpdate}
          />
        </div>
      </div>

      <ItemsTable
        quotationData={quotationData}
        handleItemChange={handleItemChange}
        handleAddItem={handleAddItem}
        handleSpecialDiscountChange={handleSpecialDiscountChangeWrapper}
        specialDiscount={specialDiscount}
        setSpecialDiscount={setSpecialDiscount}
        productCodes={productCodes}
        productNames={productNames}
        productData={productData}
      />

      <TermsAndConditions
        quotationData={quotationData}
        handleInputChange={handleInputChange}
        hiddenFields={hiddenFields}
        toggleFieldVisibility={toggleFieldVisibility}
      />

      <SpecialOfferSection
        quotationData={quotationData}
        handleInputChange={handleInputChange}
        addSpecialOffer={addSpecialOffer}
        removeSpecialOffer={removeSpecialOffer}
        handleSpecialOfferChange={handleSpecialOfferChange}
      />

      <NotesSection
        quotationData={quotationData}
        handleNoteChange={handleNoteChange}
        addNote={addNote}
        removeNote={removeNote}
      />

      <BankDetails quotationData={quotationData} handleInputChange={handleInputChange} imageform={imageform} />
    </div>
  )
}

export default QuotationForm
