import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '@/config/env';

const SALT_ROUNDS = 10;

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

// Compare password with hash
export const comparePassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

// JWT Token Payload Interface
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}

// Generate Access Token
export const generateAccessToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
};

// Generate Refresh Token
export const generateRefreshToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);
};

// Verify Access Token
export const verifyAccessToken = (token: string): JWTPayload => {
    try {
        const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('TOKEN_EXPIRED');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('INVALID_TOKEN');
        }
        throw new Error('TOKEN_VERIFICATION_FAILED');
    }
};

// Verify Refresh Token
export const verifyRefreshToken = (token: string): JWTPayload => {
    try {
        const decoded = jwt.verify(
            token,
            config.jwt.refreshSecret
        ) as JWTPayload;
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('REFRESH_TOKEN_EXPIRED');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('INVALID_REFRESH_TOKEN');
        }
        throw new Error('REFRESH_TOKEN_VERIFICATION_FAILED');
    }
};

// Generate both tokens
export const generateTokens = (
    payload: JWTPayload
): { accessToken: string; refreshToken: string } => {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
};
