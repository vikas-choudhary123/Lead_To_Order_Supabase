function OrderExpectedForm() {
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
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
  
          <div className="space-y-2">
            <label htmlFor="nextCallTime" className="block text-sm font-medium text-gray-700">
              Next Call Time
            </label>
            <input
              id="nextCallTime"
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
        </div>
  
        <div className="space-y-2">
          <label htmlFor="expectedOrderValue" className="block text-sm font-medium text-gray-700">
            Expected Order Value
          </label>
          <input
            id="expectedOrderValue"
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter expected value"
            required
          />
        </div>
  
        <div className="space-y-2">
          <label htmlFor="followUpNotes" className="block text-sm font-medium text-gray-700">
            Follow-up Notes
          </label>
          <textarea
            id="followUpNotes"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
            placeholder="Enter follow-up notes"
          />
        </div>
      </div>
    )
  }
  
  export default OrderExpectedForm
  