import { DocumentType } from "@typegoose/typegoose";
import { User } from "discord.js";
import Task, { Groups } from ".";
import { Giveaway, GiveawayModel } from "../models/giveaway";
import embeds from "../util/embed";

export default class GiveawayTask extends Task {
    taskName = "giveaways";
    groupName: Groups = "giveaways";
    interval = 10e3;

    async execute() {
        const ongoingGiveaways = GiveawayModel.find({
            ended: false,
            endsAt: { $gt: new Date() },
        }).cursor();
        ongoingGiveaways.on("data", async (giveaway: DocumentType<Giveaway>) => {
            const message = await this.client.locateMessage(giveaway.location);
            if (message) {
            await message.edit({
                embeds: [
                embeds.giveaway(
                    giveaway.prize,
                    giveaway.cappedEntries,
                    giveaway.winners,
                    giveaway.endsAt,
                    giveaway.requirements.messageRequirement,
                    giveaway.requirements.roleRequirements.map((roleId) =>
                    message.guild.roles.resolve(roleId)
                    ),
                    giveaway.requirements.multipliers
                )
                ]
            });
            } else {
            console.log(
                `Giveaway with message ID ${giveaway.location.messageId} has been automatically ended!`
            );
            giveaway.ended = true;
            await giveaway.save();
            }
        });
    
        const endedGiveaways = GiveawayModel.find({
            ended: false,
            endsAt: { $lte: new Date() },
        }).cursor();
        endedGiveaways.on("data", async (giveaway: DocumentType<Giveaway>) => {
            giveaway.ended = true;
            await giveaway.save();
    
            const message = await this.client.locateMessage(giveaway.location);
            if (message) {
            let entries = Array.from(message.reactions.cache.get("🎉").users.cache.filter(x => !x.bot).values());
            if (entries?.length) {
                let possibleWinners: string[] = entries.map((x) => x.id);
    
                if (giveaway?.requirements?.multipliers?.length) {
                for (const multiplier of giveaway.requirements.multipliers) {
                    for (const user of entries) {
                    const member = await message.guild.members.fetch(user);
                    if (member?.roles?.cache?.has(multiplier.roleId)) {
                        for (let i = 0; i < multiplier.multiplier; i++) {
                        possibleWinners.push(user.id);
                        }
                    }
                    }
                }
                }
    
                let giveawayWinners: User[] = [];
                for (let i = 0; i < giveaway.winners; i++) {
                const winner =
                    entries[Math.floor(Math.random() * entries.length)];
                entries = entries.filter((x) => x !== winner);
                giveawayWinners.push(winner);
                }
    
                const stringWinners = giveawayWinners.join(", ");
                if (giveawayWinners.length) {
                await message.edit({
                    embeds: [
                    embeds.giveaway(
                        giveaway.prize,
                        giveaway.cappedEntries,
                        giveaway.winners,
                        giveaway.endsAt,
                        giveaway.requirements.messageRequirement,
                        giveaway.requirements.roleRequirements.map((roleId) =>
                        message.guild.roles.resolve(roleId)
                        ),
                        giveaway.requirements.multipliers
                    )
                    ]
                });
                await message.channel.send({
                    content: stringWinners,
                    embeds: [
                    embeds.normal(
                        `Giveaway Ended`,
                        `🎁 **Prize** ${giveaway.prize}\n👥 **Winners** ${stringWinners}`
                    )
                    ]
                })
                }
            } else {
                await message.channel.send({
                embeds: [
                    embeds.normal(
                    `Giveaway Ended`,
                    `🎁 **Prize** ${giveaway.prize}\n👥 **Winners** Not enough people entered the giveaway!`
                    )
                ]
                });
            }
            }
        });
    }
}