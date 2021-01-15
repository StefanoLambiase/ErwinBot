// This class implements the mains bot's callback

const { ActivityHandler, MessageFactory } = require('botbuilder');
// Imports for Slack
const SampleFidelityMessage = require('../botResources/slack/SampleFidelityMessage.json');

class ErwinBot extends ActivityHandler {
    constructor() {
        super();

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
                        { type: 'message', text: aggressiveText },
                        { channelData: SampleFidelityMessage }
                    ]);
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        /**
         * Implement the bot's response to a chat member's message
         */
        this.onMessage(async (context, next) => {
            // Messages construction part
            const replyText = `Echo: ${ context.activity.text }`;

            // Send messages part
            await context.sendActivity(MessageFactory.text(replyText, replyText));
            await context.sendActivity({ channelData: SampleFidelityMessage });
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.ErwinBot = ErwinBot;
