import { CommandInteraction, Interaction, Message } from "discord.js";
import embeds from "./embed";
import { emojis as emojiList } from "./index";

export async function confirmator(
  interaction: CommandInteraction,
  confirmationMessage: string,
  userId?: string
) {
  const reactionUserId = userId || interaction.user.id;
  const questionMessage = await interaction.channel.send({
    embeds: [embeds.question(confirmationMessage + `\nClick the ✅ below to confirm.`)]
  });
  for (const emoji of ["✅", "❎"]) {
    await questionMessage.react(emoji);
  }

  const reactionCollector = await questionMessage.awaitReactions({
    filter: (r, u) =>
      (u.id === reactionUserId && r.emoji.name === "✅") ||
      (u.id === reactionUserId && r.emoji.name === "❎"),
    max: 1,
    time: 900000,
    errors: ["time"]
  });

  if (questionMessage.deletable) await questionMessage.delete();

  if (reactionCollector?.first()?.emoji?.name === "❎") return false;
  return true;
}

export async function optionReactQuestion(
  message: Message,
  question: string,
  options: string[],
  userId?: string
) {
  const emojis = emojiList.slice(0, options.length);
  const reactionUserId = userId || message.author.id;
  const questionOptions = options.map((x, i) => `${emojis[i]} ${x}`);
  const questionMessage = await message.channel.send({
    embeds: [embeds.question(question + `\n\n${questionOptions.join("\n")}`)]
  });
  for (const emoji of emojis) {
    await questionMessage.react(emoji);
  }

  const reactionCollector = await questionMessage.awaitReactions({
    filter: (r, u) => u.id === reactionUserId && emojis.includes(r.emoji.name),
    max: 1,
    time: 900000,
    errors: ["time"]
  });

  if (questionMessage.deletable) await questionMessage.delete();
  return reactionCollector
    ? options[emojis.indexOf(reactionCollector.first().emoji.name)]
    : null;
}

export async function messageQuestion(
  interaction: Interaction,
  question: string,
  userId?: string,
  options?: string[]
) {
  const reactionUserId = userId || interaction.user.id;
  const questionMessage = await interaction.channel.send({ embeds: [embeds.question(question)] });

  const messageCollector = await interaction.channel.awaitMessages({
    filter: (x) =>
      x.author.id === reactionUserId &&
      (options && options.length ? options.includes(x.content) : true),
    max: 1,
    time: 900000,
    errors: ["time"]
  });

  if (questionMessage.deletable) await questionMessage.delete();
  if (messageCollector?.first()?.deletable)
    await messageCollector.first().delete();

  return messageCollector?.first();
}

export async function messageQuestionOrCancel(
  interaction: Interaction,
  question: string,
  userId?: string,
  options?: string[]
) {
  const reactionUserId = userId || interaction.user.id;
  const questionMessage = await interaction.channel.send({ embeds: [embeds.question(question)] });

  const messageCollector = await interaction.channel.awaitMessages({
    filter: (x) =>
      x.author.id === reactionUserId &&
      (options && options.length ? options.includes(x.content) : true),
    max: 1,
    time: 900000,
    errors: ["time"]
  });

  if (questionMessage.deletable) await questionMessage.delete();
  if (messageCollector?.first()?.deletable)
    await messageCollector.first().delete();

  return messageCollector?.first();
}

export async function getTaggedUsers(
  interaction: CommandInteraction,
  question: string,
  userId?: string
) {
  const reactionUserId = userId || interaction.user.id;
  const questionMessage = await interaction.channel.send({ embeds: [embeds.question(question)] });

  const messageCollector = await interaction.channel.awaitMessages({
    filter: (x) =>
      x.author.id === reactionUserId &&
      x.mentions.users.size > 0,
    max: 1,
    time: 900000,
    errors: ["time"]
  });

  if (questionMessage.deletable) await questionMessage.delete();
  if (messageCollector.first().deletable)
    await messageCollector.first().delete();

  return messageCollector.first().mentions.users;
}

export async function getTaggedRoles(
  interaction: Interaction,
  question: string,
  userId?: string
) {
  const reactionUserId = userId || interaction.user.id;
  const questionMessage = await interaction.channel.send({ embeds: [embeds.question(question)] });

  const messageCollector = await interaction.channel.awaitMessages({
    filter: (x) =>
      x.author.id === reactionUserId &&
      x.mentions.roles.size > 0,
    max: 1,
    time: 900000,
    errors: ["time"]
  });

  if (questionMessage.deletable) await questionMessage.delete();
  if (messageCollector.first().deletable)
    await messageCollector.first().delete();

  return messageCollector.first().mentions.roles;
}

export async function getTaggedRolesOrCancel(
  interaction: Interaction,
  question: string,
  userId?: string
) {
  const reactionUserId = userId || interaction.user.id;
  const questionMessage = await interaction.channel.send({
    embeds: [embeds.question(question)]
  });

  await questionMessage.react("🚫");

  const reactionCollector = await questionMessage.awaitReactions()

  const messageCollector = await interaction.channel.awaitMessages({
    filter: (x) =>
      x.author.id === reactionUserId &&
      x.mentions.roles.size > 0,
    max: 1,
    time: 900000, 
    errors: ["time"]
  });

  if (questionMessage.deletable) await questionMessage.delete();
  if (messageCollector.first().deletable)
    await messageCollector.first().delete();

  return messageCollector.first().mentions.roles;
}

export async function getTaggedChannels(
  interaction: Interaction,
  question: string,
  userId?: string
) {
  const reactionUserId = userId || interaction.user.id;
  const questionMessage = await interaction.channel.send({ embeds: [embeds.question(question)] });

  const messageCollector = await interaction.channel.awaitMessages({
    filter: (x) =>
      x.author.id === reactionUserId &&
      x.mentions.channels.size > 0,
    max: 1,
    time: 900000,
    errors: ["time"]
  });

  if (questionMessage.deletable) await questionMessage.delete();
  if (messageCollector.first().deletable)
    await messageCollector.first().delete();

  return messageCollector.first().mentions.channels;
}
