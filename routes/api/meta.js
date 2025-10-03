require("dotenv").config();

var express = require("express");
var router = express.Router();

const db = require("../../models");
const { updateTitleInJobs } = require("../../utils/DBformatter");

router.post("/meta-title", async (req, res) => {
  const { meta_title } = req.body;
  if (!meta_title) {
    return res.status(400).json({ error: "meta_title is required" });
  }

  try {
    const meta_titles_db = await db.MetaTitle.find({}).limit(2);
  const oldMeta = meta_titles_db[1];

if(meta_titles_db[0].title !==meta_title){

  oldMeta.title = meta_titles_db[0].title;
  oldMeta.save();
}
    
    

    const changeMeta = await updateTitleInJobs(
      meta_titles_db[1].title,
      meta_title
    );
    const newMeta = meta_titles_db[0];
    newMeta.title = meta_title;
    newMeta.save();
    return res
      .status(201)
      .json({
        meta_title,
        message: `Added ${meta_title} to meta_title and updated ${changeMeta.modifiedCount} titles of matching old meta _title ${oldMeta.title}`,
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "There was some error plz try again.." });
  }
});

// Read all links
router.get("/meta-title", async (req, res) => {
  // const links = await readLinksFile();
  const meta_titles_db = await db.MetaTitle.find({}).limit(2);
  const oldMetaTitle = meta_titles_db[1];
  const newMetaTitle = meta_titles_db[0];

  return res.json({ oldMetaTitle, newMetaTitle });
});

module.exports = router;
