const http = require('http');
const app = require('../server');

const testFrontendServing = async () => {
  const PORT = 5002;
  const server = app.listen(PORT, async () => {
    console.log(`Frontend test server running on port ${PORT}`);

    const get = (urlPath) => {
      return new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${PORT}${urlPath}`, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
        }).on('error', reject);
      });
    };

    try {
      const pages = ['/', '/index.html', '/exam.html', '/result.html', '/admin.html', '/css/style.css', '/css/exam.css', '/css/admin.css', '/js/i18n.js', '/js/register.js', '/js/exam.js', '/js/result.js', '/js/admin.js'];

      for (const p of pages) {
        const res = await get(p);
        console.log(`GET ${p} -> Status: ${res.status}, Length: ${res.body.length}`);
        if (res.status !== 200) {
          throw new Error(`Failed to load ${p}`);
        }
      }

      console.log('\nAll frontend assets and HTML pages served with 200 OK successfully!\n');
    } catch (err) {
      console.error('Frontend Integration Error:', err.message);
      process.exitCode = 1;
    } finally {
      server.close(() => {
        process.exit();
      });
    }
  });
};

testFrontendServing();
