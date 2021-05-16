import { Message, Role } from "discord.js";
import moment from "moment";
import ms from "ms";
import Command, { Groups } from "..";
import { GiveawayModel, RoleMultiplier } from "../../models/giveaway";
import embeds from "../../util/embed";
import {
  messageQuestion,
  getTaggedChannels,
  optionReactQuestion,
  getTaggedRoles,
  confirmator,
} from "../../util/questions";

export default class GiveawayCommand extends Command {
  groupName: Groups = "giveaways";
  cmdName = "giveaways";
  description =
    "Setup a giveaway for multiple winners and a prize and restrictions.";
  aliases = ["giveaway"];

  async run(message: Message) {
    // Prize
    const prizeQuestion = await messageQuestion(
      message,
      `What is the prize of the giveaway?`
    );
    if (!prizeQuestion) return;

    // Winners
    const winnersQuestion = await messageQuestion(
      message,
      `How many winners will the giveaway have?`
    );
    if (!winnersQuestion) return;
    else if (isNaN(parseInt(winnersQuestion.content))) {
      return message.channel.send(
        embeds.error(`Please provide a valid number of winners!`)
      );
    }

    // Giveaway Channel
    const channels = await getTaggedChannels(
      message,
      `Tag the channel the giveaway should be located in.`
    );
    if (!channels?.size) return;

    // Time end or capped entries
    const cappedEntriesOrTime = await optionReactQuestion(
      message,
      `Would you like to set a time limit or an entries limit?\n*Note: Entries limit still comes with a time limit*`,
      ["Capped Entries", "Time Limit"]
    );
    if (!cappedEntriesOrTime) return;

    let cappedEntries = 0;
    if (cappedEntriesOrTime === "Capped Entries") {
      const cappedEntriesQuestion = await messageQuestion(
        message,
        `How many max entries can this giveaway have?`
      );
      if (!cappedEntriesQuestion) return;
      else if (isNaN(parseInt(cappedEntriesQuestion.content))) {
        return message.channel.send(
          embeds.error(`Please provide a valid number of capped entries!`)
        );
      }
      cappedEntries = parseInt(cappedEntriesQuestion.content);
    }

    // Ending Time
    const unparsedTime = await messageQuestion(
      message,
      `How long should this giveaway last? (ex. 10m, 1h, 2d)`
    );
    if (!unparsedTime) return;

    const parsedTime = ms(unparsedTime.content);
    if (!parsedTime)
      return message.channel.send(
        embeds.error(`Please provide a valid time, ex. 10m, 1h, 2d.`)
      );

    // Message Requirements
    const messageRequirementQuestion = await messageQuestion(
      message,
      `How many messages must a user have to enter?\n*Note: Enter 0 if there should be no requirement.*`
    );
    if (!messageRequirementQuestion) return;
    else if (isNaN(parseInt(messageRequirementQuestion.content))) {
      return message.channel.send(
        embeds.error(`Please provide a valid number of messages!`)
      );
    }

    // Role Requirements
    const roleReqQuestion = await confirmator(
      message,
      `Would you like to setup role requirements for this giveaway?`
    );

    let roleRequirements: Role[] = [];
    if (roleReqQuestion) {
      const roleRequirementsQuestion = await getTaggedRoles(
        message,
        `Please tag all the roles a user needs before entering a giveaway.`
      );
      if (!roleRequirementsQuestion?.size) return;

      roleRequirements = roleRequirementsQuestion.array();
    }

    // Role Multipliers
    const roleMultiplierQuestion = await confirmator(
      message,
      `Would you like to setup role multipliers for the giveaway?`
    );

    let roleMultipliers: RoleMultiplier[] = [];
    if (roleMultiplierQuestion) {
      const questionMessage = await message.channel.send(
        embeds.question(
          `Tag the roles that should have an entry multiplier, then add the amount of additional entries per role. Make sure to separate each role included the entry with a comma.\n**Example: @role 2, @role2 6, @role3 3**`
        )
      );

      const messageCollector = await message.channel.awaitMessages(
        (x) =>
          x.author.id === message.author.id &&
          x.mentions.roles &&
          x.mentions.roles.size,
        { max: 1, time: 900000, errors: ["time"] }
      );

      if (questionMessage.deletable) await questionMessage.delete();
      if (!messageCollector?.size) return;

      if (messageCollector.first().deletable)
        await messageCollector.first().delete();

      const roleMultiplierResponse = messageCollector.first().content;
      const seperatedMultipliers = roleMultiplierResponse.split(",");
      if (seperatedMultipliers) {
        roleMultipliers = seperatedMultipliers
          .map((multiplier) => {
            const info = /<@&(\d+)> (\d+)/g.exec(multiplier);
            if (info?.length >= 3)
              return {
                roleId: info[1],
                multiplier: parseInt(info[2]),
              } as RoleMultiplier;
          })
          .filter((x) => !!x);
      }
    }

    // Giveaway Constants
    const channel = channels.first();
    const prize = prizeQuestion.content;
    const winners = parseInt(winnersQuestion.content);
    const endsAt = new Date(Date.now() + parsedTime);

    // Giveaway Requirements
    const messageRequirement = parseInt(messageRequirementQuestion.content);

    // Giveaway Embed
    const giveawayEmbed = embeds
      .empty()
      .addField(
        `Information`,
        `🎁 **Prize** ${prize}\n${
          cappedEntries ? `📈 **Capped Entries** ${cappedEntries}\n` : ``
        }👥 **Winners** ${winners}\n📅 **Ends ${moment(endsAt).fromNow()}**`,
        true
      );

    if (messageRequirement || roleRequirements.length) {
      giveawayEmbed.addField(
        `Requirements`,
        `${
          messageRequirement
            ? `💬 **Message Requirement** ${messageRequirement}\n`
            : ``
        }${
          roleRequirements.length
            ? `⚙️ **Role Requirements** ${roleRequirements.map((x) =>
                x.toString()
              )}`
            : ``
        }`,
        true
      );
    }

    if (roleMultipliers.length) {
      giveawayEmbed.addField(
        `Role Multipliers`,
        `${roleMultipliers
          .map((x, i) => `${i + 1}. <@&${x.roleId}> - ${x.multiplier}x`)
          .join("\n")}`,
        true
      );
    }

    const giveawayMessage = await channel.send(
      `🎉 **__GIVEAWAY__**`,
      giveawayEmbed
    );
    await giveawayMessage.react("🎉");

    await GiveawayModel.create({
      prize,
      winners,
      cappedEntries,
      location: {
        guildId: message.guild.id,
        channelId: channel.id,
        messageId: giveawayMessage.id,
      },
      endsAt,
      requirements: {
        messageRequirement,
        roleRequirements: roleRequirements.map((x) => x.id),
        multipliers: roleMultipliers,
      },
    });
  }
}
