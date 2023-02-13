import { connect } from "./db"

export const userExists = async (user: string): Promise<boolean> => {
    let db = await connect();

    let query = "SELECT id FROM Users WHERE user = :user;"
    const result = await db.get(query, {
        ':user': user,
    });

    if(!(result === undefined)){
        return typeof result.id === "number";
    }else{
        return false;
    }
}

export const getUserId = async (user: string): Promise<number> => {
    let db = await connect();

    let result = await db.get(`
        SELECT id FROM Users
        WHERE user = :user;
    `, {
        ":user": user,
    });

    return result;
}

export const getUserPassHash = async (user: string): Promise<string> => {
    let db = await connect();

    let result = await db.get(`
        SELECT hash FROM Users
        WHERE user = :user;
    `, {
        ":user": user,
    });

    return result.hash;
}

export const setUserPassHash = async (user: string, hash: string) => {
    let db = await connect();

    await db.run(`
        INSERT INTO Users
            (user, hash)
        VALUES
            (:user, :hash);
    `, {
        ":user": user,
        ":hash": hash,
    });
}

export const noUsers = async (user:string): Promise<boolean> => {
    let db = await connect();
    let result = await db.get(`SELECT COUNT(*) FROM Users WHERE user= :user;`,{":user":user});
    return Promise.resolve(result['COUNT(*)'] === 0);
}