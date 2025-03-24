"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Car } from "lucide-react"
import { BikeIcon as Motorcycle } from "lucide-react"

export default function ServicesOverview() {
  const [activeTab, setActiveTab] = useState("car")

  const carServices = [
    "Basic Service",
    "Full Service",
    "Oil Change",
    "Brake Service",
    "Engine Tune-up",
    "Wheel Alignment",
  ]

  const bikeServices = [
    "Basic Service",
    "Full Service",
    "Chain Replacement",
    "Brake Adjustment",
    "Tire Replacement",
    "Suspension Tuning",
  ]

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-semibold text-white">Services Overview</h2>
        <p className="text-sm text-gray-400">Manage all your service offerings</p>
      </div>
      <div className="p-6">
        <div className="flex border-b border-gray-800 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "car" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("car")}
          >
            <Car className="h-4 w-4" />
            Car Services
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "bike" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("bike")}
          >
            <Motorcycle className="h-4 w-4" />
            Bike Services
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(activeTab === "car" ? carServices : bikeServices).map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            >
              <div
                className={`rounded-lg overflow-hidden bg-gray-800 border-gray-700 hover:border-${activeTab === "car" ? "blue" : "green"}-500/50 transition-colors duration-300 border`}
              >
                <div className="aspect-video bg-gray-900 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: activeTab === "car" ? 5 : -5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {activeTab === "car" ? (
                        <Car className="h-12 w-12 text-blue-400" />
                      ) : (
                        <Motorcycle className="h-12 w-12 text-green-400" />
                      )}
                    </motion.div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-white">{service}</h3>
                  <p className={`text-${activeTab === "car" ? "blue" : "green"}-400 text-sm font-medium`}>
                    ${((i + 1) * (activeTab === "car" ? 49.99 : 29.99)).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {i % 2 === 0
                      ? `Complete ${activeTab} maintenance package for optimal performance.`
                      : `Specialized service focusing on specific ${activeTab} components.`}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

