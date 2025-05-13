"use client"

import FeederPage from "@/components/feeder-page"

const setCDimensionDescriptions: Record<string, string> = {
  A: "",
  B: "",
  C: "",
  D: "",
  E: "",
  F: "",
  G: "",
  H: "",
  I: "",
  J: "",
  K: "",
  L: "",
  M: "",
  N: "",
  O: "",
  P: "",
}

const setCDimensionPositions: Record<string, { x: number; y: number }> = {
    A: { x: 15.7, y: 29.4 },
    B: { x: 19.8, y: 42 },
    C: { x: 19.1, y: 51.4 },
    D: { x: 28.6, y: 50.2 },
    E: { x: 33.9, y: 52.5 },
    F: { x: 19.6, y: 85.2 },
    G: { x: 41.5, y: 83.1 },
    H: { x: 18.4, y: 98.7 },
    I: { x: 43.2, y: 98.8 },
    J: { x: 43.5, y: 67.2 },
    K: { x: 31.8, y: 54.8 },
    L: { x: 59.2, y: 51.6 },
    M: { x: 29.8, y: 1.5 },
    N: { x: 31.8, y: 4 },
    O: { x: 42, y: 33.5 },
    P: { x: 45.4, y: 29 },
}

export default function setCPage() {
  return (
    <FeederPage
      title="Set C Configuration"
      feederType="set-c" //later will change
      imageSrc="/set-c.jpeg"
      dimensionDescriptions={setCDimensionDescriptions}
      dimensionPositions={setCDimensionPositions}
      machineInfoFields={[
        { id: "partName", label: "Part Name", type: "text" },
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
