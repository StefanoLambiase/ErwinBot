const { WebClient, LogLevel } = require('@slack/web-api');

const {
    TextPrompt,
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog
} = require('botbuilder-dialogs');

// Import for other dialogs
const {
    QUESTIONS_DEFINITION_DIALOG,
    QuestionsDefinitionDialog
} = require('./questionsDefinitionDialog');

// Dialogs names
const SCRUM_DIALOG = 'SCRUM_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';

// Class import
const { Question } = require('./model/question');

const questionsList = [
    '   How do you feel today? \n',
    '   What did you do since yesterday? \n',
    '   What will you do today? \n',
    '   Anything blocking your progress?'
];

const client = new WebClient(process.env.SlackUserAccessToken, {
    logLevel: LogLevel.DEBUG
});

const channelsName = [];
const allChannels = {};
const channelSelected = '';
let channelSelectedID = '';

class ScrumDialog extends ComponentDialog {
    constructor(userState) {
        super(SCRUM_DIALOG);

        // Adding used dialogs
        this.addDialog(new TextPrompt(TEXT_PROMPT));
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
        step.values.questionsInfo.user = step.result;
        // Retrieve the list with all slack channels
        try {
            const result = await client.conversations.list();
            result.channels.forEach(function(conversation) {
                channelsName.push(conversation.name + '\n');
                allChannels[conversation.name] = conversation;
            });
        } catch (error) {
            console.error(error);
        }
        await step.context.sendActivities([
            { type: 'message', text: 'You have to select the channel in which you want to send the questions' },
            { type: 'message', text: 'this is the list of all channels' },
            { type: 'message', text: channelsName.toString() }
        ]);
        return await step.prompt(TEXT_PROMPT, {
            prompt: 'Please type the name of the channel'
        });
    }

    async defaultQuestionStep(step) {
        step.values.channelSelected = step.result;
        await step.context.sendActivities([
            { type: 'message', text: 'So ' + step.values.questionsInfo.user + ', we need to definde the questions that would be sent to your teammates.' },
            { type: 'message', text: 'In order to ease you work i have prepared some default questions that you can use' },
            { type: 'message', text: questionsList.toString() }
        ]);
        return await step.prompt(TEXT_PROMPT, {
            prompt: 'Do you want to use these for you daily scrum?'
        });
    }

    async defineQuestionStep(step) {
        const userResponse = step.result;

        if (userResponse === 'yes') {
            // Create an instance of Question object to send the message
            const questionsInfo = new Question(
                step.values.questionsInfo.user,
                questionsList
            );
            allChannels.forEach(element => {
                if (element.name === channelSelected) {
                    channelSelectedID = element.id;
                }
            });
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

        await step.context.sendActivities([
            { type: 'message', text: 'Nice we have done, i will send those questions to your teammates:' },
            { type: 'message', text: questionsInfo.getQuestionsAsString() },
            { type: 'message', text: 'I am glad to help you, have a nice day! :D' }
        ]);

        // Function to sent private messages in slack channels
        try {
            await client.chat.postMessage({
                token: process.env.SlackUserAccessToken,
                channel: 'C01JVNWH1GS',
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
