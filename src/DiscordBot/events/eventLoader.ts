import { Bot } from "../classes/Bot";
import * as fs from "node:fs";
import path from "node:path";
import { Event } from "../classes/Event";

export function loadEvents(bot: Bot, eventsPath?: string) {

    let eventsDirectory: string;
    if (eventsPath) {
        eventsDirectory = eventsPath;
    } else {
        eventsDirectory = path.resolve(__dirname);
    }

    let commandCategories: string[] = fs.readdirSync(eventsDirectory, { withFileTypes: true })
        .filter(item => item.isDirectory())
        .map((item) => item.name);

    commandCategories.forEach(dir => {
        fs.readdirSync(path.join(eventsDirectory, dir), { withFileTypes: true })
            .filter((item) => !item.isDirectory() && item.name.endsWith(`.js`))
            .forEach(item => {
                let fileName: string = item.name;
                let filePath = path.join(eventsDirectory, dir, fileName);
                try {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const eventFile = require(filePath);
                    let event: Event = new Event(eventFile.event);
                    event.setupEvent(bot);
                    console.log(`loaded ` + fileName);
                } catch (error) {
                    bot.logger.error(`Error when trying to load \`${filePath}\`\n\`\`\`${error}\`\`\``, `commandLoader`);
                }
            });
    });
}