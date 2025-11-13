declare module 'passport-apple' {
  import { Strategy as PassportStrategy } from 'passport';
  
  interface AppleStrategyOptions {
    clientID: string;
    teamID: string;
    keyID: string;
    privateKey: string;
    callbackURL: string;
    scope?: string[];
  }
  
  interface AppleProfile {
    id: string;
    email?: string;
    name?: {
      firstName?: string;
      lastName?: string;
    };
    displayName?: string;
  }
  
  export class Strategy implements PassportStrategy {
    name: string;
    authenticate(req: any, options?: any): void;
    constructor(
      options: AppleStrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        idToken: any,
        profile: AppleProfile,
        done: (error: any, user?: any) => void
      ) => void
    );
  }
}

