const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const router = express.Router();

// keep file in memory and forward to model service
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/scan
// Accepts multipart/form-data (field name by default 'file') OR JSON { image: <base64> }
router.post('/', upload.single(process.env.MODEL_FIELD_NAME || 'file'), async (req, res) => {
  const modelUrl = process.env.MODEL_URL || 'http://localhost:5000/predict';
  const modelPayload = (process.env.MODEL_PAYLOAD || 'multipart').toLowerCase(); // 'multipart' or 'base64'
  const modelAuth = process.env.MODEL_AUTH;

  try {
    // Determine input: either req.file (from multipart) or req.body.image (from JSON)
    const hasFile = !!req.file;
    const hasBase64 = !!(req.body && req.body.image);

    if (!hasFile && !hasBase64) {
      return res.status(400).json({ error: 'No file or image provided' });
    }

    // Build headers to send to model
    const headers = {};
    // Forward client Authorization if present
    if (req.headers && req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }
    // Add server-side model auth if configured
    if (modelAuth) {
      headers.Authorization = modelAuth;
    }

    let resp;

    if (modelPayload === 'base64') {
      // Send JSON with base64 image
      let imageB64;
      let filename = (req.file && req.file.originalname) || (req.body && req.body.filename) || 'upload.jpg';

      if (hasFile) {
        imageB64 = req.file.buffer.toString('base64');
      } else {
        imageB64 = req.body.image; // assume already base64 string
      }

      const payload = { image: imageB64, filename };
      headers['Content-Type'] = 'application/json';

      resp = await axios.post(modelUrl, payload, {
        headers,
        timeout: 2 * 60 * 1000,
      });

    } else {
      // Default: send multipart/form-data to model
      const form = new FormData();

      if (hasFile) {
        form.append(process.env.MODEL_FIELD_NAME || 'file', req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
          knownLength: req.file.size,
        });
      } else {
        // If client sent base64 JSON but model expects multipart, convert
        const b64 = req.body.image;
        const buffer = Buffer.from(b64, 'base64');
        form.append(process.env.MODEL_FIELD_NAME || 'file', buffer, {
          filename: (req.body && req.body.filename) || 'upload.jpg',
          contentType: 'application/octet-stream',
          knownLength: buffer.length,
        });
      }

      // forward other body fields if any
      if (req.body) {
        Object.keys(req.body).forEach((k) => {
          // skip image field when converting
          if (k === 'image') return;
          form.append(k, req.body[k]);
        });
      }

      // merge form headers
      const formHeaders = form.getHeaders();
      Object.assign(headers, formHeaders);

      resp = await axios.post(modelUrl, form, {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 2 * 60 * 1000,
      });
    }

    // Expect model to return JSON
    return res.json(resp.data);
  } catch (err) {
    // Better error reporting
    console.error('Scan error:', err?.response?.data || err.message || err);
    const status = err.response?.status || 500;
    const data = err.response?.data || { error: err.message || 'Model error' };
    return res.status(status).json(data);
  }
});

module.exports = router;
