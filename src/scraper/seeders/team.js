import puppeteer from "puppeteer";
import { writeFileSync } from 'fs';
import { NBA_TEAMS } from '../../utils.js';

const BASE_URL = "https://www.basketball-reference.com"
const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();
const payload = []


for (let i = 0; i < NBA_TEAMS.length; i++) {
  const team = NBA_TEAMS[i];
  console.log("Scraping: ", team.code)

  await page.goto(
    `${BASE_URL}/teams/${team.code}/2024.html`,
    {
      waitUntil: "domcontentloaded",
      timeout: 0,
    }
  );

  // fetch logo
  const teamLogoUrl = await page.$eval('.teamlogo', fn => fn.getAttribute('src'))

  const statsPerSeasonPayload = {}

  // FIX: you are already on the current seasons page get the stats of current
  // season from that page itself you fuck
  for (let season = 2024; season >= 2022; season--) {

    console.log(`\tScraping Season Stats: ${season}`)
    await page.goto(
      `${BASE_URL}/teams/${team.code}/${season}.html`,
      {
        waitUntil: "domcontentloaded",
        timeout: 0,
      }
    );

    // fetch stats for each season

    const statsTable = await page.$eval('table#team_and_opponent', table => {
      // get table colums
      const tableHeadElem = table.getElementsByTagName('thead').item(0)
      const tableRowElem = tableHeadElem.getElementsByTagName('tr').item(0);
      const tableRows = tableRowElem.getElementsByTagName('th');

      const statsHeadings = []
      const statsValues = []

      for (let row = 1; row < tableRows.length; row++) {
        statsHeadings.push(tableRows.item(row).innerText);
      }

      // get table data

      const tableBodyElem = table.getElementsByTagName('tbody').item(0);
      const perGameStatsElem = tableBodyElem.getElementsByTagName('tr').item(1);
      const statsRow = perGameStatsElem.getElementsByTagName('td');

      for (let row = 1; row < statsRow.length; row++) {
        statsValues.push(statsRow.item(row).innerText);
      }
      const stats = {}

      statsHeadings.forEach((val, index) => {
        stats[val] = statsValues[index]
      })

      return stats;
    })

    statsPerSeasonPayload[season] = statsTable;
  }
  payload.push({ ...team, logoUrl: teamLogoUrl, seasonStats: statsPerSeasonPayload })
}

const payloadJson = JSON.stringify(payload, null, 2);
writeFileSync("./teams-full-stats.json", payloadJson, 'utf-8')
await browser.close()