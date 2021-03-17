import UtilityCommands from ".";
import { Message } from "discord.js";
import { emojis } from "../../util";
import embeds from "../../util/embed";

export default class PollCommand extends UtilityCommands {
  cmdName = "poll";
  description = "Create a new poll message.";
  permission = "ACCESS";

  async run(message: Message, args: string[]) {
    const seperated = args.length ? args.join(" ").split("^") : null;
    if (!seperated || seperated.length <= 1)
      return message.channel.send(
        embeds.error(
          `Please send the question seperated from the options with **^**.`
        )
      );

    const question = seperated[0].trim();
    if (!question)
      return message.channel.send(
        embeds.error(
          `Please send the question seperated from the options with **^**.`
        )
      );
    seperated.shift();

    const pollOptions = seperated
      .map((option, i) => emojis[i] + " " + option.trim())
      .join("\n");
    const pollEmbed = await message.channel.send(
      embeds.normal(`Jarvis Polls`, question + "\n\n" + pollOptions)
    );

    for (const emoji of emojis.slice(0, pollOptions.length)) {
      await pollEmbed.react(emoji);
    }
  }
}
