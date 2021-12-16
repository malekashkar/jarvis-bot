import { CommandInteraction, TextChannel } from "discord.js";
import { GiveawayModel, RoleMultiplier } from "../../models/giveaway";
import { parseToInteger } from "../../util";
import embeds from "../../util/embed";
import {
  stringQuestion,
  getTaggedChannels,
  getTaggedRolesOrCancel,
  stringQuestionOrCancel,
} from "../../util/questions";
import { SlashCommandBuilder } from "@discordjs/builders";
import GiveawayCommands from ".";

export default class GiveawayCommand extends GiveawayCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("giveaways")
    .setDescription("Setup a giveaway for multiple winners and a prize and restrictions.");

  async run(interaction: CommandInteraction) {
    const giveawaySettings = await this.giveawayCog(interaction);
    if(giveawaySettings.success) {
      const giveawayMessage = await giveawaySettings.channel?.send({
        embeds: [
          embeds.giveaway(
            giveawaySettings.prize,
            giveawaySettings.cappedEntries,
            giveawaySettings.winners,
            giveawaySettings.endsAt,
            giveawaySettings.messageRequirements,
            giveawaySettings.roleRequirements,
            giveawaySettings.roleMultipliers
          )
        ]
      });
      await giveawayMessage.react("🎉");
  
      await GiveawayModel.create({
        prize: giveawaySettings.prize,
        winners: giveawaySettings.winners,
        cappedEntries: giveawaySettings.cappedEntries,
        location: {
          guildId: interaction.guildId,
          channelId: giveawaySettings.channel.id,
          messageId: giveawayMessage.id,
        },
        endsAt: giveawaySettings.endsAt,
        requirements: {
          messageRequirement: giveawaySettings.messageRequirements,
          roleRequirements: giveawaySettings.roleRequirements.map(x => x.id),
          multipliers: giveawaySettings.roleMultipliers,
          guildRequirements: giveawaySettings.guildRequirements,
        },
      });
    } else {
      return interaction.reply({
        embeds: [embeds.error(giveawaySettings.error)]
      });
    }
  }

  async giveawayCog(interaction: CommandInteraction) {
    const prizeQuestion = await stringQuestion(interaction, `What is the prize of the giveaway?`);
    if(!prizeQuestion) return { success: false, error: "Please provide a prize for the user!" };

    const winnersQuestion = await stringQuestion(interaction, `How many winners will the giveaway have?`);
    if(!winnersQuestion) return null;

    const channelsQuestion = await getTaggedChannels(interaction, `Tag the channel the giveaway should be located in.`);
    if(channelsQuestion.size == 0) return null;

    const cappedEntriesQuestion = await stringQuestion(interaction, `How many max entries can this giveaway have? (Enter 0 for unlimited)`);
    if(!cappedEntriesQuestion) return null;

    const unparsedTime = await stringQuestion(interaction, `How long should this giveaway last? (ex. 10m, 1h, 2d)`);
    if(!unparsedTime) return null;

    const messageRequirementQuestion = await stringQuestion(interaction, `How many messages must a user have to enter? (Enter 0 for no requirement)`);
    if(!messageRequirementQuestion) return null;

    const roleRequirementsQuestion = await getTaggedRolesOrCancel(interaction, `Please tag all the roles a user needs before entering a giveaway.`);
    if(roleRequirementsQuestion?.length == 0) return null;
    
    const parsedTime = parseToInteger(unparsedTime);
    if(!parsedTime) return null;

    const roleMultiplierQuestion = await stringQuestionOrCancel(interaction, `Tag the roles that should have bonus entries/entry multipliers.\n\`Example: @role 2, @role2 6, @role3 3\``);
    const roleMultipliers = 
    roleMultiplierQuestion ? roleMultiplierQuestion
        .split(",")
        .map((mult) => {
          const info = /<@&(\d+)> (\d+)/g.exec(mult);
          if (info?.length >= 3)
            return { roleId: info[1], multiplier: parseInt(info[2]) } as RoleMultiplier;
        })
        .filter(x => !!x)
      : [];

    const linkRegex = new RegExp(/(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+[a-z]/g);
    const guildLinksQuestion = await stringQuestionOrCancel(interaction, `Please enter the guild(s) invite links with a space in between.`);
    const guildRequirements = guildLinksQuestion.split(" ").filter(link => linkRegex.test(link)) || [];

    return {
      success: true,
      prize: prizeQuestion,
      winners: parseInt(winnersQuestion),
      channel: channelsQuestion.first() as TextChannel,
      cappedEntries: parseInt(cappedEntriesQuestion),
      messageRequirements: parseInt(messageRequirementQuestion),
      roleRequirements: Array.from(roleRequirementsQuestion.values()),
      time: parsedTime,
      endsAt: new Date(Date.now() + parsedTime),
      roleMultipliers,
      guildRequirements
    }
  }
}
