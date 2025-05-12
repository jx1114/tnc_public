"use client"
import Image from "next/image"
import { useFormContext } from "@/context/FormContext"

type MultiPagePrintProps = {
  feederTypes: string[]
  dimensionConfigs: Record<
    string,
    {
      title: string
      imageSrc: string
      dimensionDescriptions: Record<string, string>
      dimensionPositions: Record<string, { x: number; y: number }>
    }
  >
  printUpToIndex: number // new prop!
}

export default function MultiPagePrint({ feederTypes, dimensionConfigs, printUpToIndex }: MultiPagePrintProps) {
  const { getFeederData } = useFormContext()

  const getCurrentDate = () => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, "0")
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const year = now.getFullYear()
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    return `${day}/${month}/${year} at ${hours}:${minutes}`
  }

  return (
    <div className="hidden print:block">
      {feederTypes.slice(0, printUpToIndex + 1).map((feederType, index) => {
        const feederData = getFeederData(feederType)
        const config = dimensionConfigs[feederType]

        if (!config) return null

        return (
          <div
            key={feederType}
            className={`print-container flex flex-col h-[297mm] p-4 print:p-0 relative ${index > 0 ? "print:page-break-before" : ""}`}
          >
            <h1 className="text-2xl font-bold text-center mb-4">{config.title}</h1>

            {/* Machine Info Section */}
            <div className="border rounded-md p-3 mb-3" style={{ flex: "1" }}>
              <h2 className="text-lg font-medium mb-2">Machine Information</h2>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(feederData.machineInfo).map(([key, value]) => (
                  <div key={key}>
                    <label className="block mb-1 font-medium">{key}</label>
                    <div className="w-full border rounded-md px-3 py-2">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feeder Design Section */}
            <div className="border rounded-md p-3 mb-3" style={{ flex: "3" }}>
              <h2 className="text-lg font-medium mb-2">Feeder Design</h2>
              <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                <Image
                  src={config.imageSrc || "/placeholder.svg"}
                  alt="Dimension Drawing"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
                {Object.entries(config.dimensionPositions).map(([dim, { x, y }]) => (
                  <div
                    key={dim}
                    className="absolute text-xs flex items-center justify-center bg-white"
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
                  </div>
                ))}
              </div>
            </div>

            {/* Dimensions Summary */}
            <div className="border rounded-md p-3" style={{ flex: "2" }}>
              <h2 className="text-lg font-medium mb-2">Dimensions Summary</h2>
              <div className="grid grid-cols-4 gap-1">
                {Object.keys(config.dimensionDescriptions).map((dim) => (
                  <div key={dim} className="border rounded-md p-1">
                    <div className="flex items-start">
                      <span className="font-bold text-black mr-1">{dim}</span>
                      <span className="text-right text-xs text-gray-500 ml-auto truncate" style={{ fontSize: "9px" }}>
                        {config.dimensionDescriptions[dim]}
                      </span>
                    </div>
                    <div className="text-black text-xs">
                      {feederData.dimensions[dim] ? `${feederData.dimensions[dim]} mm` : "--------"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-sm text-gray-500 mt-auto">Generated on {getCurrentDate()}</div>
          </div>
        )
      })}
    </div>
  )
}
