import {InputFile} from "grammy";
import locales from "../l10n.json" assert {type: "json"};

export const fallbackLocale = "en";

export const filterLocale = locale => locale === fallbackLocale ? undefined : locale;

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

export function l10n() {
    return (ctx, next) => {
        const locale = locales[ctx.from?.language_code] || locales[fallbackLocale] || {};
        ctx.l = key => locale[key] || key;
        return next();
    }
}

export function getStringByLocales(key) {
    const entries = Object.entries(locales).map(([locale, strings = {}]) => [locale, strings[key]]);
    return Object.fromEntries(entries.filter(Boolean));
}

export {locales};

export default {
    replyToDocumentFilter,
    getStringByLocales,
    fallbackLocale,
    errorHandler,
    filterLocale,
    getFileURL,
    renameFile,
    locales,
    l10n,
}
