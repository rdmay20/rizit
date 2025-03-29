document.addEventListener('DOMContentLoaded', () => {
  const status = document.getElementById('status');
  const errorDiv = document.getElementById('error');
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

  // Show error message
  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }

  // Clear error message
  function clearError() {
    errorDiv.textContent = '';
    errorDiv.classList.add('hidden');
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

  // Check clipboard permission (where supported)
  async function checkClipboardPermission() {
    if ('permissions' in navigator && 'query' in navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'clipboard-write' });
        console.log('Clipboard permission status:', permissionStatus.state);
        return permissionStatus.state === 'granted' || permissionStatus.state === 'prompt';
      } catch (err) {
        console.warn('Clipboard permission check failed:', err);
        return true; // Assume permission might be granted (fallback for unsupported browsers)
      }
    }
    return true; // Fallback for browsers that don’t support the Permissions API (e.g., Safari)
  }

  // Handle shared URL
  async function handleSharedUrl(url) {
    try {
      // Clear any previous errors
      clearError();

      console.log('Received URL:', url);

      // Check if the input looks like a URL; if not, treat it as invalid
      if (!url.includes('.')) {
        throw new Error('Input does not appear to be a URL. Please share a valid webpage URL.');
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }

      if (!isValidUrl(url)) {
        throw new Error('Invalid URL format. Please ensure the URL is correct (e.g., https://example.com).');
      }

      status.textContent = `Processing ${url}...`;

      const archiveUrl = `http://archive.is/newest/${encodeURIComponent(url)}`;
      console.log('Constructed archive URL:', archiveUrl);

      // Copy the archive URL to clipboard
      let clipboardSuccess = false;
      const canWriteToClipboard = await checkClipboardPermission();
      if (canWriteToClipboard) {
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
      } else {
        console.warn('Clipboard permission denied');
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
        showError('Failed to copy the link to clipboard. You can manually copy it from the URL above.');
      }
    } catch (err) {
      console.error('Error in handleSharedUrl:', err);
      showError(err.message);
    }
  }

  // Check if URL was shared via Web Share Target (works on Android)
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUrl = urlParams.get('url') || urlParams.get('text');
  console.log('URL params:', urlParams.toString());
  console.log('Shared URL:', sharedUrl);

  if (sharedUrl) {
    const cleanedUrl = sharedUrl.trim();
    if (cleanedUrl) {
      handleSharedUrl(cleanedUrl);
    } else {
      showError('No valid URL shared. Please try sharing a webpage again.');
    }
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
      showError('Please enter a valid URL.');
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
          showError('Share cancelled or failed. Please paste the URL manually.');
        }
      } else {
        showError('Web Share API not supported. Please paste the URL manually.');
      }
    });
  }
});