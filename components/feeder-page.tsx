"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useFormContext } from "@/context/FormContext"
import NavigationMenu from "./navigation-menu"
import ModelViewer from "./model-viewer"
import { Printer, RefreshCw, Send, Check, ExternalLink } from "lucide-react"
import { Howl } from 'howler';
import { motion, AnimatePresence } from 'framer-motion';


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
  const [showBackToMain, setShowBackToMain] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactForm, setContactForm] = useState({ cname: "", name: "", email: "", phone: "", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const [parsedData, setParsedData] = useState<{
    machineInfo: Record<string, string>
    dimensions: Record<string, string>
  } | null>(null)
  const [showParsePreview, setShowParsePreview] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const printRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const [showInactivityPopup, setShowInactivityPopup] = useState(false)
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null)
  const [showSuccessPoster, setShowSuccessPoster] = useState(false);
  const [emptyMachineFields, setEmptyMachineFields] = useState<string[]>([])
  const [showCharacter, setShowCharacter] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const soundRef = useRef<Howl | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Add this effect for audio cleanup
useEffect(() => {
  return () => {
    if (soundRef.current) {
      soundRef.current.unload();
    }
  };
}, []);

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

  // Add this function to play error sounds
const playErrorSound = (message: string) => {
  setShowCharacter(true);
  setIsSpeaking(true);
  setErrorMessage(message); // Set the error message to show in bubble
  
  // Determine which audio file to play based on message
  let audioFile = '/dimension-not-complete.mp3';
  if (message.includes("A")) {
    audioFile = '/sounds/dimensionA.mp3';
  } 
  if (message.includes("B")) {
    audioFile = '/sounds/dimensionB.mp3';
  } 
  if (message.includes("C")) {
    audioFile = '/sounds/dimensionC.mp3';
  } 
  if (message.includes("Dimension D")) {
    audioFile = '/sounds/dimensionD.mp3';
  } 
  if (message.includes("E")) {
    audioFile = '/sounds/dimensionE.mp3';
  } 
  if (message.includes("F")) {
    audioFile = '/sounds/dimensionF.mp3';
  } 
  if (message.includes("G")) {
    audioFile = '/sounds/dimensionG.mp3';
  } 
  if (message.includes("H")) {
    audioFile = '/sounds/dimensionH.mp3';
  } 
  if (message.includes("I")) {
    audioFile = '/sounds/dimensionI.mp3';
  } 
  if (message.includes("J")) {
    audioFile = '/sounds/dimensionJ.mp3';
  } 
  if (message.includes("K")) {
    audioFile = '/sounds/dimensionK.mp3';
  } 
  if (message.includes("L")) {
    audioFile = '/sounds/dimensionL.mp3';
  } 
  if (message.includes("M")) {
    audioFile = '/sounds/dimensionM.mp3';
  } 
  if (message.includes("N")) {
    audioFile = '/sounds/dimensionN.mp3';
  } 
  if (message.includes("O")) {
    audioFile = '/sounds/dimensionO.mp3';
  } 
  if (message.includes("P")) {
    audioFile = '/sounds/dimensionP.mp3';
  } 
  if (message.includes("Part")) {
    audioFile = '/sounds/partName.mp3';
  } 
  if (message.includes("Rotation")) {
    audioFile = '/sounds/rotation.mp3';
  } 
  if (message.includes("UPH")) {
    audioFile = '/sounds/UPH.mp3';
  } 
  if (message.includes("Linear")) {
    audioFile = '/sounds/linear.mp3';
  } 
  if (message.includes("Hopper")) {
    audioFile = '/sounds/hopper.mp3';
  } 
   if (message.includes("cleared")) {
    audioFile = '/sounds/dataCleared.mp3';
  } 



  soundRef.current = new Howl({
    src: [audioFile],
    html5: true,
    onplay: () => {
      if (videoRef.current) {
        videoRef.current.play();
      }
    },
    onend: () => {
      setIsSpeaking(false);
      
    }
  });
  
  soundRef.current.play();
};

  const handleDimensionClick = (dimension: string) => {
    setCurrentDimension(dimension)
    setDimensionValue(feederData.dimensions[dimension] || "")
  }

  const handleSend = () => {
    setShowContactForm(true)
  }

  const handleSaveAsPDF = () => {
    window.print()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles((prev) => [...prev, ...files])
  }

  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    const files = Array.from(event.dataTransfer.files)
    setSelectedFiles((prev) => [...prev, ...files])
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleSendEmail = async () => {
    // Validate form - only name and email are required now
    if (!contactForm.cname) {
      showTempError("Please fill in your company name")
      return
    }
     if (!contactForm.name) {
      showTempError("Please fill in your name")
      return
    }
     if (!contactForm.email) {
      showTempError("Please fill in your email")
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare FormData for file upload
      const formData = new FormData()
      formData.append("cname", contactForm.cname)
      formData.append("name", contactForm.name)
      formData.append("email", contactForm.email)
      formData.append("phone", contactForm.phone || "Not provided")
      formData.append("message", contactForm.message)
      formData.append("feederType", feederType)
      formData.append("title", title)

      // Add the formatted feeder data
      const formattedData = formatDataForEmail(feederData, dimensionDescriptions, machineInfoFields)
      formData.append("formData", formattedData)

      // Add files
      selectedFiles.forEach((file) => {
        formData.append("files", file)
      })

      const response = await fetch("/api/send-email", {
        method: "POST",
        body: formData, // Use FormData instead of JSON
      })

      if (response.ok) {
        // Show success poster
        setShowSuccessPoster(true);

        // Hide after 3 seconds
        setTimeout(() => setShowSuccessPoster(false), 3000);

        // Show success message without closing the form
        showTempError("Email sent successfully!")

        // Close the contact form
        setShowContactForm(false)

        setShowBackToMain(true)
      } else {
        showTempError("Failed to send email")
      }
    } catch (error) {
      showTempError("Error sending email")
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
    result += "---------------------------------------------------------------\n"
    machineInfoFields.forEach((field) => {
      const value = data.machineInfo[field.id] || "Not specified"
      result += `${field.label}: ${value}\n`
    })

    // Dimensions
    result += "\nDIMENSIONS\n"
    result += "---------------------------------------------------------------\n"
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
    playErrorSound("Data cleared successfully!")
  }

  const dimensionErrorMessages: Record<string, string> = {
  A: "Dimension A is missing!",
  B: "Dimension B is missing!",
  C: "Dimension C is missing!",
  D: "Dimension D is missing!",
  E: "Dimension E is missing!",
  F: "Dimension F is missing!",
  G: "Dimension G is missing!",
  H: "Dimension H is missing!",
  I: "Dimension I is missing!",
  J: "Dimension J is missing!",
  K: "Dimension K is missing!",
  L: "Dimension L is missing!",
  M: "Dimension M is missing!",
  N: "Dimension N is missing!",
  O: "Dimension O is missing!",
  P: "Dimension P is missing!",
};

 // Update your handleOkClick function
const handleOkClick = () => {
  // First check dimensions
  if (!allDimensionsFilled()) {
  const firstEmptyDimension = Object.keys(dimensionDescriptions).find(
    key => !feederData.dimensions[key]
  );

  if (firstEmptyDimension) {
    const errorMessage = dimensionErrorMessages[firstEmptyDimension] || "Dimension is not complete!";
    playErrorSound(errorMessage);

    // Simulate click on the dimension button
    const dimensionButton = document.querySelector(
      `button[style*="left: ${dimensionPositions[firstEmptyDimension].x}%"]`
    ) as HTMLElement;
    dimensionButton?.click();
  }

  return;
}

  // Then check machine info
  const emptyFields = machineInfoFields
    .filter(field => field.id !== "remark")
    .filter(field => !feederData.machineInfo[field.id] || feederData.machineInfo[field.id].trim() === "");

  setEmptyMachineFields(emptyFields.map(f => f.id));

  if (emptyFields.length > 0) {
    const firstEmptyField = emptyFields[0];
    playErrorSound(`${firstEmptyField.label} is missing!`);
    
    // Focus on the first empty field
    const inputElement = document.getElementById(firstEmptyField.id);
    if (inputElement) {
      inputElement.focus();
      
      // Scroll to the field if needed
      inputElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
    
    return;
  }

  // If all validations pass
  setShowSuccessModal(true);
};

  const showTempError = (message: string) => {
  setShowCharacter(true);
  setIsSpeaking(true);
  setErrorMessage(message); // Set the error message to show in bubble
  
  let audioFile = '/dimension-not-complete.mp3';
  if (message.includes("sent")) {
    audioFile = '/sounds/emailSent.mp3';
  } 
  if (message.includes("company")) {
    audioFile = '/sounds/companyName.mp3';
  } 
   if (message.includes("your name")) {
    audioFile = '/sounds/name.mp3';
  } 
   if (message.includes("your email")) {
    audioFile = '/sounds/email.mp3';
  } 
  if (message.includes("maximum")) {
    audioFile = '/sounds/maxNumber.mp3';
  } 
  if (message.includes("10MB")) {
    audioFile = '/sounds/10MB.mp3';
  } 
  
  soundRef.current = new Howl({
    src: [audioFile],
    html5: true,
    onplay: () => {
      if (videoRef.current) {
        videoRef.current.play();
      }
    },
    onend: () => {
      setIsSpeaking(false);
    }
  });
  
  soundRef.current.play();

};

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
      showTempError("Data imported successfully!")
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
      showTempError("Data imported successfully!")
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
    {/* Floating Logos */}
    <div className="absolute animate-floatAround">
      <Image src="/tnc-home-logo-nw.png" alt="TNC Logo" width={60} height={60} className="drop-shadow-lg" />
    </div>
    <div className="absolute animate-floatAroundReverse">
      <Image src="/tnc-home-logo-nw.png" alt="TNC Logo" width={60} height={60} className="drop-shadow-lg" />
    </div>

    {/* Popup with Character */}
    <div className="relative z-10 flex items-end mx-4">
      {/* Character Image in Round Container */}
      <div className="mr-4">
         <div className="w-[60px] h-[60px] rounded-full overflow-hidden border border-white shadow-md flex items-center justify-center bg-white">
            <img 
              src="/tnc-home-logo.png" 
              alt="TNC Logo" 
              className="w-full h-full object-cover object-center" 
            />
          </div>
      </div>

      {/* Speech Bubble */}
      <div className="relative bg-white p-4 rounded-2xl shadow-xl text-left max-w-md animate-fadeIn">
        <h2 className="text-base font-semibold mb-1">We're here waiting for you to come back 😊</h2>
        <p className="text-gray-500 text-sm">Don't say goodbye to us...</p>

        {/* Triangle for speech bubble */}
        <div className="absolute left-[-10px] top-6 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-white"></div>
      </div>
    </div>
  </div>
)}

        <div ref={printRef} className="print-container flex flex-col h-[297mm] p-4 print:p-0 relative">
          {/* Original title */}
          <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>

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
                        emptyMachineFields.includes(field.id) ? 'border-red-700 animate-pulse' : ''
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
                        emptyMachineFields.includes(field.id) ? 'border-red-700 animate-pulse' : ''
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
            <div className="bg-white rounded-lg p-6 shadow-md w-[500px] max-h-[90vh] overflow-y-auto relative">
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
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="cname"
                  placeholder="Your company name"
                  className="border w-full p-2 rounded"
                  value={contactForm.cname}
                  onChange={(e) => setContactForm({ ...contactForm, cname: e.target.value })}
                  required
                />
              </div>

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
                  Phone <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="Your phone number"
                  className="border w-full p-2 rounded"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="message" className="block text-sm font-medium mb-1">
                  Message <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  id="message"
                  placeholder="Additional message"
                  rows={3}
                  className="border w-full p-2 rounded"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                />
              </div>

              {/* ATTACHMENT SECTION - Improved file upload UI */}
              <div className="mb-4 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">
                    📎 Attachments <span className="text-gray-500">(optional)</span>
                  </label>
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add File
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      // Check if adding these files would exceed the limit
                      if (selectedFiles.length + files.length > 5) {
                        showTempError("Maximum 5 files allowed")
                        return
                      }

                      // Check file sizes
                      const oversizedFiles = files.filter((file) => file.size > 10 * 1024 * 1024)
                      if (oversizedFiles.length > 0) {
                        showTempError(
                          `Some files exceed the 10MB limit: ${oversizedFiles.map((f) => f.name).join(", ")}`,
                        )
                        return
                      }

                      setSelectedFiles((prev) => [...prev, ...files])
                    }}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov"
                  />
                </div>

                {/* File upload limit indicator */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{selectedFiles.length} of 5 files</span>
                    <span>
                      {(selectedFiles.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)).toFixed(2)} MB of 50 MB
                      total
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (selectedFiles.length / 5) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* File Upload Area with previews */}
                <div
                  className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                    isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300"
                  }`}
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {selectedFiles.length === 0 ? (
                    <div className="text-center py-8">
                      <svg
                        className="w-12 h-12 text-gray-400 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="text-sm text-gray-600 font-medium">Drag and drop files here</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOC, TXT, Images, Videos (Max 10MB each)</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative border rounded-md p-2 bg-white">
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                            aria-label="Remove file"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>

                          {/* File preview */}
                          <div className="flex flex-col items-center">
                            {file.type.startsWith("image/") ? (
                              <div className="w-full h-20 relative mb-1">
                                <img
                                  src={URL.createObjectURL(file) || "/placeholder.svg"}
                                  alt={file.name}
                                  className="w-full h-full object-contain"
                                  onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))}
                                />
                              </div>
                            ) : file.type.startsWith("video/") ? (
                              <div className="w-full h-20 relative mb-1 bg-gray-100 flex items-center justify-center">
                                <svg
                                  className="w-10 h-10 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-full h-20 relative mb-1 bg-gray-100 flex items-center justify-center">
                                <svg
                                  className="w-10 h-10 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </div>
                            )}
                            <p className="text-xs text-gray-700 truncate w-full text-center">
                              {file.name.length > 15 ? file.name.substring(0, 12) + "..." : file.name}
                            </p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded flex items-center"
                  onClick={handleSaveAsPDF}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Save as PDF
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

      <motion.div 
  className="fixed bottom-24 sm:bottom-6 right-6 z-50"
  whileHover={{ scale: 1.05 }}
>
  <motion.div
    className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white"
    animate={{ 
      scale: isSpeaking ? 1.15 : 1,
      rotate: isSpeaking ? [0, -5, 5, -5, 0] : 0 
    }}
    transition={{ 
      type: 'spring', 
      stiffness: 500, 
      damping: 20,
      rotate: { duration: 0.5 }
    }}
  >
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    >
      <source src="/bot.webm" type="video/webm" />
    </video>
  </motion.div>

  {/* Speech bubble outside of video container */}
  <AnimatePresence>
    {isSpeaking && (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        className="absolute -top-24 right-1/2 transform translate-x-12 bg-white px-4 py-3 rounded-2xl shadow-lg max-w-xs"
        style={{
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
        }}
      >
        <p className="text-sm font-medium">
          {errorMessage}
        </p>

        {/* Speech bubble tail */}
        <div className="absolute -bottom-2 right-4 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 shadow-md"></div>

        {/* Speaking indicator */}
        <div className="absolute -bottom-6 right-4 transform -translate-x-1/2 flex space-x-1">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                height: [4, 8, 4],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ 
                repeat: Infinity,
                duration: 0.8,
                delay: i * 0.2
              }}
              className="w-1 bg-blue-500 rounded-full"
              style={{ height: 4 }}
            />
          ))}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</motion.div>

 {/* Back to Main */}
        {showBackToMain && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center print:hidden">
            <div className="relative bg-white p-6 rounded-lg w-[500px] shadow-lg text-center">
              
              <h2 className="text-2xl font-bold mb-4">Back to main page or continue with the new configuration?</h2>

              <img
                src="/tick.gif"
                alt="TNC logo" 
                className="mx-auto mb-4 w-70 h-auto"
              />
             
              {/* Buttons: Back to main page or continue */}
              <div className="flex justify-center gap-4 mt-2">
                <button
                  onClick={() => {
                    setShowBackToMain(false)
                    router.push("/")
                  }}
                  className="bg-white text-black border border-black px-6 py-2 rounded-md"
                >
                  Continue
                </button>


                {/* New External Link Button */}
  <a
    href="https://www.tnctech.com.my" 
    target="_blank"
    rel="noopener noreferrer"
    className="bg-black text-white px-6 py-2 rounded-md flex items-center"
  >
    <ExternalLink className="mr-2 h-4 w-4" />
    Back To Main
  </a>


              </div>
            </div>
          </div>
        )}

{showSuccessPoster && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <img src="/thank-you.jpeg" alt="Success" className="h-[90vh] w-auto mx-auto mb-4 shadow-xl" />
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

 @keyframes pulse {
    0%, 100% {
      border-color:rgb(230, 36, 36);
    }
    50% {
      border-color:rgb(252, 252, 252);
    }
  }
  .animate-pulse {
    animation: pulse 1s infinite;
  }
      `}</style>
    </>
  )
}