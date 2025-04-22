"use client"

import { useState } from "react"
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

const leadData = [
  { month: "Jan", leads: 45, enquiries: 30, orders: 12 },
  { month: "Feb", leads: 52, enquiries: 35, orders: 15 },
  { month: "Mar", leads: 48, enquiries: 32, orders: 14 },
  { month: "Apr", leads: 70, enquiries: 45, orders: 20 },
  { month: "May", leads: 65, enquiries: 40, orders: 18 },
  { month: "Jun", leads: 58, enquiries: 38, orders: 16 },
]

const conversionData = [
  { name: "Leads", value: 124, color: "#4f46e5" },
  { name: "Enquiries", value: 82, color: "#8b5cf6" },
  { name: "Quotations", value: 56, color: "#d946ef" },
  { name: "Orders", value: 27, color: "#ec4899" },
]

const sourceData = [
  { name: "Indiamart", value: 45, color: "#06b6d4" },
  { name: "Justdial", value: 28, color: "#0ea5e9" },
  { name: "Social Media", value: 20, color: "#3b82f6" },
  { name: "Website", value: 15, color: "#6366f1" },
  { name: "Referrals", value: 12, color: "#8b5cf6" },
]

function DashboardCharts() {
  const [activeTab, setActiveTab] = useState("overview")

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
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conversionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {conversionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-col justify-center">
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
                          width: `${(item.value / conversionData[0].value) * 100}%`,
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
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {sourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default DashboardCharts
