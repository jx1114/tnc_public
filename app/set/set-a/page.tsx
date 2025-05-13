"use client"

import FeederPage from "@/components/feeder-page"

const setADimensionDescriptions: Record<string, string> = {
  A: "",
  B: "",
  C: "",
  D: "",
  E: "",
  F: "",
  G: "",
  H: "",
  I: "",
 
}

const setADimensionPositions: Record<string, { x: number; y: number }> = {
    A: { x: 31.2, y: 8 },
    B: { x: 19.2, y: 20 },
    C: { x: 21.1, y: 39.5 },
    D: { x: 22.9, y: 53.5 },
    E: { x: 45.4, y: 29.5 },
    F: { x: 30.1, y: 52 },
    G: { x: 21, y: 75.1 },
    H: { x: 46, y: 72 },
    I: { x: 22.6, y: 93.5 },
   
}

export default function setAPage() {
  return (
    <FeederPage
      title="Set A Configuration"
      feederType="set-a" //later will change
      imageSrc="/set-a.jpg"
      dimensionDescriptions={setADimensionDescriptions}
      dimensionPositions={setADimensionPositions}
      machineInfoFields={[
        { id: "Part Name", label: "Part Name", type: "text" },
        {
          id: "rotation",
          label: "Rotation",
          type: "select",
          options: ["Clockwise", "Anti-clockwise"],
        },
        { id: "uph", label: "UPH", type: "number" },
        { id: "remark", label: "Remark", type: "text" },
      ]}
    />
  )
}
