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
  try {
    // Validate database connection
    if (!db || !db.MetaTitle) {
      return res.status(500).json({ 
        error: "Database connection not available" 
      });
    }

    // Fetch meta titles from database
    const meta_titles_db = await db.MetaTitle.find({}).limit(2);
    
    // Validate that we have at least one record
    if (!meta_titles_db || meta_titles_db.length === 0) {
      return res.status(404).json({ 
        error: "No meta titles found in database" 
      });
    }

    // Extract titles safely with fallbacks
    const oldMetaTitle = meta_titles_db.length > 1 ? meta_titles_db[1] : null;
    const newMetaTitle = meta_titles_db[0] || null;

    // Validate that we have the required data
    if (!newMetaTitle) {
      return res.status(404).json({ 
        error: "No current meta title found" 
      });
    }

    return res.json({ 
      oldMetaTitle, 
      newMetaTitle,
      count: meta_titles_db.length 
    });
  } catch (err) {
    console.error("Error fetching meta titles:", err);
    return res.status(500).json({ 
      error: "Internal server error while fetching meta titles",
      message: "Please try again later"
    });
  }
});

// (()=>{
//   db.MetaTitle.create({title:'CanadaIn'}).then(()=>{
//     console.log('MetaTitle created')
//   }).catch((err)=>{
//     console.log(err)
//   })
// })()
module.exports = router;
