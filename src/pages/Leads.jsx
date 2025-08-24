"use client"

import { useState, useEffect, useContext } from "react"
import { AuthContext } from "../App"
import supabase from "../utils/supabase" // Import your supabase client

function Leads() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    receiverName: "",
    source: "",
    companyName: "",
    phoneNumber: "",
    salespersonName: "",
    location: "",
    email: "",
    contactPersons: [{ name: "", designation: "", number: "" }],
    state: "",
    address: "",
    customerRegistrationForm: "",
    creditAccess: "",
    creditDays: "",
    creditLimit: "",
    nob: "",
    gst: "",
    notes: ""
  })
  const [receiverNames, setReceiverNames] = useState([])
  const [leadSources, setLeadSources] = useState([])
  const [companyOptions, setCompanyOptions] = useState([])
  const [companyDetailsMap, setCompanyDetailsMap] = useState({})
  const [nextLeadNumber, setNextLeadNumber] = useState("")
  const [creditDaysOptions, setCreditDaysOptions] = useState([])
  const [creditLimitOptions, setCreditLimitOptions] = useState([])
  const { showNotification } = useContext(AuthContext)
  const [designationOptions, setDesignationOptions] = useState([])
  const [nobOptions, setNobOptions] = useState([])
  const [stateOptions, setStateOptions] = useState([])
  
  // Function to format date as dd/mm/yyyy
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Fetch dropdown data when component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch dropdown values from Google Sheets (keeping this as is)
        await fetchDropdownData()
        // Fetch company data for dropdown and auto-fill
        await fetchCompanyData()
        // Generate next lead number from Supabase
        await generateNextLeadNumber()
      } catch (error) {
        console.error("Error during initial data fetch:", error)
      }
    }
    
    fetchInitialData()
  }, [])

  // NEW: Fetch dropdown data from Supabase dropdown table
