import {Bot, InputFile} from "grammy";
import {code, hydrateReply} from "@grammyjs/parse-mode";

const {TELEGRAM_BOT_TOKEN} = process.env;

export const bot = new Bot(TELEGRAM_BOT_TOKEN);

bot.use(hydrateReply);

const errorHandler = (error, ctx) => {
    console.error(error);
    if (!ctx?.reply) return;
    const {message_id: reply_to_message_id} = ctx.msg;
    const message = "An error occurred, please try again later";
    return ctx.reply(error.description || error.message || message, {reply_to_message_id});
}

const getFileURL = file_path => {
    return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file_path}`;
}

bot.on(":document", async ctx => {
    try {
        await ctx.replyWithChatAction("typing");
        await ctx.getFile();
        const {message_id: reply_to_message_id, document: {file_name = "file.txt"} = {}} = ctx.msg;
        const text = `Select your message and reply to it with new file name, for example:`;
        await ctx.reply(text, {reply_to_message_id});
        return ctx.replyFmt(code(file_name), {reply_to_message_id});
    } catch (error) {
        return errorHandler(error, ctx);
    }
});

bot.on("message", async ctx => {
    try {
        const {text, reply_to_message: {document: {file_id} = {}} = {}} = ctx.msg;
        if (!file_id) return ctx.reply(`Send me any file (as document)`);
        const signal = AbortSignal.timeout(9_000);
        await ctx.replyWithChatAction("upload_document", undefined, signal);
        const {file_path} = await ctx.api.getFile(file_id, signal);
        const file = new InputFile(new URL(getFileURL(file_path)), text);
        return ctx.replyWithDocument(file, undefined, signal);
    } catch (error) {
        return errorHandler(error, ctx);
    }
});

bot.catch(({error, ctx}) => errorHandler(error, ctx));

export default bot;
