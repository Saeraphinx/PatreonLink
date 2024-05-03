import { Express } from 'express';
import { PatreonAuthHelper } from '../classes/AuthHelper';
import { HTTPTools } from '../classes/HTTPTools';
import { DatabaseHelper, IDLookupType, IDType } from '../../Shared/Database';

export class PatreonAuthRoutes {
    private app: Express;

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
    }

    private async loadRoutes() {
        this.app.get(`/api/auth/patreon`, async (req, res) => {
            const logintype = req.query[`type`].toString();
            if (logintype !== `login` && logintype !== `link`) {
                return res.status(400).send({ error: `Invalid login type.` });
            }
            req.session.loginType = logintype;
            let state = HTTPTools.createRandomString(16);
            req.session.state = state;
            return res.redirect(302, PatreonAuthHelper.getUrl(state));
        });

        this.app.get(`/api/auth/patreon/callback`, async (req, res) => {
            const code = req.query[`code`].toString();
            const state = req.query[`state`].toString();
            if (state !== req.session.state) {
                return res.status(400).send({ error: `Invalid state.` });
            }
            let token = PatreonAuthHelper.getToken(code);
            if (!token) { return res.status(400).send({ error: `Invalid code.` }); }
            let user = await PatreonAuthHelper.getUser((await token).access_token);
            if (!user) { return res.status(500).send({ error: `Internal server error.` }); }

            let dbUser = await DatabaseHelper.getUser(user.data.id, IDLookupType.Patreon);

            switch (req.session.loginType) {
                case `login`:
                    if (!dbUser) {
                        res.status(401).send({ error: `Patreon registration not complete.` });
                        dbUser = await DatabaseHelper.createUser({
                            patreonId: user.data.id,
                            patreonLevel: null,
                        });
                        if (!dbUser) {
                            res.status(500).send({ error: `Internal server error.` });
                            return;
                        }
                        return;
                    }
                    break;
                case `link`:
                    return res.status(400).send({ error: `Patreon account linking not supported.` });
            }
            req.session.user.rId = dbUser.rId;
            req.session.loginType = null;
            return res.status(200).send({ message: `Successfully logged in.` });
        });
    }
}