"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Fallback data in case of errors
const fallbackLeadData = [
  { month: "Jan", leads: 45, enquiries: 30, orders: 12 },
  { month: "Feb", leads: 52, enquiries: 35, orders: 15 },
  { month: "Mar", leads: 48, enquiries: 32, orders: 14 },
  { month: "Apr", leads: 70, enquiries: 45, orders: 20 },
  { month: "May", leads: 65, enquiries: 40, orders: 18 },
  { month: "Jun", leads: 58, enquiries: 38, orders: 16 },
]

const fallbackConversionData = [
  { name: "Leads", value: 124, color: "#4f46e5" },
  { name: "Enquiries", value: 82, color: "#8b5cf6" },
  { name: "Quotations", value: 56, color: "#d946ef" },
  { name: "Orders", value: 27, color: "#ec4899" },
]

const fallbackSourceData = [
  { name: "Indiamart", value: 45, color: "#06b6d4" },
  { name: "Justdial", value: 28, color: "#0ea5e9" },
  { name: "Social Media", value: 20, color: "#3b82f6" },
  { name: "Website", value: 15, color: "#6366f1" },
  { name: "Referrals", value: 12, color: "#8b5cf6" },
]

function DashboardCharts() {
  const [activeTab, setActiveTab] = useState("overview")
  const [leadData, setLeadData] = useState(fallbackLeadData)
  const [conversionData, setConversionData] = useState(fallbackConversionData)
  const [sourceData, setSourceData] = useState(fallbackSourceData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch data from FMS sheet for leads and lead sources
        const fmsUrl = "https://docs.google.com/spreadsheets/d/14n58u8M3NYiIjW5vT_dKrugmWwOiBsk-hnYB4e3Oyco/gviz/tq?tqx=out:json&sheet=FMS"
        const fmsResponse = await fetch(fmsUrl)
        const fmsText = await fmsResponse.text()
        
        // Extract JSON from FMS sheet response
        const fmsJsonStart = fmsText.indexOf('{')
        const fmsJsonEnd = fmsText.lastIndexOf('}') + 1
        const fmsJsonData = fmsText.substring(fmsJsonStart, fmsJsonEnd)
        const fmsData = JSON.parse(fmsJsonData)
        
        // Fetch data from Enquiry Tracker sheet for enquiries and orders
        const enquiryUrl = "https://docs.google.com/spreadsheets/d/14n58u8M3NYiIjW5vT_dKrugmWwOiBsk-hnYB4e3Oyco/gviz/tq?tqx=out:json&sheet=Enquiry Tracker"
        const enquiryResponse = await fetch(enquiryUrl)
        const enquiryText = await enquiryResponse.text()
        
        // Extract JSON from Enquiry Tracker sheet response
        const enquiryJsonStart = enquiryText.indexOf('{')
        const enquiryJsonEnd = enquiryText.lastIndexOf('}') + 1
        const enquiryJsonData = enquiryText.substring(enquiryJsonStart, enquiryJsonEnd)
        const enquiryData = JSON.parse(enquiryJsonData)
        
        // Fetch data from Make Quotation sheet for quotations
        const quotationUrl = "https://docs.google.com/spreadsheets/d/14n58u8M3NYiIjW5vT_dKrugmWwOiBsk-hnYB4e3Oyco/gviz/tq?tqx=out:json&sheet=Make Quotation"
        const quotationResponse = await fetch(quotationUrl)
        const quotationText = await quotationResponse.text()
        
        // Extract JSON from Make Quotation sheet response
        const quotationJsonStart = quotationText.indexOf('{')
        const quotationJsonEnd = quotationText.lastIndexOf('}') + 1
        const quotationJsonData = quotationText.substring(quotationJsonStart, quotationJsonEnd)
        const quotationData = JSON.parse(quotationJsonData)
        
        // Process data for the Overview chart (monthly data)
        if (fmsData && fmsData.table && fmsData.table.rows && 
            enquiryData && enquiryData.table && enquiryData.table.rows) {
            
            // Initialize counters by month
            const monthlyData = {
                Jan: { leads: 0, enquiries: 0, orders: 0 },
                Feb: { leads: 0, enquiries: 0, orders: 0 },
                Mar: { leads: 0, enquiries: 0, orders: 0 },
                Apr: { leads: 0, enquiries: 0, orders: 0 },
                May: { leads: 0, enquiries: 0, orders: 0 },
                Jun: { leads: 0, enquiries: 0, orders: 0 },
                Jul: { leads: 0, enquiries: 0, orders: 0 },
                Aug: { leads: 0, enquiries: 0, orders: 0 },
                Sep: { leads: 0, enquiries: 0, orders: 0 },
                Oct: { leads: 0, enquiries: 0, orders: 0 },
                Nov: { leads: 0, enquiries: 0, orders: 0 },
                Dec: { leads: 0, enquiries: 0, orders: 0 }
            }
            
            // Count leads by month (from FMS sheet column A for date, column B for lead)
            fmsData.table.rows.forEach(row => {
                if (row.c && row.c[0] && row.c[0].v && row.c[1] && row.c[1].v) {
                    // Extract month from date (assuming format is DD/MM/YYYY)
                    const dateStr = row.c[0].v
                    let month
                    
                    // Handle different date formats
                    if (typeof dateStr === 'string') {
                        if (dateStr.includes('/')) {
                            // Format: DD/MM/YYYY
                            const parts = dateStr.split('/')
                            if (parts.length === 3) {
                                const monthNum = parseInt(parts[1]) - 1 // 0-indexed
                                month = new Date(2000, monthNum, 1).toLocaleString('en-US', { month: 'short' })
                            }
                        } else if (dateStr.startsWith('Date(')) {
                            // Format: Date(YYYY,MM,DD)
                            const matches = dateStr.match(/Date\((\d+),(\d+),(\d+)/)
                            if (matches && matches.length >= 3) {
                                const monthNum = parseInt(matches[2])
                                month = new Date(2000, monthNum, 1).toLocaleString('en-US', { month: 'short' })
                            }
                        }
                    } else if (dateStr instanceof Date) {
                        month = dateStr.toLocaleString('en-US', { month: 'short' })
                    }
                    
                    if (month && monthlyData[month]) {
                        monthlyData[month].leads++
                    }
                }
            })
            
            // Count enquiries by month (from Enquiry Tracker sheet column A for date, column B for enquiry)
            enquiryData.table.rows.forEach(row => {
                if (row.c && row.c[0] && row.c[0].v && row.c[1] && row.c[1].v) {
                    // Extract month from date (assuming format is DD/MM/YYYY or Date object)
                    const dateStr = row.c[0].v
                    let month
                    
                    // Handle different date formats
                    if (typeof dateStr === 'string') {
                        if (dateStr.includes('/')) {
                            // Format: DD/MM/YYYY
                            const parts = dateStr.split('/')
                            if (parts.length === 3) {
                                const monthNum = parseInt(parts[1]) - 1 // 0-indexed
                                month = new Date(2000, monthNum, 1).toLocaleString('en-US', { month: 'short' })
                            }
                        } else if (dateStr.startsWith('Date(')) {
                            // Format: Date(YYYY,MM,DD)
                            const matches = dateStr.match(/Date\((\d+),(\d+),(\d+)/)
                            if (matches && matches.length >= 3) {
                                const monthNum = parseInt(matches[2])
                                month = new Date(2000, monthNum, 1).toLocaleString('en-US', { month: 'short' })
                            }
                        }
                    } else if (dateStr instanceof Date) {
                        month = dateStr.toLocaleString('en-US', { month: 'short' })
                    }
                    
                    if (month && monthlyData[month]) {
                        monthlyData[month].enquiries++
                    }
                    
                    // Count orders - where column W (index 22) is "yes"
                    if (row.c[22] && row.c[22].v && row.c[22].v.toLowerCase() === "yes") {
                        if (month && monthlyData[month]) {
                            monthlyData[month].orders++
                        }
                    }
                }
            })
            
            // Convert to array format for the chart
            const chartData = Object.entries(monthlyData).map(([month, data]) => ({
                month,
                leads: data.leads,
                enquiries: data.enquiries,
                orders: data.orders
            }))
            
            // Filter to only include months with data
            const nonEmptyMonths = chartData.filter(month => 
                month.leads > 0 || month.enquiries > 0 || month.orders > 0
            )
            
            // Update state if we have data
            if (nonEmptyMonths.length > 0) {
                setLeadData(nonEmptyMonths)
            }
        }
        
        // Process data for the Conversion Funnel
        if (fmsData && fmsData.table && fmsData.table.rows && 
            enquiryData && enquiryData.table && enquiryData.table.rows && 
            quotationData && quotationData.table && quotationData.table.rows) {
            
            // Count total leads from FMS sheet
            const totalLeads = fmsData.table.rows.slice(2).filter(row =>
              row.c && row.c[1] && row.c[1].v
          ).length
          
          // Count total enquiries where column K is not null and column L is null
          // Count total enquiries where column K is not null and column L is null
          const totalEnquiries = enquiryData.table.rows.filter(row =>                  row.c && row.c[1] && row.c[1].v             ).length 
            
            // Count total quotations from Make Quotation sheet
            const totalQuotations = quotationData.table.rows.filter(row => 
                row.c && row.c[1] && row.c[1].v
            ).length
            
            // Count total orders from Enquiry Tracker sheet
            const totalOrders = enquiryData.table.rows.filter(row => 
                row.c && row.c[22] && row.c[22].v && row.c[22].v.toLowerCase() === "yes"
            ).length
            
            // Create conversion data
            const newConversionData = [
                { name: "Leads", value: totalLeads, color: "#4f46e5" },
                { name: "Enquiries", value: totalEnquiries, color: "#8b5cf6" },
                { name: "Quotations", value: totalQuotations, color: "#d946ef" },
                { name: "Orders", value: totalOrders, color: "#ec4899" }
            ]
            
            setConversionData(newConversionData)
        }
        
        // Process data for the Lead Sources chart
        if (fmsData && fmsData.table && fmsData.table.rows) {
            // Count leads by source from FMS sheet column D (index 3)
            const sourceCounter = {}
            const colors = {
                "Indiamart": "#06b6d4",
                "Justdial": "#0ea5e9",
                "Social Media": "#3b82f6",
                "Website": "#6366f1",
                "Referrals": "#8b5cf6",
                // Add more colors for other sources if needed
            }
            
            fmsData.table.rows.slice(2).forEach(row => {
              if (row.c && row.c[3] && row.c[3].v) {
                  const source = row.c[3].v
                  sourceCounter[source] = (sourceCounter[source] || 0) + 1
              }
          })
            
            // Convert to array format for the chart
            const newSourceData = Object.entries(sourceCounter).map(([name, value]) => ({
                name,
                value,
                color: colors[name] || "#9ca3af" // Use gray as default if color not defined
            }))
            
            // Sort by value (descending)
            newSourceData.sort((a, b) => b.value - a.value)
            
            // Update state if we have data
            if (newSourceData.length > 0) {
                setSourceData(newSourceData)
            }
        }
        
      } catch (error) {
        console.error("Error fetching chart data:", error)
        setError(error.message)
        // Fallback to demo data is already handled since we initialized state with it
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Sales Analytics</h3>

      <div className="mb-4">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              activeTab === "overview" ? "bg-slate-100 text-slate-900" : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("conversion")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "conversion" ? "bg-slate-100 text-slate-900" : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Conversion
          </button>
          <button
            onClick={() => setActiveTab("sources")}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              activeTab === "sources" ? "bg-slate-100 text-slate-900" : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Lead Sources
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[350px] flex items-center justify-center">
          <p className="text-slate-500">Loading chart data...</p>
        </div>
      ) : error ? (
        <div className="h-[350px] flex items-center justify-center">
          <p className="text-red-500">Error loading data. Using fallback data.</p>
        </div>
      ) : (
        <div className="h-[350px]">
          {activeTab === "overview" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" name="Leads" fill="#4f46e5" />
                <Bar dataKey="enquiries" name="Enquiries" fill="#8b5cf6" />
                <Bar dataKey="orders" name="Orders" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeTab === "conversion" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              <div className="h-full w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={conversionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {conversionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col justify-center overflow-y-auto max-h-[350px]">
                <h4 className="text-lg font-medium mb-4">Conversion Funnel</h4>
                <div className="space-y-4">
                  {conversionData.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full"
                          style={{
                            width: `${(item.value / (conversionData[0].value || 1)) * 100}%`,
                            backgroundColor: item.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "sources" && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
}

export default DashboardCharts