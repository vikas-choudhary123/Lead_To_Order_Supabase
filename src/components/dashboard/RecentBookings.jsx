"use client"

import { motion } from "framer-motion"
import { Car } from "lucide-react"
import { BikeIcon as Motorcycle } from "lucide-react"

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function RecentBookings() {
  const bookings = [
    {
      id: 1,
      type: "car",
      service: "Car Service",
      details: "Oil Change, Brake Check",
      price: 99.99,
      time: "9:00 AM",
    },
    {
      id: 2,
      type: "bike",
      service: "Bike Service",
      details: "Full Service, Chain Replacement",
      price: 79.99,
      time: "10:00 AM",
    },
    {
      id: 3,
      type: "car",
      service: "Car Service",
      details: "Engine Tune-up",
      price: 149.99,
      time: "11:00 AM",
    },
    {
      id: 4,
      type: "bike",
      service: "Bike Service",
      details: "Brake Adjustment",
      price: 59.99,
      time: "12:00 PM",
    },
    {
      id: 5,
      type: "car",
      service: "Car Service",
      details: "Wheel Alignment",
      price: 89.99,
      time: "1:00 PM",
    },
  ]

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-semibold text-white">Recent Bookings</h2>
        <p className="text-sm text-gray-400">You have 6 new bookings today</p>
      </div>
      <div className="p-6">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
          {bookings.map((booking, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, x: 20 },
                show: {
                  opacity: 1,
                  x: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
                    delay: i * 0.1,
                  },
                },
              }}
              className="flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-800/50 p-3 hover:bg-gray-800 transition-colors duration-200"
            >
              <div
                className={`rounded-full p-2 ${booking.type === "car" ? "bg-blue-900/50 text-blue-400" : "bg-green-900/50 text-green-400"}`}
              >
                {booking.type === "car" ? <Car className="h-5 w-5" /> : <Motorcycle className="h-5 w-5" />}
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium text-white">
                  {booking.service} - #{1000 + booking.id}
                </p>
                <p className="text-sm text-gray-400">{booking.details}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">${booking.price}</p>
                <p className="text-xs text-gray-400">Today, {booking.time}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

