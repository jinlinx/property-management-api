import { sign, verify } from 'jsonwebtoken'
import { readFileSync } from 'fs';

export interface IJWTPayload {
    expiresIn?: string | number | undefined; //1d, 1h, num in seconds
    [key: string]: any;
}

function loadJwtKey(): string| Buffer {
    let pk = process.env.JWT_PRIVATE_KEY || readFileSync('keys/ec-jwt-private-key.pem');
    return pk;
}
export function signJwt(payload: IJWTPayload) {
    const pk = loadJwtKey();
    if (!payload.expiresIn) {
        payload.expiresIn = 7200;
    }
    return sign(payload, pk, {
        algorithm: 'ES256',
        issuer: 'PM',
        audience: 'PM',
        expiresIn: payload.expiresIn
    })
}

export function verifyJwt(token: string) {
    const pk = process.env.JWT_PUBLIC_KEY || readFileSync('keys/ec-jwt-public-key.pem');
    return verify(token, loadJwtKey(), {
        algorithms:['ES256']
    });
}