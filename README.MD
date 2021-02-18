# Erwin bot

<img 
  src="https://images.everyeye.it/img-notizie/l-attacco-giganti-vediamo-nuova-action-figure-dedicata-erwin-smith-v3-392534-1280x720.jpg" 
  alt="Oh my... It's Erwin!">

**Erwin bot** is a software management support bot built with node.js, [Azure Bot Framework](https://dev.botframework.com), and other Azure services.
It offers the manager the opportunity to communicate in an organized manner with the project team and, at the same time, monitor and organize the various activities under development.

Erwin Bot is meant to work primarily on Slack, but most of its features also work on the other channels in the Azure Bot Framework's default channel list.

- On *Slack*, use the [Full-Fidelity Slack Message](https://docs.microsoft.com/it-it/azure/bot-service/bot-builder-channeldata?view=azure-bot-service-4.0#:~:text=To%20create%20a%20full%2Dfidelity,bot%20to%20the%20Slack%20channel.) feature to create beautiful and clear messages.

- On other channels, use the [Microsoft Adaptive Card](https://docs.microsoft.com/it-it/adaptive-cards/) to show information meaningfully.

## Prerequisites

- [Node.js](https://nodejs.org) version 10.14 or higher
    ```bash
    # determine node version
    node --version
    ```
# To run the bot locally

- Clone this repo
- Create the nedded Azure Resources on the Azure Portal
- Saves the resources' credentials in a *.env* file in your project
- Install modules

    ```bash
    npm install
    ```

- Run the bot

    ```bash
    npm start
    ```

## Testing the bot using Bot Framework Emulator

[Bot Framework Emulator](https://github.com/microsoft/botframework-emulator) is a desktop application that allows bot developers to test and debug their bots on localhost or running remotely through a tunnel.

- Install the Bot Framework Emulator version 4.9.0 or greater from [here](https://github.com/Microsoft/BotFramework-Emulator/releases)

### Connect to the bot using Bot Framework Emulator

- Launch Bot Framework Emulator
- File -> Open Bot
- Enter a Bot URL of `http://localhost:3978/api/messages`

# Deploy the bot to Azure

To learn more about deploying a bot to Azure, see [Deploy your bot to Azure](https://aka.ms/azuredeployment) for a complete list of deployment instructions.

## Useful reading

- [Bot Framework Documentation](https://docs.botframework.com)
- [Bot Basics](https://docs.microsoft.com/azure/bot-service/bot-builder-basics?view=azure-bot-service-4.0)
- [Activity processing](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-concept-activity-processing?view=azure-bot-service-4.0)
- [Azure Bot Service Introduction](https://docs.microsoft.com/azure/bot-service/bot-service-overview-introduction?view=azure-bot-service-4.0)
- [Azure Bot Service Documentation](https://docs.microsoft.com/azure/bot-service/?view=azure-bot-service-4.0)
- [Deploy your bot to Azure](https://aka.ms/azuredeployment)
- [Azure CLI](https://docs.microsoft.com/cli/azure/?view=azure-cli-latest)
- [Azure Portal](https://portal.azure.com)
- [Language Understanding using LUIS](https://docs.microsoft.com/en-us/azure/cognitive-services/luis/)
- [Channels and Bot Connector Service](https://docs.microsoft.com/en-us/azure/bot-service/bot-concepts?view=azure-bot-service-4.0)
- [Restify](https://www.npmjs.com/package/restify)
- [dotenv](https://www.npmjs.com/package/dotenv)
