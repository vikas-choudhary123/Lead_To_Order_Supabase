function QuotationValidationForm() {
    return (
      <div className="space-y-6 border p-4 rounded-md">
        <h3 className="text-lg font-medium">Quotation Validation</h3>
        <hr className="border-gray-200" />
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="quotationNumber" className="block text-sm font-medium text-gray-700">
              Quotation Number
            </label>
            <input
              id="quotationNumber"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter quotation number"
              required
            />
          </div>
  
          <div className="space-y-2">
            <label htmlFor="validatorName" className="block text-sm font-medium text-gray-700">
              Quotation Validator Name
            </label>
            <input
              id="validatorName"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter validator name"
              required
            />
          </div>
        </div>
  
        <div className="space-y-2">
          <label htmlFor="sendStatus" className="block text-sm font-medium text-gray-700">
            Quotation Send Status
          </label>
          <select
            id="sendStatus"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          >
            <option value="">Select status</option>
            <option value="mail">Mail</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="both">Both</option>
          </select>
        </div>
  
        <div className="space-y-2">
          <label htmlFor="validationRemark" className="block text-sm font-medium text-gray-700">
            Quotation Validation Remark
          </label>
          <textarea
            id="validationRemark"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter validation remarks"
          />
        </div>
  
        <div className="space-y-4">
          <h4 className="font-medium">Additional Materials Sent</h4>
  
          <div className="space-y-3">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Send FAQ Video</label>
              <div className="flex">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="faq-yes"
                    name="faqVideo"
                    value="yes"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="faq-yes" className="text-sm text-gray-700">
                    Yes
                  </label>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <input
                    type="radio"
                    id="faq-no"
                    name="faqVideo"
                    value="no"
                    defaultChecked
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="faq-no" className="text-sm text-gray-700">
                    No
                  </label>
                </div>
              </div>
            </div>
  
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Send Product Video</label>
              <div className="flex">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="product-video-yes"
                    name="productVideo"
                    value="yes"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="product-video-yes" className="text-sm text-gray-700">
                    Yes
                  </label>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <input
                    type="radio"
                    id="product-video-no"
                    name="productVideo"
                    value="no"
                    defaultChecked
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="product-video-no" className="text-sm text-gray-700">
                    No
                  </label>
                </div>
              </div>
            </div>
  
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Send Offer Video</label>
              <div className="flex">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="offer-video-yes"
                    name="offerVideo"
                    value="yes"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="offer-video-yes" className="text-sm text-gray-700">
                    Yes
                  </label>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <input
                    type="radio"
                    id="offer-video-no"
                    name="offerVideo"
                    value="no"
                    defaultChecked
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="offer-video-no" className="text-sm text-gray-700">
                    No
                  </label>
                </div>
              </div>
            </div>
  
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Send Product Catalog</label>
              <div className="flex">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="catalog-yes"
                    name="productCatalog"
                    value="yes"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="catalog-yes" className="text-sm text-gray-700">
                    Yes
                  </label>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <input
                    type="radio"
                    id="catalog-no"
                    name="productCatalog"
                    value="no"
                    defaultChecked
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="catalog-no" className="text-sm text-gray-700">
                    No
                  </label>
                </div>
              </div>
            </div>
  
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Send Product Image</label>
              <div className="flex">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="image-yes"
                    name="productImage"
                    value="yes"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="image-yes" className="text-sm text-gray-700">
                    Yes
                  </label>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <input
                    type="radio"
                    id="image-no"
                    name="productImage"
                    value="no"
                    defaultChecked
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="image-no" className="text-sm text-gray-700">
                    No
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  export default QuotationValidationForm
  