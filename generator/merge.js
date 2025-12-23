const fs = require("fs");
const path = require("path");
const readline = require("readline");

const datasetDir = "./generator/Names";
const outputFile = "./static/names.json";

const main = async () => {
  const files = await fs.promises.readdir(datasetDir);
  const names = [];

  for (const file of files) {
    const filePath = path.join(datasetDir, file);

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    });

    let skip = 3;
    for await (const line of rl) {
      if (skip-- > 0) continue;
      if (!line.trim()) continue;

      const name = line.split(',')[0].replace(/"/g, '');
      if (name) names.push(name);
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(names, null, 2), "utf8");
  console.log(`Done! ${names.length} names saved to ${outputFile}`);
};

main().catch(console.error);
