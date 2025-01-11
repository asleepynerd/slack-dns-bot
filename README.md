# README.md

# Slack DNS Bot

A Slack bot that allows users to manage DNS records through Cloudflare by sending commands in Slack.

## Features

- Users can enter domain names and specify DNS records.
- The bot interacts with the Cloudflare API to create and manage DNS records.
- Direct messaging support for user interactions.

## Project Structure

```
slack-dns-bot
├── src
│   ├── index.js          # Entry point of the application
│   ├── config.js         # Configuration settings
│   ├── services
│   │   └── cloudflare.js  # Cloudflare API interactions
│   └── utils
│       └── validators.js   # Utility functions for validation
├── package.json           # npm configuration file
└── README.md              # Project documentation
```

## Setup Instructions

1. Clone the repository:

   ```
   git clone https://github.com/asleepynerd/slack-dns-bot.git
   cd slack-dns-bot
   ```

2. Install dependencies:

   ```
   yarn
   ```

3. Configure your config:

   ```bash
   cp src/config.example.js src/config.js
   cp .env.example .env
   ```

4. Fill in the required values in the `.env` file:

   ```
   SLACK_SIGNING_SECRET=
   SLACK_BOT_TOKEN=
   CLOUDFLARE_API_KEY=
   SLACK_APP_TOKEN=
   CLOUDFLARE_ZONE_ID=
   ```

   You can get these values by making a new app in [Slack](https://api.slack.com/apps) and creating a new app with the following bot scopes:

   ```
   channels:history
   chat:write
   im:write
   commands
   im:history
   ```

   You must enable socket mode, and create an app token.

   Then you must add event subscriptions for the following scopes:

   ```
   app_home_opened
   message.im
   message.channels
   ```

   For cloudflare, you must create a new API token with the following permissions:

   ```
   Zone.DNS.Edit
   Zone.Zone.Read
   ```

5. Start the bot:
   ```
   node src/index.js
   ```

## Usage

- Send a message in Slack with the format `hello.is-a-furry.dev` or `hello.is-a-furry.net`.
- The bot will prompt you for the DNS record you want to set up.
- Follow the instructions provided by the bot to complete the setup.
