import readline from "readline";
import bcrypt from "bcryptjs";
import { getUserPassHash, noUsers } from "./db";

export const getPassword = async (): Promise<string> => {
    return readPassIn("Password: ")
        .then((pass) => saltAndHash(pass));
};

const saltAndHash = (pass: string): string => {
    // 10 is the recommended default difficulty for bcrypt as of jan 2023
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(pass, salt);
};

export const authenticate = async (user: string): Promise<boolean> => {
    // bypass authentication if no users have been created
    if ((await noUsers(user))) {
        return Promise.resolve(true);
    }

    let pass = await readPassIn("Password: ")
    let hash = await getUserPassHash(user);

    return bcrypt.compare(pass.toString(), hash.toString());
};

// from the impressive @sdgfsdh at https://stackoverflow.com/questions/24037545/how-to-hide-password-in-the-nodejs-console
// get a password from the cli replacing input with **** to hide it
const readPassIn = (query: string): Promise<string> => {
    return new Promise((resolve, _) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const stdin = process.openStdin();
        process.stdin.on("data", (char) => {
            let str: string = char + "";
            switch (str) {
                case "\n":
                case "\r":
                case "\u0004":
                    stdin.pause();
                    break;
                default:
                    readline.clearLine(process.stdout, 0);
                    readline.cursorTo(process.stdout, 0);
                    process.stdout.write(query + Array(rl.line.length + 1).join("*"));
                    break;
            }
        });
        rl.question(query, (value) => {
            resolve(value);
        });
    });
}
