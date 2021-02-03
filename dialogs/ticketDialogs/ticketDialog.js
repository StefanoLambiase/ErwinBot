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

const {
    LuisRecognizer
} = require('botbuilder-ai');

// Dialogs names
const TICKET_DIALOG = 'TICKET_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';

class TicketDialog extends ComponentDialog {
    constructor(luisRecognizer, userState) {
        super(TICKET_DIALOG);

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.LuisRecognizer = LuisRecognizer;

        // Add used dialogs.
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStep.bind(this),
            this.definitionStep.bind(this),
            this.causeStep.bind(this),
            this.possibilitiesStep.bind(this),
            this.solutionStep.bind(this)
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

    async firstStep(stepContext) {
        await stepContext.context.sendActivities([
            { type: 'message', text: 'I, the Bot-mander, am here to help you!!!' },
            { type: 'message', text: 'Before contact your manager, we need to collect some information!' },
            { type: 'message', text: 'This is important to assure that the problem is well define and to facilitate the solution find' }
        ]);
        return await stepContext.prompt(TEXT_PROMPT, {
            prompt: 'Let\'start with your name! Type it.'
        });
    }

    async definitionStep(stepContext) {

        const message = 'What is the problem?';
    }

    async causeStep(stepContext) {

        const message = 'What is the cause of the problem?';
    }

    async possibilitiesStep(stepContext) {

        const message = 'What are all possible solutions of the problem?';
    }

    async solutionStep(stepContext) {

        const message = 'What solution do you suggest?';
    }
}

module.exports.TicketDialog = TicketDialog;
module.exports.TICKET_DIALOG = TICKET_DIALOG;
