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
    notes: "",
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
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
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
  const fetchDropdownData = async () => {
    try {
      const { data, error } = await supabase.from("dropdown").select("*")

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        // Extract unique values for each dropdown using correct column names
        const receivers = [...new Set(data.map((row) => row.lead_receiver_name).filter(Boolean))]
        const sources = [...new Set(data.map((row) => row.lead_source).filter(Boolean))]
        const states = [...new Set(data.map((row) => row.state).filter(Boolean))]
        const creditDays = [...new Set(data.map((row) => row.credit_days).filter(Boolean))]
        const creditLimits = [...new Set(data.map((row) => row.credit_limit).filter(Boolean))]
        const designations = [...new Set(data.map((row) => row.designation).filter(Boolean))]
        const nobs = [...new Set(data.map((row) => row.nob).filter(Boolean))]

        // Filter out empty strings and null values, then sort
        setReceiverNames(receivers.filter((item) => item && item.trim() !== "").sort())
        setLeadSources(sources.filter((item) => item && item.trim() !== "").sort())
        setStateOptions(states.filter((item) => item && item.trim() !== "").sort())
        setCreditDaysOptions(creditDays.filter((item) => item && item.trim() !== "").sort())
        setCreditLimitOptions(creditLimits.filter((item) => item && item.trim() !== "").sort())
        setDesignationOptions(designations.filter((item) => item && item.trim() !== "").sort())
        setNobOptions(nobs.filter((item) => item && item.trim() !== "").sort())
      }
    } catch (error) {
      console.error("Error fetching dropdown values:", error)
      // Fallback to default values
      setReceiverNames(["John Smith", "Sarah Johnson", "Michael Brown"])
      setLeadSources(["Indiamart", "Justdial", "Social Media", "Website", "Referral", "Other"])
      setStateOptions([
        "Andhra Pradesh",
        "Assam",
        "Bihar",
        "Delhi",
        "Gujarat",
        "Haryana",
        "Karnataka",
        "Kerala",
        "Madhya Pradesh",
        "Maharashtra",
        "Punjab",
        "Rajasthan",
        "Tamil Nadu",
        "Telangana",
        "Uttar Pradesh",
        "West Bengal",
      ])
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
        .from("dropdown")
        .select("company_name, salesperson_name, phone_number, email, location")
        .not("company_name", "is", null)

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        const companies = []
        const detailsMap = {}

        data.forEach((row) => {
          if (row.company_name) {
            companies.push(row.company_name)

            detailsMap[row.company_name] = {
              salesPerson: row.salesperson_name || "",
              phoneNumber: row.phone_number || "",
              email: row.email || "",
              location: row.location || "",
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
        .from("leads_to_order")
        .select('"LD-Lead-No"')
        .order("id", { ascending: false })
        .limit(1)

      if (error) {
        console.error("Error fetching last lead number:", error)
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
          const lastNumber = Number.parseInt(match[1], 10)
          const nextNumber = lastNumber + 1
          setNextLeadNumber(`LD-${String(nextNumber).padStart(3, "0")}`)
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
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }))

    // Auto-fill related fields if company is selected
    if (id === "companyName" && value) {
      const companyDetails = companyDetailsMap[value] || {}
      setFormData((prevData) => ({
        ...prevData,
        companyName: value,
        phoneNumber: companyDetails.phoneNumber || "",
        salespersonName: companyDetails.salesPerson || "",
        location: companyDetails.location || "",
        email: companyDetails.email || "",
      }))
    }
  }

  const handleContactPersonChange = (index, field, value) => {
    const updatedContactPersons = [...formData.contactPersons]
    updatedContactPersons[index] = {
      ...updatedContactPersons[index],
      [field]: value,
    }

    setFormData({
      ...formData,
      contactPersons: updatedContactPersons,
    })
  }

  const addContactPerson = () => {
    if (formData.contactPersons.length < 3) {
      setFormData({
        ...formData,
        contactPersons: [...formData.contactPersons, { name: "", designation: "", number: "" }],
      })
    }
  }

  const removeContactPerson = (index) => {
    const updatedContactPersons = [...formData.contactPersons]
    updatedContactPersons.splice(index, 1)

    setFormData({
      ...formData,
      contactPersons: updatedContactPersons,
    })
  }

  // NEW: Submit to Supabase
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Prepare data for Supabase with EXACT column names from schema
      const leadData = {
        Timestamp: formatDate(new Date()),
        "LD-Lead-No": nextLeadNumber,
        Lead_Receiver_Name: formData.receiverName,
        Lead_Source: formData.source,
        Company_Name: formData.companyName,
        Phone_Number: formData.phoneNumber,
        Salesperson_Name: formData.salespersonName,
        Location: formData.location,
        Email_Address: formData.email,
        State: formData.state,
        Address: formData.address,
        // Contact persons with exact column names
        Person_name_1: formData.contactPersons[0]?.name || "",
        Designation_1: formData.contactPersons[0]?.designation || "",
        Phone_Number_1: formData.contactPersons[0]?.number || "",
        Person_Name_2: formData.contactPersons[1]?.name || "",
        Designation_2: formData.contactPersons[1]?.designation || "",
        Phone_Number_2: formData.contactPersons[1]?.number || "",
        Person_Name_3: formData.contactPersons[2]?.name || "",
        Designation_3: formData.contactPersons[2]?.designation || "",
        Phone_Number_3: formData.contactPersons[2]?.number || "",
        // Additional fields with exact column names
        NOB: formData.nob,
        GST_Number: formData.gst,
        "Customer_Registration Form": formData.customerRegistrationForm,
        "Credit _Access": formData.creditAccess, // Note the space in "Credit _Access"
        Credit_Days: formData.creditDays,
        Credit_Limit: formData.creditLimit,
        Additional_Notes: formData.notes,
      }

      const { data, error } = await supabase.from("leads_to_order").insert([leadData])

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
        notes: "",
      })

      // Generate next lead number for the next submission
      await generateNextLeadNumber()
    } catch (error) {
      console.error("Error submitting lead:", error)
      showNotification("Error creating lead: " + error.message, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Lead Management
          </h1>
          <p className="text-slate-600 mt-1">Enter the details of the new lead</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md">
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-bold">New Lead</h2>
          <p className="text-sm text-slate-500">Fill in the lead information below</p>
          {nextLeadNumber && (
            <p className="text-sm font-medium text-blue-600 mt-1">Next Lead Number: {nextLeadNumber}</p>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label htmlFor="receiverName" className="block text-sm font-medium text-gray-700">
                  Lead Receiver Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="receiverName"
                    value={formData.receiverName}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                    required
                  >
                    <option value="">Select receiver</option>
                    {receiverNames.map((name, index) => (
                      <option key={index} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  Lead Source <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                    required
                  >
                    <option value="">Select source</option>
                    {leadSources.map((source, index) => (
                      <option key={index} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    list="companyOptions"
                    id="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter or select company"
                    required
                  />
                  <datalist id="companyOptions">
                    {companyOptions.map((company, index) => (
                      <option key={index} value={company} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Email will auto-fill"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <div className="relative">
                  <select
                    id="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                  >
                    <option value="">Select state</option>
                    {stateOptions.map((state, index) => (
                      <option key={index} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter complete address"
                rows="3"
              />
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Contact Person Details</h3>
                {formData.contactPersons.length < 3 && (
                  <button
                    type="button"
                    onClick={addContactPerson}
                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add Person
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {formData.contactPersons.map((person, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 sm:p-6 bg-gray-50">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                      <h4 className="text-sm font-medium text-gray-900">Contact Person {index + 1}</h4>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeContactPerson(index)}
                          className="inline-flex items-center px-3 py-1 text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          value={person.name}
                          onChange={(e) => handleContactPersonChange(index, "name", e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          placeholder="Contact name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Designation</label>
                        <div className="relative">
                          <select
                            value={person.designation}
                            onChange={(e) => handleContactPersonChange(index, "designation", e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                          >
                            <option value="">Select designation</option>
                            {designationOptions.map((designation, idx) => (
                              <option key={idx} value={designation}>
                                {designation}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <input
                          value={person.number}
                          onChange={(e) => handleContactPersonChange(index, "number", e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          placeholder="Contact number"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label htmlFor="nob" className="block text-sm font-medium text-gray-700">
                  Nature of Business (NOB)
                </label>
                <div className="relative">
                  <select
                    id="nob"
                    value={formData.nob}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                  >
                    <option value="">Select nature of business</option>
                    {nobOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="gst" className="block text-sm font-medium text-gray-700">
                  GST Number
                </label>
                <input
                  id="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="GST number"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="customerRegistrationForm" className="block text-sm font-medium text-gray-700">
                  Customer Registration Form <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="customerRegistrationForm"
                    value={formData.customerRegistrationForm}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                    required
                  >
                    <option value="">Select option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="creditAccess" className="block text-sm font-medium text-gray-700">
                  Credit Access
                </label>
                <div className="relative">
                  <select
                    id="creditAccess"
                    value={formData.creditAccess}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                  >
                    <option value="">Select option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="creditDays" className="block text-sm font-medium text-gray-700">
                  Credit Days
                </label>
                <div className="relative">
                  <select
                    id="creditDays"
                    value={formData.creditDays}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                  >
                    <option value="">Select credit days</option>
                    {creditDaysOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700">
                  Credit Limit
                </label>
                <div className="relative">
                  <select
                    id="creditLimit"
                    value={formData.creditLimit}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                  >
                    <option value="">Select credit limit</option>
                    {creditLimitOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter any additional information"
                rows="3"
              />
            </div>
          </div>
          <div className="p-4 sm:p-6 border-t bg-gray-50 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              onClick={() => {
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
                  notes: "",
                })
              }}
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                "Save Lead"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Leads
