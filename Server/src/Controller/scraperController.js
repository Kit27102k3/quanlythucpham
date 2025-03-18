import puppeteer from "puppeteer";

export const scrapeWebsite = async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Thiếu URL" });

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const title = await page
      .$eval("meta[property='og:title']", (el) => el.content)
      .catch(() => "Không có tiêu đề");
    const image = await page
      .$eval("meta[property='og:image']", (el) => el.content)
      .catch(() => "");
    const description = await page
      .$eval("meta[property='og:description']", (el) => el.content)
      .catch(() => "Không có mô tả");

    await browser.close();

    res.json({ title, image, description });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy dữ liệu" });
  }
};
