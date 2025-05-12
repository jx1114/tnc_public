"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, useGLTF, PerspectiveCamera } from "@react-three/drei"
import { X } from "lucide-react"
import * as THREE from "three"

function useIsPortraitMobile() {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false)

  const checkOrientation = () => {
    const isMobile = window.innerWidth < 768
    const isPortrait = window.innerHeight > window.innerWidth
    setIsPortraitMobile(isMobile && isPortrait)
  }

  useEffect(() => {
    checkOrientation()
    window.addEventListener("resize", checkOrientation)
    window.addEventListener("orientationchange", checkOrientation)
    return () => {
      window.removeEventListener("resize", checkOrientation)
      window.removeEventListener("orientationchange", checkOrientation)
    }
  }, [])

  return isPortraitMobile
}

type ModelViewerProps = {
  modelPath: string
  isOpen: boolean
  onClose: () => void
  onLoad?: () => void
  dimensions: Record<string, string>
}

const imageMap: Record<string, string> = {
  bowl: "/bowl-view.png",
  linear: "/linear-view.png",
  hopper: "/hopper-view.png",
  "set-a": "/set-a-view.png",
  "set-b": "/set-b-view.png",
  "set-c": "/set-c-view.png",
}

const dimensionPosition2D: Record<string, Record<string, { top: string; left: string }>> = {
  bowl: {
    A: { top: "38%", left: "19%" },
    B: { top: "38%", left: "50%" },
    C: { top: "66%", left: "59.5%" },
    E: { top: "57%", left: "77.5%" },
    F: { top: "75%", left: "70.5%" },
  },
  linear: {
    A: { top: "74%", left: "53.5%" },
    B: { top: "74%", left: "42.5%" },
    C: { top: "57%", left: "70.4%" },
    D: { top: "22.5%", left: "52%" },
    E: { top: "60%", left: "36%" },
    F: { top: "71%", left: "60%" },
  },
  hopper: {
    A: { top: "16%", left: "40.5%" },
    B: { top: "15.5%", left: "53%" },
    C: { top: "46.5%", left: "31.5%" },
    D: { top: "28.5%", left: "44.6%" },
    E: { top: "55%", left: "65%" },
    F: { top: "39%", left: "53%" },
  },
  "set-a": {
    A: { top: "61%", left: "66%" },
    
    C: { top: "39.5%", left: "54.5%" },
    D: { top: "44.5%", left: "65%" },
    E: { top: "72%", left: "40%" },
    F: { top: "41%", left: "77%" },
    G: { top: "57%", left: "57.3%" },
    H: { top: "44%", left: "28.8%" },
    I: { top: "62.8%", left: "21%" },
  },
  "set-b": {
    A: { top: "69.5%", left: "40%" },
    B: { top: "57%", left: "72.5%" },
    C: { top: "44%", left: "66.5%" },
    D: { top: "75.5%", left: "63%" },
    E: { top: "41%", left: "32.5%" },
    F: { top: "62%", left: "47.7%" },
    
  },
  "set-c": {
    A: { top: "37.5%", left: "59%" },
    B: { top: "39.5%", left: "67%" },
    C: { top: "55.5%", left: "74.15%" },
    
    E: { top: "40.8%", left: "52%" },
    F: { top: "51%", left: "69.3%" },
    G: { top: "51%", left: "47.9%" },
    H: { top: "62%", left: "20.5%"},
    I: { top: "62%", left: "29.2%" },
    J: { top: "38%", left: "30.5%" },
    K: { top: "16.5%", left: "28%" },
    L: { top: "17.5%", left: "53%" },
    M: { top: "70%", left: "72.5%" },
    N: { top: "69%", left: "68%" },
    O: { top: "71%", left: "47.9%" },
    P: { top: "75.5%", left: "40%" },
  },
}

const focusMap: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
  bowl: { position: [0, 0, 5], target: [0, 0, 0] },
  linear: { position: [5, 0, 5], target: [0, 0, 0] },
  hopper: { position: [-4, 0, 5], target: [0, 0, 0] },
  "set-a": { position: [0, 0, 10], target: [0, 0, 0] },
  "set-b": { position: [-5, 0, 10], target: [0, 0, 0] },
  "set-c": { position: [-5, 0, 14], target: [0, 0, 0] },
}

