import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Create a more resilient email sender that works with browser translations
export async function POST(req: NextRequest) {
  try {
    // Add CORS headers to prevent issues with cross-origin requests
    const headers = new Headers({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    })

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers })
    }

    // Log request for debugging
    console.log("Email API called with method:", req.method)

    // Parse the request body safely
    let data
    try {
      data = await req.json()
    } catch (error) {
      console.error("Failed to parse request body:", error)
      return new NextResponse(JSON.stringify({ error: "Invalid request format" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...headers },
      })
    }

    // Extract required fields with fallbacks
    const name = data?.name || ""
    const email = data?.email || ""
    const phone = data?.phone || "Not provided"
    const message = data?.message || ""
    const feederType = data?.feederType || "unknown"
    const title = data?.title || "Feeder Configuration"
    const formData = data?.formData || ""


    // Validate required fields
    if (!name || !email) {
      return new NextResponse(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...headers },
      })
    }

    // Configure email transporter with explicit error handling
    let transporter
    try {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      })
    } catch (error) {
      console.error("Failed to create email transporter:", error)
      return new NextResponse(JSON.stringify({ error: "Email service configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...headers },
      })
    }

    // Convert the plain text formData to HTML format
    const formDataHtml = formatDataToHtml(formData)

    // Create email options
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: process.env.RECIPIENT_EMAIL,
      subject: `Feeder Configuration from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #333;">Contact Information</h2>
          <hr style="border: 1px solid #eee; margin-bottom: 15px;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          
          ${
            message
              ? `<h3 style="color: #555; margin-top: 20px;">Message</h3>
          <p style="background-color: #f9f9f9; padding: 10px; border-left: 3px solid #ddd;">${message}</p>`
              : ""
          }
          
          <h2 style="color: #333; margin-top: 30px;">FEEDER CONFIGURATION DETAILS</h2>
          <hr style="border: 1px solid #eee; margin-bottom: 15px;">
          ${formDataHtml}
        </div>
      `,
      // Include a plain text version for email clients that don't support HTML
      text: `
Contact Information:
-------------------
Name: ${name}
Email: ${email}
Phone: ${phone}

${message ? `Message:\n${message}\n\n` : ""}

FEEDER CONFIGURATION DETAILS
===========================
${formData}
      `,
    }

    // Send the email with proper error handling
    try {
      await transporter.sendMail(mailOptions)

      return new NextResponse(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...headers },
      })
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error("Unknown error")
      console.error("Unexpected error in email API:", err)
      return new NextResponse(JSON.stringify({ error: "Server error", details: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error")
    console.error("Unexpected error in email API:", err)
    return new NextResponse(JSON.stringify({ error: "Server error", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Function to convert plain text form data to HTML format
function formatDataToHtml(formData: string): string {
  if (!formData) return ""

  // Split the form data into lines
  const lines = formData.split("\n")
  let html = ""
  let inSection = false
  let sectionTitle = ""

  for (let line of lines) {
    line = line.trim()

    // Skip empty lines
    if (!line) {
      html += "<br>"
      continue
    }

    // Check if this is a title line (all uppercase with no colon)
    if (line === line.toUpperCase() && !line.includes(":") && line.length > 3) {
      // This is a section title
      if (inSection) {
        // Close previous section if there was one
        html += "</div>"
      }

      sectionTitle = line
      html += `<h3 style="color: #444; margin-top: 20px; margin-bottom: 10px;"><strong>${sectionTitle}</strong></h3>`
      html += `<div style="margin-left: 15px;">`
      inSection = true
      continue
    }

    // Check if this is a separator line (all dashes or equals)
    if (/^[-=]+$/.test(line)) {
      continue // Skip separator lines
    }

    // Check if this is a "Generated on" line
    if (line.startsWith("Generated on:")) {
      html += `<p style="color: #777; font-style: italic;">${line}</p>`
      continue
    }

    // Check if this is the title line
    if (lines.indexOf(line) === 0) {
      html += `<h2 style="color: #333; font-weight: bold;">${line}</h2>`
      continue
    }

    // Handle key-value pairs (lines with colons)
    if (line.includes(":")) {
      const [key, value] = line.split(":", 2)
      html += `<p><strong>${key.trim()}:</strong> ${value.trim()}</p>`
      continue
    }

    // Default case: just a regular line
    html += `<p>${line}</p>`
  }

  // Close the last section if there was one
  if (inSection) {
    html += "</div>"
  }

  return html
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
