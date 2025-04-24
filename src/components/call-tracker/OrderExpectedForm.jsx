import { useState, useEffect } from "react"

function OrderExpectedForm({ formData, onFieldChange }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    onFieldChange(name, value)
  }

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <h3 className="text-lg font-medium">Order Expected</h3>
      <hr className="border-gray-200 mb-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="nextCallDate" className="block text-sm font-medium text-gray-700">
            Next Call Date
          </label>
          <input
            id="nextCallDate"
            name="nextCallDate"
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={formData.nextCallDate || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="nextCallTime" className="block text-sm font-medium text-gray-700">
            Next Call Time
          </label>
          <input
            id="nextCallTime"
            name="nextCallTime"
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={formData.nextCallTime || ""}
            onChange={handleChange}
            required
          />
        </div>
      </div>
    </div>
  )
}

export default OrderExpectedForm