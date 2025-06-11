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
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip")
  const xClientIP = request.headers.get("x-client-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIP) return realIP
  if (cfConnectingIP) return cfConnectingIP
  if (xClientIP) return xClientIP

  return "Unknown"
}

// Function to get IP geolocation using ipinfo.io only
async function getIPLocation(ip: string): Promise<string> {
  if (ip === "Unknown" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return "Local/Private Network"
  }

  try {
    console.log(`Getting location for IP ${ip} using ipinfo.io`)

    const response = await fetch(`https://ipinfo.io/${ip}/json`, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FeederApp/1.0)",
        Accept: "application/json",
      },
      // Add timeout
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      console.log(`ipinfo.io returned status ${response.status}`)
      return `Location lookup failed (HTTP ${response.status}) for IP ${ip}`
    }

    const data = await response.json()
    console.log("ipinfo.io response:", data)

    // ipinfo.io returns: city, region, country, loc (lat,lng), etc.
    if (data.city && data.region && data.country) {
      return `${data.city}, ${data.region}, ${data.country}`
    } else if (data.country) {
      return data.country
    } else if (data.loc) {
      return `Coordinates: ${data.loc}`
    }

    return `Partial location data for IP ${ip}`
  } catch (error) {
    console.error("Error with ipinfo.io:", error)
    return `Location lookup failed for IP ${ip} - ${error instanceof Error ? error.message : String(error)}`
  }
}

// Function to get request information
function getRequestInfo(request: NextRequest) {
  const acceptLanguage = request.headers.get("accept-language") || "Unknown"

  return {
    acceptLanguage,
    timestamp: new Date().toISOString(),
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if the request contains multipart/form-data (for file uploads)
    const contentType = req.headers.get("content-type") || ""

    let cname: string, name: string, email: string, phone: string, message: string, feederType: string, title: string, formData: string
    const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = []

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData (with potential file uploads)
      const formDataRequest = await req.formData()

      cname = formDataRequest.get("cname") as string
      name = formDataRequest.get("name") as string
      email = formDataRequest.get("email") as string
      phone = (formDataRequest.get("phone") as string) || ""
      message = (formDataRequest.get("message") as string) || ""
      feederType = (formDataRequest.get("feederType") as string) || ""
      title = (formDataRequest.get("title") as string) || ""
      formData = (formDataRequest.get("formData") as string) || ""

      // Process file uploads
      const files = formDataRequest.getAll("files") as File[]

      for (const file of files) {
        if (file && file.size > 0) {
          const buffer = Buffer.from(await file.arrayBuffer())
          attachments.push({
            filename: file.name,
            content: buffer,
            contentType: file.type || "application/octet-stream",
          })
        }
      }
    } else {
      // Handle JSON data (backward compatibility)
      const jsonData = await req.json()
      cname = jsonData.cname
      name = jsonData.name
      email = jsonData.email
      phone = jsonData.phone || ""
      message = jsonData.message || ""
      feederType = jsonData.feederType || ""
      title = jsonData.title || ""
      formData = jsonData.formData || ""
    }

    if (!cname || !email) {
      return NextResponse.json({ error: "Company name and email are required" }, { status: 400 })
    }

    // Get client IP and additional request information
    const clientIP = getClientIP(req)
    const requestInfo = getRequestInfo(req)

    console.log(`Processing request from IP: ${clientIP}`)

    // Get IP location
    const ipLocation = await getIPLocation(clientIP)
    console.log(`Final location result: ${ipLocation}`)

    // Convert the plain text formData to HTML format
    const formDataHtml = formatDataToHtml(formData)

    // Prepare attachment info for email content
    const attachmentInfo =
      attachments.length > 0
        ? `<p><strong>Attachments:</strong> ${attachments.map((att) => att.filename).join(", ")}</p>`
        : ""

    const attachmentInfoText =
      attachments.length > 0 ? `Attachments: ${attachments.map((att) => att.filename).join(", ")}\n` : ""

    // Send email with HTML content including IP address and location
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: process.env.RECIPIENT_EMAIL,
      subject: `Feeder Configuration from ${cname}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #333;">Contact Information</h2>
          <hr style="border: 1px solid #eee; margin-bottom: 15px;">
          <p><strong>Company Name:</strong> ${cname}</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
          <p><strong>IP Address:</strong> <span style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${clientIP}</span></p>
          <p><strong>Location:</strong> ${ipLocation}</p>
          ${attachmentInfo}
          
          ${
            message
              ? `<h3 style="color: #555; margin-top: 20px;">Message</h3>
          <p style="background-color: #f9f9f9; padding: 10px; border-left: 3px solid #ddd;">${message}</p>`
              : ""
          }
          
          <h2 style="color: #333; margin-top: 30px;">FEEDER CONFIGURATION DETAILS</h2>
          <hr style="border: 1px solid #eee; margin-bottom: 15px;">
          ${formDataHtml}
          
          <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; border-left: 4px solid #007bff;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Request Information</h4>
            <p style="margin: 0; font-size: 12px; color: #666;">
              This request was submitted from <strong>${ipLocation}</strong> (IP: ${clientIP}) on ${new Date(requestInfo.timestamp).toLocaleString()}.
            </p>
          </div>
        </div>
      `,
      text: `
Contact Information:
-------------------
Company Name: ${cname}
Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}

Request Details:
---------------
IP Address: ${clientIP}
Location: ${ipLocation}
Timestamp: ${requestInfo.timestamp}
Accept Language: ${requestInfo.acceptLanguage}
Feeder Type: ${feederType}
${attachmentInfoText}

${message ? `Message:\n${message}\n\n` : ""}

FEEDER CONFIGURATION DETAILS
===========================
${formData}

Request Information:
This request was submitted from ${ipLocation} (IP: ${clientIP}) on ${new Date(requestInfo.timestamp).toLocaleString()}.
      `,
      attachments: attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      attachmentCount: attachments.length,
      attachmentNames: attachments.map((att) => att.filename),
    })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}

// Function to convert plain text form data to HTML format
function formatDataToHtml(formData: string): string {
  if (!formData) return ""

  const lines = formData.split("\n")
  let html = ""
  let inSection = false

  for (let line of lines) {
    line = line.trim()

    if (!line) {
      html += "<br>"
      continue
    }

    if (line === line.toUpperCase() && !line.includes(":") && line.length > 3) {
      if (inSection) {
        html += "</div>"
      }

      html += `<h3 style="color: #444; margin-top: 20px; margin-bottom: 10px;"><strong>${line}</strong></h3>`
      html += `<div style="margin-left: 15px;">`
      inSection = true
      continue
    }

    if (/^[-=]+$/.test(line)) {
      continue
    }

    if (line.startsWith("Generated on:")) {
      html += `<p style="color: #777; font-style: italic;">${line}</p>`
      continue
    }

    if (lines.indexOf(line) === 0) {
      html += `<h2 style="color: #333; font-weight: bold;">${line}</h2>`
      continue
    }

    if (line.includes(":")) {
      const [key, value] = line.split(":", 2)
      html += `<p><strong>${key.trim()}:</strong> ${value.trim()}</p>`
      continue
    }

    html += `<p>${line}</p>`
  }

  if (inSection) {
    html += "</div>"
  }

  return html
}
