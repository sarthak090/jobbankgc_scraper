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
const multer = require("multer");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // Define the upload destination folder
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use the original filename
  },
});

const upload = multer({ storage: storage });
const jsonexport = require("jsonexport");
const formatSentences = require("../../utils/formatter/sentences-csv-import");
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
router.get("/empty-sentences", async (req, res) => {
  try {
const result = await findSentencesWithOptionsWithZeroOptions();


    // const formattedResult = result.flatMap((doc) => {
    //   return doc.sentences.map((sentence) => {
    //     return {
    //       name: sentence.title,
    //       id: sentence._id,
    //     };
    //   });
    // });

    res.send(result);
  } catch (err) {
    console.log(err);
    res.send({ message: "There is some error" });
  }
});


async function findSentencesWithOptionsWithZeroOptions() {
  try {
    const results = await db.SentencesOptions.aggregate([
      {
        $unwind: '$sentences'
      },
      {
        $match: {
          'sentences.options': { $size: 0 }
        }
      },
      {
        $group: {
          _id: {
            _id: '$_id',         // Include the _id field
            heading: '$heading' // Include the heading field
          },
          heading: { $first: '$heading' }, // Include the heading field
          sentences: {  $push: { 
            _id: '$sentences._id',  // Include the _id field of the sentence
            title: '$sentences.title'  // Include the title of the sentence
          }},
 
        }
      }
    ]);

    // console.log('Empty sentences with titles and headings:', emptySentences);
    return results
  } catch (err) {
    console.error('Error:', err);
  }
}



router.get("/new", async function (req, res, next) {
  const sentences = await db.SentencesOptions.find({});
  res.json(sentences);
});

const paginatedSentences = async (pagination) => {
  const { page, limit } = pagination;

  const paginated = await db.SentencesOptions.paginate(
    {},
    {
      page: page ? page : 1,
      limit: limit ? limit : 10,
      sort: { _id: -1 },
      select: "heading",
    }
  );
  return paginated;
};

router.get(
  "/remove-duplicates/:heading",
  asyncHandler(async (req, res) => {
    const { heading } = req.params;
    await removeDuplicatesByHeading({ heading });
    res.send({
      message: `Duplicats in ${heading} will be removed`,
    });
  })
);

router.put(
  "/:slug",
  asyncHandler(async (req, res) => {
    try {
      const sentence = await db.SentencesOptions.findOne({
        heading: req.params.slug,
      });
      const isUpdated = await updateSentenceOptions({
        heading: sentence.heading,
        sentenceTitle: req.body.sentenceTitle,
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
    const sentence = await db.SentencesOptions.findOne({
      heading: req.params.slug,
    })
    return res.send(sentence);
  })
);

router.get(
  "/:slug/export",
  asyncHandler(async (req, res) => {
    const data = await db.SentencesOptions.findOne({
      heading: req.params.slug,
    });

    // Extract the sentences data
    const sentencesData = data.sentences.map((sentence) => ({
      Heading: sentence.title,
      Sentences: sentence.options.join("\n"),
    }));

    jsonexport(sentencesData, { headerPathString: "." }, (err, csv) => {
      if (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
        return;
      }

      const fileName = "sentences.csv";

      // Set the response headers for file download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );

      // Stream the CSV data as the response
      res.send(csv);
    });
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

router.get(
  "/:slug/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sentence = await db.SentencesOptions.findOne(
      { "sentences._id": id },
      { "sentences.$": 1, heading: 1 }
    );

    return res.send(sentence);
  })
);

router.get("/:slug/:id/export", async (req, res) => {
  const { id } = req.params;
  const sentence = await db.SentencesOptions.findOne(
    { "sentences._id": id },
    { "sentences.$": 1, heading: 1 }
  );
  const data = [sentence];

  // Extract the sentences data
  const sentencesData = data
    .map((item) => item.sentences)
    .flat()
    .map((sentence) => ({
      heading: sentence.title,
      sentences: sentence.options.join("\n"),
    }));

  // Generate CSV using jsonexport
  jsonexport(sentencesData, { headerPathString: "." }, (err, csv) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const filePath = "sentences.csv";
    fs.writeFile(filePath, csv, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
        return;
      }

      // Set the response headers for file download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="sentences.csv"'
      );

      // Stream the file to the response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Cleanup the file after it's sent
      fileStream.on("close", () => {
        fs.unlinkSync(filePath);
      });
    });
  });
});

module.exports = router;
