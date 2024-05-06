import path from "path";
import { exit } from "process";
import { DataTypes, InferAttributes, InferCreationAttributes, Model, ModelStatic, Sequelize } from "sequelize";
//@ts-ignore
import { storage } from '../../storage/config.json';
import { Logger } from "./Logger";

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
            console.log(`Initializing Database \"Helper\"...`);
            new DatabaseHelper(this);
        }).catch((error) => {
            console.error(`Error loading database: ${error}`);
            exit(-1);
        });
    }

    private async maintainDatabase() {
        let userdb = await this.users.findAll();
        for (let user of userdb) {
            if (!user.patreonId && !user.gameId && !user.discordId) {
                Logger.warn(`User ${user.rId} has no linked accounts, deleting.`);
                user.destroy();
                continue;
            }

            if (user.idType == null && user.gameId) {
                user.idType = IDType.Other;
                user.save();
                Logger.warn(`User ${user.rId} has no IDType, setting to Other.`);
            }
        }
    }

    private loadTables() {
        this.users = this.sequelize.define(`users`, {
            rId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            gameId: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
            },
            idType: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            discordId: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
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
            overridePatreonLevel : { //if null, then no override
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            isAdmin: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                get() {
                    let admin = this.getDataValue(`isAdmin`);
                    if (admin == true) {
                        Logger.warn(`Getting isAdmin for ${this.getDataValue(`rId`)}`);
                    }
                    return admin;
                },
                set(value: boolean) {
                    if (value == false) {
                        this.setDataValue(`isAdmin`, value);
                    } else {
                        Logger.warn(`Setting isAdmin for ${this.getDataValue(`rId`)} to ${value}`);
                        this.setDataValue(`isAdmin`, value);
                    }
                },
            },

        });
    }
}

export interface UserAttributes extends Model<InferAttributes<UserAttributes>, InferCreationAttributes<UserAttributes>> {
    rId: number;
    gameId?: string;
    idType?: IDType;
    discordId?: string;
    patreonId?: string;
    patreonLevel?: PatreonLevel;
    overridePatreonLevel?: PatreonLevel;
    isAdmin: boolean;
}

export enum IDType {
    Steam = 0,
    BeatLeaderID = 1,
    ScoreSaberID = 2,
    Other = 3,
}

export enum PatreonLevel {
    EarlyAccess = 10,   // $3.50
    LargeDonation = 20, // $7
    BigDonation = 30,   // $13.50
    SuperSecretPrivatePatreonLevelThatNoOneKnowsAboutBecauseItsNotRealAndOnlyExistsOnTheServerBTWPinkCute = 999,
}

export class DatabaseHelper {
    public static database: DatabaseManager;

    constructor(database: DatabaseManager) {
        DatabaseHelper.database = database;
        console.log(`Database \"Helper\" Initialized.`);
    }

    public static async getUser(id: string|number, idType: IDLookupType = IDLookupType.Game): Promise<UserAttributes | null> {
        switch (idType) {
            case IDLookupType.Game:
                return await DatabaseHelper.database.users.findOne({ where: { gameId: id } });
            case IDLookupType.Discord:
                return await DatabaseHelper.database.users.findOne({ where: { discordId: id } });
            case IDLookupType.Patreon:
                return await DatabaseHelper.database.users.findOne({ where: { patreonId: id } });
            case IDLookupType.Database:
                return await DatabaseHelper.database.users.findOne({ where: { rId: id } });
            default:
                return null;
        }
    }

    public static async createUser(content: {
        gameId?: string,
        idType?: IDType,
        discordId?: string,
        patreonId?: string,
        patreonLevel?: PatreonLevel,
        overridePatreonLevel?: PatreonLevel,
        isAdmin? : boolean,
    }): Promise<UserAttributes> {
        if (!content.isAdmin) content.isAdmin = false;
        if (content.gameId) {
            Logger.log(`Creating user with game ID ${content.gameId}`);
        } else if (content.discordId) {
            Logger.log(`Creating user with discord ID ${content.discordId}`);
        } else if (content.patreonId) {
            Logger.log(`Creating user with patreon ID ${content.patreonId}`);
        } else {
            Logger.log(`Creating user with no ID`);
        }

        return await DatabaseHelper.database.users.create(content);
    }

    public static async updateUser(user: UserAttributes, content: {
        gameId?: string,
        idType?: IDType,
        discordId?: string,
        patreonId?: string,
        patreonLevel?: PatreonLevel,
        overridePatreonLevel?: PatreonLevel,
        isAdmin?: boolean,
    }): Promise<UserAttributes | null> {
        if (!user) return null;
        await user.update(content);
        return user;
    }

    /*public static async deleteUser(user: UserAttributes): Promise<boolean> {
        if (!user) return false;
        await user.destroy();
        return true;
    }

    public static async deleteUser(id: string, idType: IDLookupType = IDLookupType.Game): Promise<boolean> {
        let user = await DatabaseHelper.getUser(id, idType);
        if (!user) return false;
        await user.destroy();
        return true;
    }*/
    public static async deleteUser(id: string|number, idType: IDLookupType): Promise<boolean>;
    public static async deleteUser(user: UserAttributes): Promise<boolean>;
    public static async deleteUser(id: string|number|UserAttributes, idType?:IDLookupType): Promise<boolean> {
        Logger.log(`Attempting to delete user ${id} with type ${idType}`);
        let user: UserAttributes;
        if (!idType) idType = IDLookupType.Game; // compatibility's sake
        if (typeof id == `string` || typeof id == `number`) {
            user = await DatabaseHelper.getUser(id, idType);
        } else {
            user = id;
        }
        if (!user) return false;
        await user.destroy();
        return true;
    }

}

export enum IDLookupType { 
    Game = 1,
    Discord = 2,
    Patreon = 3,
    Database = 4,
}