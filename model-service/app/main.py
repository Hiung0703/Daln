import os
import sys
import json
import time
import base64
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import threading

# Add model path to sys.path
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../model'))
sys.path.insert(0, MODEL_DIR)

app = Flask(__name__)
CORS(app)

# Global model cache
model = None
tokenizer = None
model_lock = threading.Lock()

def load_model_once():
    """Load mô hình 1 lần duy nhất khi service khởi động"""
    global model, tokenizer
    
    if model is not None:
        return model, tokenizer
    
    with model_lock:
        if model is not None:
            return model, tokenizer
        
        print("🔄 Đang load mô hình OCR...")
        start = time.time()
        
        from unsloth import FastVisionModel
        import torch
        
        # Đường dẫn tuyệt đối đến model
        MODEL_PATH = "/home/dunhiung/Desktop/APP/model/kaggle/working/Qwen2-VL-2B"
        
        if not os.path.exists(MODEL_PATH):
            raise RuntimeError(f"Model không tồn tại tại: {MODEL_PATH}")
        
        model, tokenizer = FastVisionModel.from_pretrained(
            model_name=MODEL_PATH,
            max_seq_length=1024,
            device_map="auto",
            dtype=torch.float16,
        )
        
        print(f"✅ Load mô hình xong trong {time.time() - start:.2f}s")
        return model, tokenizer

def process_single_image(image):
    """Xử lý 1 ảnh PIL và trả về kết quả"""
    global model, tokenizer
    
    if model is None:
        load_model_once()
    
    import torch
    from transformers import TextIteratorStreamer
    
    # Chuẩn bị input
    instruction = "You are an OCR expert in bank. Extract the information from this bank cheque."
    messages = [
        {"role": "user", "content": [
            {"type": "image"},
            {"type": "text", "text": instruction}
        ]}
    ]
    
    input_text = tokenizer.apply_chat_template(messages, add_generation_prompt=True)
    inputs = tokenizer(
        image,
        input_text,
        add_special_tokens=False,
        return_tensors="pt",
    ).to("cuda" if torch.cuda.is_available() else "cpu")
    
    # Generate với streamer
    streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, timeout=30.0)
    
    generation_kwargs = {
        **inputs,
        'streamer': streamer,
        'max_new_tokens': 256,
        'use_cache': True,
        'temperature': 1.5,
        'min_p': 0.1
    }
    
    thread = threading.Thread(target=lambda: model.generate(**generation_kwargs))
    thread.start()
    
    # Thu kết quả
    result_text = ""
    for chunk in streamer:
        result_text += chunk
    
    thread.join()
    
    return result_text

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "model_loaded": model is not None})

@app.route('/predict', methods=['POST'])
def predict():
    """
    Main prediction endpoint
    Accepts: multipart/form-data with 'file' field OR JSON with 'image' (base64)
    Returns: JSON với kết quả OCR
    """
    start_time = time.time()
    
    try:
        # Parse input: file upload hoặc base64
        image = None
        filename = "unknown"
        
        if 'file' in request.files:
            # Multipart file upload
            file = request.files['file']
            filename = file.filename
            image = Image.open(file.stream).convert('RGB')
        elif request.is_json and 'image' in request.json:
            # Base64 JSON
            data = request.json
            filename = data.get('filename', 'upload.jpg')
            image_b64 = data['image']
            image_bytes = base64.b64decode(image_b64)
            image = Image.open(BytesIO(image_bytes)).convert('RGB')
        else:
            return jsonify({"error": "No file or image provided"}), 400
        
        # Process image
        print(f"📷 Processing: {filename}")
        result_text = process_single_image(image)
        
        # Parse JSON từ kết quả
        parsed_result = None
        try:
            clean_text = result_text.split('<|im_end|>')[0].strip()
            parsed_result = json.loads(clean_text)
        except Exception as e:
            print(f"⚠️  Warning: Could not parse JSON: {e}")
            parsed_result = None
        
        processing_time = time.time() - start_time
        
        response = {
            "success": True,
            "filename": filename,
            "raw_output": result_text,
            "data": parsed_result,
            "processing_time": round(processing_time, 2)
        }
        
        print(f"✅ Processed in {processing_time:.2f}s")
        return jsonify(response)
        
    except Exception as e:
        import traceback
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e),
            "processing_time": round(time.time() - start_time, 2)
        }), 500

if __name__ == '__main__':
    # Load model khi service khởi động
    print("🚀 Starting OCR Model Service...")
    load_model_once()
    
    port = int(os.environ.get('PORT', 5000))
    print(f"🌐 Service running on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
