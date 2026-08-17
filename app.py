import os
import subprocess
import sqlite3
from flask import Flask, request, render_template, jsonify, send_from_directory, Response
import mimetypes

app = Flask(__name__)

DOWNLOAD_DIR = os.path.join('static', 'downloads')
ALLOWED_EXTENSIONS = {'txt'}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/settings')
def settings():
    cookies_exist = os.path.exists(os.path.join('cookies', 'instagram-cookies.txt'))
    return render_template('settings.html', cookies_exist=cookies_exist)

@app.route('/download', methods=['POST'])
def download():
    data = request.get_json()
    target_url = data.get('url')
    
    print("=== DEBUG: Received URL from JavaScript ===")
    print(repr(target_url))
    
    if not target_url:
        return jsonify({"success": False, "error": "No URL provided"}), 400
                
    command = [
        "gallery-dl",
        "--config", "config.json",
        target_url
    ]
    
    cookies_path = os.path.join('cookies', 'instagram-cookies.txt')
    if os.path.exists(cookies_path):
        command.extend(["--cookies", cookies_path])
        
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        
        output_lines = result.stdout.strip().split('\n')
        new_files = []
        is_all_existed = True
        
        for line in output_lines:
            line_str = line.strip()
            if not line_str:
                continue
                
            start_idx = line_str.find('gallery-dl')
            if start_idx == -1:
                continue
                
            clean_path = line_str[start_idx:].replace('\\', '/')
            
            if os.path.exists(clean_path):
                pass
            else:
                is_all_existed = False
                
            new_files.append({
                "url": f"/{clean_path}",
                "name": os.path.basename(clean_path)
            })
            
        status_string = "exists" if is_all_existed else "new"
            
        return jsonify({"success": True, "status": status_string, "files": new_files})
        
    except subprocess.CalledProcessError as e:
        error_details = ""
        if e.stderr:
            error_details += e.stderr
        if e.stdout:
            if "[error]" in e.stdout or "[warning]" in e.stdout:
                error_details += "\n" + e.stdout
                
        if not error_details.strip():
            error_details = str(e)
            
        return jsonify({
            "success": False,
            "error": error_details.strip()
        }), 500
    
@app.route('/gallery-dl/<path:filename>')
def serve_gallery_dl(filename):
    base_dir = os.path.join(app.root_path, 'gallery-dl')
    file_path = os.path.join(base_dir, filename)

    if not os.path.exists(file_path) or os.path.isdir(file_path):
        return "File not found", 404

    is_download_request = request.args.get('download') == '1'
    
    if is_download_request:
        return send_from_directory(base_dir, filename, as_attachment=True)

    # 3. Detect file MIME type for normal preview streaming
    mime_type, _ = mimetypes.guess_type(file_path)
    mime_type = mime_type or 'application/octet-stream'

    if not filename.lower().endswith('.mp4'):
        return send_from_directory(base_dir, filename)

    file_size = os.path.getsize(file_path)
    byte_start = 0
    byte_end = file_size - 1
    status_code = 200

    range_header = request.headers.get('Range', None)
    if range_header and range_header.startswith('bytes='):
        try:
            raw_range = range_header.strip().split('=')[1]
            start_str, end_str = raw_range.split('-')
            
            if start_str:
                byte_start = int(start_str)
            if end_str:
                byte_end = int(end_str)
                
            status_code = 206  # Partial Content
        except (ValueError, IndexError):
            pass

    byte_start = max(0, min(byte_start, file_size - 1))
    byte_end = max(byte_start, min(byte_end, file_size - 1))
    content_length = byte_end - byte_start + 1

    # Safe chunk generator to keep server RAM footprint low
    def generate_video_chunks():
        with open(file_path, 'rb') as f:
            f.seek(byte_start)
            chunk_size = 64 * 1024  # 64KB chunks
            bytes_left = content_length
            while bytes_left > 0:
                to_read = min(chunk_size, bytes_left)
                data = f.read(to_read)
                if not data:
                    break
                bytes_left -= len(data)
                yield data

    response = Response(
        generate_video_chunks(),
        status=status_code,
        mimetype=mime_type,
        direct_passthrough=True
    )
    
    response.headers.add('Content-Range', f'bytes {byte_start}-{byte_end}/{file_size}')
    response.headers.add('Accept-Ranges', 'bytes')
    response.headers.add('Content-Length', str(content_length))
    return response

@app.route('/upload-cookies', methods=['POST'])
def upload_cookies():
    if 'cookies_file' not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400
        
    file = request.files['cookies_file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400
        
    if file and file.filename.endswith('.txt'):
        cookies_dir = os.path.join(app.root_path, 'cookies')
        os.makedirs(cookies_dir, exist_ok=True)
        
        file.save(os.path.join(cookies_dir, 'instagram-cookies.txt'))
        return jsonify({"success": True})
        
    return jsonify({"success": False, "error": "Invalid file type. Only .txt allowed."}), 400


@app.route('/gallery')
def gallery():
    users_media = {}
    valid_extensions = ('.jpg', '.jpeg', '.png', '.mp4', '.webp')
    target_path = os.path.join(app.root_path, 'gallery-dl', 'instagram')
    
    if os.path.exists(target_path):
        for username in os.listdir(target_path):
            user_folder = os.path.join(target_path, username)
            if os.path.isdir(user_folder):
                media_files = []
                for root, _, files in os.walk(user_folder):
                    for file in files:
                        if file.lower().endswith(valid_extensions):
                            rel_path = os.path.relpath(os.path.join(root, file), start=os.path.join(app.root_path, 'gallery-dl')).replace(os.sep, '/')
                            media_files.append({
                                'url': f'/gallery-dl/{rel_path}',
                                'is_video': file.lower().endswith('.mp4'),
                                'name': file
                            })
                if media_files:
                    media_files.reverse()
                    users_media[username] = media_files
                    
    return render_template('gallery.html', users_media=users_media)

@app.route('/delete-media', methods=['POST'])
def delete_media():
    data = request.get_json()
    file_url = data.get('url')
    
    if not file_url:
        return jsonify({"success": False, "error": "No file url provided"}), 400
        
    clean_url = file_url.lstrip('/')
    if clean_url.startswith('gallery-dl/'):
        clean_url = clean_url.replace('gallery-dl/', '', 1)
        
    safe_path = os.path.join(app.root_path, 'gallery-dl', clean_url.replace('/', os.sep))
    filename = os.path.basename(safe_path)
    
    try:
        if os.path.exists(safe_path):
            stem_name, _ = os.path.splitext(filename)
            main_id = stem_name.split('_')[0]
            archive_key = f"instagram{main_id}"
            
            archive_db = os.path.join(app.root_path, 'gallery-dl', 'instagram', 'download-archive.sqlite3')
            if os.path.exists(archive_db):
                conn = sqlite3.connect(archive_db)
                cursor = conn.cursor()
                
                # Delete the specific entry using the structural format
                cursor.execute("DELETE FROM archive WHERE entry = ?", (archive_key,))
                
                conn.commit()
                conn.close()
            
            os.remove(safe_path)
                
            return jsonify({
                "success": True, 
                "archive_key": archive_key
            })
        else:
            return jsonify({"success": False, "error": f"File not found at: {safe_path}"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/<path:url_param>')
def catch_all_url(url_param):
    query_string = request.query_string.decode('utf-8')
    full_ig_url = url_param
    if query_string:
        full_ig_url += f"?{query_string}"
    
    if "instagram.com" in full_ig_url:
        return render_template('index.html', auto_url=full_ig_url)
    
    return "Invalid Route", 404

if __name__ == '__main__':
    app.run(debug=True)
