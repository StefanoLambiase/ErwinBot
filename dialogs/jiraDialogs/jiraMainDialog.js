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
            this.retrieveIssueStep.bind(this)
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

    async retrieveIssueStep(step) {
        const jiraIssue = await jira.issue.getIssue({ issueKey: 'ER-1' });

        console.log(jiraIssue);
        console.log(jiraIssue.key);
        console.log(jiraIssue.fields.project.name);
        console.log(jiraIssue.fields.summary);
        console.log(jiraIssue.fields.description);
        console.log(jiraIssue.fields.priority.name);

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
}
module.exports.JiraMainDialog = JiraMainDialog;
module.exports.JIRA_MAIN_DIALOG = JIRA_MAIN_DIALOG;
