// Import required types from libraries.
const {
    TextPrompt,
    ComponentDialog,
    WaterfallDialog
} = require('botbuilder-dialogs');

// Dialogs names.
const QUESTIONS_DEFINITION_DIALOG = 'QUESTIONS_DEFINITION_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';

class QuestionsDefinitionDialog extends ComponentDialog {
    constructor(userState) {
        super(QUESTIONS_DEFINITION_DIALOG);

        this.finishOption = 'finish';

        this.questionInserted = 'value-questionInserted';

        // Adding used dialogs
        this.addDialog(new TextPrompt(TEXT_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.definitionStep.bind(this),
            this.loopStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async definitionStep(step) {
        // check if the value inserted is an array and continue the process with it
        // if not instance a new one
        const questionsList = Array.isArray(step.options) ? step.options : [];
        step.values[this.questionInserted] = questionsList;

        let informativeText = '';
        if (questionsList.length === 0) {
            informativeText = 'Please define the first question';
        } else {
            informativeText = 'You have defined ' + questionsList.length + ' questions. Type ' + this.finishOption + ' to end the process or define another question.';
        }

        return await step.prompt(TEXT_PROMPT, {
            prompt: informativeText
        });
    }

    async loopStep(step) {
        // Take the user input
        const questionsList = step.values[this.questionInserted];
        const input = step.result;

        const isFinish = (input === this.finishOption);

        if (!isFinish) {
            // Only if it's a question we take it
            questionsList.push(input);
        }

        if (isFinish && questionsList.length > 0) {
            // If the user typed "finish" and we've enough questions
            return await step.endDialog(questionsList);
        } else {
            // Continue to cycle
            return await step.replaceDialog(QUESTIONS_DEFINITION_DIALOG, questionsList);
        }
    }
}

module.exports.QuestionsDefinitionDialog = QuestionsDefinitionDialog;
module.exports.QUESTIONS_DEFINITION_DIALOG = QUESTIONS_DEFINITION_DIALOG;
