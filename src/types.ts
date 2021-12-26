export interface SlashCommand {
    id: string;
    application_id: string;
    version: string;
    default_permission: boolean;
    default_member_permissions: boolean;
    type: number;
    name: string; // the name of the cmd
    description: string; // the descripiton of the cmd
    guild_id: string;
    options: any[][];
}