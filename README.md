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

3. Configure your API keys in `.env`.

4. Start the bot:
   ```
   node src/index.js
   ```

## Usage

- Send a message in Slack with the format `hello.is-a-furry.dev` or `hello.is-a-furry.net`.
- The bot will prompt you for the DNS record you want to set up.
- Follow the instructions provided by the bot to complete the setup.
