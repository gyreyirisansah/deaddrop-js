import readline from "readline";

import { noUsers, setUserPassHash, userExists } from "./db";
import { authenticate, getPassword } from "./session";

import log4js from "log4js"

const logger = log4js.getLogger("app")
const err_logger = log4js.getLogger("errors")

export const newUser = async (user: string) => {
    try {
        if (!noUsers(user) && !userExists(user)) {
            err_logger.error("NEW USER: Unrecognized user "+user)
            throw new Error("User not recognized");
        }

        if (!(await authenticate(user))) {
            err_logger.error("NEW USER: Authentication failed for user "+user)
            throw new Error("Unable to authenticate user");
        }

        let newUser = await getNewUsername();
        let newPassHash = await getPassword();

        await setUserPassHash(newUser, newPassHash);
        logger.info(`User ${user} created successfully`)

    } catch (error) {
        err_logger.error(`NEW USER: Creating new user ${user} failed`)
        console.error("Error ocurred creating a new user.", error);
    }
}

const getNewUsername = async (): Promise<string> => {
    let rl = readline.createInterface(process.stdin, process.stdout);
    let username: string = await new Promise(resolve => rl.question("Username: ", resolve));
    return username;
}