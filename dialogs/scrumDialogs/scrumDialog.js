const { WebClient, LogLevel } = require('@slack/web-api');

const {
    TextPrompt,
    ChoicePrompt,
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog
} = require('botbuilder-dialogs');

// Import for other dialogs
const {
    QUESTIONS_DEFINITION_DIALOG,
    QuestionsDefinitionDialog
} = require('./questionsDefinitionDialog');

const {
    InterruptDialog
} = require('../interruptDialog');

// Dialogs names
const SCRUM_DIALOG = 'SCRUM_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

// Class import
const { Question } = require('./model/question');

const questionsList = [
    'How do you feel today?',
    'What did you do since yesterday?',
    'What will you do today?',
    'Anything blocking your progress?'
];

const client = new WebClient(process.env.SlackUserAccessToken, {
    logLevel: LogLevel.DEBUG
});

const channelsName = [];
let channelSelected = '';
let channelSelectedID = '';

class ScrumDialog extends InterruptDialog {
    constructor(userState) {
        super(SCRUM_DIALOG);

        // Adding used dialogs
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new QuestionsDefinitionDialog());

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.dailyScrumInitialStep.bind(this),
            this.selectChannel.bind(this),
            this.defaultQuestionStep.bind(this),
            this.defineQuestionStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async dailyScrumInitialStep(step) {
        step.values.questionsInfo = new Question();

        await step.context.sendActivities([
            { type: 'message', text: 'Hi, i am here to help you!' },
            { type: 'message', text: 'I will guide you through the definition of you daily scrum' },
            { type: 'message', text: 'The questions you will define, will be sent via brodcast messages to every teammates.' }
        ]);
        return await step.prompt(TEXT_PROMPT, {
            prompt: 'Just to be more informal, type your name here :D'
        });
    }

    async selectChannel(step) {
        if (channelsName.length !== 0) {
            channelsName.length = 0;
        }
        step.values.questionsInfo.user = step.result;
        // Retrieve the list with all slack channels
        try {
            const result = await client.conversations.list();
            result.channels.forEach(function(conversation) {
                channelsName.push(conversation.name);
            });
        } catch (error) {
            console.error(error);
        }
        await step.context.sendActivities([
            { type: 'message', text: 'You have to select the channel in which you want to send the questions' },
            { type: 'message', text: 'this is the list of all channels' }
        ]);

        console.log('PRIMO loop');
        channelsName.forEach(async channel => {
            await step.context.sendActivity(
                channel
            );
        });

        await new Promise(resolve => setTimeout(() => resolve(
            console.log('There are some problem with Slack integration. I need to wait some seconds before continue.')
        ), 2000));

        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Please select one of the following channels',
            retryPrompt: 'Choose an option from the list',
            choices: channelsName
        });
    }

    async defaultQuestionStep(step) {
        // Clear the array
        channelsName.length = 0;

        channelSelected = step.result.value;
        console.log(channelSelected);

        await step.context.sendActivities([
            { type: 'message', text: 'So ' + step.values.questionsInfo.user + ', we need to definde the questions that would be sent to your teammates.' },
            { type: 'message', text: 'In order to ease you work i have prepared some default questions that you can use' }
        ]);

        questionsList.forEach(async question => {
            await step.context.sendActivity(
                question
            );
        });

        await new Promise(resolve => setTimeout(() => resolve(
            console.log('There are some problem with Slack integration. I need to wait some seconds before continue.')
        ), 2000));

        const options = ['yes', 'no'];
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Do you want to use these for you daily scrum?',
            retryPrompt: 'Choose an option from the list',
            choices: options
        });
    }

    async defineQuestionStep(step) {
        const userResponse = step.result.value;
        console.log(userResponse);

        if (userResponse === 'yes') {
            // Create an instance of Question object to send the message
            const questionsInfo = new Question(
                step.values.questionsInfo.user,
                questionsList
            );

            // Retrieve the list with all slack channels
            try {
                const result = await client.conversations.list();
                result.channels.forEach(function(conversation) {
                    // Get the channel ID linked to the selected channel
                    if (conversation.name === channelSelected) {
                        channelSelectedID = conversation.id;
                    }
                });
            } catch (error) {
                console.error(error);
            }
            await step.context.sendActivities([
                { type: 'message', text: 'Nice we have done, iam going to send those questions to your teammates.' },
                { type: 'message', text: 'I am glad to help you, have a nice day! :D' }
            ]);
            // Function to sent private messages in slack channels
            try {
                await client.chat.postMessage({
                    token: process.env.SlackUserAccessToken,
                    channel: channelSelectedID,
                    text: questionsInfo.toString()
                });
            } catch (error) {
                console.error(error);
            }
            return await step.context.sendActivities([
                { type: 'message', text: 'Questions sent, bye bye!' }
            ]);
        } else if (userResponse === 'no') {
            await step.context.sendActivities([
                { type: 'message', text: 'Ok, now you have to define your own questions.' },
                { type: 'message', text: 'Start with the first one, we will proceed one question at a time' }
            ]);
            return await step.beginDialog(QUESTIONS_DEFINITION_DIALOG);
        }
    }

    async finalStep(step) {
        const list = step.result || [];
        // Create an instance of Question object to send the message
        const questionsInfo = new Question(
            step.values.questionsInfo.user,
            list
        );

        // Retrieve the list with all slack channels
        try {
            const result = await client.conversations.list();
            result.channels.forEach(function(conversation) {
                // Get the channel ID linked to the selected channel
                if (conversation.name === channelSelected) {
                    channelSelectedID = conversation.id;
                }
            });
        } catch (error) {
            console.error(error);
        }

        await step.context.sendActivities([
            { type: 'message', text: 'Nice we have done, i will send those questions to your teammates:' },
            { type: 'message', text: questionsInfo.getQuestionsAsString() },
            { type: 'message', text: 'I am glad to help you, have a nice day! :D' }
        ]);

        // Function to sent private messages in slack channels
        try {
            await client.chat.postMessage({
                token: process.env.SlackUserAccessToken,
                channel: channelSelectedID,
                text: questionsInfo.toString()
            });
        } catch (error) {
            console.error(error);
        }
        return await step.context.sendActivities([
            { type: 'message', text: 'Questions sent, bye bye!' }
        ]);
    }
}

module.exports.ScrumDialog = ScrumDialog;
module.exports.SCRUM_DIALOG = SCRUM_DIALOG;
