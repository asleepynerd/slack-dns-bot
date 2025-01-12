const { App, ignoreSelf } = require("@slack/bolt");
const {
  createDNSRecord,
  isDomainTaken,
  deleteDNSRecord,
  updateDNSRecord,
} = require("./services/cloudflare");
const { addUserDomain, getUserDomains } = require("./utils/storage");
const fs = require("fs/promises");
const path = require("path");
require("dotenv").config();
const cron = require("node-cron");
const { getDomainStats } = require("./utils/stats");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: "ERROR",
  ignoreSelf: true,
});

const loadBlocklist = async () => {
  const blocklistPath = path.join(__dirname, "../data/blocklist.txt");
  const content = await fs.readFile(blocklistPath, "utf8");
  return content.split("\n").filter(Boolean);
};

let lastStickyMessageId = null;

const getStickyMessage = async () => {
  const stats = await getDomainStats();

  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🌐 Available Domain Registration",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Want your own custom subdomain? Here's how:",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            "*Available Domains:*\n" +
            "• `.is-a-furry.dev` / `.is-a-furry.net`\n" +
            "• `.sleeping.wtf`\n" +
            "• `.asleep.pw`\n" +
            "• `.wagging.dev`\n" +
            "• `.furries.pw`\n" +
            "• `.fluff.pw`\n" +
            "• `.floofy.pw`\n" +
            "• `.died.pw`\n" +
            "• `.woah.pw`\n" +
            "• `.trying.cloud`\n" +
            "• `.loves-being-a.dev`\n" +
            "• `.cant-be-asked.dev`\n" +
            "• `.drinks-tea.uk`\n" +
            "• `.doesnt-give-a-fuck.org`",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            "*How to Register:*\n" +
            "1. Just type your desired subdomain in the chat (e.g. `mycool.is-a-furry.dev`)\n" +
            "2. Follow the bot's instructions in DM\n" +
            "3. Choose record type (A, CNAME, TXT)\n" +
            "4. Enter your record content\n\n" +
            "*Note:*\n" +
            "• Maximum 10 domains per user\n" +
            "• No 'www' subdomains\n" +
            "• SSL certificates must be handled by you",
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Need help? Contact <@U082FBF4MV5>",
          },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `📊 *Current Domain Stats:*\n` +
            `• Total Subdomains: \`${stats.totalSubdomains}\`\n` +
            `• Most Popular: \`${stats.mostPopular.domain}\` (${stats.mostPopular.count} subdomains)`,
        },
      },
    ],
  };
};

const updateStickyMessage = async () => {
  try {
    if (lastStickyMessageId) {
      try {
        await app.client.chat.delete({
          channel: process.env.SLACK_ANNOUNCEMENT_CHANNEL,
          ts: lastStickyMessageId,
        });
      } catch (error) {
        console.error("Error deleting previous message:", error);
      }
    }

    const result = await app.client.chat.postMessage({
      channel: process.env.SLACK_ANNOUNCEMENT_CHANNEL,
      ...(await getStickyMessage()),
    });

    lastStickyMessageId = result.ts;
  } catch (error) {
    console.error("Error updating sticky message:", error);
  }
};

cron.schedule("0 * * * *", updateStickyMessage);

