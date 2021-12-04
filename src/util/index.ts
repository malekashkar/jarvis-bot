import dotenv from "dotenv";
import path from "path";
import { DocumentType } from "@typegoose/typegoose";
import User from "../models/user";
import { Groups } from "../commands";
import settings from "../settings";
import fetch from "node-fetch";

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

export const toTitleCase = (str: String) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export async function imgurImage(query: string) {
  const response = await fetch(`https://imgur.com/r/${query}/hot.json`);
  if (!response.ok) return null;

  const data = await response.json();
  const randomData = data.data[Math.floor(Math.random() * data.data.length)];
  return `https://i.imgur.com/${randomData.hash}${randomData.ext}`;
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
    (!userData.access ||
      !userData.modules
        .map((x) => x.toLowerCase())
        .includes(module.toLowerCase())) &&
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
 
export function parseToInteger(str: string) {
   let match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
     str
   );
   if (!match) return null;

   const n = parseInt(match[1]);
   const type = (match[2] || 'ms').toLowerCase();

   switch (type) {
     case 'years':
     case 'year':
     case 'yrs':
     case 'yr':
     case 'y':
       return n * 1000 * 60 * 60 * 24 * 365.25;
     case 'weeks':
     case 'week':
     case 'w':
       return n * 1000 * 60 * 60 * 24 * 7;
     case 'days':
     case 'day':
     case 'd':
       return n * 1000 * 60 * 60 * 24;
     case 'hours':
     case 'hour':
     case 'hrs':
     case 'hr':
     case 'h':
       return n * 1000 * 60 * 60;
     case 'minutes':
     case 'minute':
     case 'mins':
     case 'min':
     case 'm':
       return n * 1000 * 60 ;
     case 'seconds':
     case 'second':
     case 'secs':
     case 'sec':
     case 's':
       return n * 1000;
     case 'milliseconds':
     case 'millisecond':
     case 'msecs':
     case 'msec':
     case 'ms':
       return n;
     default:
       return undefined;
   }
 }