import { Message } from "discord.js";
import dotenv from "dotenv";
import path from "path";
import { DocumentType } from "@typegoose/typegoose";
import User from "../models/user";
import { Groups } from "../commands";
import settings from "../settings";

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

export function toTitleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export async function react(message: Message, reactions: string[]) {
  for (const r of reactions) {
    if (
      !message.deleted &&
      !message.reactions.cache.map((x) => x.me && x.emoji.name).includes(r)
    )
      await message.react(r);
  }
}

export const emojis: string[] = [
  "🇦",
  "🇧",
  "🇨",
  "🇩",
  "🇪",
  "🇫",
  "🇬",
  "🇭",
  "🇮",
  "🇯",
  "🇰",
  "🇱",
  "🇲",
  "🇳",
  "🇴",
  "🇵",
  "🇶",
  "🇷",
  "🇸",
  "🇹",
  "🇺",
  "🇻",
  "🇼",
  "🇽",
  "🇾",
  "🇿",
];

export interface ISettings {
  ownerId: string;
  status: string;
  emojis: string[];
  mongoURL: string;
  spreadsheet: string;
  projectId: string;
}

export function permissionCheck(
  userData: DocumentType<User>,
  permissionType: string,
  module: Groups
) {
  if (
    permissionType.toLowerCase() === "access" &&
    !userData.access &&
    !userData.modules
      .map((x) => x.toLowerCase())
      .includes(module.toLowerCase()) &&
    !settings.ownerId.includes(userData.userId)
  )
    return false;
  else if (
    permissionType.toLowerCase() === "owner" &&
    !settings.ownerId.includes(userData.userId)
  )
    return false;

  return true;
}
