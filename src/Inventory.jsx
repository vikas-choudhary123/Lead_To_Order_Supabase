"use client"

import { useState } from "react"
import { Package, Search, AlertTriangle, ShoppingCart, Plus, Filter } from "lucide-react"

const Inventory = () => {
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Professional Shampoo",
      category: "Hair Care",
      brand: "LuxeHair",
      stock: 24,
      price: 18.99,
      status: "In Stock",
    },
    {
      id: 2,
      name: "Hair Color - Blonde",
      category: "Hair Color",
      brand: "ColorPro",
      stock: 8,
      price: 22.5,
      status: "Low Stock",
    },
    {
      id: 3,
      name: "Styling Gel - Extra Hold",
      category: "Styling",
      brand: "StyleMaster",
      stock: 15,
      price: 14.99,
      status: "In Stock",
    },
    {
      id: 4,
      name: "Nail Polish - Ruby Red",
      category: "Nail Care",
      brand: "GlamNails",
      stock: 3,
      price: 9.99,
      status: "Low Stock",
    },
    {
      id: 5,
      name: "Facial Cleanser",
      category: "Skin Care",
      brand: "PureSkin",
      stock: 0,
      price: 24.99,
      status: "Out of Stock",
    },
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <Plus size={18} className="mr-2" />
            Add Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <Package size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-2xl font-bold text-gray-800">5</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-yellow-100 p-3 mr-4">
            <AlertTriangle size={24} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Low Stock Items</p>
            <p className="text-2xl font-bold text-gray-800">2</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <ShoppingCart size={24} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Out of Stock</p>
            <p className="text-2xl font-bold text-gray-800">1</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Product Inventory</h3>
          <button className="flex items-center text-gray-600 hover:text-gray-900">
            <Filter size={16} className="mr-2" />
            Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Product Name
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
                  Brand
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Stock
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
                  Status
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
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.brand}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.status === "In Stock"
                          ? "bg-green-100 text-green-800"
                          : product.status === "Low Stock"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-pink-600 hover:text-pink-900 mr-3">Edit</button>
                    <button className="text-blue-600 hover:text-blue-900">Restock</button>
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

export default Inventory

