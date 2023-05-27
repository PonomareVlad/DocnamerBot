import bot from "./bot.mjs";
import Utils from "./utils.mjs";

const {VERCEL_ENV, VERCEL_URL} = process.env;

if (VERCEL_ENV === "development") await bot.start();

await bot.api.setWebhook(new URL("api/update", `https://${VERCEL_URL}`), {secret_token: Utils.hash(bot.token)});

await Promise.all(Object.entries(Utils.getStringByLocales("bot-description")).map(([locale, string]) => {
    return bot.api.setMyShortDescription(string, {language_code: Utils.filterLocale(locale)}).catch(console.error);
}));

await Promise.all(Object.entries(Utils.getStringByLocales("bot-name")).map(([locale, string]) => {
    return bot.api.setMyName(string, {language_code: Utils.filterLocale(locale)}).catch(console.error);
}));
