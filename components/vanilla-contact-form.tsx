"use client"

import { useEffect, useRef, useState } from "react"

type VanillaContactFormProps = {
  onClose: () => void
  onSave: () => void
  onSubmit: (formData: { name: string; email: string; phone: string; message: string }) => Promise<void>
  isSubmitting: boolean
}

export default function VanillaContactForm({ onClose, onSave, onSubmit, isSubmitting }: VanillaContactFormProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Don't store the form element in a ref that we'll assign to later
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(isSubmitting)

  // Update internal state when prop changes
  useEffect(() => {
    setInternalIsSubmitting(isSubmitting)
  }, [isSubmitting])

  // Create the form using vanilla DOM
  useEffect(() => {
    if (!containerRef.current) return

    // Clear any existing content
    containerRef.current.innerHTML = ""

    // Create the form container
    const formContainer = document.createElement("div")
    formContainer.className = "bg-white rounded-lg p-6 shadow-md w-[500px] relative"
    containerRef.current.appendChild(formContainer)

    // Create close button
    const closeButton = document.createElement("button")
    closeButton.className = "absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
    closeButton.setAttribute("aria-label", "Close")
    closeButton.setAttribute("type", "button")
    closeButton.setAttribute("data-testid", "close-button")
    closeButton.textContent = "×"
    closeButton.onclick = () => onClose()
    formContainer.appendChild(closeButton)

    // Create title
    const title = document.createElement("h2")
    title.className = "text-xl font-bold mb-4"
    title.textContent = "Send Your Configuration"
    formContainer.appendChild(title)

    // Create description
    const description = document.createElement("p")
    description.className = "text-sm text-gray-600 mb-4"
    description.textContent = "Please provide your contact information to send the feeder configuration."
    formContainer.appendChild(description)

    // Create status message container (for success/error messages)
    const statusContainer = document.createElement("div")
    statusContainer.id = "form-status-container"
    statusContainer.className = "mb-4 hidden"
    formContainer.appendChild(statusContainer)

    // Create form
    const form = document.createElement("form")
    form.setAttribute("data-translation-safe", "true")
    form.id = "vanilla-contact-form" // Add an ID for easier selection
    formContainer.appendChild(form)

    // Name field
    const nameFieldContainer = document.createElement("div")
    nameFieldContainer.className = "mb-4"
    form.appendChild(nameFieldContainer)

    const nameLabel = document.createElement("label")
    nameLabel.setAttribute("for", "contact-name")
    nameLabel.className = "block text-sm font-medium mb-1"
    nameLabel.innerHTML = "Name <span class='text-red-500'>*</span>"
    nameFieldContainer.appendChild(nameLabel)

    const nameInput = document.createElement("input")
    nameInput.setAttribute("type", "text")
    nameInput.setAttribute("id", "contact-name")
    nameInput.setAttribute("data-field", "name")
    nameInput.setAttribute("placeholder", "Your name")
    nameInput.className = "border w-full p-2 rounded"
    nameInput.required = true
    nameFieldContainer.appendChild(nameInput)

    // Email field
    const emailFieldContainer = document.createElement("div")
    emailFieldContainer.className = "mb-4"
    form.appendChild(emailFieldContainer)

    const emailLabel = document.createElement("label")
    emailLabel.setAttribute("for", "contact-email")
    emailLabel.className = "block text-sm font-medium mb-1"
    emailLabel.innerHTML = "Email <span class='text-red-500'>*</span>"
    emailFieldContainer.appendChild(emailLabel)

    const emailInput = document.createElement("input")
    emailInput.setAttribute("type", "email")
    emailInput.setAttribute("id", "contact-email")
    emailInput.setAttribute("data-field", "email")
    emailInput.setAttribute("placeholder", "Your email")
    emailInput.className = "border w-full p-2 rounded"
    emailInput.required = true
    emailFieldContainer.appendChild(emailInput)

    // Phone field
    const phoneFieldContainer = document.createElement("div")
    phoneFieldContainer.className = "mb-4"
    form.appendChild(phoneFieldContainer)

    const phoneLabel = document.createElement("label")
    phoneLabel.setAttribute("for", "contact-phone")
    phoneLabel.className = "block text-sm font-medium mb-1"
    phoneLabel.innerHTML = "Phone <span class='text-gray-500'>(optional)</span>"
    phoneFieldContainer.appendChild(phoneLabel)

    const phoneInput = document.createElement("input")
    phoneInput.setAttribute("type", "tel")
    phoneInput.setAttribute("id", "contact-phone")
    phoneInput.setAttribute("data-field", "phone")
    phoneInput.setAttribute("placeholder", "Your phone number (optional)")
    phoneInput.className = "border w-full p-2 rounded"
    phoneFieldContainer.appendChild(phoneInput)

    // Message field
    const messageFieldContainer = document.createElement("div")
    messageFieldContainer.className = "mb-6"
    form.appendChild(messageFieldContainer)

    const messageLabel = document.createElement("label")
    messageLabel.setAttribute("for", "contact-message")
    messageLabel.className = "block text-sm font-medium mb-1"
    messageLabel.textContent = "Message"
    messageFieldContainer.appendChild(messageLabel)

    const messageInput = document.createElement("textarea")
    messageInput.setAttribute("id", "contact-message")
    messageInput.setAttribute("data-field", "message")
    messageInput.setAttribute("placeholder", "Additional message (optional)")
    messageInput.setAttribute("rows", "3")
    messageInput.className = "border w-full p-2 rounded"
    messageFieldContainer.appendChild(messageInput)

    // Buttons container
    const buttonsContainer = document.createElement("div")
    buttonsContainer.className = "flex justify-end gap-2"
    form.appendChild(buttonsContainer)

    // Save button
    const saveButton = document.createElement("button")
    saveButton.setAttribute("type", "button")
    saveButton.className = "bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded flex items-center"
    saveButton.setAttribute("data-action", "save")
    saveButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-2 h-4 w-4">
      <rect x="6" y="2" width="12" height="20" rx="2" ry="2"></rect>
      <line x1="12" y1="18" x2="12" y2="22"></line>
      <line x1="9" y1="2" x2="9" y2="6"></line>
      <line x1="15" y1="2" x2="15" y2="6"></line>
    </svg>
    Save PDF
  `
    saveButton.onclick = () => onSave()
    buttonsContainer.appendChild(saveButton)

    // Submit button
    const submitButton = document.createElement("button")
    submitButton.setAttribute("type", "submit")
    submitButton.id = "contact-submit-button"
    submitButton.className = "bg-black text-white px-4 py-2 rounded flex items-center"
    submitButton.setAttribute("data-action", "submit")
    submitButton.innerHTML = "Submit"
    buttonsContainer.appendChild(submitButton)

    // Function to show status message
    const showStatusMessage = (message: string, isSuccess: boolean) => {
      const statusContainer = document.getElementById("form-status-container")
      if (statusContainer) {
        statusContainer.className = `mb-4 p-3 rounded ${isSuccess ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`
        statusContainer.textContent = message
        statusContainer.classList.remove("hidden")

        // Auto-hide after 5 seconds
        setTimeout(() => {
          statusContainer.classList.add("hidden")
        }, 5000)
      }
    }

    // Update submit button state based on isSubmitting
    const updateSubmitButtonState = () => {
      const submitButton = document.getElementById("contact-submit-button") as HTMLButtonElement | null
      if (!submitButton) return

      if (internalIsSubmitting) {
        submitButton.disabled = true
        submitButton.innerHTML = `
    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Sending...
  `
      } else {
        submitButton.disabled = false
        submitButton.innerHTML = "Submit"
      }
    }

    // Initial update
    updateSubmitButtonState()

    // Form submission handler
    form.onsubmit = async (e) => {
      e.preventDefault()

      // Get form data
      const formData = {
        name: (document.getElementById("contact-name") as HTMLInputElement)?.value || "",
        email: (document.getElementById("contact-email") as HTMLInputElement)?.value || "",
        phone: (document.getElementById("contact-phone") as HTMLInputElement)?.value || "",
        message: (document.getElementById("contact-message") as HTMLTextAreaElement)?.value || "",
      }

      // Validate required fields
      if (!formData.name || !formData.email) {
        showStatusMessage("Please fill in name and email fields", false)
        return
      }

      try {
        // Update UI to show submitting state
        setInternalIsSubmitting(true)
        updateSubmitButtonState()

        // Submit the form
        await onSubmit(formData)

        // Show success message
        showStatusMessage("Email sent successfully!", true)

        // Reset form after successful submission
        form.reset()
      } catch (error) {
        console.error("Error submitting form:", error)
        showStatusMessage("Error sending email. Please try again.", false)
      } finally {
        // Reset submitting state
        setInternalIsSubmitting(false)
        updateSubmitButtonState()
      }
    }

    // Clean up function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [onClose, onSave, onSubmit, internalIsSubmitting])

  // Update submit button state when isSubmitting changes
  useEffect(() => {
    // Find the submit button by ID instead of using a ref
    const submitButton = document.getElementById("contact-submit-button") as HTMLButtonElement | null
    if (!submitButton) return

    if (isSubmitting) {
      submitButton.disabled = true
      submitButton.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Sending...
    `
    } else {
      submitButton.disabled = false
      submitButton.innerHTML = "Submit"
    }
  }, [isSubmitting])

  return <div ref={containerRef} />
}
