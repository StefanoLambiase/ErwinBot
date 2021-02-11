// Import required types from libraries
const { InputHints } = require('botbuilder');

const {
    ComponentDialog,
    DialogTurnStatus
} = require('botbuilder-dialogs');

/**
 * Implements the possibility to stop a ticket dialog exectuion to ask infos or cancel it.
 */
class InterruptDialog extends ComponentDialog {
    async onContinueDialog(innerDc) {
        const result = await this.interrupt(innerDc);
        if (result) {
            return result;
        }
        return await super.onContinueDialog(innerDc);
    }

    async interrupt(innerDc) {
        if (innerDc.context.activity.text) {
            const text = innerDc.context.activity.text.toLowerCase();

            switch (text) {
            case 'help':
            case '?': {
                const helpMessageText = 'Type \'cancel\' to interrupt the interaction';
                await innerDc.context.sendActivity(helpMessageText, helpMessageText, InputHints.ExpectingInput);
                return { status: DialogTurnStatus.waiting };
            }
            case 'cancel':
            case 'quit': {
                const cancelMessageText = 'Cancelling...';
                await innerDc.context.sendActivity(cancelMessageText, cancelMessageText, InputHints.IgnoringInput);
                return await innerDc.cancelAllDialogs();
            }
            }
        }
    }
}

module.exports.InterruptDialog = InterruptDialog;
