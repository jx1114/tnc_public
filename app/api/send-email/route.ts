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

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, message, feederType, title, formData } = await req.json()

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Convert the plain text formData to HTML format
    const formDataHtml = formatDataToHtml(formData)

    // Send email with HTML content
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
          <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
          
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
Company Name: ${name}
Email: ${email}
Contact No.: ${phone || "Not provided"}

${message ? `Message:\n${message}\n\n` : ""}

FEEDER CONFIGURATION DETAILS
===========================
${formData}
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
