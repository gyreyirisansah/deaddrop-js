import "dotenv/config"

import { Command } from "commander";
import { exit } from "process";
import { noUsers } from "./db";
import { connect } from "./db/db";

import { newUser } from "./new";
import { readMessages } from "./read";
import { sendMessage } from "./send";

import log4js from "log4js"

const program = new Command();


//Environment variables declarations

// dotenv.config()

// import * as dotenv from 'dotenv'
// dotenv.config()


//configuring log 4 js with two appenders, app logs all infos whiles errors are logged to the log_errors.txt 
//took inspiration from the example log4js project on github https://github.com/log4js-node/log4js-example
log4js.configure({
  appenders: {
    app:{type:"file",
      filename:"log.txt"
    },
    errorFile:{
      type:"file",
      filename:"log_errors.txt"
    },
    errors:{
      type: "logLevelFilter",
      level:"ERROR",
      appender:"errorFile"
    }
  },
  categories:{
    default:{appenders:["app"],level:"debug"},
    errors:{appenders:["errors"],level:"debug"}
    }
});

// connect early so that if the db needs to be created, everything is populated by the time we
// try to access it. the async system should prevent us from needing to do this, but in
// practice, there are sometimes cases where it still tries to read before finishing the
// creation of the db

program
  .version("1.0.0")
  .description(
    "a deaddrop tool for storing data and retrieving it later with authentication"
  )
  .option("--new", "use the utility in new user mode")
  .option("--send", "use the utility in send mode")
  .option("--read", "use the utility in read mode")
  .option("--from <name>", "specify your username")
  .option("--user <name>", "specify a user for verbs requiring a user target")
  .option("--to <name>", "specify the user to send a message to")
  .parse(process.argv);

const options = program.opts();

const validateInputString = (target: string): string => {
  return typeof target === "string" ? target : "";
};

// ensure only one verb
if (
  (options.new && options.read) ||
  (options.new && options.send) ||
  (options.read && options.send)
) {
  console.log("Please only specify one verb");
  exit();
}

// switch based on the verb
if (options.new) {
  let user = validateInputString(options.user);
  void (async function () {
    await connect();
  })().then(() => {
    if (user === "" && !noUsers(user)) {
      console.error("Please specify a user when running in new mode");
    } else {
      newUser(user);
    }
  });
} else if (options.send) {
  let sender = validateInputString(options.from)
  
  let user = validateInputString(options.to);
  if (sender === ""){
    console.error("Please specify your username when running in send mode");
  }
  else if (user === "") {
    console.error("Please specify a to target when running in send mode");
  } else {
    sendMessage(user,sender);
  }
} else if (options.read) {
  let user = validateInputString(options.user);
  if (user === "") {
    console.error("Please specify a user when running in read mode");
  } else {
    readMessages(user);
  }
} else {
  console.error(
    "Please specify a verb for the utility. Valid verbs are: read, send, new"
  );
}
