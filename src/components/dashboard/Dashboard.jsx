"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import { TrendingUp, DollarSign, Check, Clock } from "lucide-react"
import StatsCard from "./StatsCard"
import RecentBookings from "./RecentBookings"
import StaffAttendance from "./StaffAttendance"
import ServicesOverview from "./ServicesOverview"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
}

export default function Dashboard() {
  // Ref for scroll animations
  const servicesRef = useRef(null)

  const statsData = [
    {
      title: "Total Bookings",
      value: "1,248",
      change: "+12%",
      icon: TrendingUp,
      iconColor: "text-blue-400",
      bgColor: "from-blue-600/10",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Completed Services",
      value: "946",
      change: "+8%",
      icon: Check,
      iconColor: "text-green-400",
      bgColor: "from-green-600/10",
      borderColor: "border-green-500/20",
    },
    {
      title: "Pending Services",
      value: "42",
      change: "+3%",
      icon: Clock,
      iconColor: "text-yellow-400",
      bgColor: "from-yellow-600/10",
      borderColor: "border-yellow-500/20",
      isNegative: true,
    },
    {
      title: "Total Revenue",
      value: "$24,896",
      change: "+18%",
      icon: DollarSign,
      iconColor: "text-purple-400",
      bgColor: "from-purple-600/10",
      borderColor: "border-purple-500/20",
    },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <motion.div key={index} variants={itemVariants}>
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div variants={itemVariants} className="md:col-span-2">
          <RecentBookings />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StaffAttendance />
        </motion.div>
      </div>

      {/* Services Overview */}
      <motion.div
        ref={servicesRef}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={itemVariants}
      >
        <ServicesOverview />
      </motion.div>
    </motion.div>
  )
}

