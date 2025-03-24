"use client"

import { useState } from "react"
import { Save, Upload } from "lucide-react"

export default function AddStaffPage() {
  const [profileImage, setProfileImage] = useState(null)
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    employeeId: "",
    position: "",
    department: "",
    joinDate: "",
    salary: "",
    workSchedule: "",
    skills: "",
    emergencyContact: "",
  })

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id.replace("staff-", "")]: value,
    }))
  }

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(URL.createObjectURL(e.target.files[0]))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Add New Staff</h1>
        <p className="text-gray-400">Add a new staff member to your team</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-800 bg-gray-900">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Personal Information</h2>
            <p className="text-sm text-gray-400">Enter the staff member's personal details</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="staff-fullName" className="text-sm font-medium text-gray-300">
                Full Name
              </label>
              <input
                id="staff-fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Smith"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="staff-dateOfBirth" className="text-sm font-medium text-gray-300">
                  Date of Birth
                </label>
                <input
                  id="staff-dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="staff-gender" className="text-sm font-medium text-gray-300">
                  Gender
                </label>
                <select
                  id="staff-gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="staff-email" className="text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                id="staff-email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john.smith@example.com"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="staff-phone" className="text-sm font-medium text-gray-300">
                Phone Number
              </label>
              <input
                id="staff-phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(123) 456-7890"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="staff-address" className="text-sm font-medium text-gray-300">
                Address
              </label>
              <textarea
                id="staff-address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main St, City, State, ZIP"
                className="w-full min-h-[80px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-photo" className="text-sm font-medium text-gray-300">
                Profile Photo
              </label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img
                      src={profileImage || "/placeholder.svg"}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-semibold text-gray-400">
                      {formData.fullName
                        ? formData.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : "JS"}
                    </span>
                  )}
                </div>
                <label className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" /> Upload Photo
                  <input
                    type="file"
                    id="profile-photo"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Employment Details</h2>
            <p className="text-sm text-gray-400">Enter the staff member's employment information</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="staff-employeeId" className="text-sm font-medium text-gray-300">
                Employee ID
              </label>
              <input
                id="staff-employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="EMP-001"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="staff-position" className="text-sm font-medium text-gray-300">
                Position
              </label>
              <select
                id="staff-position"
                value={formData.position}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select position</option>
                <option value="mechanic">Mechanic</option>
                <option value="senior-mechanic">Senior Mechanic</option>
                <option value="service-advisor">Service Advisor</option>
                <option value="receptionist">Receptionist</option>
                <option value="service-manager">Service Manager</option>
                <option value="apprentice">Apprentice</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="staff-department" className="text-sm font-medium text-gray-300">
                Department
              </label>
              <select
                id="staff-department"
                value={formData.department}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select department</option>
                <option value="car-service">Car Service</option>
                <option value="bike-service">Bike Service</option>
                <option value="customer-service">Customer Service</option>
                <option value="management">Management</option>
              </select>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="staff-joinDate" className="text-sm font-medium text-gray-300">
                  Join Date
                </label>
                <input
                  id="staff-joinDate"
                  type="date"
                  value={formData.joinDate}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="staff-salary" className="text-sm font-medium text-gray-300">
                  Salary
                </label>
                <input
                  id="staff-salary"
                  type="number"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="50000"
                  className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="staff-workSchedule" className="text-sm font-medium text-gray-300">
                Work Schedule
              </label>
              <select
                id="staff-workSchedule"
                value={formData.workSchedule}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select schedule</option>
                <option value="full-time">Full Time (9AM-5PM)</option>
                <option value="part-time-morning">Part Time (Morning)</option>
                <option value="part-time-evening">Part Time (Evening)</option>
                <option value="weekend">Weekend Only</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="staff-skills" className="text-sm font-medium text-gray-300">
                Skills & Certifications
              </label>
              <textarea
                id="staff-skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="List relevant skills and certifications..."
                className="w-full min-h-[80px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="staff-emergencyContact" className="text-sm font-medium text-gray-300">
                Emergency Contact
              </label>
              <input
                id="staff-emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                placeholder="Name: John Doe, Relation: Spouse, Phone: (123) 456-7890"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-between p-6 border-t border-gray-800">
            <button className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700">
              Cancel
            </button>
            <button className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <Save className="mr-2 h-4 w-4" /> Save Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

