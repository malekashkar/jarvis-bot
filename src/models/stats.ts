import { getModelForClass, prop } from "@typegoose/typegoose";

export class Stats {
  @prop()
  guildId: string;

  @prop()
  userId: string;

  @prop({ default: 0 })
  messages?: number;
}

export const StatsModel = getModelForClass(Stats);
