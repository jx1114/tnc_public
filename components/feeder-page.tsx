"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useFormContext } from "@/context/FormContext"
import NavigationMenu from "./navigation-menu"
import ModelViewer from "./model-viewer"
import { RefreshCw, Printer, Send, Clipboard } from "lucide-react"

export type FeederPageProps = {
  title: string
  feederType: string
  imageSrc: string
  modelPath?: string
  dimensionDescriptions: Record<string, string>
  dimensionPositions: Record<string, { x: number; y: number }>
  nextPageRoute?: string
  previousPageRoute?: string
  machineInfoFields?: Array<{
    id: string
    label: string
    type: "text" | "select" | "number"
    options?: string[]
  }>
}

export default function FeederPage({
  title,
  feederType,
  imageSrc,
  modelPath = `/models/${feederType}.glb`,
  dimensionDescriptions,
  dimensionPositions,
  nextPageRoute,
  previousPageRoute,
  machineInfoFields = [
    { id: "machineNo", label: "Machine no.", type: "text" },
    {
      id: "rotation",
      label: "Rotation",
      type: "select",
      options: ["Clockwise", "Anti-clockwise"],
    },
    { id: "uph", label: "UPH", type: "number" },
    { id: "remark", label: "Remark", type: "text" }, // Optional field
  ],
}: FeederPageProps) {
  const { getFeederData, updateFeederData, setCurrentFeederType, setNextFeederType } = useFormContext()
  const feederData = getFeederData(feederType)

  const [currentDimension, setCurrentDimension] = useState<string | null>(null)
  const [dimensionValue, setDimensionValue] = useState("")
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showModelViewer, setShowModelViewer] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pasteText, setPasteText] = useState("")

  const printRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const [isAnimating, setIsAnimating] = useState(false)
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null)

  // Inactivity detection: 3s idle triggers animation
  useEffect(() => {
    let animationTimeout: NodeJS.Timeout
    const resetTimer = () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current)
      }
      setIsAnimating(false)
      inactivityTimer.current = setTimeout(() => {
        setIsAnimating(true)

        animationTimeout = setTimeout(() => {
          resetTimer() // restart listening for inactivity
        }, 3000)
      }, 8000)
    }

    const events = ["mousemove", "keydown", "mousedown", "touchstart"]
    events.forEach((event) => window.addEventListener(event, resetTimer))

    resetTimer()

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer))
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current)
      }
      if (animationTimeout) clearTimeout(animationTimeout)
    }
  }, [])

  const allDimensionsFilled = () => {
    return Object.keys(dimensionDescriptions).every((key) => feederData.dimensions[key])
  }

  const machineInfoComplete = () => {
    return machineInfoFields
      .filter((field) => field.id !== "remark")
      .every((field) => {
        const value = feederData.machineInfo[field.id]
        return value !== undefined && value.trim() !== ""
      })
  }

  const clearCurrentPageData = () => {
    updateFeederData(feederType, {
      dimensions: {},
      machineInfo: {},
    })
  }

  const handleDimensionClick = (dimension: string) => {
    setCurrentDimension(dimension)
    setDimensionValue(feederData.dimensions[dimension] || "")
  }

  const handleSend = () => {
    if (!machineInfoComplete() || !allDimensionsFilled()) return showTempError("Not Complete!")
    setShowError(false)
    setShowContactForm(true)
  }

  const handleSaveAsPDF = () => {
    window.print()
  }

  const handleSendEmail = async () => {
    // Validate form
    if (!contactForm.name || !contactForm.email || !contactForm.phone) {
      showTempError("Please fill in all required fields")
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare data to send
      const formattedData = formatDataForEmail(feederData, dimensionDescriptions, machineInfoFields)

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          phone: contactForm.phone,
          message: contactForm.message,
          feederType,
          title,
          formData: formattedData,
        }),
      })

      if (response.ok) {
        setShowContactForm(false)
        showTempError("Email sent successfully!", true)
      } else {
        showTempError("Failed to send email. Please try again.")
      }
    } catch (error) {
      showTempError("Error sending email. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDataForEmail = (
    data: { machineInfo: Record<string, string>; dimensions: Record<string, string> },
    dimensionDescriptions: Record<string, string>,
    machineInfoFields: Array<{ id: string; label: string; type: string; options?: string[] }>,
  ) => {
    let result = `${title}\n`
    result += `Generated on: ${getCurrentDate()}\n\n`

    // Machine Information
    result += "MACHINE INFORMATION\n"
    result += "-------------------\n"
    machineInfoFields.forEach((field) => {
      const value = data.machineInfo[field.id] || "Not specified"
      result += `${field.label}: ${value}\n`
    })

    // Dimensions
    result += "\nDIMENSIONS\n"
    result += "----------\n"
    Object.entries(dimensionDescriptions).forEach(([key, description]) => {
      const value = data.dimensions[key] || "Not specified"
      result += `${key} ${value} mm\n`
    })

    return result
  }

  const handleNext = () => {
    if (!machineInfoComplete()) {
      showTempError("Not Complete!")
      return
    }
    if (!allDimensionsFilled()) {
      showTempError("Not Complete!")
      return
    }
    if (nextPageRoute) {
      setCurrentFeederType(feederType)
      if (nextPageRoute.includes("/")) {
        const nextType = nextPageRoute.split("/").pop() || ""
        setNextFeederType(nextType)
      }
      router.push(nextPageRoute)
    }
  }

  const handleBack = () => {
    if (previousPageRoute) {
      router.push(previousPageRoute)
    }
  }

  const handleClearData = () => {
    clearCurrentPageData()
    showTempError("Data cleared successfully!", true)
  }

  const handleOkClick = () => {
    if (!machineInfoComplete()) {
      showTempError("Not Complete!")
      return
    }
    if (!allDimensionsFilled()) {
      showTempError("Not Complete!")
      return
    }

    setShowSuccessModal(true)
  }

  const showTempError = (message: string, isSuccess = false) => {
    setShowError(true)
    setErrorMessage(message)
    setTimeout(() => setShowError(false), isSuccess ? 3000 : 5000)
  }

  const getCurrentDate = () => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, "0")
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const year = now.getFullYear()
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    return `${day}/${month}/${year} at ${hours}:${minutes}`
  }

  const updateMachineInfo = (id: string, value: string) => {
    updateFeederData(feederType, {
      ...feederData,
      machineInfo: {
        ...feederData.machineInfo,
        [id]: value,
      },
    })
  }

  const updateDimension = (dimension: string, value: string) => {
    updateFeederData(feederType, {
      ...feederData,
      dimensions: {
        ...feederData.dimensions,
        [dimension]: value,
      },
    })
  }

  const handlePasteData = () => {
    setShowPasteModal(true)
  }

  const processPastedData = () => {
    try {
      // Parse the pasted text
      const lines = pasteText.split("\n").filter((line) => line.trim() !== "")

      // Create a new object to store the parsed data
      const newMachineInfo: Record<string, string> = {}
      const newDimensions: Record<string, string> = {}

      // Process each line
      lines.forEach((line) => {
        // Try to match machine info fields
        machineInfoFields.forEach((field) => {
          const regex = new RegExp(`${field.label}\\s*:\\s*(.+)`, "i")
          const match = line.match(regex)
          if (match && match[1]) {
            newMachineInfo[field.id] = match[1].trim()
          }
        })

        // Try to match dimensions
        Object.entries(dimensionDescriptions).forEach(([key, description]) => {
          // Match either "A: 100" or "A (Bowl Diameter): 100" or just look for the dimension code
          const simpleRegex = new RegExp(`^\\s*${key}\\s*:\\s*(\\d+)`, "i")
          const detailedRegex = new RegExp(`^\\s*${key}\\s*\$$.*\$$\\s*:\\s*(\\d+)`, "i")
          const valueOnlyRegex = new RegExp(`\\b${key}\\b[^:]*?\\b(\\d+)\\s*mm\\b`, "i")

          const simpleMatch = line.match(simpleRegex)
          const detailedMatch = line.match(detailedRegex)
          const valueOnlyMatch = line.match(valueOnlyRegex)

          if (simpleMatch && simpleMatch[1]) {
            newDimensions[key] = simpleMatch[1].trim()
          } else if (detailedMatch && detailedMatch[1]) {
            newDimensions[key] = detailedMatch[1].trim()
          } else if (valueOnlyMatch && valueOnlyMatch[1]) {
            newDimensions[key] = valueOnlyMatch[1].trim()
          }
        })
      })

      // Update the form data with the parsed values
      const updatedData = {
        machineInfo: { ...feederData.machineInfo, ...newMachineInfo },
        dimensions: { ...feederData.dimensions, ...newDimensions },
      }

      // Force a complete update of the form data
      updateFeederData(feederType, updatedData)

      // Log the updated data to verify
      console.log("Updated data:", updatedData)

      setShowPasteModal(false)
      setPasteText("")
      showTempError("Data imported successfully!", true)
    } catch (error) {
      console.error("Error parsing data:", error)
      showTempError("Failed to parse the pasted data. Please check the format.")
    }
  }

  return (
    <>
      <NavigationMenu />
      <div className="bg-[#fdf5e6] min-h-screen w-[1050px] overflow-auto mx-auto p-4 print:p-0 light">
        <div ref={printRef} className="print-container flex flex-col h-[297mm] p-4 print:p-0 relative">
          <h1 className="text-2xl font-bold text-center mb-4 flex justify-center space-x-1">
            {title.split("").map((char, idx) => (
              <span
                key={idx}
                className={isAnimating ? "wave" : ""}
                style={isAnimating ? { animationDelay: `${idx * 0.1}s` } : {}}
              >
                {char}
              </span>
            ))}
          </h1>

          {/* Machine Information */}
          <div className="border bg-[#fffafa] rounded-md p-3 mb-3">
            <h2 className="text-lg font-medium mb-2">Machine Information</h2>
            <div className="grid grid-cols-3 gap-4">
              {machineInfoFields.map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="block mb-1 font-medium">
                    {field.label}
                  </label>
                  {field.id === "remark" ? (
                    <div className="relative">
                      <textarea
                        id={field.id}
                        value={feederData.machineInfo[field.id] || ""}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value.length <= 60) {
                            updateMachineInfo(field.id, value)
                            // Auto-grow the textarea
                            e.target.style.height = "auto"
                            e.target.style.height = `${e.target.scrollHeight}px`
                          }
                        }}
                        maxLength={60}
                        rows={1}
                        className="w-full border rounded-md px-3 py-2 resize-none overflow-hidden"
                        placeholder="Enter up to 60 characters"
                      />
                      <div className="text-right text-sm text-gray-500 mt-1 print:hidden">
                        {feederData.machineInfo[field.id]?.length || 0} / 60 chars
                      </div>
                    </div>
                  ) : field.type === "select" ? (
                    <select
                      id={field.id}
                      value={feederData.machineInfo[field.id] || ""}
                      onChange={(e) => updateMachineInfo(field.id, e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 ${
                        !feederData.machineInfo[field.id] ? "border-red-500" : ""
                      }`}
                    >
                      <option value="">Select</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={field.id}
                      type={field.type}
                      value={feederData.machineInfo[field.id] || ""}
                      onChange={(e) => updateMachineInfo(field.id, e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 ${
                        field.id !== "remark" && !feederData.machineInfo[field.id] ? "border-red-500" : ""
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Feeder Design */}
          <div className="border bg-[#fffafa] rounded-md p-4 flex-grow mb-3 relative">
            <h2 className="text-lg font-medium mb-2">Feeder Info</h2>
            <p className="text-sm italic text-red-500 mb-2">(*Set value as 0 if there is no dimension)</p>
            <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
              <Image
                src={imageSrc || "/placeholder.svg"}
                alt="Dimension Drawing"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
              {Object.entries(dimensionPositions).map(([dim, { x, y }]) => (
                <button
                  key={dim}
                  onClick={() => handleDimensionClick(dim)}
                  className={`absolute text-xs flex items-center justify-center ${
                    feederData.dimensions[dim]
                      ? "bg-white border-none text-black"
                      : "bg-white border border-transparent text-red-500"
                  }`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                    width: "18px",
                    height: "18px",
                    fontSize: "10px",
                  }}
                >
                  {feederData.dimensions[dim] || dim}
                </button>
              ))}
            </div>

            <div className="absolute bottom-6 left-6 flex print:hidden gap-2">
              <button
                onClick={handleClearData}
                className="bg-white border border-black text-black px-4 py-2 rounded-md flex items-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear Data
              </button>

              
            </div>

            <div className="absolute bottom-6 right-6 flex print:hidden">
              <button onClick={handleOkClick} className="bg-black text-white px-4 py-2 rounded-md">
                OK
              </button>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 mt-auto">Generated on {getCurrentDate()}</div>

          {nextPageRoute && (
            <button
              onClick={handleNext}
              className="absolute bottom-4 right-4 print:hidden bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-md"
            >
              Next
            </button>
          )}

          {previousPageRoute && (
            <button
              onClick={handleBack}
              className="absolute bottom-4 left-4 print:hidden bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-md"
            >
              Back
            </button>
          )}
        </div>

        {/* Input Dialog */}
        {currentDimension && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80">
              <h3 className="text-lg font-bold mb-4">
                Enter dimension {currentDimension}: {dimensionDescriptions[currentDimension]}
              </h3>
              <input
                type="number"
                value={dimensionValue}
                onChange={(e) => setDimensionValue(e.target.value)}
                placeholder="Enter value in mm"
                autoFocus
                className="w-full border rounded-md px-3 py-2 mb-4"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const trimmedValue = dimensionValue.trim()
                    if (trimmedValue !== "") {
                      updateDimension(currentDimension, trimmedValue)
                    } else {
                      updateDimension(currentDimension, "")
                    }
                    setCurrentDimension(null)
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {showError && (
          <div
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-4 ${
              errorMessage.includes("successfully")
                ? "bg-green-50 border-green-500 text-green-600"
                : "bg-red-50 border-red-500 text-red-600"
            } rounded-md shadow-lg print:hidden max-w-xs`}
          >
            {errorMessage}
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center print:hidden">
            <div className="relative bg-white p-6 rounded-lg w-[500px] shadow-lg text-center">
              {/* Close Button as X */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
                aria-label="Close"
              >
                &times;
              </button>

              <h2 className="text-2xl font-bold mb-4">Congratulations, your dimension is completed!🎉🎉🎉</h2>

              {/* Looping video */}
              <div className="w-full rounded-md mb-4 border-2 border-black bg-white overflow-hidden">
                <video
                  src="/hopper.mp4" // or use /yourVideo.mp4
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto block"
                />
              </div>

              {/* Buttons: View 3D and Send */}
              <div className="flex justify-center gap-4 mt-2">
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    setShowModelViewer(true)
                  }}
                  className="bg-white text-black border border-black px-6 py-2 rounded-md"
                >
                  View 3D
                </button>

                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    handleSend()
                  }}
                  className="bg-black text-white px-6 py-2 rounded-md flex items-center"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Model Viewer */}
        {showModelViewer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden">
            <ModelViewer
              modelPath={modelPath}
              isOpen={showModelViewer}
              onClose={() => setShowModelViewer(false)}
              onLoad={() => {}}
              dimensions={feederData.dimensions}
            />
          </div>
        )}

        {/* Contact Form */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center print:hidden">
            <div className="bg-white rounded-lg p-6 shadow-md w-[500px] relative">
              {/* Add close button */}
              <button
                onClick={() => setShowContactForm(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
                aria-label="Close"
              >
                &times;
              </button>

              <h2 className="text-xl font-bold mb-4">Send Your Configuration</h2>
              <p className="text-sm text-gray-600 mb-4">
                Please provide your contact information to send the feeder configuration.
              </p>

              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder="Your name"
                  className="border w-full p-2 rounded"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Your email"
                  className="border w-full p-2 rounded"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="Your phone number"
                  className="border w-full p-2 rounded"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  placeholder="Additional message (optional)"
                  rows={3}
                  className="border w-full p-2 rounded"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded flex items-center"
                  onClick={handleSaveAsPDF}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Save PDF
                </button>
                <button
                  className="bg-black text-white px-4 py-2 rounded flex items-center"
                  onClick={handleSendEmail}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Paste Data Modal */}
        {showPasteModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center print:hidden">
            <div className="bg-white rounded-lg p-6 shadow-md w-[600px]">
              <h2 className="text-xl font-bold mb-4">Paste Configuration Data</h2>
              <p className="text-sm text-gray-600 mb-4">
                Paste your configuration data below. The system will try to extract machine information and dimensions.
              </p>

              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your configuration data here..."
                rows={10}
                className="border w-full p-2 rounded mb-4"
              />

              <div className="flex justify-end gap-2">
                <button
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                  onClick={() => setShowPasteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-black text-white px-4 py-2 rounded"
                  onClick={processPastedData}
                  disabled={!pasteText.trim()}
                >
                  Import Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .wave {
          display: inline-block;
          animation: fallBounce 2.2s ease-out forwards;
          color: rgb(187, 57, 57);
        }

        @keyframes fallBounce {
          0% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(60px);
          }
          60% {
            transform: translateY(30px);
          }
          80% {
            transform: translateY(45px);
          }
          100% {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
