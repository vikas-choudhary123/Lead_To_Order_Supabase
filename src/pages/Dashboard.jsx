import DashboardMetrics from "../components/dashboard/DashboardMetrics"
import DashboardCharts from "../components/dashboard/DashboardCharts"
import PendingTasks from "../components/dashboard/PendingTasks"
import RecentActivities from "../components/dashboard/RecentActivities"

function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Leads To Order System
          </h1>
          <p className="text-slate-600 mt-2">Monitor your sales pipeline and track conversions in real-time</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <DashboardMetrics />

          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <DashboardCharts />
            </div>
          </div>

          {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <PendingTasks />
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <RecentActivities />
            </div>
          </div> */}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
