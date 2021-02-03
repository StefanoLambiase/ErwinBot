// Import required types from libraries
const {
    TextPrompt,
    ChoicePrompt,
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
const CHOICE_PROMPT = 'CHOICE_PROMPT';

/**
 * Implements the functionality used to open a problem ticket.
 * The philosophy used for this interaction has been ispired by a Dale Carnagie book.
 */
class TicketDialog extends ComponentDialog {
    constructor(luisRecognizer, userState) {
        super(TICKET_DIALOG);

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.LuisRecognizer = LuisRecognizer;

        // Add used dialogs.
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

        this.addDialog(new PossibilitiesDialog(luisRecognizer));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStep.bind(this),
            this.definitionStep.bind(this),
            this.causeStep.bind(this),
            this.possibilitiesStep.bind(this),
            this.solutionStep.bind(this),
            this.finalChoiceStep.bind(this)
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
     * Implement the first step of the dialog used to open a problem ticket.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
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

    /**
     * Implement the interaction that asks the user to define the problem.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async definitionStep(stepContext) {
        // Insert user name in the ticket info
        stepContext.values.ticketInfo.user = stepContext.result;
        console.log(stepContext.result);

        const message = 'What is the problem?';
        return await stepContext.prompt(TEXT_PROMPT, {
            prompt: message
        });
    }

    /**
     * Implements the interaction that asks the user to define the problem cause.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async causeStep(stepContext) {
        // Insert the problem definition in the ticket info
        stepContext.values.ticketInfo.problemDefinition = stepContext.result;

        const message = 'What is the cause of the problem?';
        return await stepContext.prompt(TEXT_PROMPT, {
            prompt: message
        });
    }

    /**
     * Implements the interaction that asks the user to list the possible solutions to the problem.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async possibilitiesStep(stepContext) {
        // Insert the problem cause in the ticket info.
        stepContext.values.ticketInfo.problemCause = stepContext.result;

        await stepContext.context.sendActivities([
            { type: 'message', text: 'Now we need to lists all possible solutions that you can find to solve the problem' },
            { type: 'message', text: 'Let\'start with the first. We will type one solution at a time' }
        ]);

        // Call the dialog used to insert the possible solutions to the problem.
        return await stepContext.beginDialog(POSSIBILITIES_DIALOG);
    }

    /**
     * Implements the interaction that asks the user to choice a favourite solution between the previously listed.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async solutionStep(stepContext) {
        console.log('TICKET DIALOG: solutionStep');
        // Get the possibile solutions inserted by the user in the previos step.
        stepContext.values.ticketInfo.problemPossibilities = stepContext.result || [];
        console.log('The ticket dialog is at solution step. The ticket created until now is:');
        console.log(stepContext.values.ticketInfo);

        // Create the list of options to choose from.
        const options = stepContext.values.ticketInfo.problemPossibilities;

        const message = 'What solution do you suggest?';
        // Prompt the user for a choice.
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: message,
            retryPrompt: 'Please choose an option from the list.',
            choices: options
        });
    }

    /**
     * Implements the interaction that asks the user to choice between send a ticket to the PM or close the ticket.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async finalChoiceStep(stepContext) {
        // Get the favourite user solution to the problem.
        stepContext.values.ticketInfo.problemSolution = stepContext.result.value;

        // Create the ticket object.
        const ticketInfo = stepContext.values.ticketInfo;
        const ticket = new Ticket(
            ticketInfo.user,
            ticketInfo.problemDefinition,
            ticketInfo.problemCause,
            ticketInfo.problemPossibilities,
            ticketInfo.problemSolution
        );
        console.log(ticket.toString());

        await stepContext.context.sendActivities([
            { type: 'message', text: 'We are at the final step.' },
            { type: 'message', text: 'During this interaction you have reflected about the problem.' },
            { type: 'message', text: 'If you want to send the ticket to your manager, type \'send\', else type \'done\'.' }
        ]);

        // Exit the dialog, returning the collected user information.
        return await stepContext.endDialog(ticket);
    }
}

module.exports.TicketDialog = TicketDialog;
module.exports.TICKET_DIALOG = TICKET_DIALOG;
