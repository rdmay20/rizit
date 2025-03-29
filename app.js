document.addEventListener('DOMContentLoaded', () => {
    const status = document.getElementById('status');
    const toast = document.getElementById('toast');
  
    // Show toast notification
    function showToast() {
      toast.classList.remove('hidden');
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 500);
      }, 2000);
    }
  
    // Handle shared URL
    async function handleSharedUrl(url) {
      try {
        status.textContent = `Checking archive for ${url}...`;
  
        // Check Memento API
        const response = await fetch(`http://timetravel.mementoweb.org/api/json/${encodeURIComponent(url)}`);
        const data = await response.json();
  
        // Look for archive.is entry
        let archiveUrl = null;
        if (data.mementos && data.mementos.list) {
          const archiveIsEntry = data.mementos.list.find(m => m.uri.includes('archive.is'));
          archiveUrl = archiveIsEntry ? archiveIsEntry.uri : null;
        }
  
        if (archiveUrl) {
          // Archive exists
          await navigator.clipboard.writeText(archiveUrl);
          window.open(archiveUrl, '_blank');
          status.textContent = 'Found an archived version!';
        } else {
          // No archive, open archive.is
          const archiveIsUrl = 'https://archive.is';
          await navigator.clipboard.writeText(url);
          window.open(archiveIsUrl, '_blank');
          status.textContent = 'No archive found. Opening archive.is...';
        }
  
        showToast();
      } catch (err) {
        console.error('Error:', err);
        status.textContent = 'Something went wrong. Please try again.';
      }
    }
  
    // Check if URL was shared via Web Share Target
    const urlParams = new URLSearchParams(window.location.search);
    const sharedUrl = urlParams.get('url') || urlParams.get('text'); // Handle different share data
  
    if (sharedUrl) {
      handleSharedUrl(sharedUrl);
    } else {
      status.textContent = 'Share a webpage with Rizive to get started!';
    }
  });