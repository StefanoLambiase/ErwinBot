// Import required types from libraries
const { ActivityTypes, CardFactory } = require('botbuilder');

// Import for Adaptive Card templating.
const ACData = require('adaptivecards-templating');
const jiraCard = require('../../botResources/adaptiveCardStructures/jiraCards/jiraCard.json');

const {
    TextPrompt,
    ChoicePrompt,
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog
} = require('botbuilder-dialogs');

const JiraClient = require('jira-connector');

const { InterruptDialog } = require('../interruptDialog');

// Dialogs names
const JIRA_MAIN_DIALOG = 'JIRA_MAIN_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

// Initializa jira Client
var jira = new JiraClient({
    host: 'acupito.atlassian.net',
    basic_auth: {
        email: 'a.cupito@studenti.unisa.it',
        api_token: process.env.JiraToken
    }
});

class JiraMainDialog extends InterruptDialog {
    constructor(userState) {
        super(JIRA_MAIN_DIALOG);

        // Add used dialogs.
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStep.bind(this),
            this.selectedOptionStep.bind(this)
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

    // Initial step, uselful to select the options
    async firstStep(step) {
        await step.context.sendActivity('I, the Bot-mander, can interact with your Jira projects');
        // Prompt the user for a choice.
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'What do you want to do?',
            retryPrompt: 'Please choose an option from the list.',
            choices: ['Get my projects', 'Create Issue']
        });
    }

    // Define the logic to handle the possible options
    async selectedOptionStep(step) {
        // Text from the previous step.
        const specifiedOption = (step.result.value).toLowerCase();

        // Luis result from LuisRecognizer.
        // const luisResult = await this.luisRecognizer.executeLuisQuery(step.context);

        // Part to select the dialogs.
        if (specifiedOption === 'create a card') {
            await step.context.sendActivity('Sorry! This feature is in development!');
        } else if (specifiedOption === 'projects') {
            await retrieveIssue();
        } else {
            // The user did not enter input that this bot was built to handle.
            await step.context.sendActivity('Sorry! I can\'t recognize your command. Retry!');
        }

        return await step.next();
    }
}

async function retrieveIssue(step) {
    const jiraIssue = await jira.issue.getIssue({ issueKey: 'ER-1' });

    console.log(jiraIssue);

    if (step.context.activity.channelId === 'slack') {
        await step.context.sendActivity(
            {
                channelData: {
                    text: 'Issue Key ' + jiraIssue.key,
                    attachments: [
                        {
                            title: 'Board Name',
                            text: jiraIssue.fields.project.name
                        },
                        {
                            title: 'Issue Name',
                            text: jiraIssue.fields.summary
                        },
                        {
                            title: 'Description',
                            text: jiraIssue.fields.description
                        },
                        {
                            title: 'Issue Priority',
                            text: jiraIssue.fields.priority.name
                        }
                    ]
                }
            }
        );
    } else {
        // Create a Template instance from the template payload
        const template = new ACData.Template(jiraCard);

        const card = await template.expand({
            $root: {
                issue: jiraIssue.key,
                project: jiraIssue.fields.project.name,
                name: jiraIssue.fields.summary,
                desc: jiraIssue.fields.description,
                priority: jiraIssue.fields.priority.name
            }
        });

        // Send the card.
        const cardMessage = { type: ActivityTypes.Message };
        cardMessage.attachments = [CardFactory.adaptiveCard(card)];
        await step.context.sendActivity(cardMessage);
    }

    return await step.context.sendActivities([
        { type: 'message', text: 'Job done, bye bye!' }
    ]);
}

module.exports.JiraMainDialog = JiraMainDialog;
module.exports.JIRA_MAIN_DIALOG = JIRA_MAIN_DIALOG;
