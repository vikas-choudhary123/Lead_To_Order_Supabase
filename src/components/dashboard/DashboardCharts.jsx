"use client"

import { useState, useEffect, useContext } from "react"
import { AuthContext } from "../../App" // Import AuthContext
import supabase from "../../utils/supabase" // Import your Supabase client
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
  const { currentUser, userType, isAdmin } = useContext(AuthContext) // Get user info and admin function
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
        
        // Fetch data from leads_to_order table for leads and lead sources
        let leadsQuery = supabase
          .from('leads_to_order')
          .select('*')
        
        // Apply user filter if not admin
        if (!isAdmin() && currentUser?.username) {
          leadsQuery = leadsQuery.eq('Salesperson_Name', currentUser.username)
        }
        
        const { data: leadsData, error: leadsError } = await leadsQuery
        
        // Fetch data from leads_tracker table for enquiries
        let leadsTrackerQuery = supabase
          .from('leads_tracker')
          .select('*')
        
        // Apply user filter if not admin (if there's an assigned user field)
        if (!isAdmin() && currentUser?.username) {
          // Assuming there's an assigned_user field - adjust as needed
          leadsTrackerQuery = leadsTrackerQuery.eq('assigned_user', currentUser.username)
        }
        
        const { data: leadsTrackerData, error: leadsTrackerError } = await leadsTrackerQuery
        
        // Fetch data from enquiry_tracker table for orders
        let enquiryQuery = supabase
          .from('enquiry_tracker')
          .select('*')
        
        // Apply user filter if not admin
        if (!isAdmin() && currentUser?.username) {
          enquiryQuery = enquiryQuery.eq('Quotation Shared By', currentUser.username)
        }
        
        const { data: enquiryData, error: enquiryError } = await enquiryQuery
        
        // Process data for the Overview chart (monthly data)
        if (leadsData && leadsTrackerData && enquiryData) {
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
          
          // Count leads by month
          leadsData.forEach(row => {
            if (row.Timestamp) {
              try {
                const date = new Date(row.Timestamp)
                const month = date.toLocaleString('en-US', { month: 'short' })
                if (monthlyData[month]) {
                  monthlyData[month].leads++
                }
              } catch (error) {
                console.error("Error parsing lead date:", error)
              }
            }
          })
          
          // Count enquiries by month (where Enquiry_Received_Status is "yes")
          leadsTrackerData.forEach(row => {
            if (row.Timestamp && row['Enquiry_Received_Status']?.toLowerCase() === "yes") {
              try {
                const date = new Date(row.Timestamp)
                const month = date.toLocaleString('en-US', { month: 'short' })
                if (monthlyData[month]) {
                  monthlyData[month].enquiries++
                }
              } catch (error) {
                console.error("Error parsing enquiry date:", error)
              }
            }
          })
          
          // Count orders from enquiry_tracker (where "Is Order Received? Status" = "yes")
          enquiryData.forEach(row => {
            if (row.Timestamp && row['Is Order Received? Status']?.toLowerCase() === "yes") {
              try {
                const date = new Date(row.Timestamp)
                const month = date.toLocaleString('en-US', { month: 'short' })
                if (monthlyData[month]) {
                  monthlyData[month].orders++
                }
              } catch (error) {
                console.error("Error parsing order date:", error)
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
        if (leadsData && leadsTrackerData && enquiryData) {
          // Count total leads
          const totalLeads = leadsData.length
          
          // Count total enquiries (where Enquiry_Received_Status = "yes")
          const totalEnquiries = leadsTrackerData.filter(row => 
            row['Enquiry_Received_Status']?.toLowerCase() === "yes"
          ).length
          
          // Count total quotations (rows with Quotation Number)
          const totalQuotations = enquiryData.filter(row => 
            row['Quotation Number']
          ).length
          
          // Count total orders (where "Is Order Received? Status" = "yes")
          const totalOrders = enquiryData.filter(row => 
            row['Is Order Received? Status']?.toLowerCase() === "yes"
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
        if (leadsData) {
          // Count leads by source
          const sourceCounter = {}
          
          // Define a color palette that will cycle through different colors
          const colorPalette = [
            "#06b6d4", // cyan
            "#0ea5e9", // sky
            "#3b82f6", // blue
            "#6366f1", // indigo
            "#8b5cf6", // violet
            "#a855f7", // purple
            "#d946ef", // fuchsia
            "#ec4899", // pink
            "#f43f5e", // rose
            "#ef4444", // red
            "#f97316", // orange
            "#f59e0b", // amber
            "#eab308", // yellow
            "#84cc16", // lime
            "#22c55e", // green
            "#10b981", // emerald
            "#14b8a6", // teal
          ]
          
          leadsData.forEach(row => {
            if (row.Lead_Source) {
              const source = row.Lead_Source
              sourceCounter[source] = (sourceCounter[source] || 0) + 1
            }
          })
          
          // Convert to array format for the chart with dynamic color assignment
          const sourceNames = Object.keys(sourceCounter)
          const newSourceData = sourceNames.map((name, index) => ({
            name,
            value: sourceCounter[name],
            color: colorPalette[index % colorPalette.length] // Cycle through colors
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
  }, [currentUser, isAdmin]) // Add dependencies for user context

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Sales Analytics ( Lead To Order )</h3>
        {/* Display admin view indicator similar to FollowUp page */}
        {isAdmin() && <p className="text-green-600 font-semibold">Admin View: Showing all data</p>}
      </div>

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