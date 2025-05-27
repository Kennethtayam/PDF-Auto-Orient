const fs = require('fs');
const path = require('path');

const mainFolder = 'C:\\Users\\Kenneth\\Desktop\\SCAN FILES\\Leave Cards\\Leave Cards - CHRMO';

let grouped = {};

function scanFolder(folderPath) {
  const entries = fs.readdirSync(folderPath);
  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanFolder(fullPath);
    } else if (stat.isFile() && entry.endsWith('.pdf')) {
      const match = entry.match(/^(.+)_([\d]{4}\.\d{2})-([\d]{4}\.\d{2})\.pdf$/);
      if (match) {
        const [, owner, startDate, endDate] = match;
        if (!grouped[owner]) {
          grouped[owner] = [];
        }
        grouped[owner].push([startDate, endDate]);
      }
    }
  }
}

scanFolder(mainFolder);

// Print grouped results
for (const owner of Object.keys(grouped).sort()) {
  console.log(` ${owner} \n   [ '${grouped[owner][0][0]}', '${grouped[owner][0][1]}' ]`);
  for (let i = 1; i < grouped[owner].length; i++) {
    const [start, end] = grouped[owner][i];
    console.log(`   [ '${start}', '${end}' ]`);
  }
}
