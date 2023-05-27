import {Bot, InputFile} from "grammy";
import {StatelessQuestion} from "@grammyjs/stateless-question";

const {TELEGRAM_BOT_TOKEN} = process.env;

export const bot = new Bot(TELEGRAM_BOT_TOKEN);

const replyToDocumentFilter = ctx => !!ctx?.msg?.reply_to_message?.document?.file_id;

const getFileURL = file_path => `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file_path}`;

const nameQuestion = new StatelessQuestion("name", async (ctx, additionalState) => {
    const signal = AbortSignal.timeout(9_000);
    const {message_id, chat: {id}} = ctx.msg.reply_to_message;
    const {file_id, message_id: reply_to_message_id} = JSON.parse(additionalState);
    const options = {reply_markup: {remove_keyboard: true}, reply_to_message_id};
    await renameFile(ctx, file_id, ctx.msg.text, options, signal);
    await Promise.all([
        ctx.api.deleteMessage(id, message_id, signal),
        ctx.deleteMessage(signal)
    ]);
});

const composer = bot.errorBoundary(error => {
    const {ctx} = error;
    console.error(error);
    if (!ctx?.reply) return;
    const {message_id: reply_to_message_id} = ctx.msg;
    const message = "An error occurred, please try again later";
    const text = error.description || error.message || message;
    return ctx.reply(text, {reply_to_message_id});
});

composer.use(nameQuestion.middleware());

composer.on(":document", async ctx => {
    await ctx.replyWithChatAction("typing");
    await ctx.getFile();
    const {
        message_id,
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
    const additionalState = JSON.stringify({file_id, message_id});
    return ctx.reply(text + nameQuestion.messageSuffixMarkdown(additionalState), options);
});

composer.on(":text").filter(replyToDocumentFilter, async ctx => {
    const {
        document: {
            file_id
        } = {},
        message_id: reply_to_message_id
    } = ctx.msg.reply_to_message;
    const options = {reply_to_message_id};
    const signal = AbortSignal.timeout(9_000);
    await renameFile(ctx, file_id, ctx.msg.text, options, signal);
    await ctx.deleteMessage(signal);
});

composer.on("msg", async ctx => ctx.reply(`Send me any file (as document)`));

async function renameFile(ctx, file_id, filename, options, signal) {
    void ctx.replyWithChatAction("upload_document", undefined, signal);
    const {file_path} = await ctx.api.getFile(file_id, signal);
    const file = new InputFile(new URL(getFileURL(file_path)), filename);
    await ctx.replyWithDocument(file, options, signal);
}

export default bot;
