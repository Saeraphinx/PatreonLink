//@ts-ignore
import { oauth2, express } from '../../../storage/config.json';

class OAuth2Helper {
    public static async getToken(url:string, code: string, oAuth2Data:{clientId:string, clientSecret:string}, callbackUrl:string): Promise<OAuth2Response | null> {
        if (!code || !oAuth2Data.clientId || !oAuth2Data.clientSecret || !callbackUrl || !url) {
            return null;
        }
        let tokenRequest = await fetch(url,
            {
                method: `POST`,
                body: new URLSearchParams({
                    'client_id': oAuth2Data.clientId,
                    'client_secret': oAuth2Data.clientSecret,
                    'grant_type': `authorization_code`,
                    'code': code,
                    'redirect_uri': callbackUrl,
                }),
                headers:
                {
                    'Content-Type': `application/x-www-form-urlencoded`
                }
            });

        const json: any = await tokenRequest.json();
        if (!json.access_token) {
            return null;
        } else {
            return json as OAuth2Response;
        }
    }

    protected static getRequestData(token: string) {
        return {
            method: `GET`,
            body: null as null,
            headers:
            {
                'Authorization': `Bearer ${token}`
            }
        };
    }
}

export interface OAuth2Response {
    token_type: string,
    access_token: string,
    expires_in: number,
    refresh_token?: string,
    scope: string,
}

export class BeatLeaderAuthHelper extends OAuth2Helper {
    private static readonly callbackUrl = `${express.url}/api/auth/beatleader/callback`;
    
    public static getUrl(state:string): string {
        return `https://api.beatleader.xyz/oauth2/authorize?client_id=${oauth2.beatleader.clientId}&response_type=code&scope=profile&redirect_uri=${BeatLeaderAuthHelper.callbackUrl}&state=${state}`;
    }

    public static getToken(code:string): Promise<OAuth2Response> {
        return super.getToken(`https://api.beatleader.xyz/oauth2/token`, code, oauth2.beatleader, `${express.url}/api/auth/beatleader/callback`);
    }

    public static async getUser(token: string): Promise<BeatLeaderMinimalUser | null> {
        const userIdRequest = await fetch(`https://api.beatleader.xyz/oauth2/identity`, super.getRequestData(token));
        const Idjson: BeatLeaderIdentify = await userIdRequest.json() as BeatLeaderIdentify;

        if (!Idjson.id) {
            return null;
        } else {
            const userRequest = await fetch(`https://api.beatleader.xyz/player/${Idjson.id}?stats=false`, super.getRequestData(token));
            const userJjson: BeatLeaderMinimalUser = await userRequest.json() as BeatLeaderMinimalUser;
            if (!userJjson.id) {
                return null;
            } else {
                return userJjson;
            }
        }
    }
}

export interface BeatLeaderIdentify {
    id: string,
    username: string,
}

export interface BeatLeaderMinimalUser {
    mapperId: number
    banned: boolean
    inactive: boolean
    banDescription: string
    externalProfileUrl: string
    id: string
    name: string
    platform: string
    avatar: string
    country: string
    bot: boolean
    role: string
    socials: {
        service: string
        userId: string
        user: string
        link: string
        playerId: string
    }[]
}

export class PatreonAuthHelper extends OAuth2Helper {
    private static readonly callbackUrl = `${express.url}/api/auth/patreon/callback`;

    public static getUrl(state: string): string {
        return `https://www.patreon.com/oauth2/authorize?client_id=${oauth2.patreon.clientId}&response_type=code&redirect_uri=${PatreonAuthHelper.callbackUrl}&state=${state}`;
    }

    public static getToken(code: string): Promise<OAuth2Response> {
        return super.getToken(`https://www.patreon.com/api/oauth2/token`, code, oauth2.patreon, PatreonAuthHelper.callbackUrl);
    }

    public static async getUser(token: string): Promise<PatreonUser | null> {
        const userRequest = await fetch(`https://www.patreon.com/api/oauth2/api/current_user`, super.getRequestData(token));
        const json: any = await userRequest.json();
        if (!json.data.id) {
            return null;
        } else {
            return json.data as PatreonUser;
        }
    }
}

export interface PatreonUser {
    data: {
      attributes: any,
      id: string,
      relationships: {
        pledges: {
          data: []
        }
      },
      type: any
    },
}

export class DiscordAuthHelper extends OAuth2Helper {
    private static readonly callbackUrl = `${express.url}/api/auth/discord/callback`;

    public static getUrl(state: string): string {
        return `https://discord.com/api/oauth2/authorize?client_id=${oauth2.discord.clientId}&response_type=code&scope=identify&redirect_uri=${DiscordAuthHelper.callbackUrl}&state=${state}`;
    }

    public static getToken(code: string): Promise<OAuth2Response> {
        return super.getToken(`https://discord.com/api/oauth2/token`, code, oauth2.discord, DiscordAuthHelper.callbackUrl);
    }

    public static async getUser(token: string): Promise<DiscordUser | null> {
        const userRequest = await fetch(`https://discord.com/api/users/@me`, super.getRequestData(token));
        const json: any = await userRequest.json();
        if (!json.id) {
            return null;
        } else {
            return json as DiscordUser;
        }
    }
}

export interface DiscordUser {
    id: string,
    username: string,
    discriminator: string,
    global_name: string,
    avatar: string,
    bot?: boolean,
    system?: boolean,
    mfa_enabled?: boolean,
    banner?: string,
    accent_color?: number,
    locale?: string,
    verified?: boolean,
    email?: string,
    flags?: number,
    premium_type?: number,
    public_flags?: number,
    avatar_decoration?: string,
}

// eslint-disable-next-line quotes
declare module 'express-session' {
    export interface Session {
        state: string;
        loginType: "login" | "link" | null;
        simpleRegister: boolean;
        user: {
            rId: number,
        };
    }
}