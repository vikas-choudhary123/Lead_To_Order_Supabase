import { Edit, Plus, Search, Trash } from "lucide-react"

export default function CarServicePage() {
  const carServices = [
    {
      id: 1,
      name: "Basic Service",
      description: "Essential maintenance for your vehicle",
      price: 99.99,
      duration: "1 hour",
      popularity: "High",
    },
    {
      id: 2,
      name: "Full Service",
      description: "Comprehensive service package including inspection and maintenance",
      price: 199.99,
      duration: "3 hours",
      popularity: "Medium",
    },
    {
      id: 3,
      name: "Oil Change",
      description: "Oil and filter replacement",
      price: 49.99,
      duration: "30 minutes",
      popularity: "Very High",
    },
    {
      id: 4,
      name: "Brake Service",
      description: "Brake pad replacement and system check",
      price: 149.99,
      duration: "2 hours",
      popularity: "High",
    },
    {
      id: 5,
      name: "Engine Tune-up",
      description: "Optimize engine performance and efficiency",
      price: 179.99,
      duration: "2.5 hours",
      popularity: "Medium",
    },
    {
      id: 6,
      name: "Wheel Alignment",
      description: "Adjust wheel angles for optimal tire performance",
      price: 89.99,
      duration: "1 hour",
      popularity: "Medium",
    },
    {
      id: 7,
      name: "Battery Replacement",
      description: "Replace old battery with new one",
      price: 129.99,
      duration: "30 minutes",
      popularity: "Medium",
    },
    {
      id: 8,
      name: "AC Service",
      description: "Air conditioning system check and recharge",
      price: 119.99,
      duration: "1.5 hours",
      popularity: "Low",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Car Services</h1>
          <p className="text-gray-400">Manage all your car service offerings</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add New Service
        </button>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900">
        <div className="p-6 border-b border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">All Car Services</h2>
              <p className="text-sm text-gray-400">View and manage your car service offerings</p>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search services..."
                className="rounded-md border border-gray-700 bg-gray-800 pl-8 pr-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none w-full sm:w-[250px]"
              />
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto rounded-md border border-gray-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Service Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Popularity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {carServices.map((service) => (
                  <tr key={service.id} className="border-b border-gray-800">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">#{service.id}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{service.name}</td>
                    <td className="px-4 py-4 max-w-xs truncate text-sm text-gray-300">{service.description}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">${service.price}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{service.duration}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${service.popularity === "Very High" ? "bg-green-900/50 text-green-400" : ""}
                        ${service.popularity === "High" ? "bg-blue-900/50 text-blue-400" : ""}
                        ${service.popularity === "Medium" ? "bg-yellow-900/50 text-yellow-400" : ""}
                        ${service.popularity === "Low" ? "bg-gray-800 text-gray-300" : ""}
                      `}
                      >
                        {service.popularity}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button className="text-gray-400 hover:text-white">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-400 hover:text-red-300">
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Showing <strong>1-8</strong> of <strong>8</strong> services
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                disabled
              >
                Previous
              </button>
              <button
                className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                disabled
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

