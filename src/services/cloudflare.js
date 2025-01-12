const config = require("../config");
const axios = require("axios");
require("dotenv").config();

const CLOUDFLARE_API_URL = "https://api.cloudflare.com/client/v4";
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const getZoneIdForDomain = (domain) => {
  const parts = domain.split(".");
  const baseDomain =
    parts.length > 2 ? parts.slice(-3).join(".") : parts.slice(-2).join(".");
  return config.cloudflareZones[baseDomain];
};

for (const key in config.cloudflareZones) {
  console.log(`CLOUDFLARE_ZONE_ID for ${key}: ${config.cloudflareZones[key]}`);
}

/**
 * Create a DNS record in Cloudflare
 * @param {string} domain - The domain name
 * @param {string} recordType - The type of DNS record (e.g., A, CNAME)
 * @param {string} content - The content of the DNS record (e.g., IP address)
 * @param {string} userId - The ID of the user creating the record
 * @param {boolean} [proxied=false] - Whether to use Cloudflare's proxy
 * @returns {Promise} - A promise that resolves to the response from the Cloudflare API
 */
const createDNSRecord = async (
  domain,
  recordType,
  content,
  userId,
  proxied = false,
  priority
) => {
  try {
    if (typeof domain !== "string") {
      throw new Error("Domain must be a string");
    }

    const parts = domain.split(".");
    const baseDomain =
      parts.length > 2
        ? `${parts[parts.length - 2]}.${parts[parts.length - 1]}`
        : domain;

    const zoneId = config.cloudflareZones[baseDomain];
    if (!zoneId) {
      throw new Error(`No zone ID found for domain: ${baseDomain}`);
    }

    const response = await axios.post(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records`,
      {
        type: recordType,
        name: domain,
        content: content,
        proxied: proxied,
        comment: `Created by Slack user: ${userId}`,
        priority: priority,
      },
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("DNS Record Creation Error:", error);
    throw new Error(`Failed to create DNS record: ${error.message}`);
  }
};

/**
 * List DNS records in Cloudflare
 * @param {string} zoneId - The ID of the Cloudflare zone
 * @returns {Promise} - A promise that resolves to the list of DNS records
 */
const listDNSRecords = async (zoneId) => {
  const url = `${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records`;

  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

const isDomainTaken = async (domain) => {
  console.log(`Checking if domain ${domain} is taken...`);

  try {
    const parts = domain.split(".");
    const tld = parts.pop();
    const sld = parts.pop();
    const baseDomain = `${sld}.${tld}`;

    console.log(`Base domain: ${baseDomain}`);
    const zoneId = config.cloudflareZones[baseDomain];

    if (!zoneId) {
      console.log(`No zone ID found for ${baseDomain}`);
      return false;
    }

    const response = await axios.get(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records`,
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );

    const records = response.data.result;
    console.log(`Found ${records.length} DNS records in zone`);

    const taken = records.some((record) => record.name === domain);
    console.log(`Domain ${domain} taken: ${taken}`);

    return taken;
  } catch (error) {
    console.error("Error checking domain:", error);
    return false;
  }
};

const deleteDNSRecord = async (domain) => {
  try {
    const parts = domain.split(".");
    const baseDomain =
      parts.length > 2
        ? `${parts[parts.length - 2]}.${parts[parts.length - 1]}`
        : domain;

    const zoneId = config.cloudflareZones[baseDomain];
    if (!zoneId) {
      throw new Error(`No zone ID found for domain: ${baseDomain}`);
    }

    const records = await axios.get(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records`,
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );

    const record = records.data.result.find((r) => r.name === domain);
    if (!record) {
      throw new Error(`No DNS record found for ${domain}`);
    }

    await axios.delete(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records/${record.id}`,
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );

    return true;
  } catch (error) {
    console.error("DNS Record Deletion Error:", error);
    throw new Error(`Failed to delete DNS record: ${error.message}`);
  }
};

const updateDNSRecord = async (domain, recordType, content, userId) => {
  try {
    const parts = domain.split(".");
    const baseDomain =
      parts.length > 2
        ? `${parts[parts.length - 2]}.${parts[parts.length - 1]}`
        : domain;

    const zoneId = config.cloudflareZones[baseDomain];

    const records = await axios.get(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records`,
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );

    const record = records.data.result.find((r) => r.name === domain);
    if (!record) {
      throw new Error(`No existing record found for ${domain}`);
    }

    await axios.put(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records/${record.id}`,
      {
        type: recordType,
        name: domain,
        content: content,
        proxied: record.proxied,
        comment: `Updated by Slack user: ${userId}`,
      },
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return true;
  } catch (error) {
    console.error("DNS Record Update Error:", error);
    throw new Error(`Failed to update DNS record: ${error.message}`);
  }
};

module.exports = {
  createDNSRecord,
    listDNSRecords,
  getZoneIdForDomain,
  isDomainTaken,
  deleteDNSRecord,
  updateDNSRecord,
};
