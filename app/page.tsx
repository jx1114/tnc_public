"use client"

import { useRouter } from "next/navigation"
import NavigationMenu from "@/components/navigation-menu"
import Image from "next/image"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function WelcomePage() {
  const router = useRouter()

  const images = [
    "/aluminium-bowl-feeder.jpg",
    "/bowl-feeder.jpg",
    "/rotary-feeder.jpg"
  ]
  const [currentIndex, setCurrentIndex] = useState(0)

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <>
      <NavigationMenu />
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-red-900">
        <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-center mb-6">
              Welcome to TNC Feeder Configuration Tool
            </h1>

            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="flex-1 relative">
                <Image
                  src={images[currentIndex]}
                  alt={`Feeder Image ${currentIndex + 1}`}
                  width={400}
                  height={300}
                  className="rounded-lg object-cover w-full h-auto"
                />
                <button
                  onClick={prevImage}
                  className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-90 text-gray-800 p-2 rounded-full shadow"
                >
                  <ChevronLeft />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-90 text-gray-800 p-2 rounded-full shadow"
                >
                  <ChevronRight />
                </button>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-gray-700 mb-4">
                  This tool helps you configure and document various feeder types for your manufacturing process.
                </p>
                <p className="text-gray-700 mb-4">
                  Use the navigation menu above to select either a single feeder type or a predefined set of feeders.
                </p>
                <p className="text-gray-700 mb-6">
                  Once configured, you can save the specifications as a PDF for documentation and manufacturing.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black rounded-lg p-6">
                <h2 className="text-xl text-white font-semibold mb-2">Single Feeders</h2>
                <p className="text-white mb-4">Configure individual feeder types:</p>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push("/single/bowl")}
                    className="block w-full text-left px-4 py-2 bg-white hover:bg-gray-50 rounded border transition-colors"
                  >
                    Bowl Feeder
                  </button>
                  <button
                    onClick={() => router.push("/single/linear")}
                    className="block w-full text-left px-4 py-2 bg-white hover:bg-gray-50 rounded border transition-colors"
                  >
                    Linear Feeder
                  </button>
                  <button
                    onClick={() => router.push("/single/hopper")}
                    className="block w-full text-left px-4 py-2 bg-white hover:bg-gray-50 rounded border transition-colors"
                  >
                    Hopper
                  </button>
                </div>
              </div>
              <div className="bg-black rounded-lg p-6">
                <h2 className="text-xl text-white font-semibold mb-2">Feeder Sets</h2>
                <p className="text-white mb-4">Configure predefined combinations of feeders:</p>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push("/set/set-a")}
                    className="block w-full text-left px-4 py-2 bg-white hover:bg-gray-50 rounded border transition-colors"
                  >
                    Set A (Bowl + Linear)
                  </button>
                  <button
                    onClick={() => router.push("/set/set-b")}
                    className="block w-full text-left px-4 py-2 bg-white hover:bg-gray-50 rounded border transition-colors"
                  >
                    Set B (Bowl + Hopper)
                  </button>
                  <button
                    onClick={() => router.push("/set/set-c")}
                    className="block w-full text-left px-4 py-2 bg-white hover:bg-gray-50 rounded border transition-colors"
                  >
                    Set C (Bowl + Linear + Hopper)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
