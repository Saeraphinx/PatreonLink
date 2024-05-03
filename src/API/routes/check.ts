import { Express } from 'express';
import { DatabaseHelper, IDLookupType, IDType } from '../../Shared/Database';

export class PatreonAuthRoutes {
    private app: Express;

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
    }

    private async loadRoutes() {
        this.app.get(`/api/check`, async (req, res) => {
            const userId = req.query[`id`].toString();

            let user = await DatabaseHelper.getUser(userId, IDLookupType.Game);
            if (!user) return res.status(200).send({ patreonLevel: 0 });
            if (user.overridePatreonLevel) return res.status(200).send({ patreonLevel: user.overridePatreonLevel });
            if (!user.patreonLevel) return res.status(200).send({ patreonLevel: 0 });
            return res.status(200).send({ patreonLevel: user.patreonLevel });
        });
    }
}