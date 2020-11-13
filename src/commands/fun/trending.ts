import { Message } from "discord.js";
import FunCommands from ".";
import dotenv from "dotenv";
import embeds from "../../util/embed";

dotenv.config();

export default class TrendingCommand extends FunCommands {
  cmdName = "trending";
  description = "Here are the top 10 trending youtube videos.";
  permission = "ACCESS";

  async run(message: Message) {
    const params = new URLSearchParams({
      part: `contentDetails`,
      chart: `mostPopular`,
      regionCode: `US`,
      key: process.env.YOUTUBE_API_KEY,
    });

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos/?` + params
    );
    const json = await res.json();

    if (!json)
      return message.channel.send(
        embeds.error(`The top 10 youtube videos could not be found!`)
      );

    for (const link of json.links) {
      message.channel.send(`https://www.youtube.com/watch?v=${link}`);
    }
  }
}
