import bcrypt from "bcryptjs";
const jwt = require("jsonwebtoken");

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

export async function generateToken(
    data: { userId: string | number; refresh: boolean },
    expiresIn?: number
) {
    let tokenExpiry: number;

    if (expiresIn) {
        tokenExpiry = expiresIn;
    } else if (data.refresh) {
        tokenExpiry = 60 * 60 * 24 * 7; // 7 days for refresh token
    } else {
        tokenExpiry = 60 * 60; // 1 hour for access token
    }

    const token = jwt.sign(data, JWT_SECRET_KEY, { expiresIn: tokenExpiry });
    return token;
}

export async function verifyToken(token: string) {
    try {
        const data = jwt.verify(token, JWT_SECRET_KEY);
        return { valid: true, data };
    } catch (error: any) {
        return { valid: false, error: error.message };
    }
}

export async function encryptPassword(password: string) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error) {
        throw new Error("Error when trying to encrypt password");
    }
}

export async function checkEncryptedPassword(password: string, hash: string) {
    try {
        const match = await bcrypt.compare(password, hash)
        return match;
    } catch (error) {
        throw new Error("Error when trying to decrypt password")
    }
}