// NEW: Fetch dropdown data from Supabase dropdown table
const fetchDropdownData = async () => {
  try {
    const { data, error } = await supabase
      .from('dropdown')
      .select('*')

    if (error) {
      throw error
    }

    if (data && data.length > 0) {
      // Extract unique values for each dropdown using correct column names
      const receivers = [...new Set(data.map(row => row.lead_receiver_name).filter(Boolean))]
      const sources = [...new Set(data.map(row => row.lead_source).filter(Boolean))]
      const states = [...new Set(data.map(row => row.state).filter(Boolean))]
      const creditDays = [...new Set(data.map(row => row.credit_days).filter(Boolean))]
      const creditLimits = [...new Set(data.map(row => row.credit_limit).filter(Boolean))]
      const designations = [...new Set(data.map(row => row.designation).filter(Boolean))]
      const nobs = [...new Set(data.map(row => row.nob).filter(Boolean))]
      
      // Filter out empty strings and null values, then sort
      setReceiverNames(receivers.filter(item => item && item.trim() !== '').sort())
      setLeadSources(sources.filter(item => item && item.trim() !== '').sort())
      setStateOptions(states.filter(item => item && item.trim() !== '').sort())
      setCreditDaysOptions(creditDays.filter(item => item && item.trim() !== '').sort())
      setCreditLimitOptions(creditLimits.filter(item => item && item.trim() !== '').sort())
      setDesignationOptions(designations.filter(item => item && item.trim() !== '').sort())
      setNobOptions(nobs.filter(item => item && item.trim() !== '').sort())
    }
  } catch (error) {
    console.error("Error fetching dropdown values:", error)
    // Fallback to default values
    setReceiverNames(["John Smith", "Sarah Johnson", "Michael Brown"])
    setLeadSources(["Indiamart", "Justdial", "Social Media", "Website", "Referral", "Other"])
    setStateOptions(["Andhra Pradesh", "Assam", "Bihar", "Delhi", "Gujarat", "Haryana", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"])
    setCreditDaysOptions(["7 days", "15 days", "30 days", "45 days", "60 days"])
    setCreditLimitOptions(["₹50,000", "₹100,000", "₹500,000", "₹1,000,000"])
    setDesignationOptions(["Manager", "Director", "CEO", "CFO", "Proprietor"])
    setNobOptions(["Manufacturing", "Trading", "Service", "Retail"])
  }
}

  // NEW: Fetch company data from Supabase dropdown table
  const fetchCompanyData = async () => {
    try {
      const { data, error } = await supabase
        .from('dropdown')
        .select('company_name, salesperson_name, phone_number, email, location')
        .not('company_name', 'is', null)

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        const companies = []
        const detailsMap = {}
        
        data.forEach(row => {
          if (row.company_name) {
            companies.push(row.company_name)
            
            detailsMap[row.company_name] = {
              salesPerson: row.salesperson_name || "",
              phoneNumber: row.phone_number || "",
              email: row.email || "",
              location: row.location || ""
            }
          }
        })
        
        // Remove duplicates
        const uniqueCompanies = [...new Set(companies)]
        setCompanyOptions(uniqueCompanies)
        setCompanyDetailsMap(detailsMap)
      }
    } catch (error) {
      console.error("Error fetching company data:", error)
      setCompanyOptions([])
      setCompanyDetailsMap({})
    }
  }

  // NEW: Generate next lead number from Supabase
  const generateNextLeadNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('leads_to_order')
        .select('"LD-Lead-No"')
        .order('id', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error fetching last lead number:', error)
        setNextLeadNumber("LD-001")
        return
      }

      if (!data || data.length === 0) {
        setNextLeadNumber("LD-001")
        return
      }

      const lastLeadNumber = data[0]["LD-Lead-No"]
      if (lastLeadNumber && lastLeadNumber.startsWith("LD-")) {
        const match = lastLeadNumber.match(/LD-(\d+)/)
        if (match) {
          const lastNumber = parseInt(match[1], 10)
          const nextNumber = lastNumber + 1
          setNextLeadNumber(`LD-${String(nextNumber).padStart(3, '0')}`)
        } else {
          setNextLeadNumber("LD-001")
        }
      } else {
        setNextLeadNumber("LD-001")
      }
    } catch (error) {
      console.error("Error generating lead number:", error)
      setNextLeadNumber("LD-001")
    }
  }

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prevData => ({
      ...prevData,
      [id]: value
    }))

    // Auto-fill related fields if company is selected
    if (id === 'companyName' && value) {
      const companyDetails = companyDetailsMap[value] || {}
      setFormData(prevData => ({
        ...prevData,
        companyName: value,
        phoneNumber: companyDetails.phoneNumber || "",
        salespersonName: companyDetails.salesPerson || "",
        location: companyDetails.location || "",
        email: companyDetails.email || ""
      }))
    }
  }

  const handleContactPersonChange = (index, field, value) => {
    const updatedContactPersons = [...formData.contactPersons]
    updatedContactPersons[index] = {
      ...updatedContactPersons[index],
      [field]: value
    }
    
    setFormData({
      ...formData,
      contactPersons: updatedContactPersons
    })
  }

  const addContactPerson = () => {
    if (formData.contactPersons.length < 3) {
      setFormData({
        ...formData,
        contactPersons: [...formData.contactPersons, { name: "", designation: "", number: "" }]
      })
    }
  }

  const removeContactPerson = (index) => {
    const updatedContactPersons = [...formData.contactPersons]
    updatedContactPersons.splice(index, 1)
    
    setFormData({
      ...formData,
      contactPersons: updatedContactPersons
    })
  }

  // NEW: Submit to Supabase
