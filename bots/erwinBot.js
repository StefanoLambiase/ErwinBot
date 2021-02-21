// This class implements the mains bot's callback

const { ActivityHandler } = require('botbuilder');

class ErwinBot extends ActivityHandler {
    constructor(conversationState, userState, dialog) {
        super();

        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.

        /**
         * Implement the bot's response to a new member that joins the chat
         */
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;

            // Messages construction part
            const welcomeText = 'Hello and good Sasageyo!!!';
            const presentationText = "I am Erwin, the research corp's bot-mander";
            const aggressiveText = "I'm better than my brother DARTS!😇";

            // Send messages part
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivities([
                        { type: 'message', text: welcomeText },
                        { type: 'message', text: presentationText },
                        { type: 'message', text: aggressiveText }
                    ]);
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        /**
         * Implement the bot's response to a chat member's message.
         */
        this.onMessage(async (context, next) => {
            await this.dialog.run(context, this.dialogState);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    /**
     * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
     */
    async run(context) {
        await super.run(context);

        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }
}

module.exports.ErwinBot = ErwinBot;
