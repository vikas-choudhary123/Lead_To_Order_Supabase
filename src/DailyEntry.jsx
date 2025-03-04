"use client"

import { useState, useEffect } from "react"
import { Calendar, DollarSign, TrendingUp, BarChart2, CreditCard, Scissors } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const DailyEntry = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tableHeaders, setTableHeaders] = useState([])
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    services: 0,
    cardPayments: 0,
    averageSale: 0
  })

  useEffect(() => {
    const fetchGoogleSheetData = async () => {
      try {
        setLoading(true)
        console.log("Starting to fetch Google Sheet data...")
        
        // Google Sheet Details - same sheet ID, different sheet name
        const sheetId = '1Kb-fhC1yiFJCyPO7TJDqnu-lQ1n1H6mLErlkSPc6yHc'
        const sheetName = 'Daily Entry'
        
        // Create URL to fetch the sheet in JSON format (this method works for public sheets)
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
        console.log("Fetching from URL:", url)
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`)
        }
        
        // Extract the JSON part from the response (Google returns a weird format)
        const text = await response.text()
        // The response is like: google.visualization.Query.setResponse({...})
        const jsonStart = text.indexOf('{')
        const jsonEnd = text.lastIndexOf('}')
        const jsonString = text.substring(jsonStart, jsonEnd + 1)
        const data = JSON.parse(jsonString)
        
        // Extract headers from cols
        const headers = data.table.cols.map(col => ({
          id: col.id,
          label: col.label || col.id,
          type: col.type
        })).filter(header => header.label) // Filter out empty headers
        
        setTableHeaders(headers)
        
        // Extract and transform data rows with safer handling
        const rowsData = data.table.rows.map(row => {
          const rowData = {}
          
          // Add an internal unique ID
          rowData._id = Math.random().toString(36).substring(2, 15)
          
          // Process each cell carefully
          row.c && row.c.forEach((cell, index) => {
            if (index < headers.length) {
              const header = headers[index]
              
              // Handle null or undefined cell
              if (!cell) {
                rowData[header.id] = ''
                return
              }
              
              // Get the value, with fallbacks
              const value = cell.v !== undefined && cell.v !== null ? cell.v : ''
              rowData[header.id] = value
              
              // Store formatted version if available
              if (cell.f) {
                rowData[`${header.id}_formatted`] = cell.f
              }
              
              // Special handling for dates
              if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
                if (cell.f) {
                  // Use the formatted date string if available
                  rowData[`${header.id}_formatted`] = cell.f
                } else if (value) {
                  try {
                    // Try to format the date value
                    const dateObj = new Date(value)
                    if (!isNaN(dateObj.getTime())) {
                      rowData[`${header.id}_formatted`] = dateObj.toLocaleDateString()
                    }
                  } catch (e) {
                    console.log("Date formatting error:", e)
                  }
                }
              }
            }
          })
          return rowData
        }).filter(row => Object.keys(row).length > 1) // Filter out empty rows (more than just _id)
        
        setTransactions(rowsData)
        
        // Calculate statistics for dashboard cards
        let totalAmount = 0
        let cardPayments = 0
        
        // Find field names in the data
        const amountField = headers.find(h => 
          h.label && (h.label.toLowerCase().includes('amount') || 
                      h.label.toLowerCase().includes('price') || 
                      h.label.toLowerCase().includes('revenue'))
        )?.id || 'amount'
        
        const paymentMethodField = headers.find(h => 
          h.label && (h.label.toLowerCase().includes('payment') || 
                     h.label.toLowerCase().includes('method'))
        )?.id || 'paymentMethod'
        
        // Calculate totals
        rowsData.forEach(row => {
          if (row[amountField] && !isNaN(parseFloat(row[amountField]))) {
            const amount = parseFloat(row[amountField])
            totalAmount += amount
            
            // Check for card payments
            const paymentMethod = row[paymentMethodField]?.toString().toLowerCase() || ''
            if (paymentMethod.includes('card') || 
                paymentMethod.includes('credit') || 
                paymentMethod.includes('debit')) {
              cardPayments += amount
            }
          }
        })
        
        // Update the stats
        setStats({
          totalRevenue: totalAmount,
          services: rowsData.length,
          cardPayments: cardPayments,
          averageSale: rowsData.length > 0 ? totalAmount / rowsData.length : 0
        })
        
        setLoading(false)
      } catch (error) {
        console.error("Error fetching Google Sheet data:", error)
        setError("Failed to load transaction data")
        setLoading(false)
      }
    }

    fetchGoogleSheetData()
  }, [date]) // Reload when date changes

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Daily Entry</h2>
        <div className="mt-4 md:mt-0 flex items-center">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <DollarSign size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-800">₹{stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <Scissors size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Services</p>
            <p className="text-2xl font-bold text-gray-800">{stats.services}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <CreditCard size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Card Payments</p>
            <p className="text-2xl font-bold text-gray-800">₹{stats.cardPayments.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-yellow-100 p-3 mr-4">
            <TrendingUp size={24} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Sale</p>
            <p className="text-2xl font-bold text-gray-800">₹{stats.averageSale.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-pink-600">Loading transaction data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
          {error} <button className="underline ml-2" onClick={() => window.location.reload()}>Try again</button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">Today's Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr key={transaction._id}>
                      {tableHeaders.map((header) => {
                        // Special handling for price/amount fields (but NOT serial numbers)
                        if ((header.label.toLowerCase().includes('amount') || 
                             header.label.toLowerCase().includes('price') || 
                             header.label.toLowerCase().includes('commission') || 
                             header.label.toLowerCase().includes('total')) && 
                             !header.label.toLowerCase().includes('serial') && 
                             !header.label.toLowerCase().includes('sr') && 
                             !header.label.toLowerCase().includes('no') && 
                             header.type !== 'string') {
                          const value = transaction[header.id]
                          let displayValue = value
                          
                          if (!isNaN(parseFloat(value))) {
                            displayValue = '₹' + parseFloat(value).toFixed(2)
                          }
                          
                          return (
                            <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-green-600">{displayValue || '—'}</div>
                            </td>
                          )
                        }
                        
                        // For date fields
                        if (header.type === 'date' || header.label.toLowerCase().includes('date')) {
                          let displayDate = '—'
                          
                          // Use the pre-formatted date if available
                          if (transaction[`${header.id}_formatted`]) {
                            displayDate = transaction[`${header.id}_formatted`]
                          } 
                          // For Google Sheets date format: Date(year,month,day)
                          else if (typeof transaction[header.id] === 'string' && 
                                  transaction[header.id].startsWith('Date(')) {
                            const match = /Date\((\d+),(\d+),(\d+)\)/.exec(transaction[header.id])
                            if (match) {
                              const year = parseInt(match[1], 10)
                              const month = parseInt(match[2], 10) // 0-indexed
                              const day = parseInt(match[3], 10)
                              
                              // Format as MM/DD/YYYY
                              displayDate = `${month+1}/${day}/${year}`
                            } else {
                              displayDate = transaction[header.id].toString()
                            }
                          }
                          // Otherwise try to format it safely
                          else if (transaction[header.id]) {
                            try {
                              const dateObj = new Date(transaction[header.id])
                              if (!isNaN(dateObj.getTime())) {
                                displayDate = dateObj.toLocaleDateString()
                              } else {
                                displayDate = transaction[header.id].toString()
                              }
                            } catch (e) {
                              // If date parsing fails, just show the raw value
                              displayDate = transaction[header.id].toString()
                            }
                          }
                          
                          return (
                            <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{displayDate}</div>
                            </td>
                          )
                        }
                        
                        // Default rendering for other columns (including serial numbers)
                        return (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{transaction[header.id] || '—'}</div>
                          </td>
                        )
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={tableHeaders.length} className="px-6 py-4 text-center text-gray-500">
                      No transactions found for this date
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Revenue Breakdown</h3>
        {loading ? (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-4"></div>
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Error loading chart data</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <BarChart2 size={48} className="text-gray-300" />
            <p className="ml-4 text-gray-500">No transaction data available for this date</p>
          </div>
        ) : (
          <RevenueChart transactions={transactions} tableHeaders={tableHeaders} />
        )}
      </div>
    </div>
  )
}

// Revenue Chart Component
const RevenueChart = ({ transactions, tableHeaders }) => {
  // Find field names in the data
  const amountField = tableHeaders.find(h => 
    h.label && (h.label.toLowerCase().includes('amount') || 
                h.label.toLowerCase().includes('price') || 
                h.label.toLowerCase().includes('revenue'))
  )?.id || 'amount'

  const serviceField = tableHeaders.find(h => 
    h.label && (h.label.toLowerCase().includes('service') || 
                h.label.toLowerCase().includes('item'))
  )?.id || 'service'

  const clientField = tableHeaders.find(h => 
    h.label && (h.label.toLowerCase().includes('client') || 
                h.label.toLowerCase().includes('customer') || 
                h.label.toLowerCase().includes('name'))
  )?.id || 'client'

  // Process data for the chart - group transactions by service
  const serviceData = transactions.reduce((acc, transaction) => {
    const service = transaction[serviceField] || 'Other'
    const amount = parseFloat(transaction[amountField]) || 0
    
    if (!acc[service]) {
      acc[service] = {
        name: service,
        value: 0,
        count: 0
      }
    }
    
    acc[service].value += amount
    acc[service].count += 1
    
    return acc
  }, {})
  
  // Convert to array and sort by value (highest first)
  const chartData = Object.values(serviceData)
    .sort((a, b) => b.value - a.value)
    .map(item => ({
      name: item.name,
      revenue: parseFloat(item.value.toFixed(2)),
      count: item.count
    }))

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded">
          <p className="font-bold">{label}</p>
          <p className="text-green-600">₹{payload[0].value.toFixed(2)} revenue</p>
          <p className="text-gray-600">{payload[1].value} services</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar yAxisId="left" dataKey="revenue" name="Revenue (₹)" fill="#8884d8" />
          <Bar yAxisId="right" dataKey="count" name="Number of Services" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DailyEntry