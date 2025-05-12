"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"

type MachineInfo = Record<string, string>
type Dimensions = Record<string, string>

type FeederData = {
  machineInfo: MachineInfo
  dimensions: Dimensions
}

type FormContextType = {
  feederData: Record<string, Record<string, FeederData>>
  currentFeederType: string
  nextFeederType: string
  previousFeederTypes: string[]

  getFeederData: (feederType: string) => FeederData
  updateFeederData: (feederType: string, data: FeederData) => void
  setCurrentFeederType: (feederType: string) => void
  setNextFeederType: (feederType: string) => void
  addPreviousFeederType: (feederType: string) => void
  clearCurrentPageData: () => void
}

const defaultFeederData: FeederData = {
  machineInfo: {},
  dimensions: {},
}

const FormContext = createContext<FormContextType | undefined>(undefined)

export function FormProvider({ children }: { children: ReactNode }) {
  // Initialize with empty data for each feeder type and path
  const [feederData, setFeederData] = useState<Record<string, Record<string, FeederData>>>({
    "bowl-feeder": {
      "/single/bowl": {
        machineInfo: {
          machineNo: "",
          rotation: "",
          uph: "",
        },
        dimensions: {},
      },
      "/set/set-a": {
        machineInfo: {
          machineNo: "",
          rotation: "",
          uph: "",
        },
        dimensions: {},
      },
      "/set/set-b": {
        machineInfo: {
          machineNo: "",
          rotation: "",
          uph: "",
        },
        dimensions: {},
      },
      "/set/set-c": {
        machineInfo: {
          machineNo: "",
          rotation: "",
          uph: "",
        },
        dimensions: {},
      },
    },
    "linear": {
      "/single/linear": {
        machineInfo: {
          machineNo: "",
          linearNo: "",
        },
        dimensions: {},
      },
      
    },
    hopper: {
      "/single/hopper": {
        machineInfo: {
          machineNo: "",
          hopperBinCapacity: "",
        },
        dimensions: {},
      },
      
    },
    
  })

  const [currentFeederType, setCurrentFeederType] = useState("bowl-feeder")
  const [nextFeederType, setNextFeederType] = useState("")
  const [previousFeederTypes, setPreviousFeederTypes] = useState<string[]>([])

  const pathname = usePathname()

  // Get the current page path or parent path for set pages
  const getCurrentPagePath = () => {
    if (pathname.includes("/set/")) {
      // For set pages, use the set path (e.g., /set/set-a)
      return pathname.split("/").slice(0, 3).join("/")
    }
    return pathname
  }

  const getFeederData = (feederType: string): FeederData => {
    const currentPath = getCurrentPagePath()

    // If data exists for this feeder type and path, return it
    if (feederData[feederType] && feederData[feederType][currentPath]) {
      return feederData[feederType][currentPath]
    }

    // Otherwise return default data
    return { ...defaultFeederData }
  }

  const updateFeederData = (feederType: string, data: FeederData) => {
    const currentPath = getCurrentPagePath()

    setFeederData((prev) => {
      // Create nested structure if it doesn't exist
      const feederTypeData = prev[feederType] || {}

      return {
        ...prev,
        [feederType]: {
          ...feederTypeData,
          [currentPath]: data,
        },
      }
    })
  }

  const addPreviousFeederType = (feederType: string) => {
    setPreviousFeederTypes((prev) => [...prev, feederType])
  }

  // Clear data for the current page
  const clearCurrentPageData = () => {
    const currentPath = getCurrentPagePath()
    const feederType = currentFeederType

    if (feederData[feederType] && feederData[feederType][currentPath]) {
      setFeederData((prev) => {
        const updatedFeederTypeData = { ...prev[feederType] }

        // Reset to empty data
        updatedFeederTypeData[currentPath] = {
          machineInfo: {},
          dimensions: {},
        }

        return {
          ...prev,
          [feederType]: updatedFeederTypeData,
        }
      })
    }
  }

  return (
    <FormContext.Provider
      value={{
        feederData,
        currentFeederType,
        nextFeederType,
        previousFeederTypes,
        getFeederData,
        updateFeederData,
        setCurrentFeederType,
        setNextFeederType,
        addPreviousFeederType,
        clearCurrentPageData,
      }}
    >
      {children}
    </FormContext.Provider>
  )
}

export function useFormContext() {
  const context = useContext(FormContext)
  if (context === undefined) {
    throw new Error("useFormContext must be used within a FormProvider")
  }
  return context
}
