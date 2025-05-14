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

    // Send email with text data
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: process.env.RECIPIENT_EMAIL,
      subject: `Feeder Configuration from ${name}`,
      text: `
Contact Information:
-------------------
Company Name: ${name}
Email: ${email}
Contact No.: ${phone}

${message ? `Message:\n${message}\n\n` : ""}

          COPY FROM HERE
↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓

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
