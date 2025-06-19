"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useFormContext } from "@/context/FormContext"
import { ChevronDown, Home } from "lucide-react"
import { ExternalLink } from "lucide-react"

export default function NavigationMenu() {
  const router = useRouter()
  const { currentFeederType, setCurrentFeederType } = useFormContext()
  const [singleDropdownOpen, setSingleDropdownOpen] = useState(false)
  const [setDropdownOpen, setSetDropdownOpen] = useState(false)

  const toggleSingleDropdown = () => {
    setSingleDropdownOpen(!singleDropdownOpen)
    if (setDropdownOpen) setSetDropdownOpen(false)
  }

  const toggleSetDropdown = () => {
    setSetDropdownOpen(!setDropdownOpen)
    if (singleDropdownOpen) setSingleDropdownOpen(false)
  }

  const navigateTo = (path: string, feederType?: string) => {
    if (feederType) {
      setCurrentFeederType(feederType)
    }
    router.push(path)
    setSingleDropdownOpen(false)
    setSetDropdownOpen(false)
  }

  return (
    <div className="bg-white print:hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-2 sm:gap-0">
          {/* Brand Logo */}
          <div
            className="cursor-pointer"
            onClick={() => router.push("/")}
            style={{ flexShrink: 0 }}
          >
            <img src="/tnc-home-logo.png" alt="TNC Feeder Logo" className="h-12 sm:h-16" />
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-wrap justify-start sm:justify-end items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-md bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 text-white flex items-center transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </button>

            {/* Single Dropdown */}
            <div className="relative">
              <button
                onClick={toggleSingleDropdown}
                className="px-4 py-2 rounded-md bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 text-white flex items-center transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Single
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {singleDropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => navigateTo("/single/bowl", "bowl-feeder")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Bowl Feeder
                    </button>
                    <button
                      onClick={() => navigateTo("/single/linear", "linear-feeder")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Linear Feeder
                    </button>
                    <button
                      onClick={() => navigateTo("/single/hopper", "hopper")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Hopper
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Set Dropdown */}
            <div className="relative">
              <button
                onClick={toggleSetDropdown}
                className="px-4 py-2 rounded-md bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 text-white flex items-center transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Set
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {setDropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => navigateTo("/set/set-a", "bowl-feeder")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Set A (Bowl + Linear)
                    </button>
                    <button
                      onClick={() => navigateTo("/set/set-b", "bowl-feeder")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Set B (Bowl + Hopper)
                    </button>
                    <button
                      onClick={() => navigateTo("/set/set-c", "bowl-feeder")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Set C (Bowl + Linear + Hopper)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}