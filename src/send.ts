import readline from "readline";
import { saveMessage, userExists } from "./db";
import { authenticate } from "./session";

import log4js from "log4js"
const logger = log4js.getLogger("app")
const err_logger = log4js.getLogger("errors")

export const sendMessage = async (user: string,sender:string) => {
    try {
        if (!await userExists(sender)) {
            throw new Error("Your username does not exist");
        }
        if (!await userExists(user)) {
            throw new Error("Destination user does not exist");
        }

        const message = await getUserMessage();
        
        if (!await authenticate(sender)) {
            throw new Error("Unable to authenticate");
        }

        await saveMessage(sender, message, user).then(() =>{
            logger.info(`Message sent successfully for user ${user}`)
        })

        // getUserMessage().then(async (message) => {
        //     await saveMessage(sender, message, user);
        //     logger.info(`Message sent successfully for user ${user}`)
        // });

        


    } catch (error) {
        err_logger.error(`SEND: sending message to user ${user} failed. ${error}`)
        console.error("Error occured creating a new user.", error);
    }
}

const getUserMessage = async (): Promise<string> => {
    let rl = readline.createInterface(process.stdin, process.stdout);
    let message: string = await new Promise(resolve => rl.question("Enter your message: ", resolve));
    rl.close();
    return message;
}