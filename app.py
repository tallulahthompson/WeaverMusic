import os
from flask import Flask, render_template, request, jsonify
from huggingface_hub import InferenceClient

app = Flask(__name__)

HF_TOKEN = os.environ.get("HF_TOKEN")
if not HF_TOKEN:
    print("WARNING: HF_TOKEN not set")

client = InferenceClient(
    provider="auto",
    api_key=HF_TOKEN,
)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/sentiment", methods=["POST"])
def sentiment():
    if not HF_TOKEN:
        return jsonify({"error": "HF_TOKEN not configured"}), 500

    data = request.get_json() or {}
    text = data.get("text", "")

    if not text.strip():
        return jsonify({"error": "Missing text"}), 400

    try:
        result = client.text_classification(
            text,
            model="tabularisai/multilingual-sentiment-analysis",
        )
        
        label = result[0]["label"]
        return jsonify({"label": label}), 200

    except Exception as e:
        print("Error calling Hugging Face:", e)
        return jsonify({"error": "Error calling Hugging Face"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)
