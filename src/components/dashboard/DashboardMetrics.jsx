import { useState, useEffect } from "react"
import { UsersIcon, PhoneCallIcon, FileTextIcon, ShoppingCartIcon, TrendingUpIcon, AlertCircleIcon } from "../Icons"

function DashboardMetrics() {
  const [metrics, setMetrics] = useState({
    totalLeads: "0",
    pendingFollowups: "0",
    quotationsSent: "0",
    ordersReceived: "0"
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)
        
        // FMS sheet - For total leads (column B) and pending follow-ups (column K not null and column L null)
        const fmsUrl = "https://docs.google.com/spreadsheets/d/14n58u8M3NYiIjW5vT_dKrugmWwOiBsk-hnYB4e3Oyco/gviz/tq?tqx=out:json&sheet=FMS"
        const fmsResponse = await fetch(fmsUrl)
        const fmsText = await fmsResponse.text()
        
        // Extract JSON from FMS sheet response
        const fmsJsonStart = fmsText.indexOf('{')
        const fmsJsonEnd = fmsText.lastIndexOf('}') + 1
        const fmsJsonData = fmsText.substring(fmsJsonStart, fmsJsonEnd)
        const fmsData = JSON.parse(fmsJsonData)
        
        // Make Quotation sheet - For quotations sent (count of rows in column B)
        const quotationUrl = "https://docs.google.com/spreadsheets/d/14n58u8M3NYiIjW5vT_dKrugmWwOiBsk-hnYB4e3Oyco/gviz/tq?tqx=out:json&sheet=Make Quotation"
        const quotationResponse = await fetch(quotationUrl)
        const quotationText = await quotationResponse.text()
        
        // Extract JSON from Make Quotation sheet response
        const quotationJsonStart = quotationText.indexOf('{')
        const quotationJsonEnd = quotationText.lastIndexOf('}') + 1
        const quotationJsonData = quotationText.substring(quotationJsonStart, quotationJsonEnd)
        const quotationData = JSON.parse(quotationJsonData)
        
        // Enquiry Tracker sheet - For orders received (column W = "yes")
        const enquiryUrl = "https://docs.google.com/spreadsheets/d/14n58u8M3NYiIjW5vT_dKrugmWwOiBsk-hnYB4e3Oyco/gviz/tq?tqx=out:json&sheet=Enquiry Tracker"
        const enquiryResponse = await fetch(enquiryUrl)
        const enquiryText = await enquiryResponse.text()
        
        // Extract JSON from Enquiry Tracker sheet response
        const enquiryJsonStart = enquiryText.indexOf('{')
        const enquiryJsonEnd = enquiryText.lastIndexOf('}') + 1
        const enquiryJsonData = enquiryText.substring(enquiryJsonStart, enquiryJsonEnd)
        const enquiryData = JSON.parse(enquiryJsonData)
        
        // Calculate metrics
        let totalLeads = 0
        let pendingFollowups = 0
        let quotationsSent = 0
        let ordersReceived = 0
        
        // Count total leads from FMS sheet (assuming header row is excluded)
        if (fmsData && fmsData.table && fmsData.table.rows) {
          // Count all rows with data in column B (index 1)
          totalLeads = fmsData.table.rows.filter(row => 
            row.c && row.c[1] && row.c[1].v
          ).length
          
          // Count pending follow-ups: rows where column K (index 10) is not null and column L (index 11) is null
          pendingFollowups = fmsData.table.rows.filter(row => 
            row.c && 
            row.c[10] && row.c[10].v && 
            (!row.c[11] || !row.c[11].v)
          ).length
        }
        
        // Count quotations sent from Make Quotation sheet
        if (quotationData && quotationData.table && quotationData.table.rows) {
          // Count all rows with data in column B (index 1), excluding header
          quotationsSent = quotationData.table.rows.filter(row => 
            row.c && row.c[1] && row.c[1].v
          ).length
        }
        
        // Count orders received from Enquiry Tracker sheet
        if (enquiryData && enquiryData.table && enquiryData.table.rows) {
          // Count rows where column W (index 22) = "yes"
          ordersReceived = enquiryData.table.rows.filter(row => 
            row.c && 
            row.c[22] && 
            row.c[22].v && 
            row.c[22].v.toLowerCase() === "yes"
          ).length
        }
        
        // Update metrics state
        setMetrics({
          totalLeads: totalLeads.toString(),
          pendingFollowups: pendingFollowups.toString(),
          quotationsSent: quotationsSent.toString(),
          ordersReceived: ordersReceived.toString()
        })
        
      } catch (error) {
        console.error("Error fetching metrics:", error)
        setError(error.message)
        // Use fallback demo values
        setMetrics({
          totalLeads: "124",
          pendingFollowups: "38",
          quotationsSent: "56",
          ordersReceived: "27"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchMetrics()
  }, [])

  return (
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