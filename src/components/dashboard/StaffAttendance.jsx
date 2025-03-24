"use client"

import { motion } from "framer-motion"

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function StaffAttendance() {
  const staffMembers = [
    { name: "John Smith", checkedIn: true, time: "8:00 AM" },
    { name: "Sarah Johnson", checkedIn: true, time: "8:15 AM" },
    { name: "Mike Williams", checkedIn: true, time: "8:30 AM" },
    { name: "Emily Davis", checkedIn: true, time: "9:00 AM" },
    { name: "Robert Brown", checkedIn: false, time: null },
  ]

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-semibold text-white">Staff Attendance</h2>
        <p className="text-sm text-gray-400">Today's attendance</p>
      </div>
      <div className="p-6">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
          {staffMembers.map((staff, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, x: -20 },
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
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-blue-400 border border-gray-700">
                <span className="font-medium">
                  {staff.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{staff.name}</p>
                <p className="text-xs text-gray-400">
                  {staff.checkedIn ? `Checked in at ${staff.time}` : "Not checked in yet"}
                </p>
              </div>
              <div className={`h-2.5 w-2.5 rounded-full ${staff.checkedIn ? "bg-green-500" : "bg-red-500"}`} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

