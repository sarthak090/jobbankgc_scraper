const mongoose = require("mongoose");
const chalk = require("chalk");

const connectDB = async () => {
  try {
    console.log(chalk.blue("Connecting To The Database..."));

    const conn = await mongoose.connect(
      "mongodb+srv://sarthak:sarthak1@cluster0.p8zt4.mongodb.net/jobbank"
      // "mongodb+srv://sarthak:sarthak1@cluster0.p8zt4.mongodb.net/newcanadajob"
    );
    console.log(chalk.bold.bgGreen(`Connected: ${conn.connection.host}`));
  } catch (error) {
    console.log(chalk.red(error));
    process.exit(1);
  }
};

module.exports = connectDB;
