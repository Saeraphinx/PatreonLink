import { Express } from 'express';
import { DiscordAuthHelper } from '../classes/AuthHelper';
import { HTTPTools } from '../classes/HTTPTools';
import { DatabaseHelper, IDLookupType, IDType } from '../../Shared/Database';

export class DiscordAuthRoutes {
    private app: Express;

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
    }

    private async loadRoutes() {
        this.app.get(`/api/auth/discord`, async (req, res) => {
            const logintype = req.query[`type`].toString();
            if (logintype !== `login` && logintype !== `link`) {
                return res.status(400).send({ error: `Invalid login type.` });
            }
            req.session.loginType = logintype;
            let state = HTTPTools.createRandomString(16);
            req.session.state = state;
            return res.redirect(302, DiscordAuthHelper.getUrl(state));
        });

        this.app.get(`/api/auth/discord/callback`, async (req, res) => {
            const code = req.query[`code`].toString();
            const state = req.query[`state`].toString();
            if (state !== req.session.state) {
                return res.status(400).send({ error: `Invalid state.` });
            }
            let token = DiscordAuthHelper.getToken(code);
            if (!token) { return res.status(400).send({ error: `Invalid code.` }); }
            let user = await DiscordAuthHelper.getUser((await token).access_token);
            if (!user) { return res.status(500).send({ error: `Internal server error.` }); }

            let dbUser = await DatabaseHelper.getUser(user.id, IDLookupType.Discord);

            switch (req.session.loginType) {
                case `login`:
                    if (!dbUser) {
                        res.status(401).send({ error: `Discord registration not permitted.` });
                        return;
                    }
                    break;
                case `link`:
                    if (req.session.user.rId) {
                        if (dbUser) {
                            res.status(400).send({ error: `Discord account already linked.` });
                            return;
                        }
                        dbUser.discordId = user.id;
                        dbUser.save();
                    }
            }
            req.session.user.rId = dbUser.rId;
            req.session.loginType = null;
            return res.status(200).send({ message: `Successfully logged in.` });
        });

        this.app.delete(`/api/auth/discord`, async (req, res) => {
            if (!req.session.user.rId) {
                return res.status(401).send({ error: `Not logged in.` });
            }
            let dbUser = await DatabaseHelper.getUser(req.session.user.rId, IDLookupType.Database);
            if (!dbUser) {
                return res.status(500).send({ error: `Internal server error.` });
            }
            dbUser.discordId = null;
            dbUser.save();
            let accountDeleted = false;
            if (!dbUser.patreonId && !dbUser.gameId && !dbUser.discordId) {
                req.session.user.rId = null;
                dbUser.destroy();
                accountDeleted = true;
            }
            return res.status(200).send({ message: `Successfully unlinked Discord account.`, accountDeleted: accountDeleted });
        });
    }
}