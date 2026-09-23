/* ==========================================================================
   Victory School Management System V2 - Form Validation Engine
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initFormValidation();
});

/**
 * Binds intercept hooks to standard application data entry forms
 */
function initFormValidation() {
    const validatedForms = document.querySelectorAll(".needs-validation");

    validatedForms.forEach(form => {
        form.addEventListener("submit", (e) => {
            let formIsValid = true;
            
            // Extract all input nodes bound for evaluation inside current form layout
            const inputsToValidate = form.querySelectorAll("input[required], select[required], textarea[required]");

            inputsToValidate.forEach(input => {
                if (!validateInputField(input)) {
                    formIsValid = false;
                }
            });

            if (!formIsValid) {
                e.preventDefault(); // Stop form submission if validation errors exist
                e.stopPropagation();
                
                // Focus on the first invalid field gracefully
                const firstError = form.querySelector(".has-error .form-input, .has-error .form-select");
                if (firstError) firstError.focus();
            }
        });

        // Add real-time input listeners to clear error states dynamically as the user types
        const interactiveInputs = form.querySelectorAll(".form-input, .form-select, .form-textarea");
        interactiveInputs.forEach(input => {
            input.addEventListener("input", () => {
                if (input.value.trim() !== "") {
                    clearInputError(input);
                }
            });
        });
    });
}

/**
 * Validates individual input components based on type constraints
 */
function validateInputField(input) {
    const value = input.value.trim();
    const groupContainer = input.closest(".form-group");
    
    if (!groupContainer) return true;

    // Check 1: Empty field validation
    if (value === "") {
        applyInputError(input, groupContainer, "This field is required.");
        return false;
    }

    // Check 2: Email string format validation
    if (input.type === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            applyInputError(input, groupContainer, "Please enter a valid email address.");
            return false;
        }
    }

    // Check 3: Phone number pattern validation
    if (input.type === "tel") {
        const phoneRegex = /^\+?[0-9]{7,15}$/;
        if (!phoneRegex.test(value.replace(/[\s-]/g, ""))) {
            applyInputError(input, groupContainer, "Please enter a valid phone number.");
            return false;
        }
    }

    clearInputError(input);
    return true;
}

/**
 * Injects error elements and classes into the form group layout structure
 */
function applyInputError(input, container, customMessage) {
    container.classList.add("has-error");
    
    let errorSpan = container.querySelector(".error-message");
    if (!errorSpan) {
        errorSpan = document.createElement("span");
        errorSpan.className = "error-message";
        container.appendChild(errorSpan);
    }
    errorSpan.textContent = customMessage;
}

/**
 * Pulls down dynamic error blocks and indicators cleanly
 */
function clearInputError(input) {
    const groupContainer = input.closest(".form-group");
    if (groupContainer) {
        groupContainer.classList.remove("has-error");
        const errorSpan = groupContainer.querySelector(".error-message");
        if (errorSpan) errorSpan.remove();
    }
}