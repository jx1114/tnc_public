import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import puppeteer from "puppeteer"

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,         // Your Gmail address
    pass: process.env.EMAIL_PASS,     // App password, not regular password
  },
})

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, message, html } = await req.json()

    if (!name || !email || !phone || !html) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate PDF from submitted HTML
    const pdfBuffer = await generatePDF(html)

    // Prepare and send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL, // Same recipient every time
      subject: `Feeder Configuration - ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone}

        Message:
        ${message || "No message provided"}
      `,
      attachments: [
        {
          filename: "feeder-configuration.pdf",
          content: pdfBuffer,
        },
      ],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}

// Generate PDF from HTML using Puppeteer
async function generatePDF(html: string): Promise<Buffer> {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })

    // Add print styles (optional)
    await page.addStyleTag({
      content: `
        @page {
          size: A4;
          margin: 10mm;
        }
        body {
          font-family: Arial, sans-serif;
        }
      `,
    })

    const pdfUint8Array = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    })

    await browser.close()
    return Buffer.from(pdfUint8Array)
  } catch (error) {
    console.error("PDF generation failed:", error)
    return Buffer.from("PDF generation failed.")
  }
}
