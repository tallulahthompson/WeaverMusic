# Setup Guide

## Quick Start

1. Get HuggingFace token from: https://huggingface.co/settings/tokens
2. Add to GitHub: Settings → Secrets and variables → Actions → New secret
   - Name: `HF_TOKEN`
   - Value: your token
3. Enable GitHub Actions Pages: Settings → Pages → Source: GitHub Actions
4. Push to main branch - it will auto-deploy!

Your token stays secret and is injected during build. ✅
