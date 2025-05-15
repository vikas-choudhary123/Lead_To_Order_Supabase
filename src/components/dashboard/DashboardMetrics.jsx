// DashboardMetrics.jsx - Updated to show user-specific data

import { useState, useEffect, useContext } from "react"
import { UsersIcon, PhoneCallIcon, FileTextIcon, ShoppingCartIcon, TrendingUpIcon, AlertCircleIcon } from "../Icons"
import { AuthContext } from "../../App" // Import AuthContext

function DashboardMetrics() {
  const { currentUser, userType, isAdmin } = useContext(AuthContext) // Get user info and admin function
  const [metrics, setMetrics] = useState({
    totalLeads: "0",
    pendingFollowups: "0",
    quotationsSent: "0",
    ordersReceived: "0",
    totalEnquiry: "0",
    pendingEnquiry: "0"
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)
        
        // FMS sheet - For total leads (column B) and pending follow-ups (column K not null and column L null)
        const fmsUrl = "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=FMS"
        const fmsResponse = await fetch(fmsUrl)
        const fmsText = await fmsResponse.text()
        
        // Extract JSON from FMS sheet response
        const fmsJsonStart = fmsText.indexOf('{')
        const fmsJsonEnd = fmsText.lastIndexOf('}') + 1
        const fmsJsonData = fmsText.substring(fmsJsonStart, fmsJsonEnd)
        const fmsData = JSON.parse(fmsJsonData)
        
        // Make Quotation sheet - For quotations sent (count of rows in column B)
        const quotationUrl = "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=Make Quotation"
        const quotationResponse = await fetch(quotationUrl)
        const quotationText = await quotationResponse.text()
        
        // Extract JSON from Make Quotation sheet response
        const quotationJsonStart = quotationText.indexOf('{')
        const quotationJsonEnd = quotationText.lastIndexOf('}') + 1
        const quotationJsonData = quotationText.substring(quotationJsonStart, quotationJsonEnd)
        const quotationData = JSON.parse(quotationJsonData)

        const enquiryUrl1 = "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=Enquiry Tracker"
        const enquiryResponse1 = await fetch(enquiryUrl1)
        const enquiryText1 = await enquiryResponse1.text()
        
        // Extract JSON from Enquiry Tracker sheet response
        const enquiryJsonStart1 = enquiryText1.indexOf('{')
        const enquiryJsonEnd1 = enquiryText1.lastIndexOf('}') + 1
        const enquiryJsonData1 = enquiryText1.substring(enquiryJsonStart1, enquiryJsonEnd1)
        const enquiryData1 = JSON.parse(enquiryJsonData1)
        
        // Enquiry to Order sheet - For total enquiry and pending enquiry
        const enquiryUrl = "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=ENQUIRY TO ORDER"
        const enquiryResponse = await fetch(enquiryUrl)
        const enquiryText = await enquiryResponse.text()
        
        // Extract JSON from Enquiry to Order sheet response
        const enquiryJsonStart = enquiryText.indexOf('{')
        const enquiryJsonEnd = enquiryText.lastIndexOf('}') + 1
        const enquiryJsonData = enquiryText.substring(enquiryJsonStart, enquiryJsonEnd)
        const enquiryData = JSON.parse(enquiryJsonData)
        
        // Calculate metrics
        let totalLeads = 0
        let pendingFollowups = 0
        let quotationsSent = 0
        let ordersReceived = 0
        let totalEnquiry = 0
        let pendingEnquiry = 0
        
        // Count total leads from FMS sheet - Modified to filter by user
        if (fmsData && fmsData.table && fmsData.table.rows) {
          // For admin users, count all rows; for regular users, filter by their username in column CH (index 88)
          totalLeads = fmsData.table.rows.filter((row, index) => {
            // Get the assigned user 
            const assignedUser = row.c && row.c[88] ? row.c[88].v : ""
            
            // Check if this row should be included based on user permissions
            const shouldInclude = isAdmin() || (currentUser && assignedUser === currentUser.username)
            
            // Count rows starting from index 2 with data in column B (index 1)
            return index >= 2 && row.c && row.c[1] && row.c[1].v && shouldInclude
          }).length
          
          // Count pending follow-ups with user filtering
          pendingFollowups = fmsData.table.rows.filter((row, index) => {
            // Get the assigned user 
            const assignedUser = row.c && row.c[88] ? row.c[88].v : ""
            
            // Check if this row should be included based on user permissions
            const shouldInclude = isAdmin() || (currentUser && assignedUser === currentUser.username)
            
            // Filter for pending follow-ups
            return index >= 2 && 
                   row.c && 
                   row.c[27] && row.c[27].v && 
                   (!row.c[28] || !row.c[28].v) && 
                   shouldInclude
          }).length
        }
        
        // Count quotations sent from Make Quotation sheet with user filtering
        if (quotationData && quotationData.table && quotationData.table.rows) {
          quotationsSent = quotationData.table.rows.filter(row => {
            // Assuming the Make Quotation sheet has a user assignment column (adjust index as needed)
            // Here, I'm assuming column Z (index 25) contains the username
            const assignedUser = row.c && row.c[25] ? row.c[25].v : ""
            
            // Check if this row should be included based on user permissions
            const shouldInclude = isAdmin() || (currentUser && assignedUser === currentUser.username)
            
            // Count all rows with data in column B (index 1)
            return row.c && row.c[1] && row.c[1].v && shouldInclude
          }).length
        }
        
        // Count orders received from Enquiry Tracker sheet with user filtering
        if (enquiryData1 && enquiryData1.table && enquiryData1.table.rows) {
          ordersReceived = enquiryData1.table.rows.filter(row => {
            // Assuming the Enquiry Tracker sheet has a user assignment column (adjust index as needed)
            // Here, I'm assuming column AJ (index 35) contains the username
            const assignedUser = row.c && row.c[35] ? row.c[35].v : ""
            
            // Check if this row should be included based on user permissions
            const shouldInclude = isAdmin() || (currentUser && assignedUser === currentUser.username)
            
            // Count rows where column W (index 22) = "yes"
            return row.c && 
                   row.c[22] && 
                   row.c[22].v && 
                   row.c[22].v.toLowerCase() === "yes" &&
                   shouldInclude
          }).length
        }
        
        // Count from Enquiry to Order sheet with user filtering
        if (enquiryData && enquiryData.table && enquiryData.table.rows) {
          // Count total enquiries with user filtering
          totalEnquiry = enquiryData.table.rows.filter(row => {
            // Assuming the Enquiry to Order sheet has a user assignment column (adjust index as needed)
            // Here, I'm assuming column AQ (index 42) contains the username
            const assignedUser = row.c && row.c[42] ? row.c[42].v : ""
            
            // Check if this row should be included based on user permissions
            const shouldInclude = isAdmin() || (currentUser && assignedUser === currentUser.username)
            
            // Count all rows with data in column A (index 0)
            return row.c && row.c[0] && row.c[0].v && shouldInclude
          }).length
          
          // Count pending enquiries with user filtering
          pendingEnquiry = enquiryData.table.rows.filter(row => {
            // Get the assigned user
            const assignedUser = row.c && row.c[42] ? row.c[42].v : ""
            
            // Check if this row should be included based on user permissions
            const shouldInclude = isAdmin() || (currentUser && assignedUser === currentUser.username)
            
            // Count pending enquiries where column AH (index 37) is not null and column AI (index 38) is null
            return row.c && 
                   row.c[37] && row.c[37].v && 
                   (!row.c[38] || !row.c[38].v) &&
                   shouldInclude
          }).length
        }
        
        // Update metrics state
        setMetrics({
          totalLeads: totalLeads.toString(),
          pendingFollowups: pendingFollowups.toString(),
          quotationsSent: quotationsSent.toString(),
          ordersReceived: ordersReceived.toString(),
          totalEnquiry: totalEnquiry.toString(),
          pendingEnquiry: pendingEnquiry.toString()
        })
        
      } catch (error) {
        console.error("Error fetching metrics:", error)
        setError(error.message)
        // Use fallback demo values
        setMetrics({
          totalLeads: "124",
          pendingFollowups: "38",
          quotationsSent: "56",
          ordersReceived: "27",
          totalEnquiry: "145",
          pendingEnquiry: "42"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchMetrics()
  }, [currentUser, isAdmin]) // Add dependencies for user context

  return (
    <div className="space-y-8">
      {/* Lead to Order Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          {/* Display admin view indicator similar to FollowUp page */}
          {isAdmin() && <p className="text-green-600 font-semibold">Admin View: Showing all data</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
          <MetricCard
            title="Total Leads"
            value={isLoading ? "Loading..." : metrics.totalLeads}
            change="+12%"
            trend="up"
            icon={<UsersIcon className="h-5 w-5" />}
            color="from-blue-500 to-indigo-600"
          />
          
          <MetricCard
            title="Pending Follow-ups"
            value={isLoading ? "Loading..." : metrics.pendingFollowups}
            change="+5%"
            trend="up"
            icon={<PhoneCallIcon className="h-5 w-5" />}
            color="from-amber-500 to-orange-600"
          />
          
          <MetricCard
            title="Quotations Sent"
            value={isLoading ? "Loading..." : metrics.quotationsSent}
            change="+8%"
            trend="up"
            icon={<FileTextIcon className="h-5 w-5" />}
            color="from-emerald-500 to-green-600"
          />
          
          <MetricCard
            title="Orders Received"
            value={isLoading ? "Loading..." : metrics.ordersReceived}
            change="-3%"
            trend="down"
            icon={<ShoppingCartIcon className="h-5 w-5" />}
            color="from-purple-500 to-pink-600"
          />
        </div>
      </div>
      
      {/* Enquiry to Order Section */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <MetricCard
            title="Total Enquiry"
            value={isLoading ? "Loading..." : metrics.totalEnquiry}
            change="+15%"
            trend="up"
            icon={<UsersIcon className="h-5 w-5" />}
            color="from-cyan-500 to-blue-600"
          />
          
          <MetricCard
            title="Pending Enquiry"
            value={isLoading ? "Loading..." : metrics.pendingEnquiry}
            change="+7%"
            trend="up"
            icon={<AlertCircleIcon className="h-5 w-5" />}
            color="from-rose-500 to-red-600"
          />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, change, trend, icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className={`h-2 bg-gradient-to-r ${color}`} />
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className={`p-2 rounded-full bg-gradient-to-r ${color} text-white`}>{icon}</div>
        </div>
        <div className="flex items-center mt-4">
          {trend === "up" ? (
            <TrendingUpIcon className="h-4 w-4 text-emerald-500 mr-1" />
          ) : (
            <AlertCircleIcon className="h-4 w-4 text-rose-500 mr-1" />
          )}
          <span className={trend === "up" ? "text-emerald-500 text-sm" : "text-rose-500 text-sm"}>
            {change} from last month
          </span>
        </div>
      </div>
    </div>
  )
}

export default DashboardMetrics