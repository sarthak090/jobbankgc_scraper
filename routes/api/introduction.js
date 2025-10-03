var express = require("express");
const db = require("../../models");
var router = express.Router();
const asyncHandler = require("express-async-handler");
const {
  updateSentenceOptions,
  updateSentenceOptionsCSV,
  removeDuplicatesByHeading,
} = require("../../utils/sentences/sentences");
const fs = require("fs");
const csv = require("csv-parser");
const formatSentences = require("../../utils/formatter/sentences-csv-import");
const {
  updateIntroductionOptions,
} = require("../../utils/sentences/introduction");
/* GET home page. */
router.get("/", async function (req, res, next) {
  const { page, limit } = req.query;
  try {
    const sentences = await paginatedSentences({ page, limit });

    res.json(sentences);
  } catch (err) {
    res.send({ error: true, msg: "There was some error" });
  }
});

const paginatedSentences = async (pagination) => {
  const { page, limit } = pagination;

  const paginated = await db.IntroductionSentences.paginate(
    {},
    {
      page: page ? page : 1,
      limit: limit ? limit : 10,
      sort: { _id: -1 },
      select: "title sentenceOrder",
    }
  );
  return paginated;
};

router.put(
  "/:slug",
  asyncHandler(async (req, res) => {
    try {
      const sentence = await db.IntroductionSentences.findOne({
        sentenceOrder: req.params.slug,
      });

      const isUpdated = await updateIntroductionOptions({
        title: sentence.title,
        options: req.body.options,
      });

      return res.send({
        message: "Sentence Updated Succesfully",
        error: false,
      });
    } catch (err) {
      console.log(err);
      return res.send({ message: err, error: true });
    }
  })
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const sentence = await db.IntroductionSentences.findOne({
      sentenceOrder: req.params.slug,
    });
    return res.send(sentence);
  })
);

router.post("/:slug/import-csv", (req, res) => {
  const { slug } = req.params;

  if (!req.files || !req.files.file) {
    return res.status(400).send("CSV file is missing");
  }

  const csvFile = req.files.file;
  const filePath = `./${csvFile.name}`;
  const results = [];

  csvFile.mv(filePath, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        // Process the imported data
        const formattedData = formatSentences(results, slug);

        await formattedData.forEach(async (csvData) => {
          try {
            await updateSentenceOptionsCSV(csvData);
          } catch (err) {
            console.log({ err });
          }
        });
        fs.unlinkSync(filePath);

        // TODO: Perform further operations with the imported data
        res
          .status(200)
          .send({ message: "CSV Data Imported Successfully", error: false });

        // Delete the temporary file

        // res.status(200).send("CSV data imported successfully");
      });
  });
});

module.exports = router;
