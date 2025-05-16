"use client"

import type React from "react"

import { useState } from "react"
import { Printer } from "lucide-react"

type ContactFormProps = {
  onClose: () => void
  onSave: () => void
  onSubmit: (formData: { name: string; email: string; phone: string; message: string }) => Promise<void>
  isSubmitting: boolean
}

export default function TranslationSafeContactForm({ onClose, onSave, onSubmit, isSubmitting }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })

  // Use data attributes for form fields to make them translation-safe
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.name || !formData.email) {
      alert("Please fill in name and email fields")
      return
    }

    await onSubmit(formData)
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-md w-[500px] relative">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
        aria-label="Close"
        type="button"
        data-testid="close-button"
      >
        &times;
      </button>

      <h2 className="text-xl font-bold mb-4">Send Your Configuration</h2>
      <p className="text-sm text-gray-600 mb-4">
        Please provide your contact information to send the feeder configuration.
      </p>

      <form onSubmit={handleSubmit} data-translation-safe="true">
        <div className="mb-4">
          <label htmlFor="contact-name" className="block text-sm font-medium mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="contact-name"
            data-field="name"
            placeholder="Your name"
            className="border w-full p-2 rounded"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="contact-email" className="block text-sm font-medium mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="contact-email"
            data-field="email"
            placeholder="Your email"
            className="border w-full p-2 rounded"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="contact-phone" className="block text-sm font-medium mb-1">
            Phone <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="tel"
            id="contact-phone"
            data-field="phone"
            placeholder="Your phone number (optional)"
            className="border w-full p-2 rounded"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="contact-message" className="block text-sm font-medium mb-1">
            Message
          </label>
          <textarea
            id="contact-message"
            data-field="message"
            placeholder="Additional message (optional)"
            rows={3}
            className="border w-full p-2 rounded"
            value={formData.message}
            onChange={(e) => handleChange("message", e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded flex items-center"
            onClick={onSave}
            data-action="save"
          >
            <Printer className="mr-2 h-4 w-4" />
            Save PDF
          </button>
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded flex items-center"
            disabled={isSubmitting}
            data-action="submit"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
