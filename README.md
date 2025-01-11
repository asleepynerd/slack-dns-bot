# Slack DNS Bot: Manage DNS Records in Cloudflare

A Slack bot that allows users to manage DNS records through Cloudflare by
sending commands in Slack.

## Overview

The Slack DNS Bot is a simple and intuitive tool for managing DNS records
in Cloudflare. With this bot, you can create, update, and delete DNS
records directly from your Slack channel.

## Features

- **Domain Management**: Users can enter domain names and specify DNS
  records.
- **Cloudflare Integration**: The bot interacts with the Cloudflare API to
  create and manage DNS records.
- **Direct Messaging Support**: Users can interact with the bot through
  direct messages in Slack.

## Project Structure

Our project is organized into the following directories:

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

### Step 1: Clone the Repository

Clone this repository using the following command:

```bash
git clone https://github.com/asleepynerd/slack-dns-bot.git
cd slack-dns-bot
```

### Step 2: Install Dependencies

Install the required dependencies using yarn:

```
yarn
```

### Step 3: Configure Your Bot

Copy the example configuration files:

```bash
cp src/config.example.js src/config.js
cp .env.example .env
```

Fill in the required values in the `.env` file:

- `SLACK_SIGNING_SECRET=`
- `SLACK_BOT_TOKEN=`
- `CLOUDFLARE_API_KEY=`
- `SLACK_APP_TOKEN=`
- `CLOUDFLARE_ZONE_ID=`

You can obtain these values by creating a new app on [Slack](https://api.slack.com/apps) and setting up the following bot scopes:

- `channels:history`
- `chat:write`
- `im:write`
- `commands`
- `im:history`

### Step 4: Start the Bot

Start the bot by running:

```
node src/index.js
```

## Usage

To use the bot, simply send a message in Slack with the format `<domain_name>`. The bot will prompt you for the DNS record you want to set up. Follow the instructions provided by the bot to complete
the setup.

### Examples:

- `hello.is-a-furry.dev`
- `hello.is-a-furry.net`
