import { getModelForClass, prop } from "@typegoose/typegoose";

export class Location {
  @prop()
  guildId?: string;

  @prop()
  channelId?: string;

  @prop()
  messageId?: string;

  constructor(guildId: string, channelId: string, messageId: string) {
    this.guildId = guildId;
    this.channelId = channelId;
    this.messageId = messageId;
  }
}

export class RoleMultiplier {
  @prop()
  roleId: string;

  @prop()
  multiplier: number;
}

export class Requirements {
  @prop({ type: String, default: [] })
  roleRequirements?: string[];

  @prop({ default: 0 })
  messageRequirement?: number;

  @prop({ type: RoleMultiplier, default: [] })
  multipliers?: RoleMultiplier[];

  @prop({ type: String, default: [] })
  guildRequirements?: string[];

  constructor(
    roleRequirements?: string[],
    messageRequirements?: number,
    multipliers?: RoleMultiplier[],
    guildRequirements?: string[]
  ) {
    this.roleRequirements = roleRequirements;
    this.messageRequirement = messageRequirements;
    this.multipliers = multipliers;
    this.guildRequirements = guildRequirements;
  }
}

export class Giveaway {
  @prop()
  prize: string;

  @prop()
  winners: number;

  @prop({ type: Location, default: null })
  location: Location;

  @prop()
  timeLeft: number;

  @prop()
  startedAt: number;

  @prop({ default: 0 })
  cappedEntries?: number;

  @prop({ type: Requirements })
  requirements?: Requirements;

  @prop({ default: false })
  ended?: boolean;

  constructor(prize: string, winners: number, location: Location, timeLeft: number, startedAt: number, requirements?: Requirements) {
    this.prize = prize;
    this.winners = winners;
    this.location = location;
    this.timeLeft = timeLeft;
    this.startedAt = startedAt;
    this.requirements = requirements;
  }
}

export const GiveawayModel = getModelForClass(Giveaway);
