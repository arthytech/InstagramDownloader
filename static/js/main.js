// static/js/main.js

/**
 * Global Shared Media Deletion Engine
 */
async function deleteMedia(url, username, elementId) {
    if (!url || !elementId) return;
    if (!confirm('Are you sure you want to delete this media file from server?')) return;
    
    try {
        const response = await fetch('/delete-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        });
        const data = await response.json();
        
        if (data.success) {
            console.log("Successfully deleted archive key from database:", data.archive_key);
            
            const targetWrapper = document.getElementById(elementId);
            if (!targetWrapper) return;
            
            const parentGrid = targetWrapper.parentNode;
            targetWrapper.remove();
            
            // Check if there's a gallery counter to update on the current page
            if (parentGrid) {
                const remainingCards = parentGrid.querySelectorAll('.media-card-wrapper').length;
                const countSpan = document.getElementById(`count-${username}`);
                
                if (countSpan) {
                    countSpan.innerText = `${remainingCards} items`;
                }
                
                if (remainingCards === 0) {
                    const userBlock = document.getElementById(`user-block-${username}`);
                    if (userBlock) userBlock.remove();
                    
                    const remainingBlocks = document.querySelectorAll('[id^="user-block-"]').length;
                    if (remainingBlocks === 0) {
                        location.reload();
                    }
                }
            }
        } else {
            alert('Delete failed: ' + data.error);
        }
    } catch (err) {
        alert('Server error during deletion.');
    }
}
