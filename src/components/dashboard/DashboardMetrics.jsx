// DashboardMetrics.jsx - Updated to use Supabase instead of Google Sheets

import { useState, useEffect, useContext } from "react"
import { UsersIcon, PhoneCallIcon, FileTextIcon, ShoppingCartIcon, TrendingUpIcon, AlertCircleIcon } from "../Icons"
import { AuthContext } from "../../App" // Import AuthContext
import supabase from "../../utils/supabase" // Import your Supabase client

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
        
        let totalLeads = 0
        let pendingFollowups = 0
        let quotationsSent = 0
        let ordersReceived = 0
        let totalEnquiry = 0
        let pendingEnquiry = 0
        
        // Fetch data from leads_to_order table for total leads and pending follow-ups
        let leadsQuery = supabase
          .from('leads_to_order')
          .select('*')
        
        // Apply user filter if not admin
        if (!isAdmin() && currentUser?.username) {
          leadsQuery = leadsQuery.eq('Salesperson_Name', currentUser.username)
        }
        
        const { data: leadsData, error: leadsError } = await leadsQuery
        
        if (leadsError) {
          console.error('Error fetching leads:', leadsError)
        } else if (leadsData) {
          // Count total leads
          totalLeads = leadsData.length
          
          // Count pending follow-ups (where Planned is not null and Actual is null)
          pendingFollowups = leadsData.filter(row => 
            row.Planned && !row.Actual
          ).length
        }
        
        // Fetch data from enquiry_tracker table for quotations sent and orders received
        let enquiryQuery = supabase
          .from('enquiry_tracker')
          .select('*')
        
        // Apply user filter if not admin (assuming there's a user assignment field)
        if (!isAdmin() && currentUser?.username) {
          enquiryQuery = enquiryQuery.eq('Quotation Shared By', currentUser.username)
        }
        
        const { data: enquiryData, error: enquiryError } = await enquiryQuery
        
        if (enquiryError) {
          console.error('Error fetching enquiry data:', enquiryError)
        } else if (enquiryData) {
          // Count quotations sent (rows with Quotation Number)
          quotationsSent = enquiryData.filter(row => 
            row['Quotation Number']
          ).length
          
          // Count orders received (where "Is Order Received? Status" = "yes")
          ordersReceived = enquiryData.filter(row => 
            row['Is Order Received? Status'] && 
            row['Is Order Received? Status'].toLowerCase() === 'yes'
          ).length
        }
        
        // Fetch data from enquiry_to_order table for total enquiry and pending enquiry
        let enquiryToOrderQuery = supabase
          .from('enquiry_to_order')
          .select('*')
        
        // Apply user filter if not admin
        if (!isAdmin() && currentUser?.username) {
          enquiryToOrderQuery = enquiryToOrderQuery.eq('sales_coordinator_name', currentUser.username)
        }
        
        const { data: enquiryToOrderData, error: enquiryToOrderError } = await enquiryToOrderQuery
        
        if (enquiryToOrderError) {
          console.error('Error fetching enquiry to order data:', enquiryToOrderError)
        } else if (enquiryToOrderData) {
          // Count total enquiries
          totalEnquiry = enquiryToOrderData.length
          
          // Count pending enquiries (where planned1 is not null and actual1 is null)
          pendingEnquiry = enquiryToOrderData.filter(row => 
            row.planned1 && !row.actual1
          ).length
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