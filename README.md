# WeaverMusic

A musical word ladder generator with sentiment-based synthesis.

## Running Locally

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set your HuggingFace token:
```bash
export HF_TOKEN="your_token_here"
```

3. Run the Flask app:
```bash
python app.py
```

4. Open http://localhost:5001 in your browser

## Deploying to Render

### Option 1: Using render.yaml (Recommended)

1. Push your code to GitHub
2. Go to https://render.com and sign in
3. Click "New +" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect `render.yaml`
6. Add your `HF_TOKEN` environment variable in the Render dashboard
7. Click "Apply" to deploy

### Option 2: Manual Setup

1. Go to https://render.com and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: weaver-music (or whatever you want)
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. Add Environment Variable:
   - **Key**: `HF_TOKEN`
   - **Value**: Your HuggingFace token from https://huggingface.co/settings/tokens
6. Click "Create Web Service"

Your app will be live at: `https://weaver-music.onrender.com` (or your chosen name)

## Project Structure

```
WeaverMusic/
├── app.py                    # Flask backend
├── requirements.txt          # Python dependencies
├── runtime.txt              # Python version for Render
├── render.yaml              # Render deployment config
├── templates/
│   └── index.html           # HTML template
└── static/
    ├── weaver.js            # Frontend JavaScript
    └── 4-letter-words.txt   # Word list
```

## How It Works

1. User enters two 4-letter words
2. BFS algorithm finds the shortest word ladder path
3. Each word in the path is analysed for sentiment using HuggingFace API
4. Sentiment determines:
   - **Synth type**: Marimba (negative), Harmonics (neutral), Electric Cello (positive)
   - **Background colour**: Blue (negative), Purple (neutral), Pink (positive)
5. Words are played as chords using Tone.js
