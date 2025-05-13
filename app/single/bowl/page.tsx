//sample page

"use client"

import FeederPage from "@/components/feeder-page"

const bowlFeederDimensionDescriptions: Record<string, string> = {
  A: "",
  B: "",
  C: "",
  D: "",
  E: "",
  F: "",
}

const bowlFeederDimensionPositions: Record<string, { x: number; y: number }> = {
    A: { x: 49.7, y: 5.8 },
    B: { x: 67.5, y: 28 },
    C: { x: 37, y: 40.7 },
    D: { x: 49.5, y: 49.7 },
    E: { x: 33.1, y: 73.5 },
    F: { x: 39.5, y:77}
}


export default function BowlFeederPage() {
  return (
    <FeederPage
      title="Bowl Feeder Configuration"
      feederType="bowl" //later will change
      imageSrc="/bowl.jpeg"
      dimensionDescriptions={bowlFeederDimensionDescriptions}
      dimensionPositions={bowlFeederDimensionPositions}
      
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
