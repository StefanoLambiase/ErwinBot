// Import required types from libraries
const { ActivityTypes, CardFactory } = require('botbuilder');

// Import for Adaptive Card templating.
const ACData = require('adaptivecards-templating');
const ticketCard = require('../../botResources/adaptiveCardStructures/ticketCards/ticketCard.json');

// Imports for dialogs.
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
const { TicketDAO } = require('./model/ticketDAO');

// Dialogs names
const SHOW_TICKETS_DIALOG = 'SHOW_TICKETS_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

// Global color array.
const color = [
    '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
    '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
    '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
    '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'
];

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
        const regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

        if (emailInserted.match(regexEmail)) {
            const ticketDAO = new TicketDAO();

            // Sends the tickets to the user as adaptive cards.
            const tickets = await ticketDAO.findTicketsByManagerEmail(emailInserted);

            // Check if there are tickets for the user.
            if (tickets.length === 0) {
                await stepContext.context.sendActivity('There aren\'t tickets for you!');
            } else {
                await stepContext.context.sendActivity('These are the tickets that I have found.');

                // Prints the tickets found in the DB.
                await printTicketsFound(stepContext, tickets);
            }

            await stepContext.context.sendActivities([
                { type: 'message', text: 'Perfect, my job here is done! 😎' },
                { type: 'message', text: 'Your interaction for the ticket **ends** here!' }
            ]);

            return await stepContext.endDialog();
        } else {
            await stepContext.context.sendActivity('The email inserted doesn\'t match the email format. Please retry.');

            // Repeat the dialog from the beginning.
            return await stepContext.replaceDialog(SHOW_TICKETS_DIALOG);
        }
    }
}

/**
 * Prints in chat the tickets found in the DB based on the email inserted.
 * @param {*} stepContext - The context from previous interactions with the user.
 * @param {*} tickets - The tickets found in the DB.
 */
async function printTicketsFound(stepContext, tickets) {
    // Creates a Color index for colors array.
    let colorIndex = 0;

    // Send the informations as slack full fidelity or adaptive cards using a 'for of' loop.
    if (stepContext.context.activity.channelId === 'slack') {
        for (const [index, item] of tickets.entries()) {
            let solutionsString = '';
            for (const [index2, item2] of item.problemPossibilities.entries()) {
                solutionsString = solutionsString + index2 + '. ' + item2 + '\n';
            }

            // Sends a slack full-fidelity message.
            await stepContext.context.sendActivity(
                {
                    channelData: {
                        text: '**' + (index + 1) + ' . Ticket from ' + item.user + '**',
                        attachments: [
                            {
                                title: '**Sender**',
                                text: item.user,
                                color: color[colorIndex]
                            },
                            {
                                title: '**Problem**',
                                text: item.problemDefinition,
                                color: color[colorIndex]
                            },
                            {
                                title: 'Problem Cause',
                                text: item.problemCause,
                                color: color[colorIndex]
                            },
                            {
                                title: 'Possible solutions',
                                text: solutionsString,
                                color: color[colorIndex]
                            },
                            {
                                title: 'Favourite solution',
                                text: item.name,
                                color: color[colorIndex]
                            }
                        ]
                    }
                }
            );

            // Increments color index.
            colorIndex = ((colorIndex + 1) === color.length) ? 0 : (colorIndex + 1);

            await new Promise(resolve => setTimeout(() => resolve(
                console.log('There are some problem with Slack integration. I need to wait some seconds before continue.')
            ), 1000));
        }
    } else {
        for (const [index, item] of tickets.entries()) {
            // Create a Template instance from the template payload
            const template = new ACData.Template(ticketCard);

            let solutionsString = '';
            for (const [index2, item2] of item.problemPossibilities.entries()) {
                solutionsString = solutionsString + index2 + '. ' + item2 + '\n';
            }

            const card = await template.expand({
                $root: {
                    index: index + 1,
                    sender: item.user,
                    problem: item.problemDefinition,
                    cause: item.problemCause,
                    solutions: solutionsString,
                    favouriteSolution: item.problemSolution
                }
            });

            const cardMessage = { type: ActivityTypes.Message };
            cardMessage.attachments = [CardFactory.adaptiveCard(card)];
            // Sends the adaptive card.
            await stepContext.context.sendActivity(cardMessage);
        }
    }
}

module.exports.ShowTicketsDialog = ShowTicketsDialog;
module.exports.SHOW_TICKETS_DIALOG = SHOW_TICKETS_DIALOG;
