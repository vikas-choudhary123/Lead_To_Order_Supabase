"use client"

const ConsigneeDetails = ({ quotationData, handleInputChange, companyOptions, dropdownData }) => {
  const handleCompanyChange = (e) => {
    const selectedCompany = e.target.value
    handleInputChange("consigneeName", selectedCompany)

    if (selectedCompany && dropdownData.companies && dropdownData.companies[selectedCompany]) {
      const companyDetails = dropdownData.companies[selectedCompany]

      handleInputChange("consigneeAddress", companyDetails.address)
      handleInputChange("consigneeState", companyDetails.state)
      handleInputChange("consigneeContactName", companyDetails.contactName)
      handleInputChange("consigneeContactNo", companyDetails.contactNo)
      handleInputChange("consigneeGSTIN", companyDetails.gstin)
      handleInputChange("consigneeStateCode", companyDetails.stateCode)
    } else {
      handleInputChange("consigneeAddress", "")
      handleInputChange("consigneeState", "")
      handleInputChange("consigneeContactName", "")
      handleInputChange("consigneeContactNo", "")
      handleInputChange("consigneeGSTIN", "")
      handleInputChange("consigneeStateCode", "")
    }
  }

  return (
    <>
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
    </>
  )
}

export default ConsigneeDetails
