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
        this.app.delete(`/api/auth`, async (req, res) => {
            if (!req.session.user.rId) {
                return res.status(401).send({ error: `Not logged in.` });
            }
            DatabaseHelper.deleteUser(req.session.user.rId, IDLookupType.Database);
            req.session.user.rId = null;
        });
    }
}