app.message(async ({ message, client }) => {
  if (!message?.text || message.bot_id) return;

  console.log("Received message:", message.text);

  const urlRegex = /<http:\/\/(.*?)\|.*?>/;
  const match = message.text.match(urlRegex);
  const domain = match ? match[1] : message.text;

  const blocklist = await loadBlocklist();
  const subdomain = domain.split(".")[0].toLowerCase();

  if (blocklist.includes(subdomain)) {
    await client.chat.postMessage({
      channel: message.channel,
      //thread_ts: message.ts,
      text: `❌ Sorry, but the domain ${domain} is blocked.`,
    });
    return;
  }

  const domainPattern =
    /^[a-zA-Z0-9-_]+(\.[a-zA-Z0-9-_]+)*\.(is-a-furry\.(dev|net)|sleeping\.wtf|asleep\.pw|wagging\.dev|furries\.pw|fluff\.pw|floofy\.pw|died\.pw|woah\.pw|trying\.cloud|loves-being-a\.dev|cant-be-asked\.dev|drinks-tea\.uk|doesnt-give-a-fuck\.org)$/i;

  if (domainPattern.test(domain)) {
    try {
      //const threadTs = message.thread_ts || message.ts;

      if (domain.startsWith("www.")) {
        await client.chat.postMessage({
          channel: message.channel,
          //thread_ts: threadTs,
          text: `❌ Sorry, but 'www' subdomains cannot be registered.`,
        });
        return;
      }

      const userDomains = await getUserDomains(message.user);
      if (userDomains.length >= 10) {
        await client.chat.postMessage({
          channel: message.channel,
          //thread_ts: threadTs,
          text: `❌ Sorry, but you've already registered 10 domains. Please contact <@U082FBF4MV5> if you need more.`,
        });
        return;
      }

      if (await isDomainTaken(domain)) {
        await client.chat.postMessage({
          channel: message.channel,
          //thread_ts: threadTs,
          text: `Hey uhhh, that domains taken, sorry!`,
        });
        return;
      }
      await client.chat.postMessage({
        channel: message.channel,
        //thread_ts: threadTs,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Hey? you called? Check your DMs for more info on the domain ${domain}`,
            },
          },
        ],
      });
      await client.chat.postMessage({
        channel: message.user,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Hey you, yeah you! I noticed you want the domain ${domain}. Click the button below to create a DNS record for it.\n\n P.S (SSL must be handled by you)`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Open Modal",
                  emoji: true,
                },
                action_id: "open_domain_modal",
                value: domain,
              },
            ],
          },
        ],
      });
    } catch (error) {
      console.error("Error sending DM:", error);
    }
  }
});

app.action("open_domain_modal", async ({ ack, body, client }) => {
  await ack();
  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "dns_record_submit",
        private_metadata: body.actions[0].value,
        title: {
          type: "plain_text",
          text: "Create DNS Record",
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Domain: ${body.actions[0].value}`,
            },
          },
          {
            type: "input",
            block_id: "record_type",
            element: {
              type: "static_select",
              placeholder: {
                type: "plain_text",
                text: "Select record type",
              },
              options: [
                { text: { type: "plain_text", text: "A Record" }, value: "A" },
                {
                  text: { type: "plain_text", text: "AAAA Record" },
                  value: "AAAA",
                },
                {
                  text: { type: "plain_text", text: "CNAME Record" },
                  value: "CNAME",
                },
                {
                  text: { type: "plain_text", text: "MX Record" },
                  value: "MX",
                },
                {
                  text: { type: "plain_text", text: "NS Record" },
                  value: "NS",
                },
                {
                  text: { type: "plain_text", text: "TXT Record" },
                  value: "TXT",
                },
              ],
              action_id: "record_type_select",
            },
            label: {
              type: "plain_text",
              text: "Record Type",
            },
          },
          {
            type: "input",
            block_id: "record_content",
            element: {
              type: "plain_text_input",
              action_id: "record_content_input",
              placeholder: {
                type: "plain_text",
                text: "Enter record content",
              },
            },
            label: {
              type: "plain_text",
              text: "Record Content",
            },
          },
        ],
        submit: {
          type: "plain_text",
          text: "Create Record",
        },
      },
    });
  } catch (error) {
    console.error("Error opening modal:", error);
  }
});

app.action({}, async ({ ack, body, action, client }) => {
  await ack();
  console.log("DEBUG - Action received:", {
    action_id: action.action_id,
    block_id: action.block_id,
    type: action.type,
  });
});

