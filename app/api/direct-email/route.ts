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

    // Get form data
    let formData: FormData
    try {
      formData = await req.formData()
    } catch (error) {
      console.error("Failed to parse form data:", error)
      return new NextResponse(JSON.stringify({ error: "Invalid form data" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...headers },
      })
    }

    // Extract fields
    const name = (formData.get("name") as string) || ""
    const email = (formData.get("email") as string) || ""
    const phone = (formData.get("phone") as string) || "Not provided"
    const message = (formData.get("message") as string) || ""
    const feederType = (formData.get("feederType") as string) || "unknown"
    const title = (formData.get("title") as string) || "Feeder Configuration"
    const configData = (formData.get("configData") as string) || ""

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
    const err = error instanceof Error ? error : new Error("Unknown error")
    console.error("Unexpected error in email API:", err)
    return new NextResponse(JSON.stringify({ error: "Server error", details: err.message }), {
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
