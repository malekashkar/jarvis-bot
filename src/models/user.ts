import { getModelForClass, prop } from "@typegoose/typegoose";

export class Reminder {
  @prop({ required: true })
  id: number;

  @prop({ required: true })
  guildId: string;

  @prop({ required: true })
  name: string;

  @prop({ required: true })
  message: string;

  constructor(id: number, guildId: string, name: string, message: string) {
    this.id = id;
    this.guildId = guildId;
    this.name = name;
    this.message = message;
  }
}

export default class User {
  @prop()
  userId!: string;

  @prop()
  access?: boolean;

  @prop({ type: String })
  modules?: string[];

  @prop()
  usedCode?: string;

  @prop({ type: Reminder })
  reminders?: Reminder[];
}

export const UserModel = getModelForClass(User);
