import puppeteer from "puppeteer";
import { writeFile } from "fs";
import { join, dirname, resolve } from "path";
import {BASE_URL} from '../utils';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

for (let season = 2023; season >= 2022; season--) {
  console.log(`Scrapping Season ${season}`);
  await page.goto(
    `${BASE_URL}/leagues/NBA_${season}_per_game.html`,
    {
      waitUntil: "domcontentloaded",
      timeout: 0,
    }
  );

  const tableElem = await page.$eval("#per_game_stats", (fn) => {
    const tableBody = fn.querySelector("tbody");
    const tableHead = fn
      .querySelector("thead")
      .querySelector("tr")
      .querySelectorAll("th");

    const columns = Array.from(tableHead).map((item) => item.textContent);

    columns.splice(0, 1);

    const trs = Array.from(tableBody.children).map((elem) => {
      const tds = Array.from(elem.querySelectorAll("td"));
      const tableData = tds.map((td) => td.textContent);
      const tableObj = {};
      for (let i = 0; i < columns.length; i++) {
        const columnName = columns[i];
        const columnData = tableData[i];
        tableObj[columnName] = columnData;
      }

      return tableObj;
    });

    return trs;
  });

  const dataPayload = JSON.stringify(tableElem, null, 2);
  const filePath = join("../data/seasons", `player_stats_${season}.json`);

  writeFile(filePath, dataPayload, "utf-8", (done) => {
    if (done) {
      console.log("File saved on disk!");
    }
  });
}

await browser.close();
