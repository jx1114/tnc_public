import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { FormProvider } from "@/context/FormContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Feeder Configuration Report",
  description: "Machine part customization application",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FormProvider>{children}</FormProvider>
      </body>
    </html>
  )
}
