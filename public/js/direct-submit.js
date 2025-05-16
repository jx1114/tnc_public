// This script provides a direct form submission method that bypasses React
// It can be used as a fallback when the React form submission fails

function submitFormDirectly(formData) {
    return new Promise((resolve, reject) => {
      // Create a new XMLHttpRequest
      const xhr = new XMLHttpRequest()
  
      // Configure it to make a POST request to our API endpoint
      xhr.open("POST", "/api/direct-email-fallback", true)
  
      // Set up event handlers
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Success
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (e) {
            resolve({ success: true })
          }
        } else {
          // Error
          reject(new Error("Failed to send email: " + xhr.statusText))
        }
      }
  
      xhr.onerror = () => {
        reject(new Error("Network error occurred"))
      }
  
      // Send the request with the form data
      xhr.send(formData)
    })
  }
  
  // Expose the function globally
  window.submitFormDirectly = submitFormDirectly
  
  // Add a fallback form submission handler
  document.addEventListener("DOMContentLoaded", () => {
    // Look for forms with the data-email-form attribute
    const forms = document.querySelectorAll("form[data-email-form]")
  
    forms.forEach((form) => {
      form.addEventListener("submit", (event) => {
        // Only intercept if the form has the fallback attribute
        if (form.getAttribute("data-use-fallback") === "true") {
          event.preventDefault()
  
          // Create a FormData object
          const formData = new FormData(form)
  
          // Add any missing fields from data attributes
          const feederType = form.getAttribute("data-feeder-type")
          const title = form.getAttribute("data-title")
  
          if (feederType && !formData.has("feederType")) {
            formData.append("feederType", feederType)
          }
  
          if (title && !formData.has("title")) {
            formData.append("title", title)
          }
  
          // Show sending status
          const statusContainer = document.getElementById("form-status-container")
          if (statusContainer) {
            statusContainer.className = "mb-4 p-3 rounded bg-blue-100 text-blue-700"
            statusContainer.textContent = "Sending email..."
            statusContainer.classList.remove("hidden")
          }
  
          // Disable submit button
          const submitButton = form.querySelector('button[type="submit"]')
          if (submitButton) {
            submitButton.disabled = true
            submitButton.innerHTML = `
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            `
          }
  
          // Submit the form directly
          submitFormDirectly(formData)
            .then((response) => {
              if (response.success) {
                // Show success message
                if (statusContainer) {
                  statusContainer.className = "mb-4 p-3 rounded bg-green-100 text-green-700"
                  statusContainer.textContent = "Email sent successfully! ✓"
                } else {
                  alert("Email sent successfully!")
                }
  
                // Clear the form
                form.reset()
              } else {
                // Show error message
                if (statusContainer) {
                  statusContainer.className = "mb-4 p-3 rounded bg-red-100 text-red-700"
                  statusContainer.textContent = "Failed to send email: " + (response.error || "Unknown error")
                } else {
                  alert("Failed to send email: " + (response.error || "Unknown error"))
                }
              }
            })
            .catch((error) => {
              // Show error message
              if (statusContainer) {
                statusContainer.className = "mb-4 p-3 rounded bg-red-100 text-red-700"
                statusContainer.textContent = "Error: " + error.message
              } else {
                alert("Error: " + error.message)
              }
            })
            .finally(() => {
              // Re-enable submit button
              if (submitButton) {
                submitButton.disabled = false
                submitButton.innerHTML = "Submit"
              }
            })
        }
      })
    })
  })
  