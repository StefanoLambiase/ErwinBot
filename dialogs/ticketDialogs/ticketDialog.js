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

// Import models
const { Ticket } = require('./model/ticket');

// Import others dialogs
const { PossibilitiesDialog, POSSIBILITIES_DIALOG } = require('./possiblitiesDialog');

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

        this.addDialog(new PossibilitiesDialog(luisRecognizer));

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
        // Instantiate the object that contains ticket info and insert it in the context.
        stepContext.values.ticketInfo = new Ticket();

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
        // Insert user name in the ticket info
        stepContext.values.ticketInfo.user = stepContext.result;
        console.log(stepContext.result);

        const message = 'What is the problem?';
        return await stepContext.prompt(TEXT_PROMPT, {
            prompt: message
        });
    }

    async causeStep(stepContext) {
        // Insert the problem definition in the ticket info
        stepContext.values.ticketInfo.problemDefinition = stepContext.result;

        const message = 'What is the cause of the problem?';
        return await stepContext.prompt(TEXT_PROMPT, {
            prompt: message
        });
    }

    async possibilitiesStep(stepContext) {
        // Insert the problem cause in the ticket info
        stepContext.values.ticketInfo.problemCause = stepContext.result;

        await stepContext.context.sendActivities([
            { type: 'message', text: 'Now we need to lists all possible solutions that you can find to solve the problem' },
            { type: 'message', text: 'Let\'start with the first. We will type one solution at a time' }
        ]);

        return await stepContext.beginDialog(POSSIBILITIES_DIALOG);
    }

    async solutionStep(stepContext) {
        stepContext.values.ticketInfo.problemPossibilities = stepContext.result || [];

        console.log(stepContext.values.ticketInfo);

        const message = 'What solution do you suggest?';
        return await stepContext.prompt(TEXT_PROMPT, {
            prompt: message
        });
    }

    async choiceStep(stepContext) {
        const ticketInfo = stepContext.values.ticketInfo;
        // Exit the dialog, returning the collected user information.
        return await stepContext.endDialog(ticketInfo);
    }
}

module.exports.TicketDialog = TicketDialog;
module.exports.TICKET_DIALOG = TICKET_DIALOG;
