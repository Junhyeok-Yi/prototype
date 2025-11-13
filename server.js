/**
 * Express Proxy Server for SmartHome Level Checker
 * 
 * CORS 문제로 직접 Make.com Webhook 호출이 불가능한 경우 사용하는 프록시 서버입니다.
 * 
 * 사용 방법:
 *   $ npm install express multer node-fetch@2 cors
 *   $ node server.js
 * 
 * 프록시 엔드포인트:
 *   POST /proxy?target=<encoded_webhook_url>
 * 
 * 요청 본문은 그대로 전달됩니다 (multipart/form-data 또는 application/json).
 */

const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 3000;

// CORS 설정: 모든 origin 허용
app.use(cors());

// JSON 본문 파싱 (Base64 모드용)
app.use(express.json({ limit: '50mb' }));

// Multipart 파싱 설정 (Binary 모드용)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB 제한
});

/**
 * 프록시 엔드포인트
 * 
 * 쿼리 파라미터:
 *   - target: 인코딩된 Make.com Webhook URL
 * 
 * 요청 본문:
 *   - multipart/form-data: files[] 필드에 파일들
 *   - application/json: { files: [{ name, content_base64 }] }
 */
app.post('/proxy', upload.any(), async (req, res) => {
  try {
    const targetUrl = req.query.target;
    
    if (!targetUrl) {
      return res.status(400).json({ 
        error: 'Missing target parameter (target 쿼리 파라미터가 필요합니다)' 
      });
    }

    // 디코딩된 Webhook URL
    const webhookUrl = decodeURIComponent(targetUrl);
    
    console.log(`[Proxy] Forwarding request to: ${webhookUrl}`);
    console.log(`[Proxy] Content-Type: ${req.headers['content-type']}`);
    console.log(`[Proxy] Request size: ${JSON.stringify(req.body).length} bytes`);

    // 요청 옵션 준비
    const fetchOptions = {
      method: 'POST',
      headers: {}
    };

    // Content-Type에 따라 본문 처리
    if (req.headers['content-type']?.includes('application/json')) {
      // Base64 JSON 모드: 본문을 그대로 전달
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(req.body);
    } else {
      // Multipart 모드: FormData 생성
      const FormData = require('form-data');
      const formData = new FormData();
      
      // 업로드된 파일들을 FormData에 추가
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          formData.append('files[]', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype
          });
        });
      }
      
      fetchOptions.body = formData;
      // FormData는 자동으로 Content-Type을 설정하므로 헤더에 추가하지 않음
    }

    // Make.com Webhook으로 요청 전달
    const response = await fetch(webhookUrl, fetchOptions);
    
    // 응답 상태 확인
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] Error response: ${response.status} ${errorText}`);
      return res.status(response.status).json({ 
        error: `Webhook returned ${response.status}`,
        details: errorText 
      });
    }

    // 응답 본문 파싱 시도
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      try {
        responseData = JSON.parse(text);
      } catch (e) {
        return res.status(500).json({ 
          error: 'Invalid JSON response from webhook',
          raw: text.substring(0, 500) // 처음 500자만 표시
        });
      }
    }

    // 성공 응답 전달
    console.log(`[Proxy] Success: ${response.status}`);
    res.json(responseData);

  } catch (error) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({ 
      error: 'Proxy error (프록시 오류)',
      message: error.message 
    });
  }
});

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'smarthome-level-checker-proxy' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`SmartHome Level Checker Proxy Server`);
  console.log(`========================================`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`\nProxy endpoint: POST /proxy?target=<encoded_webhook_url>`);
  console.log(`Health check: GET /health\n`);
});
