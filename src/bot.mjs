import {Bot, InputFile} from "grammy";
import {StatelessQuestion} from "@grammyjs/stateless-question";

const {TELEGRAM_BOT_TOKEN} = process.env;

export const bot = new Bot(TELEGRAM_BOT_TOKEN);

const nameQuestion = new StatelessQuestion("name", async (ctx, file_id) => {
    const signal = AbortSignal.timeout(9_000);
    await ctx.replyWithChatAction("upload_document", undefined, signal);
    const {file_path} = await ctx.api.getFile(file_id, signal);
    const file = new InputFile(new URL(getFileURL(file_path)), ctx.msg.text);
    await ctx.replyWithDocument(file, {reply_markup: {remove_keyboard: true}}, signal);
});

bot.use(nameQuestion.middleware());

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
        const {
            document: {
                file_id,
                file_name = "file.txt"
            } = {}
        } = ctx.msg;
        const options = {
            parse_mode: "Markdown",
            reply_markup: {
                force_reply: true,
                input_field_placeholder: file_name,
            },
        };
        const text = `Send new file name including extension`;
        return ctx.reply(text + nameQuestion.messageSuffixMarkdown(file_id), options);
    } catch (error) {
        return errorHandler(error, ctx);
    }
});

bot.on("message", async ctx => ctx.reply(`Send me any file (as document)`));

bot.catch(({error, ctx}) => errorHandler(error, ctx));

export default bot;
