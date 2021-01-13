// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');

class ErwinBot extends ActivityHandler {
    constructor() {
        super();

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.

        /**
         * Implement the bot's response to a chat member's message
         */
        this.onMessage(async (context, next) => {
            const replyText = `Echo: ${ context.activity.text }`;
            await context.sendActivity(MessageFactory.text(replyText, replyText));
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        /**
         * Implement the bot's response to a new member that joins the chat
         */
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and good Sasageyo!!!';
            const presentationText = "I am Erwin, the research corp's bot-mander";
            const aggressiveText = "I'm better than my brother DARTS!😇";
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
    }
}

module.exports.ErwinBot = ErwinBot;
