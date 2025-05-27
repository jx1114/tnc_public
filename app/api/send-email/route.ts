import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Function to get client IP address
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP address
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip") // Cloudflare
  const xClientIP = request.headers.get("x-client-ip")
  const xForwardedFor = request.headers.get("x-forwarded-for")

  // If behind a proxy, x-forwarded-for might contain multiple IPs
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  // Try other headers
  if (realIP) return realIP
  if (cfConnectingIP) return cfConnectingIP
  if (xClientIP) return xClientIP

  // Fallback if no IP headers are found
  return "Unknown"
}

// Function to get additional request information
function getRequestInfo(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "Unknown"
  const referer = request.headers.get("referer") || "Direct"
  const acceptLanguage = request.headers.get("accept-language") || "Unknown"

  return {
    userAgent,
    referer,
    acceptLanguage,
    timestamp: new Date().toISOString(),
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, message, feederType, title, formData } = await req.json()

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Get client IP and additional request information
    const clientIP = getClientIP(req)
    const requestInfo = getRequestInfo(req)

    // Convert the plain text formData to HTML format
    const formDataHtml = formatDataToHtml(formData)

    // Send email with HTML content including IP address
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: process.env.RECIPIENT_EMAIL,
      subject: `Feeder Configuration from ${name} [IP: ${clientIP}]`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #333;">Contact Information</h2>
          <hr style="border: 1px solid #eee; margin-bottom: 15px;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
          
          <h2 style="color: #333; margin-top: 50px;">Request Details</h2>
          <hr style="border: 1px solid #eee; margin-bottom: 15px;">
          <p><strong>IP Address:</strong> <span style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${clientIP}</span></p>
          <p><strong>Timestamp:</strong> ${requestInfo.timestamp}</p>
          <p><strong>User Agent:</strong> ${requestInfo.userAgent}</p>
          <p><strong>Referrer:</strong> ${requestInfo.referer}</p>
          <p><strong>Accept Language:</strong> ${requestInfo.acceptLanguage}</p>
          <p><strong>Feeder Type:</strong> ${feederType}</p>
          
          ${
            message
              ? `<h3 style="color: #555; margin-top: 20px;">Message</h3>
          <p style="background-color: #f9f9f9; padding: 10px; border-left: 3px solid #ddd;">${message}</p>`
              : ""
          }
          
          <h2 style="color: #333; margin-top: 30px;">FEEDER CONFIGURATION DETAILS</h2>
          <hr style="border: 1px solid #eee; margin-bottom: 15px;">
          ${formDataHtml}
          
          <div style="margin-top: 50px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; border-left: 4px solid #007bff;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Security Information</h4>
            <p style="margin: 0; font-size: 12px; color: #666;">
              This request was submitted from IP address <strong>${clientIP}</strong> on ${new Date(requestInfo.timestamp).toLocaleString()}.
              Please verify the legitimacy of this request if it seems suspicious.
            </p>
          </div>
        </div>
      `,
      // Include a plain text version for email clients that don't support HTML
      text: `
Contact Information:
-------------------
Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}

Request Details:
---------------
IP Address: ${clientIP}
Timestamp: ${requestInfo.timestamp}
User Agent: ${requestInfo.userAgent}
Referrer: ${requestInfo.referer}
Accept Language: ${requestInfo.acceptLanguage}
Feeder Type: ${feederType}

${message ? `Message:\n${message}\n\n` : ""}

FEEDER CONFIGURATION DETAILS
===========================
${formData}

Security Information:
This request was submitted from IP address ${clientIP} on ${new Date(requestInfo.timestamp).toLocaleString()}.
      `,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
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
