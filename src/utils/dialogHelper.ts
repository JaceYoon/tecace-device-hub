
/**
 * Helper function to add padding between buttons in dialogs
 * This is a workaround since we can't directly modify the DeviceHistoryDialog component
 */
export const initDialogButtonSpacing = () => {
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', () => {
    // Create a mutation observer to watch for dialog elements being added to the DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          // Check for dialogs or modals that might have been added
          document.querySelectorAll('.dialog-header,.fixed [data-radix-popper-content-wrapper]').forEach(dialog => {
            // Find close buttons (X icons) in these dialogs
            const closeButtons = dialog.querySelectorAll('button[aria-label="Close"]');
            closeButtons.forEach(button => {
              // Add our custom class for styling
              if (!button.classList.contains('dialog-header-close-button')) {
                button.classList.add('dialog-header-close-button');
              }
            });
          });
        }
      });
    });

    // Start observing the entire document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
};
