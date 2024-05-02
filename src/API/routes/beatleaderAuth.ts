import { Express } from 'express';
import { BeatLeaderAuthHelper, OAuth2Helper } from '../classes/AuthHelper';
import { oauth2, express } from '../../../storage/config.json';
import { HTTPTools } from '../classes/HTTPTools';
import { DatabaseHelper, IDLookupType, IDType, PrimarySignInPlatform } from '../../Shared/Database';

export class BeatLeaderAuthRoutes {
    private app: Express;

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
    }

    private async loadRoutes() {
        this.app.get(`/api/auth/beatleader`, async (req, res) => {
            const logintype = req.query[`type`].toString();
            if (logintype !== `login` && logintype !== `link`) {
                return res.status(400).send({ error: `Invalid login type.` });
            }
            req.session.loginType = logintype;
            let state = HTTPTools.createRandomString(16);
            req.session.state = state;
            return res.redirect(302, BeatLeaderAuthHelper.getBeatLeaderUrl(state, `${express.url}/api/auth/beatleader/callback`));
        });

        this.app.get(`/api/auth/beatleader/callback`, async (req, res) => {
            const code = req.query[`code`].toString();
            const state = req.query[`state`].toString();
            if (state !== req.session.state) {
                return res.status(400).send({ error: `Invalid state.` });
            }
            let token = OAuth2Helper.getToken(null, code, oauth2.beatleader, `${express.url}/api/auth/beatleader/callback`);
            if (!token) { return res.status(400).send({ error: `Invalid code.` }); }
            let user = await BeatLeaderAuthHelper.getUser((await token).access_token);
            if (!user) { return res.status(500).send({ error: `Internal server error.` }); }

            let dbUser = await DatabaseHelper.getUser(user.id, IDLookupType.Game);

            switch (req.session.loginType) {
                case `login`:
                    if (!dbUser) {
                        if (user.platform == `steam`) {
                            dbUser = await DatabaseHelper.createUser({
                                gameId: user.id,
                                primarySignInPlatform: PrimarySignInPlatform.BeatLeader,
                                idType: IDType.Steam,
                            });
                        } else {
                            dbUser = await DatabaseHelper.createUser({
                                gameId: user.id,
                                primarySignInPlatform: PrimarySignInPlatform.BeatLeader,
                                idType: IDType.BeatLeaderID,
                            });
                        }
                        if (!dbUser) {
                            return res.status(500).send({ error: `Internal server error.` });
                        }
                    }
                    break;
                case `link`:
                    
            }
            req.session.user.id = dbUser.gameId;
            return res.status(200).send({ message: `Successfully logged in.` });
        });
    }
}