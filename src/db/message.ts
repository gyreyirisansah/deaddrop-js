import { connect } from "./db"
import * as dotenv from "dotenv"
import crypto from "crypto"

dotenv.config({path: __dirname+'./env'})
export const getMessagesForUser = async (user: string): Promise<string[]> => {
    let db = await connect();

    let messages: string[] = [];
    //Just to avoid error
    const tempinitVector = crypto.randomBytes(16);
    let initVector = process.env.INIT_VECTOR||""
    const initVect = (Buffer.from(initVector))||initVector
    const alg = process.env.ALGORITHM||""
    const secKey = process.env.SECURITY_KEY||""
    const decipher = crypto.createDecipheriv(alg,secKey, alg, initVect)

    await db.each(`
        SELECT data FROM Messages
        WHERE recipient = (
            SELECT id FROM Users WHERE user = :user
        );
    `, {
        ":user": user,
    }, (err, row) => {
        if (err) {
            throw new Error(err);
        }
        let decryptedMessage = decipher.update(row.data,"hex","utf-8")
        decryptedMessage += decipher.final("utf8")
        messages.push(decryptedMessage);
    });

    return messages;
}

export const saveMessage = async (message: string, recipient: string) => {
    let db = await connect();

    const tempinitVector = crypto.randomBytes(16);
    const tempKey = crypto.randomBytes(32);
    console.log(tempinitVector)
    let initVector = process.env.INIT_VECTOR||"";
    let sec_Key = process.env.SECURITY_KEY||"";
    const initVect = (Buffer.from(initVector, "base64"))||tempinitVector;
    const secKey = (Buffer.from(sec_Key,"base64"))||tempinitVector;
    const alg = process.env.ALGORITHM||"";
    
    console.log(alg + " " + secKey+ " " +initVect)
    const cipher = crypto.createCipheriv("aes-256-gcm",tempKey, tempinitVector);
    let encryptedMessage = cipher.update(message, "utf-8","hex");
    encryptedMessage += cipher.final("hex");


    await db.run(`
        INSERT INTO Messages 
            (recipient, data)
        VALUES (
            (SELECT id FROM Users WHERE user = :user),
            :message
        )
    `, {
        ":user": recipient,
        ":message": encryptedMessage,
    });
}