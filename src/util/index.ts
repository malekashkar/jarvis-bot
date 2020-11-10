import { Message } from "discord.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

export function toTitleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export async function react(message: Message, reactions: string[]) {
  for (const r of reactions) {
    if (!message.deleted) await message.react(r);
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

export interface Information {
  trouble_code_1: string;
  tow_distance: string;
  er_distance: string;
  completed: string;
  company: string;
  call_id: string;
  payment: string;
  level: string;
  color: string;
  model: string;
  year: string;
  make: string;
  images: string[];
  apd: string[];
}

export async function imgurImage(query: string) {
  const response = await fetch(`https://imgur.com/r/${query}/hot.json`);
  if (!response.ok) return null;

  const data = await response.json();
  const randomData = data.data[Math.floor(Math.random() * data.data.length)];
  const imageLink = `https://i.imgur.com/${randomData.hash}${randomData.ext}`;

  return imageLink;
}

export async function uploadImage(image: string) {
  const response = await fetch(`https://api.imgur.com/3/image`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer a3c62e2303d0b422c922225d8d9d3e89794cb3ed`,
    },
    body: JSON.stringify({
      image,
    }),
    method: "POST",
  });
  return ((await response.json()).data.link || image) as string;
}
