// sample page

"use client"

import FeederPage from "@/components/feeder-page"
import MultiPagePrint from "@/components/multi-page-print"

const bowlFeederDimensionDescriptions: Record<string, string> = {
  A: "Bowl Diameter",
  B: "Bowl Height",
  C: "Bowl Depth",
}

const bowlFeederDimensionPositions: Record<string, { x: number; y: number }> = {
  A: { x: 15.7, y: 29.4 },
  B: { x: 19.8, y: 42 },
  C: { x: 19.1, y: 51.4 },
}



// Configuration for both feeder types for printing
const dimensionConfigs = {
  "bowl-feeder": {
    title: "Bowl Feeder Configuration",
    imageSrc: "/bowl.jpeg",
    dimensionDescriptions: bowlFeederDimensionDescriptions,
    dimensionPositions: bowlFeederDimensionPositions,
  },
  "linear-feeder": {
    title: "Linear Feeder Configuration",
    imageSrc: "/linear.jpeg",
    dimensionDescriptions: {
      D: "Track Width",
      E: "Track Length",
      F: "Track Height",
      G: "Vibration Amplitude",
    },
    dimensionPositions: {
      D: { x: 25, y: 30 },
      E: { x: 50, y: 40 },
      F: { x: 75, y: 50 },
      G: { x: 40, y: 60 },
    },
  },
}

export default function SetAPage() {
  return (
    <>
      {/* Screen-only content */}
      <div className="print:hidden">
        <FeederPage
          title="Bowl Feeder Configuration (Set A)"
          feederType="bowl-feeder"
          imageSrc="/bowl.jpeg"
          dimensionDescriptions={bowlFeederDimensionDescriptions}
          dimensionPositions={bowlFeederDimensionPositions}
          
          nextPageRoute="/set/set-a/linear"
          machineInfoFields={[
            { id: "machineNo", label: "Machine No.", type: "text" },
            {
              id: "rotation",
              label: "Rotation",
              type: "select",
              options: ["Clockwise", "Anti-clockwise"],
            },
            { id: "uph", label: "UPH", type: "number" },
          ]}
        />
      </div>

      {/* Print-only content */}
      <MultiPagePrint
        feederTypes={["bowl-feeder", "linear-feeder"]}
        dimensionConfigs={dimensionConfigs}
        printUpToIndex={0} // 0 = only print the first page
      />
    </>
  )
}
