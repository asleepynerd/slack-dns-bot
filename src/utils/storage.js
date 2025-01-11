const fs = require("fs/promises");
const path = require("path");

const USER_DATA_FILE = path.join(__dirname, "../../data/users.json");

const ensureDataDir = async () => {
  const dir = path.dirname(USER_DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
};

const readUserData = async () => {
  try {
    await ensureDataDir();
    const data = await fs.readFile(USER_DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
};

const saveUserData = async (data) => {
  await ensureDataDir();
  await fs.writeFile(USER_DATA_FILE, JSON.stringify(data, null, 2));
};

const addUserDomain = async (userId, domain, recordType, content) => {
  const userData = await readUserData();

  if (!userData[userId]) {
    userData[userId] = {
      domains: [],
    };
  }

  userData[userId].domains.push({
    domain,
    recordType,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await saveUserData(userData);
};

const getUserDomains = async (userId) => {
  const userData = await readUserData();
  return userData[userId]?.domains || [];
};

module.exports = {
  addUserDomain,
  getUserDomains,
};