app.action("record_type_select", async ({ ack, body, client }) => {
  await ack();

  console.log("Action triggered");
  console.log("Full body:", JSON.stringify(body, null, 2));
  console.log("View state:", body.view?.state?.values);
  console.log("Action ID:", body.action_id);

  const selectedType =
    body.view.state.values.record_type.record_type_select.selected_option.value;
  console.log("Selected type:", selectedType);

  let blocks = [...body.view.blocks];
  console.log("Current blocks:", blocks);

  blocks = blocks.filter((block) => block.block_id !== "mx_priority");

  if (selectedType === "MX") {
    const priorityBlock = {
      type: "input",
      block_id: "mx_priority",
      element: {
        type: "number_input",
        is_decimal_allowed: false,
        min_value: "0",
        max_value: "65535",
        action_id: "priority_input",
        initial_value: "10",
        placeholder: {
          type: "plain_text",
          text: "Enter MX priority (0-65535)",
        },
      },
      label: {
        type: "plain_text",
        text: "Priority",
      },
    };

    const recordTypeIndex = blocks.findIndex(
      (block) => block.block_id === "record_type"
    );
    console.log("Record type index:", recordTypeIndex);

    blocks.splice(recordTypeIndex + 1, 0, priorityBlock);
  }

  try {
    await client.views.update({
      view_id: body.view.id,
      view: {
        type: "modal",
        callback_id: body.view.callback_id,
        private_metadata: body.view.private_metadata,
        title: body.view.title,
        submit: body.view.submit,
        blocks: blocks,
      },
    });
    console.log("View updated successfully");
  } catch (error) {
    console.error("Error updating view:", error);
  }
});

app.view("dns_record_submit", async ({ ack, body, view, client }) => {
  await ack();

  try {
    const domain = String(view.private_metadata).trim();
    if (!domain) {
      throw new Error("Domain is required");
    }

    const taken = await isDomainTaken(domain);
    if (taken) {
      await client.chat.postMessage({
        channel: body.user.id,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `❌ The domain \`${domain}\` is already taken. Please contact <@U082FBF4MV5> or Josh for assistance.`,
            },
          },
        ],
      });
      return;
    }

    const recordType =
      view.state.values.record_type.record_type_select.selected_option.value;

    let priority = undefined;

    if (recordType === "MX") {
      priority = parseInt(view.state.values.mx_priority.priority_input.value);
      if (isNaN(priority) || priority < 0 || priority > 65535) {
        throw new Error(
          "Invalid MX priority. Please enter a number between 0 and 65535."
        );
      }
    }

    const content = view.state.values.record_content.record_content_input.value;

    await createDNSRecord(
      domain,
      recordType,
      content,
      body.user.id,
      false,
      priority
    );

    await addUserDomain(body.user.id, domain, recordType, content);

    const userDomains = await getUserDomains(body.user.id);
    const domainsCount = userDomains.length;

    await client.chat.postMessage({
      channel: body.user.id,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `✅ Created ${recordType} record for ${domain} pointing to ${content}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `You now have ${domainsCount} domain${
              domainsCount !== 1 ? "s" : ""
            } registered.`,
          },
        },
      ],
    });
  } catch (error) {
    console.error("Form submission error:", error);
    await client.chat.postMessage({
      channel: body.user.id,
      text: `❌ Error creating DNS record: ${error.message}`,
    });
  }
});

app.event("app_mention", async ({ event, say }) => {
  await say(`Hello! I'm listening for domain requests.`);
});

app.event("app_home_opened", async ({ event, client }) => {
  try {
    const userDomains = await getUserDomains(event.user);

    const domainBlocks = userDomains
      .map((domain) => [
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              `*${domain.domain}*\n` +
              `Type: \`${domain.recordType}\`\n` +
              `Points to: \`${domain.content}\`\n` +
              `Created: <!date^${Math.floor(
                new Date(domain.createdAt).getTime() / 1000
              )}^{date_pretty} at {time}|${domain.createdAt}>`,
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Edit Record",
              emoji: true,
            },
            action_id: "edit_domain_record",
            value: JSON.stringify({
              domain: domain.domain,
              recordType: domain.recordType,
              content: domain.content,
            }),
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "🗑️ Delete Record",
                emoji: true,
              },
              action_id: "delete_domain_record",
              style: "danger",
              value: JSON.stringify({
                domain: domain.domain,
                recordType: domain.recordType,
              }),
              confirm: {
                title: {
                  type: "plain_text",
                  text: "Delete DNS Record?",
                },
                text: {
                  type: "plain_text",
                  text: `Are you sure you want to delete ${domain.domain}?`,
                },
                confirm: {
                  type: "plain_text",
                  text: "Yes, Delete",
                },
                deny: {
                  type: "plain_text",
                  text: "Cancel",
                },
                style: "danger",
              },
            },
          ],
        },
      ])
      .flat();

    await client.views.publish({
      user_id: event.user,
      view: {
        type: "home",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🌐 Your Registered Domains",
              emoji: true,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `You have *${userDomains.length}* registered domain${
                userDomains.length !== 1 ? "s" : ""
              }.`,
            },
          },
          ...domainBlocks,
          {
            type: "divider",
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: "Need help? Contact <@U082FBF4MV5> for assistance.",
              },
            ],
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error updating app home:", error);
  }
});

