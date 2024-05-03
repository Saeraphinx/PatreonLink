import { ActivityType, Client, Events } from "discord.js";
import { Event } from "../../classes/Event";
import { Bot } from "../../classes/Bot";

module.exports = {
    event: new Event({
        event: Events.ClientReady,
        once: false,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        execute: async function exec(bot: Bot, client: Client) {
            let number = 0;
            setTimeout(() => {
                number++;
                switch (number) {
                    case 1:
                        bot.user.setActivity({ name: `!bsr ff9`, type: ActivityType.Custom });
                        break;
                    case 2:
                        bot.user.setActivity({ name: `pink cute`, type: ActivityType.Custom });
                        break;
                    case 3:
                        bot.user.setActivity({ name: `1e6ff`, type: ActivityType.Playing });
                        break;
                    case 4:
                        bot.user.setActivity({ name: `11b7a`, type: ActivityType.Playing });
                        break;
                    case 5:
                        bot.user.setActivity({ name: `release the bees`, type: ActivityType.Custom });
                        break;
                    case 6:
                        bot.user.setActivity({ name: `what a beautiful stick`, type: ActivityType.Custom });
                        break;
                    case 7:
                        bot.user.setActivity({ name: `i will find you seedface`, type: ActivityType.Custom });
                        break;
                    case 8:
                        bot.user.setActivity({ name: `who needs so many seeds?`, type: ActivityType.Custom });
                        break;
                    case 9:
                        bot.user.setActivity({ name: `im just a simple seed enjoyer`, type: ActivityType.Custom });
                        break;
                    case 10:
                        bot.user.setActivity({ name: `dancing`, type: ActivityType.Custom });
                        break;
                    case 11:
                        bot.user.setActivity({ name: `walking`, type: ActivityType.Custom });
                        break;
                    case 12:
                        bot.user.setActivity({ name: `rearranging furniture`, type: ActivityType.Custom });
                        break;
                    case 13:
                        bot.user.setActivity({ name: `babs is`, type: ActivityType.Playing });
                        break;
                    case 14:
                        bot.user.setActivity({ name: `shopping`, type: ActivityType.Playing });
                        break;
                    case 15:
                        bot.user.setActivity({ name: `i let the bird out of the cage`, type: ActivityType.Playing });
                        break;
                    default:
                        break;
                }
                if (number >= 15) {
                    number = 0;
                }
            }, 1000 * 60 * 5);
        }
    })
};