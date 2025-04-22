import { useState, useEffect } from "react"
import { Link, useLocation, useParams } from "react-router-dom"

function MakeQuotationForm() {
    // const [activeTab, setActiveTab] = useState("edit")
    // const [isGenerating, setIsGenerating] = useState(false)
    // const [quotationLink, setQuotationLink] = useState("")
  
    // const [quotationData, setQuotationData] = useState({
    //     quotationNo: "IN-NBD-24-25-378",
    //     date: "02/04/2025",
    //     companyName: "Tech Solutions Ltd",
    //     contactPerson: "John Smith",
    //     items: [
    //       {
    //         id: 1,
    //         name: "Product A",
    //         qty: 2,
    //         rate: 500,
    //         amount: 1000,
    //       },
    //       {
    //         id: 2,
    //         name: "Product B",
    //         qty: 1,
    //         rate: 1200,
    //         amount: 1200,
    //       },
    //     ],
    //     subtotal: 2200,
    //     tax: 396,
    //     total: 2596,
    //   })

    //   const handleGenerateLink = () => {
    //     setIsGenerating(true)
    
    //     // Simulate API call
    //     setTimeout(() => {
    //       setIsGenerating(false)
    //       setQuotationLink(`https://nbd-crr.vercel.app/quotations/${quotationData.quotationNo}`)
    
    //       showNotification("Link Generated", "Quotation link has been successfully generated and is ready to share.")
    //     }, 1000)
    //   }
    
    //   const handleGeneratePDF = () => {
    //     setIsGenerating(true)
    
    //     // Simulate PDF generation
    //     setTimeout(() => {
    //       setIsGenerating(false)
    
    //       showNotification("PDF Generated", "Quotation PDF has been successfully generated.")
    //     }, 1500)
    //   }
    
    //   const handleSubmit = (e) => {
    //     e.preventDefault()
    //     setIsSubmitting(true)
    
    //     // Simulate API call
    //     setTimeout(() => {
    //       showNotification("Call tracker updated successfully", "success")
    //       navigate("/call-tracker")
    //       setIsSubmitting(false)
    //     }, 1000)
    //   }

    const location = useLocation()
    const params = useParams()
  
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
      enquiryNo: "",
      companyName: "",
      sendQuotationNo: "",
      quotationSharedBy: "",
      quotationNumber: "",
      valueWithoutTax: "",
      valueWithTax: "",
      remarks: "",
      quotationFile: null,
    })
  
    useEffect(() => {
      // Pre-fill form from location state if passed from previous page
      const { state } = location
      if (state) {
        const newFormData = { ...formData };
        
        Object.keys(state).forEach(key => {
          if (key in newFormData) {
            newFormData[key] = state[key];
          }
        });
        
        setFormData(newFormData);
      } else if (params.enquiryNo) {
        setFormData((prev) => ({
          ...prev,
          enquiryNo: params.enquiryNo,
        }))
      }
    }, [location, params])
  
    const handleChange = (e) => {
      const { name, value } = e.target
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  
    // const handleFileChange = (file) => {
    //   setFormData((prev) => ({
    //     ...prev,
    //     quotationFile: file,
    //   }))
    // }
  
    const handleSubmit = async (e) => {
      e.preventDefault()
      setIsSubmitting(true)
  
      // Simulate form submission
      try {
        // Simulated success after 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        alert(`Quotation for enquiry #${formData.enquiryNo} has been successfully saved.`)
  
        // Reset form after submission
        setFormData({
          enquiryNo: "",
          sendQuotationNo: "",
          quotationSharedBy: "",
          quotationNumber: "",
          valueWithoutTax: "",
          valueWithTax: "",
          remarks: "",
          quotationFile: null,
        })
      } catch (error) {
        console.error("Error submitting form:", error)
        alert("There was a problem updating the quotation. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
    }
    return (
    //     <div className="space-y-6 border p-4 rounded-md">
    //     <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
    //       Make Quotation
    //     </h3>

    //     <div className="bg-white rounded-lg border">
    //       <div className="border-b">
    //         <div className="flex">
    //           <button
    //             type="button"
    //             className={`px-4 py-2 font-medium ${
    //               activeTab === "edit"
    //                 ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-tl-lg"
    //                 : "text-gray-600"
    //             }`}
    //             onClick={() => setActiveTab("edit")}
    //           >
    //             Edit Quotation
    //           </button>
    //           <button
    //             type="button"
    //             className={`px-4 py-2 font-medium ${
    //               activeTab === "preview"
    //                 ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
    //                 : "text-gray-600"
    //             }`}
    //             onClick={() => setActiveTab("preview")}
    //           >
    //             Preview
    //           </button>
    //         </div>
    //       </div>

    //       <div className="p-4">
    //         {activeTab === "edit" ? (
    //           <div className="space-y-6">
    //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    //               <div className="bg-white border rounded-lg p-4 shadow-sm">
    //                 <h3 className="text-lg font-medium mb-4">Quotation Details</h3>
    //                 <div className="space-y-4">
    //                   <div className="grid grid-cols-2 gap-4">
    //                     <div className="space-y-2">
    //                       <label className="block text-sm font-medium">Quotation No.</label>
    //                       <input
    //                         type="text"
    //                         value={quotationData.quotationNo}
    //                         onChange={(e) =>
    //                           setQuotationData({ ...quotationData, quotationNo: e.target.value })
    //                         }
    //                         className="w-full p-2 border border-gray-300 rounded-md"
    //                       />
    //                     </div>
    //                     <div className="space-y-2">
    //                       <label className="block text-sm font-medium">Date</label>
    //                       <input
    //                         type="text"
    //                         value={quotationData.date}
    //                         onChange={(e) => setQuotationData({ ...quotationData, date: e.target.value })}
    //                         className="w-full p-2 border border-gray-300 rounded-md"
    //                       />
    //                     </div>
    //                   </div>
    //                 </div>
    //               </div>

    //               <div className="bg-white border rounded-lg p-4 shadow-sm">
    //                 <h3 className="text-lg font-medium mb-4">Client Details</h3>
    //                 <div className="space-y-4">
    //                   <div className="space-y-2">
    //                     <label className="block text-sm font-medium">Company Name</label>
    //                     <input
    //                       type="text"
    //                       value={quotationData.companyName}
    //                       onChange={(e) => setQuotationData({ ...quotationData, companyName: e.target.value })}
    //                       className="w-full p-2 border border-gray-300 rounded-md"
    //                     />
    //                   </div>
    //                   <div className="space-y-2">
    //                     <label className="block text-sm font-medium">Contact Person</label>
    //                     <input
    //                       type="text"
    //                       value={quotationData.contactPerson}
    //                       onChange={(e) =>
    //                         setQuotationData({ ...quotationData, contactPerson: e.target.value })
    //                       }
    //                       className="w-full p-2 border border-gray-300 rounded-md"
    //                     />
    //                   </div>
    //                 </div>
    //               </div>
    //             </div>

    //             <div className="bg-white border rounded-lg p-4 shadow-sm">
    //               <h3 className="text-lg font-medium mb-4">Items</h3>
    //               <div className="overflow-x-auto">
    //                 <table className="min-w-full divide-y divide-gray-200">
    //                   <thead className="bg-gray-50">
    //                     <tr>
    //                       <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
    //                         Item
    //                       </th>
    //                       <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
    //                         Qty
    //                       </th>
    //                       <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
    //                         Rate
    //                       </th>
    //                       <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
    //                         Amount
    //                       </th>
    //                     </tr>
    //                   </thead>
    //                   <tbody className="bg-white divide-y divide-gray-200">
    //                     {quotationData.items.map((item, index) => (
    //                       <tr key={item.id}>
    //                         <td className="px-4 py-2">
    //                           <input
    //                             type="text"
    //                             value={item.name}
    //                             onChange={(e) => {
    //                               const newItems = [...quotationData.items]
    //                               newItems[index].name = e.target.value
    //                               setQuotationData({ ...quotationData, items: newItems })
    //                             }}
    //                             className="w-full p-1 border border-gray-300 rounded-md"
    //                           />
    //                         </td>
    //                         <td className="px-4 py-2">
    //                           <input
    //                             type="number"
    //                             value={item.qty}
    //                             onChange={(e) => {
    //                               const newItems = [...quotationData.items]
    //                               newItems[index].qty = Number.parseInt(e.target.value)
    //                               newItems[index].amount = newItems[index].qty * newItems[index].rate
    //                               setQuotationData({ ...quotationData, items: newItems })
    //                             }}
    //                             className="w-20 p-1 border border-gray-300 rounded-md"
    //                           />
    //                         </td>
    //                         <td className="px-4 py-2">
    //                           <input
    //                             type="number"
    //                             value={item.rate}
    //                             onChange={(e) => {
    //                               const newItems = [...quotationData.items]
    //                               newItems[index].rate = Number.parseInt(e.target.value)
    //                               newItems[index].amount = newItems[index].qty * newItems[index].rate
    //                               setQuotationData({ ...quotationData, items: newItems })
    //                             }}
    //                             className="w-24 p-1 border border-gray-300 rounded-md"
    //                           />
    //                         </td>
    //                         <td className="px-4 py-2">
    //                           <input
    //                             type="number"
    //                             value={item.amount}
    //                             className="w-24 p-1 border border-gray-300 rounded-md"
    //                             readOnly
    //                           />
    //                         </td>
    //                       </tr>
    //                     ))}
    //                   </tbody>
    //                   <tfoot>
    //                     <tr>
    //                       <td colSpan="3" className="px-4 py-2 text-right font-medium">
    //                         Subtotal:
    //                       </td>
    //                       <td className="px-4 py-2">₹{quotationData.subtotal.toFixed(2)}</td>
    //                     </tr>
    //                     <tr>
    //                       <td colSpan="3" className="px-4 py-2 text-right font-medium">
    //                         Tax (18%):
    //                       </td>
    //                       <td className="px-4 py-2">₹{quotationData.tax.toFixed(2)}</td>
    //                     </tr>
    //                     <tr className="font-bold">
    //                       <td colSpan="3" className="px-4 py-2 text-right">
    //                         Total:
    //                       </td>
    //                       <td className="px-4 py-2">₹{quotationData.total.toFixed(2)}</td>
    //                     </tr>
    //                   </tfoot>
    //                 </table>
    //               </div>
    //               <button
    //                 type="button"
    //                 className="mt-4 px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
    //                 onClick={() => {
    //                   const newItems = [...quotationData.items]
    //                   const newId = Math.max(...newItems.map((item) => item.id)) + 1
    //                   newItems.push({ id: newId, name: "", qty: 1, rate: 0, amount: 0 })
    //                   setQuotationData({ ...quotationData, items: newItems })
    //                 }}
    //               >
    //                 + Add Item
    //               </button>
    //             </div>

    //             <div className="flex justify-between">
    //               <button
    //                 type="button"
    //                 className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
    //               >
    //                 Save Quotation
    //               </button>
    //               <div className="space-x-2">
    //                 <button
    //                   type="button"
    //                   className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md flex items-center"
    //                   onClick={handleGenerateLink}
    //                   disabled={isGenerating}
    //                 >
    //                   Generate Link
    //                 </button>
    //                 <button
    //                   type="button"
    //                   className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
    //                   onClick={handleGeneratePDF}
    //                   disabled={isGenerating}
    //                 >
    //                   {isGenerating ? "Generating..." : "Generate PDF"}
    //                 </button>
    //               </div>
    //             </div>
    //           </div>
    //         ) : (
    //           <div className="space-y-6">
    //             <div className="bg-white border p-6 rounded-lg">
    //               <div className="flex justify-between items-start border-b pb-4">
    //                 <div className="w-1/3">
    //                   <p className="font-bold">DIVINE EMPIRE INDIA PVT LTD</p>
    //                   <p className="text-sm">401-402, 4th floor, Lalganga Midas, Fafadih Chowk, Raipur</p>
    //                 </div>
    //                 <div className="w-1/3 text-center">
    //                   <h1 className="text-xl font-bold">QUOTATION</h1>
    //                 </div>
    //                 <div className="w-1/3 text-right">
    //                   <p className="font-bold">Quo No: {quotationData.quotationNo}</p>
    //                   <p>Date: {quotationData.date}</p>
    //                 </div>
    //               </div>

    //               <div className="grid grid-cols-2 gap-4 border-b py-4">
    //                 <div>
    //                   <h3 className="font-bold mb-2">Client Details</h3>
    //                   <p>{quotationData.companyName}</p>
    //                   <p>Contact: {quotationData.contactPerson}</p>
    //                 </div>
    //               </div>

    //               <div className="py-4">
    //                 <table className="min-w-full divide-y divide-gray-200">
    //                   <thead className="bg-gray-50">
    //                     <tr>
    //                       <th className="px-4 py-2 text-left font-medium">Item</th>
    //                       <th className="px-4 py-2 text-left font-medium">Qty</th>
    //                       <th className="px-4 py-2 text-left font-medium">Rate</th>
    //                       <th className="px-4 py-2 text-left font-medium">Amount</th>
    //                     </tr>
    //                   </thead>
    //                   <tbody className="divide-y divide-gray-200">
    //                     {quotationData.items.map((item) => (
    //                       <tr key={item.id}>
    //                         <td className="px-4 py-2">{item.name}</td>
    //                         <td className="px-4 py-2">{item.qty}</td>
    //                         <td className="px-4 py-2">₹{item.rate.toFixed(2)}</td>
    //                         <td className="px-4 py-2">₹{item.amount.toFixed(2)}</td>
    //                       </tr>
    //                     ))}
    //                   </tbody>
    //                   <tfoot>
    //                     <tr>
    //                       <td colSpan="3" className="px-4 py-2 text-right font-medium">
    //                         Subtotal:
    //                       </td>
    //                       <td className="px-4 py-2">₹{quotationData.subtotal.toFixed(2)}</td>
    //                     </tr>
    //                     <tr>
    //                       <td colSpan="3" className="px-4 py-2 text-right font-medium">
    //                         Tax (18%):
    //                       </td>
    //                       <td className="px-4 py-2">₹{quotationData.tax.toFixed(2)}</td>
    //                     </tr>
    //                     <tr className="font-bold">
    //                       <td colSpan="3" className="px-4 py-2 text-right">
    //                         Total:
    //                       </td>
    //                       <td className="px-4 py-2">₹{quotationData.total.toFixed(2)}</td>
    //                     </tr>
    //                   </tfoot>
    //                 </table>
    //               </div>

    //               <div className="border-t pt-4 grid grid-cols-2 gap-4">
    //                 <div>
    //                   <h3 className="font-bold mb-2">Terms & Conditions</h3>
    //                   <p className="text-sm">1. Validity: This quotation is valid for 7 days.</p>
    //                   <p className="text-sm">2. Payment: 100% advance payment required.</p>
    //                   <p className="text-sm">3. Delivery: Within 7 days after payment confirmation.</p>
    //                 </div>
    //                 <div className="text-right">
    //                   <p className="mt-8 text-sm">Authorized Signatory</p>
    //                   <p className="mt-4 text-sm italic">
    //                     This document is computer generated and does not require signature.
    //                   </p>
    //                 </div>
    //               </div>
    //             </div>

    //             {quotationLink && (
    //               <div className="p-4 border rounded-md bg-gray-50">
    //                 <p className="font-medium mb-2">Quotation Link:</p>
    //                 <div className="flex items-center gap-2">
    //                   <input
    //                     type="text"
    //                     value={quotationLink}
    //                     readOnly
    //                     className="w-full p-2 border border-gray-300 rounded-md"
    //                   />
    //                   <button
    //                     type="button"
    //                     className="border border-gray-300 hover:bg-gray-100 p-2 rounded-md"
    //                     onClick={() => {
    //                       navigator.clipboard.writeText(quotationLink)
    //                       showNotification("Link Copied", "success")
    //                     }}
    //                   >
    //                     Copy
    //                   </button>
    //                   <button type="button" className="border border-gray-300 hover:bg-gray-100 p-2 rounded-md">
    //                     Share
    //                   </button>
    //                 </div>
    //                 <p className="text-sm text-gray-500 mt-2">
    //                   Share this link with the client. They can view and request updates to the quotation.
    //                 </p>
    //               </div>
    //             )}

    //             <div className="flex justify-between">
    //               <button
    //                 type="button"
    //                 className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md flex items-center"
    //               >
    //                 View as Client
    //               </button>
    //               <div className="space-x-2">
    //                 <button
    //                   type="button"
    //                   className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md flex items-center"
    //                   onClick={handleGenerateLink}
    //                   disabled={isGenerating}
    //                 >
    //                   Generate Link
    //                 </button>
    //                 <button
    //                   type="button"
    //                   className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
    //                   onClick={handleGeneratePDF}
    //                   disabled={isGenerating}
    //                 >
    //                   {isGenerating ? "Generating..." : "Download PDF"}
    //                 </button>
    //               </div>
    //             </div>
    //           </div>
    //         )}
    //       </div>
    //     </div>
    //   </div>
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link to="/update-quotation" className="text-gray-600 hover:text-gray-900 mr-4 flex items-center">
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Update Quotation
        </Link>
        <h1 className="text-3xl font-bold">Update Quotation</h1>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Update Quotation</h2>
          <p className="text-sm text-gray-500">Update quotation details and track shared quotations.</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="enquiryNo" className="block text-sm font-medium">
                  Enquiry No.
                </label>
                <input
                  id="enquiryNo"
                  name="enquiryNo"
                  type="text"
                  placeholder="ENQ-001"
                  value={formData.enquiryNo}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="sendQuotationNo" className="block text-sm font-medium">
                  Send Quotation No.
                </label>
                <input
                  id="sendQuotationNo"
                  name="sendQuotationNo"
                  type="text"
                  placeholder="QUO-001"
                  value={formData.sendQuotationNo}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="quotationSharedBy" className="block text-sm font-medium">
                  Quotation Shared By
                </label>
                <select
                  id="quotationSharedBy"
                  name="quotationSharedBy"
                  value={formData.quotationSharedBy}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select person</option>
                  <option value="Rahul Sharma">Rahul Sharma</option>
                  <option value="Priya Patel">Priya Patel</option>
                  <option value="Amit Singh">Amit Singh</option>
                  <option value="Neha Gupta">Neha Gupta</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="quotationNumber" className="block text-sm font-medium">
                  Quotation Number
                </label>
                <input
                  id="quotationNumber"
                  name="quotationNumber"
                  type="text"
                  placeholder="QUO-001"
                  value={formData.quotationNumber}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="valueWithoutTax" className="block text-sm font-medium">
                  Quotation Value Without Tax
                </label>
                <input
                  id="valueWithoutTax"
                  name="valueWithoutTax"
                  type="text"
                  placeholder="₹10,000"
                  value={formData.valueWithoutTax}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="valueWithTax" className="block text-sm font-medium">
                  Quotation Value With Tax
                </label>
                <input
                  id="valueWithTax"
                  name="valueWithTax"
                  type="text"
                  placeholder="₹11,800"
                  value={formData.valueWithTax}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="quotationFile" className="block text-sm font-medium">
                Quotation Upload
              </label>
              {/* <FileUploader value={formData.quotationFile} onChange={handleFileChange} /> */}
              <p className="text-xs text-gray-500 mt-1">
                Upload your quotation document (PDF, Word, Excel, image files, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="remarks" className="block text-sm font-medium">
                REMARK
              </label>
              <textarea
                id="remarks"
                name="remarks"
                placeholder="Enter any remarks about this quotation"
                value={formData.remarks}
                onChange={handleChange}
                rows="4"
                className="w-full p-2 border border-gray-300 rounded-md"
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </>
              ) : (
                "Update Quotation"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
    )
  }
  
  export default MakeQuotationForm
  