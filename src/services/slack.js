const { WebClient } = require('@slack/web-api');
const config = require('../config');

const slackClient = new WebClient(config.SLACK_BOT_TOKEN);

async function sendDirectMessage(userId, text) {
    try {
        await slackClient.chat.postMessage({
            channel: userId,
            text: text,
        });
    } catch (error) {
        console.error('Error sending message to user:', error);
    }
}

async function handleCommand(command, userId) {
    // Process the command and respond accordingly
    if (command.startsWith('hello.')) {
        const domain = command;
        await sendDirectMessage(userId, `What DNS record do you want for ${domain}?`);
        // Further processing can be added here
    } else {
        await sendDirectMessage(userId, 'Invalid command. Please enter a valid domain.');
    }
}

module.exports = {
    sendDirectMessage,
    handleCommand,
};