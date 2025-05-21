"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useFormContext } from "@/context/FormContext"
import NavigationMenu from "./navigation-menu"
import ModelViewer from "./model-viewer"
import { RefreshCw, Send, Clipboard, Check } from "lucide-react"
import VanillaContactForm from "./vanilla-contact-form"

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
    { id: "remark", label: "Remark", type: "text" },
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const [parsedData, setParsedData] = useState<{
    machineInfo: Record<string, string>
    dimensions: Record<string, string>
  } | null>(null)
  const [showParsePreview, setShowParsePreview] = useState(false)

  const printRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const [showInactivityPopup, setShowInactivityPopup] = useState(false)
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null)

  function startInactivityTimer() {
    // Clear any existing timers first
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
    }

     // Set new inactivity timer (30 seconds)
     inactivityTimer.current = setTimeout(() => {
      setShowInactivityPopup(true)
    }, 30000) // 30 seconds of inactivity
  }

  function resetInactivityTimer() {
    // Hide popup if showing
    if (showInactivityPopup) {
      setShowInactivityPopup(false)
    }
    
    // Restart the timer
    startInactivityTimer()
  }

  useEffect(() => {
    const handleUserActivity = () => {
      resetInactivityTimer()
    }

    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"]
    events.forEach((event) => window.addEventListener(event, handleUserActivity))

    // Initialize the timer on mount
    startInactivityTimer()

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleUserActivity))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
  }, [showInactivityPopup])

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
    if ( !allDimensionsFilled()) return showTempError("Not Complete!")
    setShowError(false)
    setShowContactForm(true)
  }

  const handleSaveAsPDF = () => {
    window.print()
  }

  const handleSendEmail = async (formData: { name: string; email: string; phone: string; message: string }) => {
    try {
      setIsSubmitting(true)

      // Prepare data to send
      const formattedData = formatDataForEmail(feederData, dimensionDescriptions, machineInfoFields)

      // Create a simple data object with explicit property names that won't be affected by translation
      const emailData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || "Not provided", // Use fallback if phone is empty
        message: formData.message,
        feederType,
        title,
        formData: formattedData,
      }

      // Log the data being sent (for debugging)
      console.log("Sending email data:", emailData)

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      })

      if (response.ok) {
        // Show success message
        showTempError("Email sent successfully!", true)
      } else {
        // Try to parse the error response
        let errorMessage = "Unknown error"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // If we can't parse the response, use a generic error message
        }

        console.error("Email sending failed:", errorMessage)
        showTempError(`Failed to send email: ${errorMessage}. Please try again.`)
      }
    } catch (error) {
      console.error("Error sending email:", error)
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
    result += "-----------------------------------\n"
    machineInfoFields.forEach((field) => {
      const value = data.machineInfo[field.id] || "Not specified"
      result += `${field.label}: ${value}\n`
    })

    // Dimensions
    result += "\nDIMENSIONS\n"
    result += "-----------------------------------\n"
    Object.entries(dimensionDescriptions).forEach(([key, description]) => {
      const value = data.dimensions[key] || "Not specified"
      result += `${key} ${value} mm\n`
    })

    return result
  }

  const handleNext = () => {
    
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
    
    if (!allDimensionsFilled()) {
      showTempError("Not Complete!")
      return
    }

    setShowSuccessModal(true)
  }

  const showTempError = (message: string, isSuccess = false) => {
    setShowError(true)
    setErrorMessage(message)
    setTimeout(() => setShowError(false), isSuccess ? 4000 : 5000)
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
    setParsedData(null)
    setShowParsePreview(false)
  }

  const parseData = () => {
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
          // Match patterns like "Machine no.: ABC123" or "Machine no: ABC123" or just "Machine no ABC123"
          const regexWithColon = new RegExp(`${field.label}\\s*:\\s*(.+)`, "i")
          const regexWithoutColon = new RegExp(`${field.label}\\s+([^:]+)`, "i")

          const matchWithColon = line.match(regexWithColon)
          const matchWithoutColon = line.match(regexWithoutColon)

          if (matchWithColon && matchWithColon[1]) {
            newMachineInfo[field.id] = matchWithColon[1].trim()
          } else if (matchWithoutColon && matchWithoutColon[1]) {
            newMachineInfo[field.id] = matchWithoutColon[1].trim()
          }
        })

        // Try to match dimensions - use multiple patterns to catch different formats
        Object.entries(dimensionDescriptions).forEach(([key, description]) => {
          // Pattern 1: "A: 100" or "A : 100"
          const pattern1 = new RegExp(`\\b${key}\\s*:\\s*(\\d+)`, "i")

          // Pattern 2: "A (Bowl Diameter): 100" or similar with description
          const pattern2 = new RegExp(`\\b${key}\\s*\$$[^)]*\$$\\s*:\\s*(\\d+)`, "i")

          // Pattern 3: "A 100 mm" or "Dimension A: 100 mm" or similar
          const pattern3 = new RegExp(`\\b${key}\\b[^:]*?\\b(\\d+)\\s*mm\\b`, "i")

          // Pattern 4: Look for description directly: "Bowl Diameter: 100"
          const pattern4 = new RegExp(`\\b${description}\\s*:\\s*(\\d+)`, "i")

          // Pattern 5: Just look for the dimension code and a number nearby
          const pattern5 = new RegExp(`\\b${key}\\b[^:]*?\\b(\\d+)\\b`, "i")

          const match1 = line.match(pattern1)
          const match2 = line.match(pattern2)
          const match3 = line.match(pattern3)
          const match4 = line.match(pattern4)
          const match5 = line.match(pattern5)

          if (match1 && match1[1]) {
            newDimensions[key] = match1[1].trim()
          } else if (match2 && match2[1]) {
            newDimensions[key] = match2[1].trim()
          } else if (match3 && match3[1]) {
            newDimensions[key] = match3[1].trim()
          } else if (match4 && match4[1]) {
            newDimensions[key] = match4[1].trim()
          } else if (match5 && match5[1]) {
            newDimensions[key] = match5[1].trim()
          }
        })
      })

      // Show preview of parsed data
      setParsedData({
        machineInfo: newMachineInfo,
        dimensions: newDimensions,
      })

      setShowParsePreview(true)

      return { newMachineInfo, newDimensions }
    } catch (error) {
      console.error("Error parsing data:", error)
      showTempError("Failed to parse the pasted data. Please check the format.")
      return null
    }
  }

  const applyParsedData = () => {
    if (!parsedData) {
      const result = parseData()
      if (!result) return

      const { newMachineInfo, newDimensions } = result

      // Update the form data with the parsed values
      const updatedData = {
        machineInfo: { ...feederData.machineInfo, ...newMachineInfo },
        dimensions: { ...feederData.dimensions, ...newDimensions },
      }

      // Force a complete update of the form data
      updateFeederData(feederType, updatedData)

      setShowPasteModal(false)
      setPasteText("")
      showTempError("Data imported successfully!", true)
    } else {
      // Update the form data with the already parsed values
      const updatedData = {
        machineInfo: { ...feederData.machineInfo, ...parsedData.machineInfo },
        dimensions: { ...feederData.dimensions, ...parsedData.dimensions },
      }

      // Force a complete update of the form data
      updateFeederData(feederType, updatedData)

      setShowPasteModal(false)
      setPasteText("")
      setParsedData(null)
      showTempError("Data imported successfully!", true)
    }
  }

  const handleAnalyzeData = () => {
    parseData()
  }

  return (
    <>
      <NavigationMenu />
      <div className="bg-[#f2f4f4] min-h-screen w-[1050px] overflow-auto mx-auto p-4 print:p-0 light">
            {/* Inactivity Popup */}
            {showInactivityPopup && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
              
              <div className="absolute animate-floatAround">
                <Image
                  src="/tnc-home-logo-nw.png"
                  alt="TNC Logo"
                  width={60}
                  height={60}
                  className="drop-shadow-lg"
                />
              </div>

                {/* Second Logo - New Counter-Rotation Animation */}
              <div className="absolute animate-floatAroundReverse">
                <Image
                  src="/tnc-home-logo-nw.png"
                  alt="TNC Logo"
                  width={60}
                  height={60}
                  className="drop-shadow-lg"
                />
              </div>

              {/* Popup Container */}
              <div className="relative bg-white p-8 rounded-lg shadow-xl text-center max-w-md z-10 animate-fadeIn mx-4">

              <h2 className="text-2xl font-bold mb-4">We're here waiting for you to come back 😊</h2>
              <p className="text-gray-600 mb-6">
                Don't say goodbye to us... 
              </p>
              
            </div>
          </div>
        )}

        <div ref={printRef} className="print-container flex flex-col h-[297mm] p-4 print:p-0 relative">
            {/* Original title */}
             <h1 className="text-2xl font-bold text-center mb-4">
            {title}
          </h1>

          {/* Machine Information */}
          <div className="border bg-white rounded-md p-3 mb-3">
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
                        !feederData.machineInfo[field.id] ? "" : ""
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
                        field.id !== "remark" && !feederData.machineInfo[field.id] ? "" : ""
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Feeder Design */}
          <div className="border bg-white rounded-md p-4 flex-grow mb-3 relative">
            <h2 className="text-lg font-medium mb-2">Feeder Info</h2>
            <p className="text-sm italic text-red-500 mb-2">* Set value as 0 if there is no dimension</p>
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

        {/* Error/Success Toast */}
        {showError && (
          <div className={`fixed inset-0 flex items-center justify-center z-[100] pointer-events-none print:hidden`}>
            <div
              className={`${
                errorMessage.includes("successfully")
                  ? "bg-green-100 border-2 border-green-500 text-green-700"
                  : "bg-red-100 border-2 border-red-500 text-red-700"
              } rounded-md shadow-lg p-4 max-w-xs text-center font-medium`}
            >
              {errorMessage}
            </div>
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

        {/* Contact Form - Using vanilla DOM implementation */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center print:hidden">
            <VanillaContactForm
              onClose={() => setShowContactForm(false)}
              onSave={handleSaveAsPDF}
              onSubmit={handleSendEmail}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {/* Paste Data Modal */}
        {showPasteModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center print:hidden">
            <div className="bg-white rounded-lg p-6 shadow-md w-[600px] max-h-[80vh] overflow-auto">
              <h2 className="text-xl font-bold mb-4">Paste Configuration Data</h2>
              <p className="text-sm text-gray-600 mb-4">
                Paste your configuration data below. The system will automatically extract machine information and
                dimensions.
              </p>

              {!showParsePreview ? (
                <>
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
                      className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded flex items-center"
                      onClick={handleAnalyzeData}
                      disabled={!pasteText.trim()}
                    >
                      Analyze Data
                    </button>
                    <button
                      className="bg-black text-white px-4 py-2 rounded flex items-center"
                      onClick={applyParsedData}
                      disabled={!pasteText.trim()}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Import Data
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <h3 className="font-medium text-lg mb-2">Detected Machine Information</h3>
                    <div className="bg-gray-50 p-3 rounded border">
                      {parsedData && Object.keys(parsedData.machineInfo).length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(parsedData.machineInfo).map(([id, value]) => {
                            const field = machineInfoFields.find((f) => f.id === id)
                            return (
                              <div key={id} className="flex justify-between">
                                <span className="font-medium">{field?.label || id}:</span>
                                <span className="text-green-600">{value}</span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No machine information detected</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-medium text-lg mb-2">Detected Dimensions</h3>
                    <div className="bg-gray-50 p-3 rounded border">
                      {parsedData && Object.keys(parsedData.dimensions).length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(parsedData.dimensions).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium">
                                {key} ({dimensionDescriptions[key]}):
                              </span>
                              <span className="text-green-600">{value} mm</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No dimensions detected</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                      onClick={() => {
                        setShowParsePreview(false)
                        setParsedData(null)
                      }}
                    >
                      Back
                    </button>
                    <button
                      className="bg-black text-white px-4 py-2 rounded flex items-center"
                      onClick={applyParsedData}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Apply Data
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
         @keyframes floatAround {
    0% {
      transform: translate(-50%, -50%) rotate(0deg);
      top: 10%;
      left: 10%;
    }
    25% {
      transform: translate(-50%, -50%) rotate(0deg);
      top: 10%;
      left: 80%;
    }
    50% {
      transform: translate(-50%, -50%) rotate(0deg);
      top: 80%;
      left: 80%;
    }
    75% {
      transform: translate(-50%, -50%) rotate(0deg);
      top: 80%;
      left: 20%;
    }
    100% {
      transform: translate(-50%, -50%) rotate(0deg);
      top: 10%;
      left: 10%;
    }
  }

   @keyframes floatAroundReverse {
    0% {
      transform: translate(-50%, -50%) rotate(0deg);
      top: 90%;
      left: 90%;
    }
    25% {
      transform: translate(-50%, -50%) rotate(0deg);
      top: 90%;
      left: 20%;
    }
    50% {
      transform: translate(-50%, -50%) rotate(0deg);
      top: 20%;
      left: 20%;
    }
    75% {
      transform: translate(-50%, -50%) rotate(0deg);
      top: 20%;
      left: 80%;
    }
    100% {
      transform: translate(-50%, -50%) rotate(0deg);
      top: 90%;
      left: 90%;
    }
  }

    .animate-floatAround {
    animation: floatAround 15s infinite linear;
  }

  .animate-floatAroundReverse {
    animation: floatAroundReverse 18s infinite linear;
  }

  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }

      `}</style>
    </>
  )
}
