import UtilityCommands from ".";
import { Message } from "discord.js";
import { messageQuestion } from "../../util/questions";
import { react, emojis } from "../../util";
import embeds from "../../util/embed";

export default class PollCommand extends UtilityCommands {
  cmdName = "poll";
  description = "Create a new poll message.";
  permission = "ACCESS";

  async run(message: Message) {
    const questionQuestion = await messageQuestion(
      message,
      `What would you like the question to be?`
    );
    if (!questionQuestion) return;

    const question = questionQuestion.content;

    const pollOptionsQuestion = await messageQuestion(
      message,
      `Please provide all the poll options seperated by a **^**.`
    );
    if (!pollOptionsQuestion) return;

    const pollOptions = pollOptionsQuestion.content
      .split("^", 10)
      .map((x, i) => `${emojis[i]}. ${x}\n`);
    const pollEmbed = await message.channel.send(
      embeds.normal(`Polls`, `${question}\n\n${pollOptions.join("\n")}`)
    );

    for (let i = 0; i < pollOptions.length; i++) {
      await react(pollEmbed, [emojis[i]]);
    }
  }
}
