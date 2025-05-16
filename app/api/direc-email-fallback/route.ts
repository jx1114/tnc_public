import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: NextRequest) {
  try {
    // Add CORS headers
    const headers = new Headers({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    })

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers })
    }

    // Get form data - try both JSON and FormData
    let name = ""
    let email = ""
    let phone = "Not provided"
    let message = ""
    let feederType = "unknown"
    let title = "Feeder Configuration"
    let configData = ""

    try {
      // First try to parse as JSON
      const jsonData = await req.json()
      name = jsonData.name || ""
      email = jsonData.email || ""
      phone = jsonData.phone || "Not provided"
      message = jsonData.message || ""
      feederType = jsonData.feederType || "unknown"
      title = jsonData.title || "Feeder Configuration"
      configData = jsonData.formData || ""
    } catch (jsonError) {
      try {
        // If JSON parsing fails, try FormData
        const formData = await req.formData()
        name = (formData.get("name") as string) || ""
        email = (formData.get("email") as string) || ""
        phone = (formData.get("phone") as string) || "Not provided"
        message = (formData.get("message") as string) || ""
        feederType = (formData.get("feederType") as string) || "unknown"
        title = (formData.get("title") as string) || "Feeder Configuration"
        configData = (formData.get("configData") as string) || ""
      } catch (formDataError) {
        console.error("Failed to parse request data:", formDataError)
        return new NextResponse(JSON.stringify({ error: "Invalid request format" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...headers },
        })
      }
    }

    // Validate required fields
    if (!name || !email) {
      return new NextResponse(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...headers },
      })
    }

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

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
          <pre style="background-color: #f9f9f9; padding: 15px; border-left: 3px solid #ddd; white-space: pre-wrap;">${configData}</pre>
        </div>
      `,
      text: `
Contact Information:
-------------------
Name: ${name}
Email: ${email}
Phone: ${phone}

${message ? `Message:\n${message}\n\n` : ""}

FEEDER CONFIGURATION DETAILS
===========================
${configData}
      `,
    }

    // Send the email
    await transporter.sendMail(mailOptions)

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...headers },
    })
  } catch (error: unknown) {
    // Properly type the error
    let errorMessage = "Failed to send email"
    if (error instanceof Error) {
      errorMessage = error.message
    }

    console.error("Error sending email:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to send email", details: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
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
