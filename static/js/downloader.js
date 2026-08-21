const urlInput = document.getElementById('url');
const form = document.getElementById('dlForm');
const submitBtn = document.getElementById('submitBtn');
const statusDiv = document.getElementById('status');
const resultsGrid = document.getElementById('downloadResultsGrid');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value;
    
    submitBtn.disabled = true;
    resultsGrid.innerHTML = ''; 
    statusDiv.className = 'loading';
    statusDiv.innerText = 'Downloading content...';
    
    try {
        const response = await fetch('/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        });
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const rawText = await response.text();
            throw new Error(`Status: ${response.status}. Raw response: ${rawText.substring(0, 200)}`);
        }

        const data = await response.json();
        
        if (data.success) {
            statusDiv.className = 'success';
            statusDiv.innerText = 'Download complete!';
            
            if (data.files && data.files.length > 0) {
                data.files.forEach((file, index) => {
                    const fileUrl = file.url;
                    const isVideo = fileUrl.toLowerCase().endsWith('.mp4');
                    const uniqueCardId = `dl-card-${index}-${Date.now()}`;

                    const cardWrapperString = `
                        <div id="${uniqueCardId}" class="media-card-wrapper">
                            <div class="media-card">
                                <a href="${fileUrl}" target="_blank" class="media-link">
                                    ${isVideo ? `
                                        <video 
                                            src="${fileUrl}" 
                                            class="media-element lazy-media video-fallback-thumb" 
                                            preload="none" 
                                            playsinline 
                                            muted 
                                            autoplay>
                                        </video>
                                        <div class="video-icon-overlay" style="display: flex;">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4v16l15-8z"/></svg>
                                        </div>
                                    ` : `
                                        <img src="${fileUrl}" class="media-element lazy-media">
                                    `}
                                </a>
                            </div>
                            <div class="media-action-row">
                                <a href="${fileUrl}?download=1" class="action-btn download-btn" title="Download File">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                </a>
                                <button type="button" class="action-btn delete-btn" onclick="deleteMedia('${fileUrl}', 'instadownload', '${uniqueCardId}')" title="Delete Media">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>`;

                    resultsGrid.insertAdjacentHTML('beforeend', cardWrapperString);
                });
            }
            
            urlInput.value = '';
            
            if (window.location.pathname !== '/') {
                window.history.replaceState({}, document.title, '/');
            }
        } else {
            statusDiv.className = 'error';
            const errorText = data.error || 'Download failed with unknown error.';
            statusDiv.innerHTML = `<div style="font-weight: 700; margin-bottom: 6px;">Download Failed:</div><pre style="margin: 0; white-space: pre-wrap; font-family: monospace; font-size: 12px; text-align: left; background: #FFF5F5; padding: 10px; border-radius: 6px; border: 1px solid #FFCCD0;">${errorText}</pre>`;
        }
    } catch (err) {
        statusDiv.className = 'error';
        statusDiv.innerHTML = `<div style="font-weight: 700; margin-bottom: 6px;">Server Error:</div><pre style="margin: 0; white-space: pre-wrap; font-family: monospace; font-size: 12px; text-align: left; background: #FFF5F5; padding: 10px; border-radius: 6px; border: 1px solid #FFCCD0;">${err.message || err}</pre>`;
    } finally {
        submitBtn.disabled = false;
    }
});

window.addEventListener('DOMContentLoaded', () => {
    if (urlInput && urlInput.value.trim() !== '') {
        form.dispatchEvent(new Event('submit'));
    }
});
