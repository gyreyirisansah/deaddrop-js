import { getMessagesForUser, userExists } from "./db";
import { authenticate } from "./session";

import log4js from "log4js"
const logger = log4js.getLogger("app")
const err_logger = log4js.getLogger("errors")

export async function readMessages(user: string) {
    try {
        if (!await userExists(user)) {
            throw new Error("User does not exist");
        }

        if (!await authenticate(user)) {
            throw new Error("Unable to authenticate");
        }

        getMessagesForUser(user).then((results) => {
            results[0].forEach((e: string) => {console.log(e, "\n")});
           
            if(results[1].length >0){
                console.log("The integrity of "+results[1].length +" messages could not be verified. sent by the following people");
                results[1].forEach((e:string) =>console.log(e, "\n"))
            }
            logger.info(`User ${user} read message successfully`)
        });

    } catch (error) {
        err_logger.error(`READ: operation failed failed for user ${user} Error: ${error}`)
        console.error("Error occured during reading.", error);
    }
}