document.addEventListener('DOMContentLoaded', () => {
  const status = document.getElementById('status');
  const toast = document.getElementById('toast');
  const iosInstructions = document.getElementById('ios-instructions');
  const urlInput = document.getElementById('urlInput');
  const submitUrl = document.getElementById('submitUrl');
  const sharePrompt = document.getElementById('sharePrompt');

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Show toast notification
  function showToast() {
    toast.classList.remove('hidden');
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 500);
    }, 2000);
  }

  // Validate URL
  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Handle shared URL
  async function handleSharedUrl(url) {
    try {
      // Validate the URL
      if (!isValidUrl(url)) {
        throw new Error('Invalid URL format');
      }

      status.textContent = `Processing ${url}...`;

      // Append the URL to archive.is/newest/
      const archiveUrl = `http://archive.is/newest/${encodeURIComponent(url)}`;
      console.log('Constructed archive URL:', archiveUrl);

      // Copy the archive URL to clipboard
      try {
        await navigator.clipboard.writeText(archiveUrl);
        console.log('Clipboard write successful');
      } catch (clipboardErr) {
        throw new Error(`Clipboard error: ${clipboardErr.message}`);
      }

      // Open the archive URL in a new tab
      const newTab = window.open(archiveUrl, '_blank');
      if (!newTab) {
        throw new Error('Failed to open new tab. Please allow popups for this site.');
      }

      status.textContent = 'Opening archive.is with your URL...';
      showToast();
    } catch (err) {
      console.error('Error in handleSharedUrl:', err);
      status.textContent = `Error: ${err.message}. Please try again.`;
    }
  }

  // Check if URL was shared via Web Share Target (works on Android)
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUrl = urlParams.get('url') || urlParams.get('text');

  if (sharedUrl) {
    handleSharedUrl(sharedUrl);
  } else if (isIOS) {
    iosInstructions.classList.remove('hidden');
  }

  // Handle manual URL submission
  submitUrl.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url) {
      handleSharedUrl(url);
    } else {
      status.textContent = 'Please enter a valid URL.';
    }
  });

  // Handle share prompt for iOS
  if (sharePrompt) {
    sharePrompt.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          const shareData = await navigator.share({
            title: 'Share a webpage with Rizive',
            text: 'Please share the URL of the webpage you want to archive.'
          });
          const url = shareData.url || shareData.text;
          if (url) {
            handleSharedUrl(url);
          }
        } catch (err) {
          console.error('Share failed:', err);
          status.textContent = 'Share cancelled or failed. Please paste the URL manually.';
        }
      } else {
        status.textContent = 'Web Share API not supported. Please paste the URL manually.';
      }
    });
  }
});