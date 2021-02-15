// Import required types from libraries
const { ActivityTypes, CardFactory } = require('botbuilder');

// Import for Adaptive Card templating.
const ACData = require('adaptivecards-templating');
const boardCard = require('../../botResources/adaptiveCardStructures/trelloCards/boardCard.json');

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

// Import utils.
const trelloAdapter = require('./ticketUtils/trelloAdapter');
const moment = require('moment');

// Import dialogs
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
     * @param {*} stepContext - The context from previous interactions with the user.
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
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async optionsStep(stepContext) {
        console.log('**TRELLO MAIN DIALOG: optionStep**\n');

        // Text from the previous step.
        const specifiedOption = (stepContext.result.value).toLowerCase();

        // Luis result from LuisRecognizer.
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);

        // Part to select the dialogs.
        if (specifiedOption === 'get my cards') {
            const responseAsJSON = await trelloAdapter.getAllMyCards();
            if (responseAsJSON !== undefined) {
                await printCards(stepContext, responseAsJSON);
            } else {
                await stepContext.context.sendActivity('Sorry! There are problems with Trello! Retry later.');
            }
        } else if (specifiedOption === 'get my boards') {
            const responseAsJSON = await trelloAdapter.getAllMyBoards();
            if (responseAsJSON !== undefined) {
                await printBoards(stepContext, responseAsJSON);
            } else {
                await stepContext.context.sendActivity('Sorry! There are problems with Trello! Retry later.');
            }
        } else {
            // The user did not enter input that this bot was built to handle.
            await stepContext.context.sendActivity('Sorry! I can\'t recognize your command. Retry!');
        }

        return await stepContext.next();
    }

    /**
     * Implements the interaction that asks to the user to continue or stop the conversation.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
    async waitStep(stepContext) {
        console.log('**TRELLO MAIN DIALOG: waitStep**\n');

        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: 'Do you want to continue with trello?',
            retryPrompt: 'Please select one of the following options',
            choices: ['yes', 'no']
        });
    }

    /**
     * Implements the loop or quit of the dialog.
     * @param {*} stepContext - The context from previous interactions with the user.
     */
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

/**
 * Prints in chat the cards found in the http request.
 * @param {*} stepContext - The context from previous interactions with the user.
 * @param {string} responseAsJSON - The cards list as JSON.
 */
async function printCards(stepContext, responseAsJSON) {
    console.log('**TRELLO MAIN DIALOG: printCards**\n');
}

/**
 * Prints in chat the boards found in the http request.
 * @param {*} stepContext - The context from previous interactions with the user.
 * @param {string} responseAsJSON - The boards list as JSON.
 */
async function printBoards(stepContext, responseAsJSON) {
    console.log('**TRELLO MAIN DIALOG: printBoards**\n');

    if (stepContext.context.activity.channelId === 'slack') {
        await responseAsJSON.forEach(async (item, index) => {
            await stepContext.context.sendActivity(
                {
                    channelData: {
                        text: 'Card number ' + index,
                        attachments: [
                            {
                                title: 'Board Name',
                                text: item.name
                            },
                            {
                                title: 'Description',
                                text: item.desc
                            },
                            {
                                title: 'Last update',
                                text: moment(item.dateLastActivity).format('MMMM Do YYYY, h:mm:ss a')
                            },
                            {
                                title: 'Link to the board',
                                text: item.url
                            }
                        ]
                    }
                }
            );

            await new Promise(resolve => setTimeout(() => resolve(
                console.log('There are some problem with Slack integration. I need to wait some seconds before continue.')
            ), 2000));
        });
    } else {
        await responseAsJSON.forEach(async (item, index) => {
            // Create a Template instance from the template payload
            const template = new ACData.Template(boardCard);

            const date = moment(item.dateLastActivity).format('MMMM Do YYYY, h:mm:ss a');

            const card = await template.expand({
                $root: {
                    index: index + 1,
                    name: item.name,
                    url: item.url,
                    desc: item.desc,
                    dateLastActivity: date.toString()
                }
            });

            // Send the card.
            const cardMessage = { type: ActivityTypes.Message };
            cardMessage.attachments = [CardFactory.adaptiveCard(card)];
            await stepContext.context.sendActivity(cardMessage);
        });
    }

    await new Promise(resolve => setTimeout(() => resolve(
        console.log('Wait 4 seconds after boards print.')
    ), 3000));
}

module.exports.TrelloMainDialog = TrelloMainDialog;
module.exports.TRELLO_MAIN_DIALOG = TRELLO_MAIN_DIALOG;