function CameraController({ modelPath }: { modelPath: string }) {
  const camera = useRef<THREE.PerspectiveCamera | null>(null)
  const { camera: defaultCamera } = useThree()

  useEffect(() => {
    if (camera.current) {
      const focus = Object.entries(focusMap).find(([key]) => modelPath.includes(key))?.[1]
      if (focus) {
        camera.current.position.set(...focus.position)
        camera.current.lookAt(...focus.target)
        defaultCamera.position.copy(camera.current.position)
        defaultCamera.rotation.copy(camera.current.rotation)
      }
    }
  }, [modelPath])

  return <PerspectiveCamera ref={camera} makeDefault fov={50} near={0.1} far={1000} />
}

function Model({ modelPath, onLoaded }: { modelPath: string; onLoaded: () => void }) {
  const { scene } = useGLTF(modelPath, true, undefined, () => onLoaded())
  const modelRef = useRef<THREE.Group>(null)
  const rotationRef = useRef({ currentAngle: 0, shouldRotate: true })

  const getScale = (path: string) => {
    if (path.includes("bowl")) return 0.005
    if (path.includes("linear")) return 0.015
    if (path.includes("hopper")) return 0.004
    return 0.01
  }

  useEffect(() => {
    if (modelRef.current) {
      const box = new THREE.Box3().setFromObject(modelRef.current)
      const center = box.getCenter(new THREE.Vector3())
      modelRef.current.position.sub(center)
    }
    rotationRef.current.currentAngle = 0
    rotationRef.current.shouldRotate = true
  }, [modelPath])

  useFrame((_, delta) => {
    if (!modelRef.current || !rotationRef.current.shouldRotate) return
    const speed = 1 * Math.PI
    const increment = speed * delta
    modelRef.current.rotation.y += increment
    rotationRef.current.currentAngle += increment
    if (rotationRef.current.currentAngle >= 2 * Math.PI) rotationRef.current.shouldRotate = false
  })

  return <group ref={modelRef}><primitive object={scene} scale={getScale(modelPath)} /></group>
}

export default function ModelViewer({ modelPath, isOpen, onClose, dimensions }: ModelViewerProps) {
  const isPortraitMobile = useIsPortraitMobile()
  const [showDimensions, setShowDimensions] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  const modelKey = Object.keys(imageMap).find(k => modelPath.includes(k)) || "bowl"
  const allFilled = Object.keys(dimensionPosition2D[modelKey] || {}).every(k => dimensions[k])

  useEffect(() => {
    if (allFilled) setShowDimensions(true)
  }, [allFilled])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 print:hidden">
      {isPortraitMobile ? (
        <div className="text-white text-lg text-center px-6">
          <p>Please rotate your phone to landscape mode to view the model properly.</p>
        </div>
      ) : (
        <div className="relative w-[640px] h-[480px] bg-white rounded-lg overflow-hidden">
          <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full hover:bg-white" aria-label="Close">
            <X size={24} />
          </button>

          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <button onClick={() => setShowDimensions(true)} className={`px-3 py-1 rounded-lg font-medium ${showDimensions ? "bg-white text-gray-800 border" : "bg-black text-white"}`}>
              With Dimension
            </button>
            <button onClick={() => setShowDimensions(false)} className={`px-3 py-1 rounded-lg font-medium ${!showDimensions ? "bg-white text-gray-800 border" : "bg-black text-white"}`}>
              Without Dimension
            </button>
          </div>

          {showDimensions ? (
            <div className="relative w-full h-full">
              <img src={imageMap[modelKey]} className="w-full h-full object-contain" alt="2D model" />
              {(dimensionPosition2D[modelKey] && Object.entries(dimensionPosition2D[modelKey]).map(([label, pos]) => (
                dimensions[label] && (
                  <div key={label} className="absolute text-xs font-bold text-black bg-white/80 px-1 rounded" style={{ top: pos.top, left: pos.left }}>
                    {dimensions[label]}
                  </div>
                )
              )))}
            </div>
          ) : (
            <Canvas className="w-full h-full">
              <CameraController modelPath={modelPath} />
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 10, 5]} intensity={2} castShadow />
              <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={1.5} castShadow />
              <Suspense fallback={null}>
                <Model modelPath={modelPath} onLoaded={() => setIsLoading(false)} />
              </Suspense>
              <OrbitControls enablePan enableZoom enableRotate />
            </Canvas>
          )}

          <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-600 bg-white/80 py-2">
            {showDimensions
              ? 'Click "Without Dimension" to rotate 3D model'
              : 'Click and drag to rotate • Scroll to zoom • Shift + drag to pan'}
          </div>
        </div>
      )}
    </div>
  )
}
