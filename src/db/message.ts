import { connect } from "./db"
import crypto from "crypto"

import log4js from "log4js"
const logger = log4js.getLogger("app")
const err_logger = log4js.getLogger("errors")

// dotenv.config()
export const getMessagesForUser = async (user: string): Promise<string[][]> => {
    let db = await connect();

    let messages: string[] = [];
    let unverifiedMessages: string[] = [];
    
    await db.each(`
        SELECT data, sender, (SELECT user FROM Users WHERE id = sender) as senderName, mac FROM Messages
        WHERE recipient = (
            SELECT id FROM Users WHERE user = :user
        );
    `, {
        ":user": user,
    }, (err, row) => {
        if (err) {
            
            throw new Error(err);
        }
        
        const mac = row.mac
        const sender = row.senderName,
        message = row.data
        const cur_mac = generateMac(sender,user,message)
        if(mac != cur_mac){
            err_logger.error("The integrity of message sent by "+sender+" could not be verified!")
            
            unverifiedMessages.push(sender)
        }

        const  decryptedMessage = decryptMessage(message)
        messages.push(decryptedMessage+" [Sender: "+sender+"]");
    });

    return [messages,unverifiedMessages];
}

export const saveMessage = async (sender:string, message: string, recipient: string) => {
    let db = await connect();
    const encryptedMessage = encryptMessage(message)
    const mac = generateMac(sender, recipient,encryptedMessage)
    await db.run(`
        INSERT INTO Messages 
            (sender,recipient, data, mac)
        VALUES (
            (SELECT id FROM Users WHERE user = :sender),
            (SELECT id FROM Users WHERE user = :user),
            :message,
            :mac
        )
    `, {
        ":sender":sender,
        ":user": recipient,
        ":message": encryptedMessage,
        ":mac":mac
    });
}



const getSecretKey = (key:string) =>{
    return crypto.scryptSync(key, "salt", 24);
}

const encryptMessage = (message:string) =>{
    const initial_vector = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(process.env.ALGORITHM||"", getSecretKey(process.env.SECURITY_KEY||""),initial_vector);
    const encryptedMesage = cipher.update(message, "utf8", "hex");
    const finalEncryptedMsg = [
        encryptedMesage + cipher.final("hex"),
      Buffer.from(initial_vector).toString("hex"),
    ].join("|");
    return finalEncryptedMsg
}

const decryptMessage = (encryptedMessage:string) =>{
    try{
        const [encryptedMsg, initial_vector] = encryptedMessage.split("|");
        if (!initial_vector) throw new Error("Initial Vector not found");
        const decipher = crypto.createDecipheriv(
            process.env.ALGORITHM||"",
            getSecretKey(process.env.SECURITY_KEY||""),
          Buffer.from(initial_vector, "hex")
        );
        return decipher.update(encryptedMsg, "hex", "utf8") + decipher.final("utf8");
    }catch(error){
        err_logger.error("Could not decrypt message, Cyphertext might have changed.")
        return ""
    }
        
      
}

const generateMac = (sender:string,recipient:string, data:string) =>{
    return crypto.createHmac("sha256",recipient)
        .update(sender + data)
        .digest("hex")
}