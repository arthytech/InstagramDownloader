### Instagram Media Downloader

A lightweight, self-hosted web utility built with Flask, Python, and gallery-dl to download and manage Instagram posts, reels, and profiles. This application provides a modern, touch-friendly UI that is fully optimized for media previews and instant downloads on mobile web layouts (including iOS Safari). <br/><br/>

![IGDL Home Page](https://imgur.com/aayQmF3.png)


### ⚠️ SECURITY WARNING (READ BEFORE USE)

* **DO NOT EXPOSE THIS APPLICATION TO THE PUBLIC INTERNET.**
* This utility is strictly designed for **local network deployment** and **personal use only**.
* **The Risk:** Since this application utilizes your personal Instagram account cookies to bypass login screens, anyone who accesses your instance can hijack your authenticated state. If exposed, bad actors can exploit your session cookies to run automated spam bots, scrape data, or trigger immediate, permanent account bans from Meta.
* Keep it securely behind a local network router, a private VPN (like Tailscale/WireGuard), or password-protect it via an authentication layer.

### 🐳 Docker Deployment Strategy (Recommended)

### Option A: Spin Up via Docker Compose

Docker Compose automates named volume orchestration for seamless disk persistence. 

1. Download the compose.yml file into your directory.
2. Fire up the application cluster: 

```bash

docker compose up -d

```


### Option B: Spin Up via Raw Docker CLI

If you prefer binding raw directory mappings straight to your host system directories, use the run string below: 

```bash

docker run -d \
  -p 5000:5000 \
  -v ./gallery-dl:/app/gallery-dl \
  -v ./cookies:/app/cookies \
  --name insta-downloader \
  --restart always \
  arthytech/instagram-downloader:latest

```
### Using the app

IGDL supports all types of media from instagram, including posts, reel, stories and profile.

1. Under the post, click on send<br/><br/>
![IG Post](https://imgur.com/20pas8w.png)

2. Click on Copy link<br/><br/>
![DL IG Post](https://imgur.com/JKNBVdt.png)

3. You can append the url at the end of your IGDL's url (a) OR paste the post's url to IGDL's home page (b)
(a)<br/><br/>
![Append URL](https://imgur.com/29jbDob.png)


(b)<br/><br/>
![Paste URL](https://imgur.com/HJQa76L.png)


4. The content will be downloaded and appear under the page<br/><br/>
![DLed Content](https://imgur.com/ufC1AgK.png)



### View downloaded media

To view media stored in IGDL, navigate to gallery page<br/><br/>
![Gallery](https://imgur.com/WU8KDEe.png)


You can download the media again, or remove it from the server

### 🍪 Instagram Cookie Injection

To reliably capture content and bypass Instagram's restrictive login redirects, authentication cookie records are required: 

1. Export your Instagram network context tokens using a browser extension (such as *Get cookies.txt LOCALLY*).

2. Save or rename the text file asset explicitly to instagram-cookies.txt.<br/><br/>
![Ext.](https://imgur.com/AHBAB8X.png)


3. Upload it directly using the frontend web UI panel at /settings, or place it manually in the local workspace directory inside a folder named cookies/.<br/><br/>
![Settings](https://imgur.com/8SX9H6j.png)


### 🚀 Local Installation (Development)

Follow these steps if you want to spin up the Flask development server natively on your machine without Docker. 

### Prerequisites

Before setup, make sure you have the following installed: 

* **Python 3.12+** (Recommended: Python 3.12 or 3.13)
* **FFmpeg**: Mandatory for merging video container files and audio tracks. Ensure ffmpeg is globally configured in your system's PATH.

### Installation Steps

1. **Clone** this repository to a local directory, then open your terminal inside the project root folder.
2. **Initialize a virtual environment:** 

bash

python -m venv venv

3. **Activate the environment:** 

  * **Windows (Command Prompt):** 

```cmd

venv\Scripts\activate

```


  * **Windows (PowerShell):** 

```powershell

.\venv\Scripts\activate

```


  * **macOS / Linux:** 

```bash

source venv/bin/activate

```


4. **Install backend dependencies:** 

```bash

pip install -r requirements.txt

```


### 🏃 Running the Server

Start the local Flask app infrastructure by running: 

```bash

python app.py

```

Once initialized, navigate to the local portal inside your web browser: http://127.0.0.1:5000 

