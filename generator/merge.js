const fs = require("fs");
const path = require("path");
const fcsv = require("@fast-csv/parse");

const datasetDir = "./generator/Names";
const outputFile = "./static/names.json";

const main = async () => {
  const files = await fs.promises.readdir(datasetDir);
  const names = [];

  for (const file of files) {
    const filePath = path.join(datasetDir, file);

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(fcsv.parse({ headers: false, skipRows: 3 }))
        .on("data", (row) => {
          if (row[0]) names.push(row[0]);
        })
        .on("end", resolve)
        .on("error", reject);
    });
  }

  fs.writeFileSync(outputFile, JSON.stringify(names, null, 2), "utf8");
  console.log(`Done! ${names.length} names saved to ${outputFile}`);
};

main().catch(console.error);
