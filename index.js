const puppeteer = require('puppeteer-extra');
const express = require('express');
const app = express();
const PORT = 3000;
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Regex kiểm tra m3u8 hợp lệ
const validM3U8Regex = /^https:\/\/[a-zA-Z0-9.-]+\/hls\/[a-zA-Z0-9+/=.-]+\/[a-zA-Z0-9+/=.-]+\.m3u8$/;

async function getM3u8(id) {
  const embedUrl = "https://www.rophim.me/xem-phim/" + id;
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  let m3u8Link = null;
  let subLinks = [];

  const clientFound = new Promise((resolve) => {
    // Lắng nghe các response
    page.on('response', async (response) => {
      const url = response.url();

      // Nếu là file phụ đề
      if (url.includes('.vtt') || url.includes('.srt')) {
        subLinks.push(url);
        console.log('🎯 Found valid Sub:', url);
        return;
      }

      // Nếu là file .m3u8
      if (url.includes('.m3u8') && validM3U8Regex.test(url)) {
        m3u8Link = url;
        console.log('🎯 Found valid M3U8:', url);
        resolve(); // Ngừng chờ khi tìm được
      }
    });
  });

  try {
    await page.goto(embedUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Chờ tới khi tìm thấy m3u8 hoặc hết 15 giây
    await Promise.race([
      clientFound,
      new Promise(resolve => setTimeout(resolve, 15000))
    ]);

    await browser.close();

    if (m3u8Link) {
      // const vieSubs = subLinks.filter(url => url.split('/').pop().includes('vie'));
      const base = m3u8Link.slice(0, m3u8Link.lastIndexOf('/') + 1);
      return [base, subLinks];
    } else {
      return null;
    }

  } catch (err) {
    console.error('🚫 Lỗi khi truy cập:', err.message);
    await browser.close();
    return null;
  }
}

app.get('/m3u8', async (req, res) => {
  const { mid, ss, ep } = req.query;
  if (!mid || !ss || !ep) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const id = `${mid}?ver=1&ss=${ss}&ep=${ep}`;
  const link = await getM3u8(id);

  if (!link) {
    return res.status(404).json({ error: 'Không tìm thấy m3u8 hợp lệ' });
  }

  const fullUrl = link[0] + "aW5kZXgtZjEtdjEtYTEubTN1OA==.m3u8";
  return res.json({ m3u8: fullUrl, sub: link[1] });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
