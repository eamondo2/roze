import "dotenv/config";
import fetch from "node-fetch";
import { verifyKey } from "discord-interactions";
import { InteractionResponseType } from "discord-interactions";

import steamIdResolver from "steamid-resolver";

function VerifyDiscordRequest(clientKey) {
  return function (req, res, buf, encoding) {
    if (req.url !== "/discord") {
      return;
    }

    const signature = req.get("X-Signature-Ed25519");
    const timestamp = req.get("X-Signature-Timestamp");

    const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);
    if (!isValidRequest) {
      res.status(401).send("Bad request signature");
      throw new Error("Bad request signature");
    }
  };
}

async function DiscordRequest(endpoint, options) {
  const url = "https://discord.com/api/v10/" + endpoint;
  if (options.body) options.body = JSON.stringify(options.body);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      "Content-Type": "application/json; charset=UTF-8",
      "User-Agent": "DiscordBot (https://github.com/zkhr/roze, 1.0.0)",
    },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json();
    console.log(`Got ${res.status} from [${url}]`);
    throw new Error(JSON.stringify(data));
  }
  return res;
}

async function postMessage(channelId, content) {
  try {
    await DiscordRequest(`/channels/${channelId}/messages`, {
      method: "POST",
      body: { content },
    });
  } catch (err) {
    console.error(err);
  }
}


/**
 * 
 * @param {String} steamName Vanity URL/screen name of user
 * @returns {String} SteamID64 as string for user in question if valid, error if invalid.
 */
async function attemptResolveSteamID(steamName) {
  let resolvedSteamID64;
  try {
    resolvedSteamID64 = await steamIdResolver.customUrlToSteamID64(steamName);
  } catch (e) {
    console.error(`Error fetching SteamID64 for given username: ${steamName}`);
    console.error(`Error message: ${e}`);
    resolvedSteamID64 = undefined;
  }

  return resolvedSteamID64;
}

export { VerifyDiscordRequest, DiscordRequest, postMessage, attemptResolveSteamID };
