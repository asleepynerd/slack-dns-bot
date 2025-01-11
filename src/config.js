require("dotenv").config();

const config = {
  slackToken: process.env.SLACK_TOKEN || "your-slack-token-here",
  cloudflareEmail: process.env.CLOUDFLARE_EMAIL || "your-email@example.com",
  cloudflareApiKey: process.env.CLOUDFLARE_API_KEY || "your-cloudflare-api-key",
  
  cloudflareZones: {
    "is-a-furry.dev": process.env.CLOUDFLARE_ZONE_ID_DEV,
    "is-a-furry.net": process.env.CLOUDFLARE_ZONE_ID_NET,
    "sleeping.wtf": process.env.CLOUDFLARE_ZONE_ID_SLEEPING_WTF,
    "asleep.pw": process.env.CLOUDFLARE_ZONE_ID_ASLEEP_PW,
    "wagging.dev": process.env.CLOUDFLARE_ZONE_ID_WAGGING_DEV,
    "furries.pw": process.env.CLOUDFLARE_ZONE_ID_FURRIES_PW,
    "fluff.pw": process.env.CLOUDFLARE_ZONE_ID_FLUFF_PW,
    "floofy.pw": process.env.CLOUDFLARE_ZONE_ID_FLOOFY_PW,
    "died.pw": process.env.CLOUDFLARE_ZONE_ID_DIED_PW,
    "woah.pw": process.env.CLOUDFLARE_ZONE_ID_WOAH_PW,
    "trying.cloud": process.env.CLOUDFLARE_ZONE_ID_TRYING_CLOUD,
    "loves-being-a.dev": process.env.CLOUDFLARE_ZONE_ID_LOVES_BEING_A_DEV,
    "cant-be-asked.dev": process.env.CLOUDFLARE_ZONE_ID_CANT_BE_ASKED_DEV,
    "drinks-tea.uk": process.env.CLOUDFLARE_ZONE_ID_DRINKS_TEA_UK,
    "doesnt-give-a-fuck.org": process.env.CLOUDFLARE_ZONE_ID_DOESNT_GIVE_A_FUCK_ORG
  },
};

module.exports = config;
