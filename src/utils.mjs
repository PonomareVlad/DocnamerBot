import {InputFile} from "grammy";

export const replyToDocumentFilter = ctx => !!ctx?.msg?.reply_to_message?.document?.file_id;

export const getFileURL = (file_path, token) => `https://api.telegram.org/file/bot${token}/${file_path}`;

export async function renameFile(ctx, file_id, filename, options, signal) {
    void ctx.replyWithChatAction("upload_document", undefined, signal);
    const {file_path} = await ctx.api.getFile(file_id, signal);
    const file = new InputFile(new URL(getFileURL(file_path)), filename);
    await ctx.replyWithDocument(file, options, signal);
}

export function errorHandler({ctx, error}) {
    console.error(error);
    if (!ctx?.reply) return;
    const {message_id: reply_to_message_id} = ctx.msg;
    const message = "An error occurred, please try again later";
    const text = error?.description || error?.message || message;
    return ctx.reply(text, {reply_to_message_id});
}
