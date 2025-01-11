require("dotenv").config();

const config = {
  slackToken: process.env.SLACK_TOKEN || "your-slack-token-here",
  cloudflareEmail: process.env.CLOUDFLARE_EMAIL || "your-email@example.com",
  cloudflareApiKey: process.env.CLOUDFLARE_API_KEY || "your-cloudflare-api-key",

  cloudflareZones: {
    "somedomain.here": process.env.CLOUDFLARE_ZONE_SMTH,
  },
};

module.exports = config;
