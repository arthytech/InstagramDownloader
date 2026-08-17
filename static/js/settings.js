document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('cookiesFile');
    const fileLabelBtn = document.getElementById('fileLabelBtn');
    const statusDiv = document.getElementById('status');

    fileLabelBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
        if (fileInput.files.length === 0) return;
        
        const formData = new FormData();
        formData.append('cookies_file', fileInput.files[0]);
        
        fileLabelBtn.disabled = true;
        statusDiv.className = 'loading';
        statusDiv.innerText = 'Uploading cookies file...';
        
        try {
            const response = await fetch('/upload-cookies', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                statusDiv.className = 'success';
                statusDiv.innerText = 'Cookies uploaded successfully!';
                fileLabelBtn.innerText = 'Replace Cookies File';
            } else {
                statusDiv.className = 'error';
                statusDiv.innerText = 'Upload failed: ' + data.error;
            }
        } catch (err) {
            statusDiv.className = 'error';
            statusDiv.innerText = 'Server error during upload.';
        } finally {
            fileInput.value = '';
            fileLabelBtn.disabled = false;
        }
    });
});
