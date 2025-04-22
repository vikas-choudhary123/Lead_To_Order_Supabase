"use client"

import { useState, useContext } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AuthContext } from "../App"
import MakeQuotationForm from "../components/call-tracker/MakeQuotationFrom"
import QuotationValidationForm from "../components/call-tracker/QuotationValidationForm"
import OrderExpectedForm from "../components/call-tracker/OrderExpectedForm"
import OrderStatusForm from "../components/call-tracker/OrderStatusFrom"

function NewCallTracker() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const enquiryNo = searchParams.get("enquiryNo")
  const { showNotification } = useContext(AuthContext)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStage, setCurrentStage] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      showNotification("Call tracker updated successfully", "success")
      navigate("/call-tracker")
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Call Tracker</h2>
          <p className="text-sm text-slate-500">
            Track the progress of the enquiry
            {enquiryNo && <span className="font-medium"> for Enquiry #{enquiryNo}</span>}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label htmlFor="enquiryNo" className="block text-sm font-medium text-gray-700">
                Enquiry No.
              </label>
              <input
                id="enquiryNo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="En-01"
                defaultValue={enquiryNo || ""}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="enquiryStatus" className="block text-sm font-medium text-gray-700">
                Enquiry Status
              </label>
              <select
                id="enquiryStatus"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select status</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="customerFeedback" className="block text-sm font-medium text-gray-700">
                What Did Customer Say
              </label>
              <textarea
                id="customerFeedback"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                placeholder="Enter customer feedback"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Current Stage</label>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="make-quotation"
                    name="currentStage"
                    value="make-quotation"
                    checked={currentStage === "make-quotation"}
                    onChange={() => setCurrentStage("make-quotation")}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="make-quotation" className="text-sm text-gray-700">
                    Make Quotation
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="quotation-validation"
                    name="currentStage"
                    value="quotation-validation"
                    checked={currentStage === "quotation-validation"}
                    onChange={() => setCurrentStage("quotation-validation")}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="quotation-validation" className="text-sm text-gray-700">
                    Quotation Validation
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="order-expected"
                    name="currentStage"
                    value="order-expected"
                    checked={currentStage === "order-expected"}
                    onChange={() => setCurrentStage("order-expected")}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="order-expected" className="text-sm text-gray-700">
                    Order Expected
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="order-status"
                    name="currentStage"
                    value="order-status"
                    checked={currentStage === "order-status"}
                    onChange={() => setCurrentStage("order-status")}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="order-status" className="text-sm text-gray-700">
                    Order Status
                  </label>
                </div>
              </div>
            </div>

            {currentStage === "make-quotation" && <MakeQuotationForm />}
            {currentStage === "order-expected" && <OrderExpectedForm />}
            {currentStage === "quotation-validation" && <QuotationValidationForm />}
            {currentStage === "order-status" && <OrderStatusForm />}
          </div>
          <div className="p-6 border-t flex justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {isSubmitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewCallTracker
