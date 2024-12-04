import * as cheerio from "cheerio";

const calculateReadingTime = (htmlContent: string) => {
  const $ = cheerio.load(htmlContent);
  const textContent = $("body").text();
  const wordsPerMinute = 200;

  const wordCount = textContent.split(/\s+/).length;

  const readTimeInMinutes = Math.ceil(wordCount / wordsPerMinute);
  return readTimeInMinutes;
};

export default calculateReadingTime;
