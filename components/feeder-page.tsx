"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useFormContext } from "@/context/FormContext"
import NavigationMenu from "./navigation-menu"
import ModelViewer from "./model-viewer"
import { RefreshCw } from "lucide-react"

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
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' })

  const printRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const [isAnimating, setIsAnimating] = useState(false)
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null)
  

  // Inactivity detection: 3s idle triggers animation
  useEffect(() => {
    let animationTimeout: NodeJS.Timeout;
    const resetTimer = () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current)
      }
      setIsAnimating(false)
      inactivityTimer.current = setTimeout(() => {
        setIsAnimating(true)

        animationTimeout = setTimeout(() => {
          resetTimer()  // restart listening for inactivity
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

  const handlePrint = () => {
    if (!machineInfoComplete() || !allDimensionsFilled()) return showTempError("Not Complete!")
    setShowError(false)
    setShowContactForm(true)
  }

  const handleSendEmail = async () => {
    try {
      const html = printRef.current?.outerHTML || ""
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          phone: contactForm.phone,
          message: contactForm.message,
          html,
        }),
      })

      if (response.ok) {
        setShowContactForm(false)
        alert("Email sent successfully!")
      } else {
        alert("Failed to send email.")
      }
    } catch (error) {
      alert("Error sending email")
    }
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
                      {(feederData.machineInfo[field.id]?.length || 0)} / 60 chars
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
                      field.id !== "remark" && !feederData.machineInfo[field.id]
                        ? "border-red-500"
                        : ""
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
                    feederData.dimensions[dim] ? "bg-white border-none text-black" : "bg-white border border-transparent text-red-500"
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

            <div className="absolute bottom-6 left-6 flex print:hidden">
              <button
                onClick={handleClearData}
                className="bg-white border border-black text-black px-4 py-2 rounded-md flex items-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear Data
              </button>
            </div>


            <div className="absolute bottom-6 right-6 flex print:hidden">

              <button
                onClick={handleOkClick}
                className="bg-black text-white px-4 py-2 rounded-md"
              >
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
          <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-4 ${
            errorMessage.includes("cleared")
              ? "bg-green-50 border-green-500 text-green-600"
              : "bg-red-50 border-red-500 text-red-600"
          } rounded-md shadow-lg print:hidden max-w-xs`}>
            {errorMessage}
          </div>
        )}

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
          src={`/hopper.mp4`} // or use `/yourVideo.mp4`
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto block"
        />
      </div>

       {/* Buttons: Save and View 3D */}
       <div className="flex justify-center gap-4 mt-2">
        
        <button
          onClick={() => {
            setShowSuccessModal(false)
            setShowModelViewer(true)
          }}
          className= "bg-white text-black border border-black px-6 py-2 rounded-md"          
        >
          View 3D
        </button>

        <button
          onClick={handlePrint}
          className="bg-black text-white px-6 py-2 rounded-md"
        >
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
      </div>

      <style jsx>{`
  .wave {
    display: inline-block;
    animation: fallBounce 2.2s ease-out forwards;
    color:rgb(187, 57, 57);
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


{showContactForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center print:hidden">
          <div className="bg-white rounded-lg p-6 shadow-md w-[400px]">
            <h2 className="text-xl font-bold mb-4">Contact Info</h2>
            <input type="text" placeholder="Name" className="border w-full p-2 mb-2" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
            <input type="email" placeholder="Email" className="border w-full p-2 mb-2" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
            <input type="tel" placeholder="Phone" className="border w-full p-2 mb-2" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
            <textarea placeholder="Message" rows={3} className="border w-full p-2 mb-4" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setShowContactForm(false)}>Cancel</button>
              <button className="bg-black text-white px-4 py-2 rounded" onClick={handleSendEmail}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
