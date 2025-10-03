var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/api/users");
var apiRoutes = require("./routes/api/jobs");
var employersRoute = require("./routes/api/employers");
var unprotectedJobsRoute = require("./routes/api/unp_jobs");
require("./utils/_test2");
require("./utils/DBformatter");
require("./utils/sentences/sentences");
require("./scripts/csvimport");
var cors = require("cors");
const connectDB = require("./config/db");
const fileUpload = require("express-fileupload");

var app = express();
connectDB();
app.use(cors());

require("./utils/cron");
require("./utils/introduction");
require("./utils/lmiaUpdater");
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));
app.use(fileUpload());

app.use("/", indexRouter);
app.use("/api/images", require("./routes/api/images"));
app.use("/api/featured-img", require("./routes/api/featuredImg"));
app.use("/api/salary", require("./routes/api/salary"));

app.use("/api/users", usersRouter);
app.use("/api/jobs", apiRoutes);
app.use("/api/sgb/jobs", require("./routes/api/sgb"));
app.use("/api/introduction", require("./routes/api/introduction"));

app.use("/api/sentences", require("./routes/api/sentences"));
app.use("/api/meta", require("./routes/api/meta"));
app.use("/api/employers", employersRoute);
app.use("/api/unprotected/jobs", unprotectedJobsRoute);
app.get('/ui',(req,res)=>{
  res.send({message:'Working Fine!'})
})
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
