import { DocumentType } from "@typegoose/typegoose";
import { Message, TextChannel, Permissions, CommandInteraction } from "discord.js";
import FridayCommands from ".";
import Global from "../../models/global";
import { Guild, Roles } from "../../models/guild";
import User from "../../models/user";
import {
  getTaggedRoles,
  messageQuestion,
  confirmator,
} from "../../util/questions";
import ms from "ms";
import embeds from "../../util/embed";
import { SlashCommandBuilder } from "@discordjs/builders";

export default class SetupCommand extends FridayCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup a role with Friday on your discord server.");

  async run(
    interaction: CommandInteraction,
    _userData: DocumentType<User>,
    _globalData: DocumentType<Global>,
    guildData: DocumentType<Guild>
  ) {
    const roles = await getTaggedRoles(
      interaction,
      `Please tag the role you would like to setup.`
    );
    if (!roles) return;

    const channels = await getNumberedChannels(
      interaction,
      `What channels would you like this role to have access to?`
    );
    if (!channels) return;

    const cooldownQuestion = await messageQuestion(
      interaction,
      `How long should the interval be between every ad this role can post?`
    );
    if (!cooldownQuestion) return;

    const autorole = await confirmator(
      interaction,
      `Would you like this role to be an autorole for when members join?`
    );

    const role = roles.first();
    const channelIds = channels.map((channel) => channel.id);
    const cooldownTime = ms(cooldownQuestion.content);
    guildData.roles.push(
      new Roles(role.id, channelIds, autorole, cooldownTime)
    );
    await guildData.save();

    channels.forEach(async (channel: TextChannel) => {
      await channel.permissionOverwrites.set(
        [{
          id: role.id,
          allow: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.VIEW_CHANNEL]
        }]
      );
    });
  }
}

export async function getNumberedChannels(
  interaction: CommandInteraction,
  question: string,
  userId?: string
) {
  const reactionUserId = userId || interaction.user.id;
  const questionMessage = await interaction.channel.send({ embeds: [embeds.question(question)] });

  const messageCollector = await interaction.channel.awaitMessages(
    { filter: (m: Message) => m.author.id == reactionUserId, max: 1, time: 900000, errors: ["time"] }
  );

  if (questionMessage.deletable) await questionMessage.delete();
  if (messageCollector.first().deletable)
    await messageCollector.first().delete();

  return messageCollector.first().mentions.channels;
}
