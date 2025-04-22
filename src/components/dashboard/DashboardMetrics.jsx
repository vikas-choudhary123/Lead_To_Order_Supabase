import { UsersIcon, PhoneCallIcon, FileTextIcon, ShoppingCartIcon, TrendingUpIcon, AlertCircleIcon } from "../Icons"

function DashboardMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
      <MetricCard
        title="Total Leads"
        value="124"
        change="+12%"
        trend="up"
        icon={<UsersIcon className="h-5 w-5" />}
        color="from-blue-500 to-indigo-600"
      />

      <MetricCard
        title="Pending Follow-ups"
        value="38"
        change="+5%"
        trend="up"
        icon={<PhoneCallIcon className="h-5 w-5" />}
        color="from-amber-500 to-orange-600"
      />

      <MetricCard
        title="Quotations Sent"
        value="56"
        change="+8%"
        trend="up"
        icon={<FileTextIcon className="h-5 w-5" />}
        color="from-emerald-500 to-green-600"
      />

      <MetricCard
        title="Orders Received"
        value="27"
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
