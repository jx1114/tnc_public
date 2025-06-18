"use client"

import { useRouter } from "next/navigation"
import NavigationMenu from "@/components/navigation-menu"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, ArrowRight, Settings, Package, Layers } from "lucide-react"


export default function WelcomePage() {
  const router = useRouter()

  // Slides with durations matching video lengths
  const slides = [
    {
      image: "/home image.png?height=600&width=800",
      title: "Welcome to TNC Feeder Configuration Tool",
      duration: 3000,
    },
    {
      image: "/home image.png?height=600&width=800",
      title: "Ready to know more?",
      duration: 3000,
    },
    {
      image: "/home image.png?height=600&width=800",
      title: "Step 1: Choose single or set",
      video: "step1.mp4",
      duration: 9000,
    },
    {
      image: "/home image.png?height=600&width=800",
      title: "Step 2: Fill in the information",
      video: "step2.mp4",
      duration: 14000,
    },
    {
      image: "/home image.png?height=600&width=800",
      title: "Step 3: Send your configuration",
      video: "step3.mp4",
      duration: 18000,
    },
    {
      image: "/home image.png?height=600&width=800",
      title: "View 3D Dimension",
      video: "3d.mp4",
      duration: 18000,
    },
    {
      image: "/home image.png?height=600&width=800",
      title: "Set value as 0",
      video: "value0.mp4",
      duration: 8000,
    },
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeCard, setActiveCard] = useState<string | null>(null)
  const [hoverFeeder, setHoverFeeder] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Initialize video refs array
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, slides.length)
  }, [slides.length])

  // Carousel auto-rotation
  useEffect(() => {
    setIsLoaded(true)

    const startInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      intervalRef.current = setInterval(() => {
        if (!isTransitioning) {
          handleNextImage()
        }
      }, slides[currentIndex].duration)
    }

    startInterval()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [currentIndex, isTransitioning])

  // Video playback control
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.pause()
        video.currentTime = 0
      }
    })

    const currentVideo = videoRefs.current[currentIndex]
    if (currentVideo && slides[currentIndex].video) {
      const playPromise = currentVideo.play().catch(e => console.log("Video play error:", e))
      
      return () => {
        if (playPromise !== undefined) {
          playPromise.then(() => {
            currentVideo.pause()
          })
        }
      }
    }
  }, [currentIndex])

  useEffect(() => {
  videoRefs.current.forEach((video, idx) => {
    if (video && slides[idx].video) {
      video.load()
    }
  })
}, [isLoaded])

  const handleSlideChange = (newIndex: number) => {
    if (isTransitioning || newIndex === currentIndex) return

    setIsTransitioning(true)
    setCurrentIndex(newIndex)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    intervalRef.current = setInterval(() => {
      if (!isTransitioning) {
        handleNextImage()
      }
    }, slides[newIndex].duration)

    setTimeout(() => {
      setIsTransitioning(false)
    }, 1000)
  }

  const handlePrevImage = () => {
    const newIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1
    handleSlideChange(newIndex)
  }

  const handleNextImage = () => {
    const newIndex = currentIndex === slides.length - 1 ? 0 : currentIndex + 1
    handleSlideChange(newIndex)
  }

  const handleGoToSlide = (index: number) => {
    handleSlideChange(index)
  }


  
  const feederTypes = [
    { name: "Bowl Feeder", path: "/single/bowl", icon: <Package className="w-6 h-6" /> },
    { name: "Linear Feeder", path: "/single/linear", icon: <Package className="w-6 h-6" /> },
    { name: "Hopper", path: "/single/hopper", icon: <Package className="w-6 h-6" /> },
  ]

  const feederSets = [
    { name: "Set A (Bowl + Linear)", path: "/set/set-a", icon: <Layers className="w-6 h-6" /> },
    { name: "Set B (Bowl + Hopper)", path: "/set/set-b", icon: <Layers className="w-6 h-6" /> },
    { name: "Set C (Bowl + Linear + Hopper)", path: "/set/set-c", icon: <Layers className="w-6 h-6" /> },
  ]

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-950 text-white">
      <NavigationMenu />

      <div
        className={`transition-all duration-1000 ease-out transform ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
      >
        {/* Hero Section */}
        <div className="relative h-[60vh] overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-black opacity-30 z-10"></div>
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=100&width=100')] bg-repeat opacity-10 z-0"></div>

          {/* Carousel */}
          <div className="relative h-full w-full">
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  idx === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
                style={{
                  zIndex: idx === currentIndex ? 5 : 0,
                  transitionDelay: idx === currentIndex ? "0ms" : "0ms",
                }}
              >
                <Image
                  src={slide.image || "/placeholder.svg"}
                  alt={`Slide ${idx + 1}`}
                  fill
                  className="object-cover"
                  priority={idx === 0}
                />
              </div>
            ))}

           {/* Navigation buttons */}
           <button
              type="button"
              onClick={handlePrevImage}
              className="absolute top-1/2 left-4 z-30 transform -translate-y-1/2 bg-transparent hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-sm transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute top-1/2 right-4 z-30 transform -translate-y-1/2 bg-transparent hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-sm transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Overlay content */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-center px-4 py-4 backdrop-blur-sm bg-black/30 w-full">
                {slides.map((slide, idx) => (
                  <div
                    key={idx}
                    className={`transition-all duration-1000 ease-in-out ${
                      idx === currentIndex ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 absolute inset-0"
                    }`}
                    style={{
                      transitionDelay: idx === currentIndex ? "200ms" : "0ms",
                      pointerEvents: idx === currentIndex ? "auto" : "none",
                    }}
                  >
                    <h1 className="text-2xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg">{slide.title}</h1>

                    {slide.video && (
                      <div className="flex justify-center">
                        <video
                          ref={(el) => {
                            videoRefs.current[idx] = el
                            return undefined
                          }}
                          src={slide.video}
                          className="w-full max-w-xl rounded-lg shadow-lg"
                          muted
                          playsInline
                          preload="auto"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-3 z-20">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleGoToSlide(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx === currentIndex ? "bg-white scale-125 w-8" : "bg-white/50 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Current slide indicator (for debugging) */}
            <div className="absolute top-2 left-2 z-30 bg-black/50 text-white text-xs px-2 py-1 rounded">
              Slide {currentIndex + 1} of {slides.length}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Choose Your Configuration Path</h2>
            <p className="max-w-2xl mx-auto text-white/80">
              Our intuitive tool helps you configure and document various feeder types for your manufacturing process.
              Select a single feeder or a predefined set to get started.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Single Feeders Card */}
            <div
              className={`bg-gradient-to-br from-black/80 to-black/90 rounded-2xl overflow-hidden transition-all duration-500 transform hover:scale-[1.02] ${activeCard === "single" ? "ring-4 ring-white/30 shadow-xl" : ""}`}
              onMouseEnter={() => setActiveCard("single")}
              onMouseLeave={() => setActiveCard(null)}
            >
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Settings className="mr-3 h-7 w-7" />
                  Single Feeders
                </h3>
                <p className="mb-6 text-white/70">
                  Configure individual feeder types with detailed specifications and dimensions.
                </p>

                <div className="space-y-3">
                  {feederTypes.map((feeder) => (
                    <button
                      key={feeder.name}
                      onClick={() => router.push(feeder.path)}
                      onMouseEnter={() => setHoverFeeder(feeder.name)}
                      onMouseLeave={() => setHoverFeeder(null)}
                      className={`group relative w-full text-left px-5 py-4 bg-gradient-to-r ${
                        hoverFeeder === feeder.name ? "from-red-700 to-red-900" : "from-white/10 to-white/5"
                      } hover:from-red-700 hover:to-red-900 rounded-xl border border-white/10 transition-all duration-300`}
                    >
                      <div className="flex items-center">
                        <div className="mr-3 text-white/80 group-hover:text-white transition-colors">{feeder.icon}</div>
                        <span className="font-medium">{feeder.name}</span>
                        <ArrowRight className="ml-auto h-5 w-5 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feeder Sets Card */}
            <div
              className={`bg-gradient-to-br from-black/80 to-black/90 rounded-2xl overflow-hidden transition-all duration-500 transform hover:scale-[1.02] ${activeCard === "sets" ? "ring-4 ring-white/30 shadow-xl" : ""}`}
              onMouseEnter={() => setActiveCard("sets")}
              onMouseLeave={() => setActiveCard(null)}
            >
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Layers className="mr-3 h-7 w-7" />
                  Feeder Sets
                </h3>
                <p className="mb-6 text-white/70">
                  Configure predefined combinations of feeders for common manufacturing setups.
                </p>

                <div className="space-y-3">
                  {feederSets.map((set) => (
                    <button
                      key={set.name}
                      onClick={() => router.push(set.path)}
                      onMouseEnter={() => setHoverFeeder(set.name)}
                      onMouseLeave={() => setHoverFeeder(null)}
                      className={`group relative w-full text-left px-5 py-4 bg-gradient-to-r ${
                        hoverFeeder === set.name ? "from-red-700 to-red-900" : "from-white/10 to-white/5"
                      } hover:from-red-700 hover:to-red-900 rounded-xl border border-white/10 transition-all duration-300`}
                    >
                      <div className="flex items-center">
                        <div className="mr-3 text-white/80 group-hover:text-white transition-colors">{set.icon}</div>
                        <span className="font-medium">{set.name}</span>
                        <ArrowRight className="ml-auto h-5 w-5 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              {
                title: "Precise Configuration",
                description: "Set exact dimensions and specifications for your feeders with our intuitive interface.",
                icon: <Settings className="h-10 w-10 text-red-300" />,
              },
              {
                title: "3D Visualization",
                description: "View your configured feeders in interactive 3D to verify design before manufacturing.",
                icon: <Package className="h-10 w-10 text-red-300" />,
              },
              {
                title: "Export & Share",
                description: "Generate detailed PDF reports and easily share configurations with your team.",
                icon: <ArrowRight className="h-10 w-10 text-red-300" />,
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className={`bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-white/10 transition-all duration-500 transform hover:scale-105 hover:bg-black/40 ${
                  isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                }`}
                style={{ transitionDelay: `${idx * 200}ms` }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Configure Your Feeders?</h2>
            <p className="mb-8 text-white/80 max-w-2xl mx-auto">
              Start by selecting a feeder type above or explore our documentation to learn more about the configuration
              process.
            </p>
            <button
              onClick={() => router.push("/set/set-c")}
              className="px-8 py-3 bg-red-700 hover:bg-red-600 rounded-full font-medium transition-colors inline-flex items-center"
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-black/50 backdrop-blur-sm py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 text-center text-white/60 text-sm">
            <p>© {new Date().getFullYear()} TNC Feeder Configuration Tool. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Add CSS for smoother animations */}
      <style jsx global>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(1.05);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fadeOutScale {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  )
}
