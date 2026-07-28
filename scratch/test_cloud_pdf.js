const fs = require('fs');
const https = require('https');
const http = require('http');

async function testGotenberg() {
  console.log("Testing native LibreOffice DOCX to PDF conversion via Gotenberg...");
  const docxBuffer = fs.readFileSync('scratch/sample_filled.docx');

  // Boundary for multipart/form-data
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

  const postDataHead = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="files"; filename="document.docx"\r\n` +
    `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n\r\n`
  );

  const postDataTail = Buffer.from(`\r\n--${boundary}--\r\n`);

  const fullPayload = Buffer.concat([postDataHead, docxBuffer, postDataTail]);

  return new Promise((resolve, reject) => {
    const req = https.request('https://demo.gotenberg.dev/forms/libreoffice/convert', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullPayload.length,
      },
      timeout: 15000,
    }, (res) => {
      console.log("Gotenberg status code:", res.statusCode);
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const resultBuf = Buffer.concat(chunks);
        if (res.statusCode === 200) {
          fs.writeFileSync('scratch/native_gotenberg_result.pdf', resultBuf);
          console.log("SUCCESS! Created native PDF at scratch/native_gotenberg_result.pdf, size:", resultBuf.length);
          resolve(true);
        } else {
          console.error("Failed:", res.statusCode, resultBuf.toString().substring(0, 300));
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.error("Gotenberg network error:", e.message);
      resolve(false);
    });

    req.write(fullPayload);
    req.end();
  });
}

testGotenberg();
