"use client"

import { useState } from "react"
import { Car, Clock, DollarSign, Save } from "lucide-react"
import { BikeIcon as Motorcycle } from "lucide-react"

export default function AddServicePage() {
  const [serviceType, setServiceType] = useState("car")
  const [components, setComponents] = useState([
    { name: "", price: "" },
    { name: "", price: "" },
    { name: "", price: "" },
  ])

  const addComponent = () => {
    setComponents([...components, { name: "", price: "" }])
  }

  const removeComponent = (index) => {
    const newComponents = [...components]
    newComponents.splice(index, 1)
    setComponents(newComponents)
  }

  const handleComponentChange = (index, field, value) => {
    const newComponents = [...components]
    newComponents[index][field] = value
    setComponents(newComponents)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Add New Service</h1>
        <p className="text-gray-400">Create a new service offering for your customers</p>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Service Details</h2>
          <p className="text-sm text-gray-400">Enter the details of the new service</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Service Type</label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="car"
                  name="serviceType"
                  value="car"
                  checked={serviceType === "car"}
                  onChange={() => setServiceType("car")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 bg-gray-800"
                />
                <label htmlFor="car" className="flex items-center gap-1 cursor-pointer text-gray-300">
                  <Car className="h-4 w-4" /> Car Service
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="bike"
                  name="serviceType"
                  value="bike"
                  checked={serviceType === "bike"}
                  onChange={() => setServiceType("bike")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 bg-gray-800"
                />
                <label htmlFor="bike" className="flex items-center gap-1 cursor-pointer text-gray-300">
                  <Motorcycle className="h-4 w-4" /> Bike Service
                </label>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="service-name" className="text-sm font-medium text-gray-300">
                Service Name
              </label>
              <input
                id="service-name"
                placeholder="e.g. Full Service, Oil Change"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="service-price" className="text-sm font-medium text-gray-300">
                Price ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  id="service-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="99.99"
                  className="w-full rounded-md border border-gray-700 bg-gray-800 pl-8 pr-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="service-duration" className="text-sm font-medium text-gray-300">
                Duration
              </label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  id="service-duration"
                  placeholder="e.g. 1 hour, 30 minutes"
                  className="w-full rounded-md border border-gray-700 bg-gray-800 pl-8 pr-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="service-popularity" className="text-sm font-medium text-gray-300">
                Popularity
              </label>
              <select
                id="service-popularity"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
                defaultValue="medium"
              >
                <option value="very-high">Very High</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="service-description" className="text-sm font-medium text-gray-300">
              Description
            </label>
            <textarea
              id="service-description"
              placeholder="Describe the service in detail..."
              className="w-full min-h-[100px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Service Components</label>
            <div className="rounded-md border border-gray-700 p-4">
              <div className="space-y-4">
                {components.map((component, index) => (
                  <div key={index} className="grid gap-4 grid-cols-12 items-center">
                    <div className="col-span-5 md:col-span-6">
                      <input
                        placeholder={`Component ${index + 1} name`}
                        value={component.name}
                        onChange={(e) => handleComponentChange(index, "name", e.target.value)}
                        className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-4">
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Price"
                          value={component.price}
                          onChange={(e) => handleComponentChange(index, "price", e.target.value)}
                          className="w-full rounded-md border border-gray-700 bg-gray-800 pl-8 pr-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <button
                        onClick={() => removeComponent(index)}
                        className="w-full inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addComponent}
                  className="w-full inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700"
                >
                  Add Component
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between p-6 border-t border-gray-800">
          <button className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700">
            Cancel
          </button>
          <button className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Save className="mr-2 h-4 w-4" /> Save Service
          </button>
        </div>
      </div>
    </div>
  )
}

