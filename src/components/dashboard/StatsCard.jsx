import { ArrowUp } from "lucide-react"

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  bgColor,
  borderColor,
  isNegative = false,
}) {
  return (
    <div className={`rounded-lg border ${borderColor} bg-gray-900 overflow-hidden relative`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} to-transparent`}></div>
      <div className="p-6 relative z-10">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          {title}
        </div>
        <div className="mt-2 text-2xl font-bold text-white">{value}</div>
        <p className="text-xs text-gray-400 mt-1">
          <span className={`flex items-center ${isNegative ? "text-red-400" : "text-green-400"}`}>
            <ArrowUp className="h-3 w-3 mr-1" /> {change}
          </span>{" "}
          from last month
        </p>
      </div>
    </div>
  )
}

