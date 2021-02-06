// Import required types from libraries.
const {
    TextPrompt,
    ComponentDialog,
    WaterfallDialog
} = require('botbuilder-dialogs');

// Imports for Language Understanding.
const {
    LuisRecognizer
} = require('botbuilder-ai');

// Import models
const { Ticket } = require('./model/ticket');

// Imports for mailsender.
const mailSender = require('../../utils/sendEmail');

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
        console.log('**SEND EMAIL DIALOG: insertEmailStep**');

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
        console.log('**SEND EMAIL DIALOG: loopStep**');

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
            // Inform the usert that the inserted email is correct and that the mail will be send.
            reply = 'I\'ll send an email to ' + emailInserted;
            await stepContext.context.sendActivities([
                { type: 'message', text: reply }
            ]);

            // Create the mail to send.
            const introHTMLString = '<h1>Problem ticket opened</h1>' +
                '<p>Boss, one of our team members has a problem!</p>' +
                '<p>Your attention is required<!/p>' +
                '<p>Below I give you the details of the problem.</p>';

            const ticketInfo = stepContext.values.ticketInfo;
            const ticket = new Ticket(
                ticketInfo.user,
                ticketInfo.problemDefinition,
                ticketInfo.problemCause,
                ticketInfo.problemPossibilities,
                ticketInfo.problemSolution
            );
            const ticketAsHTMLString = ticket.getAsHTMLString();

            const emailHTMLText = introHTMLString.concat(ticketAsHTMLString);
            console.log(emailHTMLText);

            // Send the mail.
            mailSender.sendEmail(
                ticketInfo.user,
                emailInserted,
                'Problem ticket by ' + ticketInfo.user,
                emailHTMLText
            );

            // Return to the parent dialog.
            return await stepContext.endDialog(emailInserted);
        } else {
            reply = 'The email inserted doesn\'t match the email format. Please retry.';
            await stepContext.context.sendActivity(reply);

            // Repeat the dialog from the beginning.
            return await stepContext.replaceDialog(SEND_EMAIL_DIALOG, stepContext.values.ticketInfo);
        }
    }
}

module.exports.SendEmailDialog = SendEmailDialog;
module.exports.SEND_EMAIL_DIALOG = SEND_EMAIL_DIALOG;
