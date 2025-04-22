"use client"

import { useState } from "react"

function OrderStatusForm() {
  const [orderStatus, setOrderStatus] = useState("")

  return (
    <div className="space-y-6 border p-4 rounded-md">
      <h3 className="text-lg font-medium">Order Status</h3>
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
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Is Order Received? Status</label>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="order-yes"
              name="orderStatus"
              value="yes"
              checked={orderStatus === "yes"}
              onChange={() => setOrderStatus("yes")}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="order-yes" className="text-sm text-gray-700">
              YES
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="order-no"
              name="orderStatus"
              value="no"
              checked={orderStatus === "no"}
              onChange={() => setOrderStatus("no")}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="order-no" className="text-sm text-gray-700">
              NO
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="order-hold"
              name="orderStatus"
              value="hold"
              checked={orderStatus === "hold"}
              onChange={() => setOrderStatus("hold")}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="order-hold" className="text-sm text-gray-700">
              HOLD
            </label>
          </div>
        </div>
      </div>

      {orderStatus === "yes" && (
        <div className="space-y-4 border p-4 rounded-md">
          <h4 className="font-medium">Order Received Details</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="acceptanceVia" className="block text-sm font-medium text-gray-700">
                Acceptance Via
              </label>
              <select
                id="acceptanceVia"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select method</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="in-person">In Person</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700">
                Payment Mode
              </label>
              <select
                id="paymentMode"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select mode</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="bank-transfer">Bank Transfer</option>
                <option value="credit-card">Credit Card</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700">
                Payment Terms (In Days)
              </label>
              <input
                id="paymentTerms"
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter days"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="orderVideo" className="block text-sm font-medium text-gray-700">
              Order Video (If Order Received)
            </label>
            <input
              id="orderVideo"
              type="file"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="acceptanceFile" className="block text-sm font-medium text-gray-700">
              Acceptance File Upload
            </label>
            <input
              id="acceptanceFile"
              type="file"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="remark" className="block text-sm font-medium text-gray-700">
              REMARK
            </label>
            <textarea
              id="remark"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter remarks"
            />
          </div>
        </div>
      )}

      {orderStatus === "no" && (
        <div className="space-y-4 border p-4 rounded-md">
          <h4 className="font-medium">Order Lost Details</h4>

          <div className="space-y-2">
            <label htmlFor="apologyVideo" className="block text-sm font-medium text-gray-700">
              Order Lost Apology Video
            </label>
            <input
              id="apologyVideo"
              type="file"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="reasonStatus" className="block text-sm font-medium text-gray-700">
              If No then get relevant reason Status
            </label>
            <select
              id="reasonStatus"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Select reason</option>
              <option value="price">Price too high</option>
              <option value="competitor">Went with competitor</option>
              <option value="timeline">Timeline issues</option>
              <option value="specifications">Specifications not met</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="reasonRemark" className="block text-sm font-medium text-gray-700">
              If No then get relevant reason Remark
            </label>
            <textarea
              id="reasonRemark"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter reason remarks"
            />
          </div>
        </div>
      )}

      {orderStatus === "hold" && (
        <div className="space-y-4 border p-4 rounded-md">
          <h4 className="font-medium">Order Hold Details</h4>

          <div className="space-y-2">
            <label htmlFor="holdReason" className="block text-sm font-medium text-gray-700">
              CUSTOMER ORDER HOLD REASON CATEGORY
            </label>
            <select
              id="holdReason"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Select reason</option>
              <option value="budget">Budget constraints</option>
              <option value="approval">Pending approval</option>
              <option value="project-delay">Project delay</option>
              <option value="reconsideration">Under reconsideration</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="holdingDate" className="block text-sm font-medium text-gray-700">
              HOLDING DATE
            </label>
            <input
              id="holdingDate"
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="holdRemark" className="block text-sm font-medium text-gray-700">
              HOLD REMARK
            </label>
            <textarea
              id="holdRemark"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter hold remarks"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderStatusForm
