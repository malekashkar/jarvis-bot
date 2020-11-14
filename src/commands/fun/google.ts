import { Message } from "discord.js";
import FunCommands from ".";
import dotenv from "dotenv";
import embeds from "../../util/embed";
import fetch from "node-fetch";
import { messageQuestion } from "../../util/questions";

dotenv.config();

interface YoutubeResult {
  kind?: string;
  etag?: string;
  items?: {
    kind?: string;
    etag?: string;
    id?: string;
    contentDetails?: any;
  }[];
  nextPageToken?: string;
  pageInfo?: {
    totalResults?: number;
    resultsPerPage?: number;
  };
}

export default class GoogleCommand extends FunCommands {
  cmdName = "google";
  description = "Get the top 10 results of a specific search.";
  permission = "ACCESS";

  async run(message: Message) {
    const searchQuery = await messageQuestion(
      message,
      `What would you like to search for?`
    );
    if (!searchQuery) return;

    const params = new URLSearchParams({
      q: searchQuery.content,
      num: (10).toString(),
    });

    const res = await fetch(
      `https://customsearch.googleapis.com/customsearch/v1?` + params,
      {
        headers: {
          Authorization: `Bearer ${process.env.GOOGLE_API}`,
        },
      }
    );
    const googleResponse = (await res.json()) as any;
    if (!googleResponse)
      return message.channel.send(
        embeds.error(
          `Google didn't seem to be able to find any answers for you!`
        )
      );

    console.log(googleResponse, googleResponse.error.errors);
  }
}
