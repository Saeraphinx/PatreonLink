/* eslint-disable @typescript-eslint/ban-types */
import { Events } from "discord.js";
import { Bot } from "./Bot";

export class Event {
    public event: string;
    public execute: Function;
    public once: boolean = false;

    constructor(eventConfig: IEvent) {
        this.event = eventConfig.event;
        this.execute = eventConfig.execute;
        if (eventConfig.once == true) {
            this.once = true;
        }
    }

    public setupEvent(bot: Bot) {
        if (this.once) {
            bot.once(this.event, (...args) => {
                this.execute(bot, ...args);
            });
        } else {
            bot.on(this.event, (...args) => {
                this.execute(bot, ...args);
            });
        }
    }
}

export interface IEvent {
    event:Events;
    execute:Function;
    once?:boolean;
}