// NEW: Submit to Supabase - FIXED to match exact column names
const handleSubmit = async (e) => {
  e.preventDefault()
  setIsSubmitting(true)

  try {
    // Prepare data for Supabase with EXACT column names from schema
    const leadData = {
      "Timestamp": formatDate(new Date()),
      "LD-Lead-No": nextLeadNumber,
      "Lead_Receiver_Name": formData.receiverName,
      "Lead_Source": formData.source,
      "Company_Name": formData.companyName,
      "Phone_Number": formData.phoneNumber,
      "Salesperson_Name": formData.salespersonName,
      "Location": formData.location,
      "Email_Address": formData.email,
      "State": formData.state,
      "Address": formData.address,
      // Contact persons with exact column names
      "Person_name_1": formData.contactPersons[0]?.name || "",
      "Designation_1": formData.contactPersons[0]?.designation || "",
      "Phone_Number_1": formData.contactPersons[0]?.number || "",
      "Person_Name_2": formData.contactPersons[1]?.name || "",
      "Designation_2": formData.contactPersons[1]?.designation || "",
      "Phone_Number_2": formData.contactPersons[1]?.number || "",
      "Person_Name_3": formData.contactPersons[2]?.name || "",
      "Designation_3": formData.contactPersons[2]?.designation || "",
      "Phone_Number_3": formData.contactPersons[2]?.number || "",
      // Additional fields with exact column names
      "NOB": formData.nob,
      "GST_Number": formData.gst,
      "Customer_Registration Form": formData.customerRegistrationForm,
      "Credit _Access": formData.creditAccess, // Note the space in "Credit _Access"
      "Credit_Days": formData.creditDays,
      "Credit_Limit": formData.creditLimit,
      "Additional_Notes": formData.notes
    }

    const { data, error } = await supabase
      .from('leads_to_order')
      .insert([leadData])

    if (error) {
      throw error
    }

    showNotification("Lead created successfully", "success")
    
    // Reset form
    setFormData({
      receiverName: "",
      source: "",
      companyName: "",
      phoneNumber: "",
      salespersonName: "",
      location: "",
      email: "",
      contactPersons: [{ name: "", designation: "", number: "" }],
      state: "",
      address: "",
      customerRegistrationForm: "",
      creditAccess: "",
      creditDays: "",
      creditLimit: "",
      nob: "",
      gst: "",
      notes: ""
    })

    // Generate next lead number for the next submission
    await generateNextLeadNumber()

  } catch (error) {
    console.error('Error submitting lead:', error)
    showNotification("Error creating lead: " + error.message, "error")
  } finally {
    setIsSubmitting(false)
  }
}

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Lead Management
          </h1>
          <p className="text-slate-600 mt-1">Enter the details of the new lead</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">New Lead</h2>
          <p className="text-sm text-slate-500">Fill in the lead information below</p>
          {nextLeadNumber && (
            <p className="text-sm font-medium text-blue-600 mt-1">
              Next Lead Number: {nextLeadNumber}
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="receiverName" className="block text-sm font-medium text-gray-700">
                  Lead Receiver Name
                </label>
                <select
                  id="receiverName"
                  value={formData.receiverName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select receiver</option>
                  {receiverNames.map((name, index) => (
                    <option key={index} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  Lead Source
                </label>
                <select
                  id="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select source</option>
                  {leadSources.map((source, index) => (
                    <option key={index} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  list="companyOptions"
                  id="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <datalist id="companyOptions">
                  {companyOptions.map((company, index) => (
                    <option key={index} value={company} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone number will auto-fill"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="salespersonName" className="block text-sm font-medium text-gray-700">
                  Person Name
                </label>
                <input
                  id="salespersonName"
                  value={formData.salespersonName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Salesperson name will auto-fill"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  id="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Location will auto-fill"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email will auto-fill"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <select
                  id="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select state</option>
                  {stateOptions.map((state, index) => (
                    <option key={index} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter complete address"
                rows="2"
              />
            </div>

            {/* Contact Person Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium">Contact Person Details</h3>
                {formData.contactPersons.length < 3 && (
                  <button
                    type="button"
                    onClick={addContactPerson}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Add Person
                  </button>
                )}
              </div>
              
              {formData.contactPersons.map((person, index) => (
                <div key={index} className="border rounded-md p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Person {index + 1}</h4>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeContactPerson(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        value={person.name}
                        onChange={(e) => handleContactPersonChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contact name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Designation</label>
                      <select
                        value={person.designation}
                        onChange={(e) => handleContactPersonChange(index, 'designation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select designation</option>
                        {designationOptions.map((designation, idx) => (
                          <option key={idx} value={designation}>{designation}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        value={person.number}
                        onChange={(e) => handleContactPersonChange(index, 'number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contact number"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="nob" className="block text-sm font-medium text-gray-700">
                  Nature of Business (NOB)
                </label>
                <select
                  id="nob"
                  value={formData.nob}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select nature of business</option>
                  {nobOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="gst" className="block text-sm font-medium text-gray-700">
                  GST Number
                </label>
                <input
                  id="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="GST number"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="customerRegistrationForm" className="block text-sm font-medium text-gray-700">
                  Customer Registration Form
                </label>
                <select
                  id="customerRegistrationForm"
                  value={formData.customerRegistrationForm}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="creditAccess" className="block text-sm font-medium text-gray-700">
                  Credit Access
                </label>
                <select
                  id="creditAccess"
                  value={formData.creditAccess}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="creditDays" className="block text-sm font-medium text-gray-700">
                  Credit Days
                </label>
                <select
                  id="creditDays"
                  value={formData.creditDays}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select credit days</option>
                  {creditDaysOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700">
                  Credit Limit
                </label>
                <select
                  id="creditLimit"
                  value={formData.creditLimit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select credit limit</option>
                  {creditLimitOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <input
                id="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any additional information"
              />
            </div>
          </div>
          <div className="p-6 border-t flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Leads