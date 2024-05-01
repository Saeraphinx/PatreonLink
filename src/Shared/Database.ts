import path from "path";
import { exit } from "process";
import { DataTypes, InferAttributes, InferCreationAttributes, Model, ModelStatic, Sequelize } from "sequelize";
import { storage } from '../../storage/config.json';

export class DatabaseManager {
    public sequelize: Sequelize;
    public users: ModelStatic<UserAttributes>;

    constructor() {
        this.sequelize = new Sequelize(`database`, `user`, `password`, {
            host: `localhost`,
            dialect: `sqlite`,
            logging: false,
            storage: path.resolve(storage.database),
        });

        console.log(`Loading Database...`);
        this.loadTables();
        this.sequelize.sync().then(() => {
            console.log(`Database Loaded.`);
        }).catch((error) => {
            console.error(`Error loading database: ${error}`);
            exit(-1);
        });
    }

    private loadTables() {
        this.users = this.sequelize.define(`users`, {
            gameId: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            signInPlatform: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            idType: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            patreonId: { //if null, then not a patreon user, manual add, level is static
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
            },
            patreonLevel: { //if null, then no patreon perks
                type: DataTypes.INTEGER,
                allowNull: true,
            },
        });
    }
}

export interface UserAttributes extends Model<InferAttributes<UserAttributes>, InferCreationAttributes<UserAttributes>> {
    gameId: string;
    patreonId: string;
    signInPlatform: SignInPlatform;
    idType: IDType;
    patreonLevel: PatreonLevel;
}

export enum SignInPlatform {
    BeatLeader = 1,
    ScoreSaber = 2,
}

export enum IDType {
    Steam = 0,
    OculusBeatLeader = 1,
    OculusScoreSaber = 2,
    Other = 3,
}

export enum PatreonLevel {
    EarlyAccess = 1,   // $3.50
    LargeDonation = 2, // $7
    BigDonation = 3,   // $13.50
}