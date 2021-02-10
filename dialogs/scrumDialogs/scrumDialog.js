const { WebClient, LogLevel } = require('@slack/web-api');

// Import required types from libraries
const {
    ActivityTypes,
    MessageFactory,
    InputHints
} = require('botbuilder');

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
const {Question} = require('./model/question');

const questionsList = [
    "1. How do you feel today? \n", 
    "2. What did you do since yesterday? \n", 
    "3. What will you do today? \n",
    "4. Anything blocking your progress?"
];

class ScrumDialog extends ComponentDialog {
    constructor(userState) {
        super(SCRUM_DIALOG);

        // Adding used dialogs
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new QuestionsDefinitionDialog());

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.dailyScrumInitialStep.bind(this),
            this.defaultQuestionStep.bind(this),
            this.defineQuestionStep.bind(this)
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

        step.values.questionsInfo = new Question();;

        await step.context.sendActivities([
            {type:"message", text:"Hi, i'm here to help you!"},
            {type:"message", text:"I'll guide you through the definition of you daily scrum's questions"},
            {type:"message", text:"The questions you will define, will be sent via brodcast messages to every teammates."}
        ])
        return await step.prompt(TEXT_PROMPT, {
            prompt: "Just to be more informal, type your name here :D"
        })
    }

    async defaultQuestionStep(step) {

        step.values.questionsInfo.user = step.result;

        await step.context.sendActivities([
            {type:"message", text:"So " + step.values.questionsInfo.user + ", we need to definde the questions that would be sent to your teammates."},
            {type:"message", text:"In order to ease you work i've prepared some default questions that you can use"},
            {type:"message", text: questionsList.toString()},
        ])
        return await step.prompt(TEXT_PROMPT, {
            prompt: "Do you want to use these for you daily scrum?"
        })
    }

    async defineQuestionStep(step) {
        const userResponse = step.result;
        
        const client = new WebClient(process.env.SlackUserAccessToken,{
            logLevel: LogLevel.DEBUG
        })

        if(userResponse == 'yes'){

            // Create an instance of Question object to send the message
            const questionsInfo = new Question (
                step.values.questionsInfo.user,
                questionsList
            )

            await step.context.sendActivities([
                {type:"message", text:"Nice we have done, i'll sent those questions to your teammates."},
                {type:"message", text:"I'm glad to help you, have a nice day! :D"}
            ]);

            // Function to sent private messages in slack channels
            try{
                await client.chat.postMessage({
                    token: process.env.SlackUserAccessToken,
                    channel: "C01JVNWH1GS",
                    text: questionsInfo.toString()
                });
            }catch(error){
                console.error(error);
            }
            return await step.context.sendActivities([
                {type:"message", text:"Questions sent, bye bye!"}
            ]);

        } else if(userResponse == 'no'){
            
            // Clear the questions' array
            questionsList = []
            
            await step.context.sendActivities([
                {type:"message", text:"Ok, now you have to define your own questions."},
                {type:"message", text:"Let's start with the first one, we'll proceed one question at a time"}
            ]);
            return await step.beginDialog(QUESTIONS_DEFINITION_DIALOG);
        }
    }
}

module.exports.ScrumDialog = ScrumDialog;
module.exports.SCRUM_DIALOG = SCRUM_DIALOG;
