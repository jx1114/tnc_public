"use client"

import FeederPage from "@/components/feeder-page"

const setBDimensionDescriptions: Record<string, string> = {
  A: "",
  B: "",
  C: "",
  D: "",
  E: "",
  F: "",
  G: "",
  
}

const setBDimensionPositions: Record<string, { x: number; y: number }> = {
    A: { x: 45.2, y: 26.9 },
    B: { x: 31, y: 43.5 },
    C: { x: 20.3, y: 45.4 },
    D: { x: 35, y: 48 },
    E: { x: 80.6, y: 71.7 },
    F: { x: 47.6, y: 81.5 },
    G: { x: 24, y: 86 },
   
}

export default function setBPage() {
  return (
    <FeederPage
      title="Set B Configuration"
      feederType="set-b" //later will change
      imageSrc="/set-b.jpg"
      dimensionDescriptions={setBDimensionDescriptions}
      dimensionPositions={setBDimensionPositions}
      machineInfoFields={[
        { id: "partName", label: "Part Name", type: "text" },
        {
          id: "rotation",
          label: "Rotation",
          type: "select",
          options: ["Clockwise", "Anti-clockwise"],
        },
        { id: "uph", label: "UPH", type: "number" },
       
      ]}
    />
  )
}
