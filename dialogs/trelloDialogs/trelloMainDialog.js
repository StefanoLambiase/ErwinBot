// Import required types from libraries
const {
    ActivityTypes,
    MessageFactory,
    InputHints
} = require('botbuilder');

const {
    TextPrompt,
    ChoicePrompt,
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog
} = require('botbuilder-dialogs');

const {
    LuisRecognizer
} = require('botbuilder-ai');

const { InterruptDialog } = require('../interruptDialog');

// Dialogs names
const TRELLO_MAIN_DIALOG = 'TRELLO_MAIN_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

/**
 * Implements the first interaction for the trello integration.
 */
class TrelloMainDialog extends InterruptDialog {
    constructor(luisRecognizer, userState) {
        super(TRELLO_MAIN_DIALOG);

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        // Add used dialogs.
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

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
     * Implement the first trello main dialog message.
     * @param {*} stepContext
     */
    async firstStep(stepContext) {
        console.log('**TRELLO MAIN DIALOG: firstStep**\n');

        await stepContext.context.sendActivity('I, the Bot-mander, can interact with your boards on trello!!!');
        // Prompt the user for a choice.
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: 'What do you want to do?',
            retryPrompt: 'Please choose an option from the list.',
            choices: ['Get my cards', 'Get my boards']
        });
    }

    /**
     * Implement the dialog operations.
     * @param {*} stepContext
     */
    async optionsStep(stepContext) {
        console.log('**TRELLO MAIN DIALOG: optionStep**\n');

        // Text from the previous step.
        const specifiedOption = (stepContext.result.value).toLowerCase();

        // Luis result from LuisRecognizer.
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);

        // Part to select the dialogs.
        if (specifiedOption === 'get my cards') {
            await stepContext.context.sendActivity('Get my cards!');
            return await stepContext.next();
        } else if (specifiedOption === 'get my boards') {
            await stepContext.context.sendActivity('Get my boards!');
            return await stepContext.next();
        } else {
            // The user did not enter input that this bot was built to handle.
            await stepContext.context.sendActivity('Sorry! I can\'t recognize your command. Retry!');
        }

        return await stepContext.replaceDialog(this.id);
    }

    async waitStep(stepContext) {
        console.log('**TRELLO MAIN DIALOG: waitStep**\n');

        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: 'Do you want to continue with trello?',
            retryPrompt: 'Please select one of the following options',
            choices: ['yes', 'no']
        });
    }

    async loopStep(stepContext) {
        console.log('**TRELLO MAIN DIALOG: loopStep**\n');

        if (stepContext.result.value === 'yes') {
            return await stepContext.replaceDialog(this.id);
        } else {
            await stepContext.context.sendActivities([
                { type: 'message', text: 'Perfect, my job here is done! 😎' },
                { type: 'message', text: 'Your interaction for trello **ends** here!' }
            ]);
            return await stepContext.endDialog();
        }
    }
}

module.exports.TrelloMainDialog = TrelloMainDialog;
module.exports.TRELLO_MAIN_DIALOG = TRELLO_MAIN_DIALOG;
