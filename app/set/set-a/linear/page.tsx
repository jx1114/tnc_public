"use client"

import FeederPage from "@/components/feeder-page"
import MultiPagePrint from "@/components/multi-page-print"

const linearFeederDimensionDescriptions: Record<string, string> = {
  D: "Track Width",
  E: "Track Length",
  F: "Track Height",
  G: "Vibration Amplitude",
}

const linearFeederDimensionPositions: Record<string, { x: number; y: number }> = {
  D: { x: 25, y: 30 },
  E: { x: 50, y: 40 },
  F: { x: 75, y: 50 },
  G: { x: 40, y: 60 },
}

// Configuration for both feeder types for printing
const dimensionConfigs = {
  "bowl-feeder": {
    title: "Bowl Feeder Configuration",
    imageSrc: "/bowl.jpeg",
    dimensionDescriptions: {
      A: "Bowl Diameter",
      B: "Bowl Height",
      C: "Bowl Depth",
    },
    dimensionPositions: {
      A: { x: 15.7, y: 29.4 },
      B: { x: 19.8, y: 42 },
      C: { x: 19.1, y: 51.4 },
    },
  },
  "linear-feeder": {
    title: "Linear Feeder Configuration",
    imageSrc: "/linear-feeder.jpeg",
    dimensionDescriptions: linearFeederDimensionDescriptions,
    dimensionPositions: linearFeederDimensionPositions,
  },
}

export default function SetALinearFeederPage() {
  return (
    <>
      {/* Screen-only content */}
      <div className="print:hidden">
        <FeederPage
          title="Linear Feeder Configuration (Set A)"
          feederType="linear-feeder"
          imageSrc="/linear.jpeg"
          dimensionDescriptions={linearFeederDimensionDescriptions}
          dimensionPositions={linearFeederDimensionPositions}
          previousPageRoute="/set/set-a/bowl"
          machineInfoFields={[
            { id: "linearNo", label: "Linear No.", type: "text" },
            {
              id: "trackType",
              label: "Track Type",
              type: "select",
              options: ["Straight", "Curved", "Inclined"],
            },
            { id: "frequency", label: "Frequency (Hz)", type: "number" },
            { id: "amplitude", label: "Amplitude", type: "number" },
          ]}
        />
      </div>

      {/* Print-only content */}
      <MultiPagePrint
        feederTypes={["bowl-feeder", "linear-feeder"]}
        dimensionConfigs={dimensionConfigs}
        printUpToIndex={1} // Only print the first two pages (bowl and linear)
      />
    </>
  )
}
