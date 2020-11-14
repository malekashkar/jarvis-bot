import { Message } from "discord.js";
import FunCommands from ".";
import dotenv from "dotenv";
import embeds from "../../util/embed";
import fetch from "node-fetch";

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

export default class TrendingCommand extends FunCommands {
  cmdName = "trending";
  description = "Here are the top 10 trending youtube videos.";
  permission = "ACCESS";

  async run(message: Message) {
    const params = new URLSearchParams({
      part: `contentDetails`,
      chart: `mostPopular`,
      regionCode: `US`,
      maxResults: (10).toString(),
    });

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos/?` + params,
      {
        headers: {
          Authorization: `Bearer ${process.env.YOUTUBE_API}`,
        },
      }
    );
    const youtubeResponse = (await res.json()) as YoutubeResult;
    if (!youtubeResponse)
      return message.channel.send(
        embeds.error(`The top 10 youtube videos could not be found!`)
      );

    const description = youtubeResponse.items
      .map((info, i) => `${i + 1}. https://www.youtube.com/watch?v=${info.id}`)
      .join("\n");

    return await message.channel.send(
      embeds.normal(`Youtube Top 10`, description)
    );
  }
}
