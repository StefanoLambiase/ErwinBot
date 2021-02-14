const {
    TextPrompt,
    ChoicePrompt,
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog
} = require('botbuilder-dialogs');

const { LuisRecognizer } = require('botbuilder-ai');

const { InterruptDialog } = require('../interruptDialog');

// Import models
const { Ticket } = require('./model/ticket');
const { TicketDAO } = require('./model/ticketDAO');

// Dialogs names
const SHOW_TICKETS_DIALOG = 'SHOW_TICKETS_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

/**
 * Implements the interaction used to show to a user all the tickets directed to him/her.
 */
class ShowTicketsDialog extends InterruptDialog {
    constructor(luisRecognizer) {
        super(SHOW_TICKETS_DIALOG);

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.LuisRecognizer = LuisRecognizer;

        // Add used dialogs.
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStep.bind(this),
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
     * Implement the first step of the dialog used to show the tickets opened.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async firstStep(stepContext) {
        console.log('**SHOW TICKETS DIALOG: firstStep**\n');

        await stepContext.context.sendActivities([
            { type: 'message', text: 'I, the Bot-mander, am here for you!!!' },
            { type: 'message', text: 'In this interaction I can show you all the tickets opened!' }
        ]);

        return await stepContext.prompt(TEXT_PROMPT, {
            prompt: 'Please, insert your email!'
        });
    }

    /**
     * Implement the final step of the dialog.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async loopStep(stepContext) {
        console.log('**SHOW TICKETS DIALOG: loopStep**');

        // Get the receiver email.
        let emailInserted = stepContext.result;
        console.log('String inserted by the user: ' + emailInserted);
        // String slice if channel is Slack.
        if (stepContext.context.activity.channelId === 'slack' && emailInserted.includes('<mailto:')) {
            const index = emailInserted.indexOf('|');
            emailInserted = emailInserted.slice(index + 1, emailInserted.length - 1);
            console.log('String from Slack modified: ' + emailInserted);
        }

        // Check if the email inserted match the email format.
        let reply = '';
        const regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

        if (emailInserted.match(regexEmail)) {
            const ticketDAO = new TicketDAO();
            if (stepContext.context.activity.channelId === 'slack') {
                reply = 'This feature on Slack isn\'t implemented yet';
                await stepContext.context.sendActivity(reply);
                return await stepContext.endDialog();
            } else {
                const tickets = await ticketDAO.findTicketsByManagerEmail(emailInserted);
                console.log('Tickets that I have found: ' + tickets);

                reply = 'These are the tickets that I have found.';
                await stepContext.context.sendActivity(reply);
                return await stepContext.endDialog();
            }
        } else {
            reply = 'The email inserted doesn\'t match the email format. Please retry.';
            await stepContext.context.sendActivity(reply);

            // Repeat the dialog from the beginning.
            return await stepContext.replaceDialog(SHOW_TICKETS_DIALOG);
        }
    }
}

module.exports.ShowTicketsDialog = ShowTicketsDialog;
module.exports.SHOW_TICKETS_DIALOG = SHOW_TICKETS_DIALOG;
