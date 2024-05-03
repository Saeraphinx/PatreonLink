import { Express } from 'express';
import { BeatLeaderAuthHelper } from '../classes/AuthHelper';
import { HTTPTools } from '../classes/HTTPTools';
import { DatabaseHelper, IDLookupType, IDType } from '../../Shared/Database';

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
            return res.redirect(302, BeatLeaderAuthHelper.getUrl(state));
        });

        this.app.get(`/api/auth/beatleader/callback`, async (req, res) => {
            const code = req.query[`code`].toString();
            const state = req.query[`state`].toString();
            if (state !== req.session.state) {
                return res.status(400).send({ error: `Invalid state.` });
            }
            let token = BeatLeaderAuthHelper.getToken(code);
            if (!token) { return res.status(400).send({ error: `Invalid code.` }); }
            let user = await BeatLeaderAuthHelper.getUser((await token).access_token);
            if (!user) { return res.status(500).send({ error: `Internal server error.` }); }

            let dbUser = await DatabaseHelper.getUser(user.id, IDLookupType.Game);

            switch (req.session.loginType) {
                case `login`:
                    if (!dbUser) {
                        res.status(401).send({ error: `BeatLeader registration not permitted.` });
                        return;
                    }
                    break;
                case `link`:
                    if (req.session.user.rId) {
                        if (dbUser) {
                            res.status(400).send({ error: `BeatLeader account already linked.` });
                            return;
                        }
                        dbUser.gameId = user.id;
                        dbUser.idType = user.platform === `steam` ? IDType.Steam : IDType.BeatLeaderID;
                        dbUser.save();
                    }
            }
            req.session.user.rId = dbUser.rId;
            req.session.loginType = null;
            return res.status(200).send({ message: `Successfully logged in.` });
        });
    }
}