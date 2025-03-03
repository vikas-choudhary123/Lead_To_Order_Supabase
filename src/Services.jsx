"use client"

import { useState } from "react"
import { Search, Plus, Edit2, Trash2 } from "lucide-react"

const Services = () => {
  const [services, setServices] = useState([
    {
      id: 1,
      name: "Haircut & Styling",
      category: "Hair",
      duration: "45 min",
      price: 45.0,
      description: "Professional haircut and styling service tailored to your preferences.",
    },
    {
      id: 2,
      name: "Hair Coloring",
      category: "Hair",
      duration: "120 min",
      price: 85.0,
      description: "Full hair coloring service with premium products for vibrant, long-lasting color.",
    },
    {
      id: 3,
      name: "Manicure",
      category: "Nails",
      duration: "30 min",
      price: 25.0,
      description: "Classic manicure including nail shaping, cuticle care, and polish application.",
    },
    {
      id: 4,
      name: "Pedicure",
      category: "Nails",
      duration: "45 min",
      price: 35.0,
      description: "Relaxing pedicure with foot soak, exfoliation, and polish application.",
    },
    {
      id: 5,
      name: "Facial Treatment",
      category: "Skin",
      duration: "60 min",
      price: 65.0,
      description: "Rejuvenating facial treatment customized for your skin type and concerns.",
    },
    {
      id: 6,
      name: "Beard Trim",
      category: "Hair",
      duration: "20 min",
      price: 20.0,
      description: "Professional beard trimming and shaping service.",
    },
  ])

  const [categories, setCategories] = useState([
    { id: 1, name: "Hair", count: 3 },
    { id: 2, name: "Nails", count: 2 },
    { id: 3, name: "Skin", count: 1 },
  ])

  const [selectedCategory, setSelectedCategory] = useState("All")

  const filteredServices =
    selectedCategory === "All" ? services : services.filter((service) => service.category === selectedCategory)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Services Management</h2>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search services..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent w-full"
            />
          </div>
          <button className="flex items-center justify-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2">
            <Plus size={18} className="mr-2" />
            Add Service
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Service Categories</h3>
          <div className="space-y-4">
            <button
              className={`w-full text-left px-4 py-3 rounded-md ${
                selectedCategory === "All" ? "bg-pink-50 text-pink-600" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setSelectedCategory("All")}
            >
              All Services ({services.length})
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`w-full text-left px-4 py-3 rounded-md ${
                  selectedCategory === category.name
                    ? "bg-pink-50 text-pink-600"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedCategory(category.name)}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
          <div className="mt-6">
            <button className="flex items-center text-pink-600 hover:text-pink-700">
              <Plus size={16} className="mr-2" />
              Add New Category
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Service Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Total Services</p>
              <p className="text-2xl font-bold text-gray-800">{services.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Categories</p>
              <p className="text-2xl font-bold text-gray-800">{categories.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Avg. Price</p>
              <p className="text-2xl font-bold text-gray-800">
                ${(services.reduce((sum, service) => sum + service.price, 0) / services.length).toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Most Popular</p>
              <p className="text-2xl font-bold text-gray-800">Hair</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">
            {selectedCategory === "All" ? "All Services" : `${selectedCategory} Services`}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Service Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Duration
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredServices.map((service) => (
                <tr key={service.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{service.name}</div>
                    <div className="text-sm text-gray-500">{service.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {service.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{service.duration}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${service.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-pink-600 hover:text-pink-900 mr-3">
                      <Edit2 size={16} />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Services

