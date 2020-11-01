import { Message } from "discord.js";
import embeds from "./embed";
import { emojis as emojiList, react } from "./index";

export async function confirmator(
  message: Message,
  confirmationMessage: string,
  userId?: string
) {
  const reactionUserId = userId || message.author.id;
  const questionMessage = await message.channel.send(
    embeds.question(confirmationMessage + `\nClick the ✅ below to confirm.`)
  );

  await react(questionMessage, ["✅"]);

  const reactionCollector = await questionMessage.awaitReactions(
    (r, u) => u.id === reactionUserId && r.emoji.name === "✅",
    { max: 1, time: 900000, errors: ["time"] }
  );

  if (questionMessage.deletable) await questionMessage.delete();

  if (
    !reactionCollector ||
    !reactionCollector.size ||
    !reactionCollector.first()
  )
    return false;
  return true;
}

export async function optionReactQuestion(
  message: Message,
  question: string,
  options: string[],
  userId?: string
) {
  const emojis = emojiList.slice(0, emojiList.length);
  const reactionUserId = userId || message.author.id;
  const questionOptions = options.map((x, i) => `${emojis[i]} ${x}`);
  const questionMessage = await message.channel.send(
    embeds.question(question + questionOptions)
  );

  await react(questionMessage, emojis);

  const reactionCollector = await questionMessage.awaitReactions(
    (r, u) => u.id === reactionUserId && emojis.includes(r.emoji.name),
    { max: 1, time: 900000, errors: ["time"] }
  );

  if (questionMessage.deletable) await questionMessage.delete();
  return reactionCollector.first();
}

export async function messageQuestion(
  message: Message,
  question: string,
  userId?: string,
  options?: string[]
) {
  const reactionUserId = userId || message.author.id;
  const questionMessage = await message.channel.send(embeds.question(question));

  const messageCollector = await message.channel.awaitMessages(
    (x) =>
      x.author.id === reactionUserId && options.length
        ? options.includes(x.content)
        : true,
    { max: 1, time: 900000, errors: ["time"] }
  );

  if (questionMessage.deletable) await questionMessage.delete();
  if (messageCollector.first().deletable)
    await messageCollector.first().delete();

  return messageCollector.first();
}

export async function getTaggedUser(
  message: Message,
  question: string,
  userId?: string
) {
  const reactionUserId = userId || message.author.id;
  const questionMessage = await message.channel.send(embeds.question(question));

  const messageCollector = await message.channel.awaitMessages(
    (x) =>
      x.author.id === reactionUserId &&
      x.mentions.users &&
      x.mentions.users.size,
    { max: 1, time: 900000, errors: ["time"] }
  );

  if (questionMessage.deletable) await questionMessage.delete();
  if (messageCollector.first().deletable)
    await messageCollector.first().delete();

  return messageCollector.first().mentions.users.first();
}
