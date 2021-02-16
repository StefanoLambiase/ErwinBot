// Import required types from libraries
const {
    MessageFactory,
    InputHints
} = require('botbuilder');

const {
    TextPrompt,
    ComponentDialog,
    DialogSet,
    ChoicePrompt,
    DialogTurnStatus,
    WaterfallDialog
} = require('botbuilder-dialogs');

const {
    LuisRecognizer
} = require('botbuilder-ai');

// Imports for Slack
const PresentationMessage = require('../botResources/slack/PresentationMessage.json');

// Imports other dialogs
const { TicketDialog, TICKET_DIALOG } = require('./ticketDialogs/ticketDialog');
const { ShowTicketsDialog, SHOW_TICKETS_DIALOG } = require('./ticketDialogs/showTicketsDialog');
const { TrelloMainDialog, TRELLO_MAIN_DIALOG } = require('./trelloDialogs/trelloMainDialog');

const {
    SCRUM_DIALOG,
    ScrumDialog
} = require('./scrumDialogs/scrumDialog');

const {
    INFO_DIALOG,
    InfoDialog
} = require('./infoDialogs/infoDialog');

const {
    JIRA_MAIN_DIALOG,
    JiraMainDialog
} = require('./jiraDialogs/jiraMainDialog');

// Dialogs names
const MAIN_DIALOG = 'MAIN_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

/**
 * Implement the first dialog in the chain.
 */
class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, userState) {
        super(MAIN_DIALOG);

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;
        this.userState = userState;
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

        //  Add used dialog.
        // ! if you want to add a new dialog in the steps, first add it here.
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

        this.addDialog(new ScrumDialog());
        this.addDialog(new InfoDialog());
        this.addDialog(new TicketDialog(luisRecognizer, userState));
        this.addDialog(new ShowTicketsDialog(luisRecognizer));
        this.addDialog(new TrelloMainDialog(luisRecognizer, userState));
        this.addDialog(new JiraMainDialog(userState));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStep.bind(this),
            this.optionsStep.bind(this),
            this.waitStep.bind(this),
            this.loopStep.bind(this)
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

    /**
     * Implement the first bot message.
     * @param {*} step
     */
    async firstStep(step) {
        console.log('**MAIN_DIALOG: firstStep**');

        if (!this.luisRecognizer.isConfigured) {
            const errorText = 'WARNING: There are problems in the Luis configuration';
            await step.context.sendActivity(errorText, null, InputHints.IgnoringInput);
            return await step.next();
        }

        if (step.context.activity.channelId === 'slack') {
            await step.context.sendActivity({
                channelData: PresentationMessage
            });
        }

        const messageText = step.options.restartMsg ? step.options.restartMsg : 'Write something to start or press one of the above buttons';
        const welcomeMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);

        return await step.prompt(TEXT_PROMPT, {
            prompt: welcomeMessage
        });
    }

    /**
     * Implement the step selection on LuisRecognizer intent.
     * @param {*} step
     */
    async optionsStep(step) {
        console.log('**MAIN_DIALOG: optionsStep**');

        // Text from the previous step.
        const specifiedOption = (step.result).toLowerCase();

        // Luis result from LuisRecognizer.
        const luisResult = await this.luisRecognizer.executeLuisQuery(step.context);
        console.log('LUIS INTENT: ' + LuisRecognizer.topIntent(luisResult));

        // Part to select the dialogs.
        if (specifiedOption === 'start daily scrum' || LuisRecognizer.topIntent(luisResult) === 'select_daily_scrum') {
            return await step.beginDialog(SCRUM_DIALOG);
        } else if (specifiedOption === 'info' || LuisRecognizer.topIntent(luisResult) === 'select_information') {
            return await step.beginDialog(INFO_DIALOG);
        } else if (specifiedOption === 'trello') {
            return await step.beginDialog(TRELLO_MAIN_DIALOG);
        } else if (specifiedOption === 'jira') {
            return await step.beginDialog(JIRA_MAIN_DIALOG);
        } else if (specifiedOption === 'show tickets' || LuisRecognizer.topIntent(luisResult) === 'show_tickets') {
            return await step.beginDialog(SHOW_TICKETS_DIALOG);
        } else if (specifiedOption === 'open a ticket' || LuisRecognizer.topIntent(luisResult) === 'open_a_ticket') {
            return await step.beginDialog(TICKET_DIALOG);
        } else {
            // The user did not enter input that this bot was built to handle.
            await step.context.sendActivity('Sorry! I can\'t recognize your command. Retry!');
            return await step.replaceDialog(this.id);
        }
    }

    async waitStep(step) {
        console.log('**MAIN_DIALOG: waitStep**');

        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Do you want to continue with Erwin Bot?',
            retryPrompt: 'Please select one of the following options',
            choices: ['yes', 'no']
        });
    }

    async loopStep(step) {
        console.log('**MAIN_DIALOG: loopStep**');

        if (step.result.value === 'yes') {
            return await step.replaceDialog(this.id);
        } else {
            await step.context.sendActivity('Bye Bye');
            return await step.endDialog();
        }
    }
}

module.exports.MainDialog = MainDialog;
module.exports.MAIN_DIALOG = MAIN_DIALOG;
