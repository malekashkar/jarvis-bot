import Command, { Groups } from "..";

export default abstract class ReminderCommands extends Command {
  groupName: Groups = "reminders";
}
