import { connect } from "./db"
import crypto from "crypto"

// dotenv.config()
export const getMessagesForUser = async (user: string): Promise<string[]> => {
    let db = await connect();

    let messages: string[] = [];

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
        const  decryptedMessage = decryptMessage(row.data)
        messages.push(decryptedMessage);
    });

    return messages;
}

export const saveMessage = async (message: string, recipient: string) => {
    let db = await connect();
    
    const encryptedMessage = encryptMessage(message)

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
        const [encryptedMsg, initial_vector] = encryptedMessage.split("|");
        if (!initial_vector) throw new Error("Initial Vector not found");
        const decipher = crypto.createDecipheriv(
            process.env.ALGORITHM||"",
            getSecretKey(process.env.SECURITY_KEY||""),
          Buffer.from(initial_vector, "hex")
        );
        return decipher.update(encryptedMsg, "hex", "utf8") + decipher.final("utf8");
      
}