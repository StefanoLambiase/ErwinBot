// Import required types from libraries.
const {
    TextPrompt,
    ComponentDialog,
    WaterfallDialog
} = require('botbuilder-dialogs');

const {
    LuisRecognizer
} = require('botbuilder-ai');

// Dialogs names.
const SEND_EMAIL_DIALOG = 'SEND_EMAIL_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';

/**
 * Implements the functionality used to send an email with a ticket information inside.
 */
class SendEmailDialog extends ComponentDialog {
    constructor(luisRecognizer) {
        super(SEND_EMAIL_DIALOG);

        if (!luisRecognizer) throw new Error('[SendEmailDialog]: Missing parameter \'luisRecognizer\' is required');
        this.LuisRecognizer = LuisRecognizer;

        // Add used dialogs.
        this.addDialog(new TextPrompt(TEXT_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.insertEmailStep.bind(this),
            this.loopStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * Implements the interaction that asks the user to insert the receiver email.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async insertEmailStep(stepContext) {
        // Get the ticket info to insert in the mail.
        const ticketInfo = stepContext.options;
        stepContext.values.ticketInfo = ticketInfo;

        // Ask the user to insert the receiver email.
        const message = 'Insert the receiver email';
        return await stepContext.prompt(TEXT_PROMPT, {
            prompt: message
        });
    }

    /**
     * Implements the email inserted check.
     * If the email is correct, the bot send the ticket informations to the mail.
     * If the email isn't correct, the bot ask again the email.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async loopStep(stepContext) {
        // Get the receiver email.
        const emailInserted = stepContext.result;

        // Check if the email inserted match the email format.
        let reply = '';
        const regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (emailInserted.match(regexEmail)) {
            reply = 'I\'ll send an email to ' + emailInserted;
            await stepContext.context.sendActivities([
                { type: 'message', text: reply }
            ]);

            return await stepContext.endDialog(emailInserted);
        } else {
            reply = 'The email inserted doesn\'t match the email format. Please retry.';
            stepContext.context.sendActivity(reply);

            return await stepContext.replaceDialog(SEND_EMAIL_DIALOG, stepContext.values.ticketInfo);
        }
    }
}

module.exports.SendEmailDialog = SendEmailDialog;
module.exports.SEND_EMAIL_DIALOG = SEND_EMAIL_DIALOG;
