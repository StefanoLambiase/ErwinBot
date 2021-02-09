// Import required types from libraries
const { ActivityTypes, CardFactory } = require('botbuilder');

// Import for Adaptive Card templating.
const ACData = require('adaptivecards-templating');

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
const { SendEmailDialog, SEND_EMAIL_DIALOG } = require('./sendEmailDialog');
const { BingSearchDialog, BING_SEARCH_DIALOG } = require('../bingSearchDialogs/bingSearchDialog');

// Dialogs names
const TICKET_DIALOG = 'TICKET_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

const searchResultTicketCard = require('../../botResources/adaptiveCardStructures/searchResultTicketCard.json');
const moment = require('moment');

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

        this.addDialog(new BingSearchDialog());
        this.addDialog(new PossibilitiesDialog(luisRecognizer));
        this.addDialog(new SendEmailDialog(luisRecognizer));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStep.bind(this),
            this.definitionStep.bind(this),
            this.bingSearchStep.bind(this),
            this.askToContinueAfterSearchStep.bind(this),
            this.causeStep.bind(this),
            this.possibilitiesStep.bind(this),
            this.solutionStep.bind(this),
            this.informationAndSendEmailStep.bind(this),
            this.finalChoiceStep.bind(this),
            this.closingStep.bind(this)
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
        console.log('**TICKET DIALOG: firstStep**\n');
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
        console.log('**TICKET DIALOG: definitionStep**\n');
        // Insert user name in the ticket info
        stepContext.values.ticketInfo.user = stepContext.result;

        const message = 'What is the problem?';
        return await stepContext.prompt(TEXT_PROMPT, {
            prompt: message
        });
    }

    /**
     * Implement the interaction that show to the user links to possible solutions and asks if the problem have been resolved.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async bingSearchStep(stepContext) {
        console.log('**TICKET DIALOG: bingSearchStep**\n');
        // Insert the problem definition in the ticket info
        stepContext.values.ticketInfo.problemDefinition = stepContext.result;
        console.log(stepContext.values.ticketInfo.problemDefinition);

        await stepContext.context.sendActivity('Before continue, I\'m going to do a fast search on Bing about your problem!');

        // Call the dialog used to insert the possible solutions to the problem.
        return await stepContext.beginDialog(BING_SEARCH_DIALOG, stepContext.values.ticketInfo.problemDefinition);
    }

    /**
     * Implements the interaction that show the user the bing search result and ask to continue the ticket.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async askToContinueAfterSearchStep(stepContext) {
        console.log('**TICKET DIALOG: askToContinueAfterSearchStep**\n');

        // Prints informations from bing search.
        const responseAsJSON = stepContext.result;
        if (responseAsJSON === '') {
            await stepContext.context.sendActivities([
                { type: 'message', text: 'I have done a fast search on Bing about your problem.' },
                { type: 'message', text: 'Unfortunately, I have not found anything. 😥' }
            ]);
        } else {
            await stepContext.context.sendActivities([
                { type: 'message', text: 'I have done a fast search on Bing about your problem.' },
                { type: 'message', text: 'These are the informations that I have found! 😀' }
            ]);

            // Send the informations as adaptive cards using a forEach loop.
            if (stepContext.context.activity.channelId === 'slack') {
                await responseAsJSON.webPages.value.forEach(async (item, index) => {
                    await stepContext.context.sendActivity(
                        {
                            channelData: {
                                attachments: [
                                    {
                                        title: 'Site name',
                                        text: (index + 1) + '. ' + item.name
                                    },
                                    {
                                        fields: [
                                            {
                                                title: 'Date last crawled',
                                                value: moment(item.dateLastCrawled).format('MMMM Do YYYY, h:mm:ss a'),
                                                short: true
                                            },
                                            {
                                                title: 'Site language',
                                                value: item.language,
                                                short: true
                                            }
                                        ]
                                    },
                                    {
                                        title: 'Link to the site',
                                        text: item.url
                                    },
                                    {
                                        title: 'Site snippet',
                                        text: item.snippet
                                    }
                                ]
                            }
                        }
                    );
                });
            } else {
                await responseAsJSON.webPages.value.forEach(async (item, index) => {
                    // Create a Template instance from the template payload
                    const template = new ACData.Template(searchResultTicketCard);

                    const date = moment(item.dateLastCrawled).format('MMMM Do YYYY, h:mm:ss a');

                    const card = template.expand({
                        $root: {
                            title: item.name,
                            lastCrawled: date.toString(),
                            language: item.language,
                            linkToTheSite: item.url,
                            snippet: item.snippet
                        }
                    });

                    const cardMessage = { type: ActivityTypes.Message };
                    cardMessage.attachments = [CardFactory.adaptiveCard(card)];

                    await stepContext.context.sendActivity(cardMessage);
                });
            }
        }

        // Function used to wait 5 seconds if your channel is slack due to let the channel shows all the bing search results.
        if (stepContext.context.activity.channelId === 'slack') {
            await new Promise(resolve => setTimeout(() => resolve(
                console.log('There are some problem with Slack integration. I need to wait some seconds before continue.')
            ), 5000));
        }

        // Create the list of options to choose from.
        const options = ['Yes', 'No'];
        const message = 'Have you solved your problem?';
        // Prompt the user for a choice.
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: message,
            retryPrompt: 'Please choose an option from the list.',
            choices: options
        });
    }

    /**
     * Implements the interaction that asks the user to define the problem cause.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async causeStep(stepContext) {
        console.log('**TICKET DIALOG: causeStep**\n');
        // Gets the user choiche.
        const userChoice = stepContext.result.value;

        if (userChoice === 'Yes') {
            return await stepContext.endDialog();
        } else {
            const message = 'What is the cause of the problem?';
            return await stepContext.prompt(TEXT_PROMPT, {
                prompt: message
            });
        }
    }

    /**
     * Implements the interaction that asks the user to list the possible solutions to the problem.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async possibilitiesStep(stepContext) {
        console.log('**TICKET DIALOG: possibilitiesStep**\n');
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
        console.log('**TICKET DIALOG: solutionStep**\n');
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
    async informationAndSendEmailStep(stepContext) {
        console.log('**TICKET DIALOG: informationAndSendEmailStep**\n');

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

        console.log(stepContext.context.activity.channelId);

        // Starts to send the messages to the user.
        await stepContext.context.sendActivity('We are at the final step.');
        // Check if the channel used by the user is Slack or not.
        if (stepContext.context.activity.channelId === 'slack') {
            await stepContext.context.sendActivity(
                {
                    channelData: {
                        text: 'Problem Informations',
                        attachments: [
                            {
                                title: 'Problem definition',
                                text: ticket.problemDefinition
                            },
                            {
                                title: 'Problem cause',
                                text: ticket.problemCause
                            },
                            {
                                title: 'Problem Solutions',
                                text: ticket.getPossibilitiesAsString()
                            },
                            {
                                title: 'Favourite solution',
                                text: ticket.problemSolution
                            }
                        ]
                    }
                }
            );
        } else {
            await stepContext.context.sendActivities([
                // Send ticket informations as messages.
                { type: 'message', text: 'These are the problem informations' },
                { type: 'message', text: '**Problem definition**: ' + ticket.problemDefinition },
                { type: 'message', text: '**Problem cause**: ' + ticket.problemCause },
                { type: 'message', text: '**Possible solutions**: ' + ticket.getPossibilitiesAsString() },
                { type: 'message', text: '**Favourite solution**: ' + ticket.problemSolution }
            ]);
        }
        // Sends a reflective message.
        await stepContext.context.sendActivity('During this interaction you have reflected about the problem.');

        const options = ['send', 'done'];
        const message = 'If you want to send the ticket to your manager, type \'send\', else type \'done\'.';
        // Prompt the user for a choice.
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: message,
            retryPrompt: 'Please choose an option from the list.',
            choices: options
        });
    }

    /**
     * Implements the final user decision about the ticket. Send it or avoid.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async finalChoiceStep(stepContext) {
        console.log('**TICKET DIALOG: finalChoiceStep**\n');

        const userInput = stepContext.result.value;
        if (userInput === 'done') {
            console.log('Well done');
            // Exit the dialog.
            return await stepContext.context.sendActivity('Well done! This means that the strategy works!!!');
        } else {
            // Create the ticket object.
            const ticketInfo = stepContext.values.ticketInfo;

            const reply = 'Ok, I\'ll send an email to your PM with ticket information';
            await stepContext.context.sendActivity(reply);

            // Call the dialog used to insert the possible solutions to the problem.
            return await stepContext.beginDialog(SEND_EMAIL_DIALOG, ticketInfo);
        }
    }

    /**
     * Implements the interaction closing.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async closingStep(stepContext) {
        console.log('**TICKET DIALOG: closingStep**\n');

        await stepContext.context.sendActivities([
            { type: 'message', text: 'Perfect, my job here is done! 😎' },
            { type: 'message', text: 'Your interaction for the ticket **ends** here!' }
        ]);
        return await stepContext.endDialog();
    }
}

module.exports.TicketDialog = TicketDialog;
module.exports.TICKET_DIALOG = TICKET_DIALOG;
