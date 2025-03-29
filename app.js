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
      // Log the raw URL for debugging
      console.log('Received URL:', url);

      // Add https:// if no protocol is specified
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }

      // Validate the URL
      if (!isValidUrl(url)) {
        throw new Error('Invalid URL format');
      }

      status.textContent = `Processing ${url}...`;

      // Append the URL to archive.is/newest/
      const archiveUrl = `http://archive.is/newest/${encodeURIComponent(url)}`;
      console.log('Constructed archive URL:', archiveUrl);

      // Copy the archive URL to clipboard
      let clipboardSuccess = false;
      try {
        await navigator.clipboard.writeText(archiveUrl);
        console.log('Clipboard write successful');
        clipboardSuccess = true;
      } catch (clipboardErr) {
        console.warn('Clipboard write failed:', clipboardErr);
        // Fallback: Use execCommand for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = archiveUrl;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          console.log('Fallback clipboard write successful');
          clipboardSuccess = true;
        } catch (fallbackErr) {
          console.error('Fallback clipboard write failed:', fallbackErr);
        }
        document.body.removeChild(textarea);
      }

      // Open the archive URL in a new tab
      const newTab = window.open(archiveUrl, '_blank');
      if (!newTab) {
        status.textContent = 'Popup blocked. Click here to open: ';
        const link = document.createElement('a');
        link.href = archiveUrl;
        link.textContent = archiveUrl;
        link.target = '_blank';
        status.appendChild(link);
      } else {
        status.textContent = 'Opening archive.is with your URL...';
      }

      if (clipboardSuccess) {
        showToast();
      } else {
        status.textContent += ' (Failed to copy the link)';
      }
    } catch (err) {
      console.error('Error in handleSharedUrl:', err);
      status.textContent = `Error: ${err.message}. Please try again.`;
    }
  }

  // Check if URL was shared via Web Share Target (works on Android)
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUrl = urlParams.get('url') || urlParams.get('text');
  console.log('URL params:', urlParams.toString());
  console.log('Shared URL:', sharedUrl);

  if (sharedUrl) {
    handleSharedUrl(sharedUrl);
  } else if (isIOS) {
    iosInstructions.classList.remove('hidden');
  } else {
    status.textContent = 'Please share a webpage with Rizive using the share menu.';
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