import bot from "../src/bot.mjs";
import {hash} from "../src/utils.mjs";
import {webhookCallback} from "grammy";

export default webhookCallback(bot, "http", {secretToken: hash(bot.token)});
