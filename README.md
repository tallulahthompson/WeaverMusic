# WeaverMusic
https://tallulahthompson.github.io/WeaverMusic/

A musical word ladder generator that creates unique soundscapes based on word transformations and sentiment analysis.

## Setup Instructions

To enable sentiment-based background colors and synth selection, you need to add a HuggingFace API token as a GitHub Secret:

1. **Get a HuggingFace Token:**
   - Go to https://huggingface.co/settings/tokens
   - Create a free account (no credit card required)
   - Click "New token" → Create a "Read" token
   - Copy the token (starts with `hf_`)

2. **Add the Token to GitHub Secrets:**
   - Go to your repository on GitHub
   - Click `Settings` → `Secrets and variables` → `Actions`
   - Click `New repository secret`
   - Name: `HF_TOKEN`
   - Value: Paste your HuggingFace token
   - Click `Add secret`

3. **Enable GitHub Pages with Actions:**
   - Go to `Settings` → `Pages`
   - Under "Build and deployment", set Source to `GitHub Actions`

4. **Deploy:**
   - Push any change to the `main` branch
   - The GitHub Action will automatically deploy with your token injected
   - Your token will never appear in the public code!

The app will work without the token, but sentiment colors won't change (all neutral).