app.action("edit_domain_record", async ({ ack, body, client }) => {
  await ack();
  try {
    const domainData = JSON.parse(body.actions[0].value);

    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "edit_record_submit",
        private_metadata: JSON.stringify(domainData),
        title: {
          type: "plain_text",
          text: "Edit DNS Record",
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Editing record for: ${domainData.domain}`,
            },
          },
          {
            type: "input",
            block_id: "record_type",
            element: {
              type: "static_select",
              initial_option: {
                text: {
                  type: "plain_text",
                  text: `${domainData.recordType} Record`,
                },
                value: domainData.recordType,
              },
              options: [
                {
                  text: { type: "plain_text", text: "A Record" },
                  value: "A",
                },
                {
                  text: { type: "plain_text", text: "CNAME Record" },
                  value: "CNAME",
                },
                {
                  text: { type: "plain_text", text: "TXT Record" },
                  value: "TXT",
                },
              ],
              action_id: "record_type_select",
            },
            label: {
              type: "plain_text",
              text: "Record Type",
            },
          },
          {
            type: "input",
            block_id: "record_content",
            element: {
              type: "plain_text_input",
              initial_value: domainData.content,
              action_id: "record_content_input",
            },
            label: {
              type: "plain_text",
              text: "Record Content",
            },
          },
        ],
        submit: {
          type: "plain_text",
          text: "Update Record",
        },
      },
    });
  } catch (error) {
    console.error("Error opening edit modal:", error);
  }
});

app.view("edit_record_submit", async ({ ack, body, view, client }) => {
  await ack();
  try {
    const domainData = JSON.parse(view.private_metadata);
    const domain = domainData.domain;
    const recordType =
      view.state.values.record_type.record_type_select.selected_option.value;
    const content = view.state.values.record_content.record_content_input.value;

    await updateDNSRecord(domain, recordType, content, body.user.id);

    const userData = await readUserData();
    const userDomains = userData[body.user.id]?.domains || [];
    userData[body.user.id] = {
      domains: userDomains.map((d) =>
        d.domain === domain
          ? { ...d, recordType, content, updatedAt: new Date().toISOString() }
          : d
      ),
    };
    await saveUserData(userData);

    await client.chat.postMessage({
      channel: body.user.id,
      text: `✅ Updated ${recordType} record for ${domain} to point to ${content}`,
    });
  } catch (error) {
    console.error("Edit submission error:", error);
    await client.chat.postMessage({
      channel: body.user.id,
      text: `❌ Error updating DNS record: ${error.message}`,
    });
  }
});

app.action("delete_domain_record", async ({ ack, body, client }) => {
  await ack();
  try {
    const { domain, recordType } = JSON.parse(body.actions[0].value);

    await deleteDNSRecord(domain);

    const userData = await readUserData();
    const userDomains = userData[body.user.id]?.domains || [];
    userData[body.user.id] = {
      domains: userDomains.filter((d) => d.domain !== domain),
    };
    await saveUserData(userData);

    await client.chat.postMessage({
      channel: body.user.id,
      text: `✅ Deleted ${recordType} record for ${domain}`,
    });

    await client.views.publish({
      user_id: body.user.id,
      view: {
        type: "home",
        blocks: await generateHomeBlocks(body.user.id),
      },
    });
  } catch (error) {
    console.error("Error deleting record:", error);
    await client.chat.postMessage({
      channel: body.user.id,
      text: `❌ Error deleting record: ${error.message}`,
    });
  }
});

(async () => {
  await app.start();
  console.log("⚡️ Slack bot is running!");
  //  await updateStickyMessage();
})();
cron.schedule("0 * * * *", updateStickyMessage);
