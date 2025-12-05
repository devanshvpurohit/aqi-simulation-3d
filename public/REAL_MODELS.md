# 🧠 Real AI Models for AQI Forecasting

The simulation currently uses a **High-Fidelity Heuristic Model** for immediate browser compatibility. However, for a production-grade system, we recommend using one of the following State-of-the-Art (SOTA) Time Series Foundation Models from Hugging Face.

## 🏆 Recommended Models

### 1. Amazon Chronos (Tiny)
*   **Model ID**: `amazon/chronos-t5-tiny`
*   **Type**: T5-based Time Series Transformer
*   **Why**: Extremely lightweight (8M parameters), fast, and pretrained on massive time-series datasets. Perfect for edge/browser inference.
*   **Link**: [Hugging Face](https://huggingface.co/amazon/chronos-t5-tiny)

### 2. Google TimesFM
*   **Model ID**: `google/timesfm-1.0-200m`
*   **Type**: Transformer-based Foundation Model
*   **Why**: Developed by Google Research, highly accurate for zero-shot forecasting.
*   **Link**: [Hugging Face](https://huggingface.co/google/timesfm-1.0-200m)

### 3. Lag-Llama
*   **Model ID**: `time-series-foundation-models/Lag-Llama`
*   **Type**: Probabilistic Forecasting Model
*   **Why**: Good for uncertainty estimation (confidence intervals).
*   **Link**: [Hugging Face](https://huggingface.co/time-series-foundation-models/Lag-Llama)

---

## ⚙️ How to Deploy (ONNX Conversion)

To use these models in the browser (client-side), you must convert them to **ONNX** format.

### Step 1: Install Tools
```bash
pip install optimum[exporters] onnxruntime
```

### Step 2: Convert Model
Run this command in your terminal to export `amazon/chronos-t5-tiny` to ONNX:

```bash
optimum-cli export onnx --model amazon/chronos-t5-tiny --task seq2seq-lm-with-past onnx_output/
```

### Step 3: Integrate
1.  Copy the `model.onnx` file from `onnx_output/` to the `public/assets/` folder.
2.  Update `scripts/model.js`:
    ```javascript
    this.modelUrl = './assets/model.onnx';
    ```

## 🔬 Current Implementation
The current `model.js` is architected to support this switch seamlessly. It uses `onnxruntime-web` and expects a tensor input. Once you provide the real `.onnx` file, the `heuristicPredict` fallback will automatically be bypassed.
