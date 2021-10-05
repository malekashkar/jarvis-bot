import { getModelForClass, prop } from "@typegoose/typegoose";

export class Location {
  @prop()
  guildId?: string;

  @prop()
  channelId?: string;

  @prop()
  messageId?: string;
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
  serverRequirements?: string[];
}

export class Giveaway {
  @prop()
  prize: string;

  @prop()
  winners: number;

  @prop({ default: 0 })
  cappedEntries?: number;

  @prop({ type: Location, default: null })
  location: Location;

  @prop()
  endsAt: Date;

  @prop({ type: Requirements })
  requirements?: Requirements;

  @prop({ default: false })
  ended?: boolean;
}

export const GiveawayModel = getModelForClass(Giveaway);
