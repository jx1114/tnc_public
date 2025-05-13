//sample page only, need to change later

"use client"

import FeederPage from "@/components/feeder-page"

const hopperDimensionDescriptions: Record<string, string> = {
  A: "",
  B: "",
  C: "",
  D: "",
  E: "",
  F: "",
}

const hopperDimensionPositions: Record<string, { x: number; y: number }> = {
    A: { x: 67.7, y: 7.5 },
    B: { x: 76, y: 22 },
    C: { x: 26.4, y: 66.5 },
    D: { x: 76, y: 48.2 },
    E: { x: 52, y: 76.2 },
    F: { x: 60, y: 66.5 },
}

export default function hopperPage() {
  return (
    <FeederPage
      title="Hopper Configuration"
      feederType="hopper" //later will change
      imageSrc="/hopper.jpg"
      dimensionDescriptions={hopperDimensionDescriptions}
      dimensionPositions={hopperDimensionPositions}
      machineInfoFields={[
        { id: "partName", label: "Part Name", type: "text" },
        { id: "hopperBinCapacity", label: "Hopper Bin Capacity", type: "number" },
        { id: "remark", label: "Remark", type: "text" },
      ]}
    />
  )
}
