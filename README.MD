# Erwin bot

<img 
  src="https://raw.githubusercontent.com/StefanoLambiase/ErwinBot/develop/botResources/images/erwinImage.png?token=AH2LWLYOROBX5CRSB3Z4WV3AG5LAY" 
  alt="Oh my... It's Erwin!">

**Erwin bot** is a software management support bot built with node.js, [Azure Bot Framework](https://dev.botframework.com), and other Azure services.
It offers the manager the opportunity to communicate in an organized manner with the project team and, at the same time, monitor and organize the various activities under development.

Erwin Bot is meant to work primarily on Slack, but most of its features also work on the other channels in the Azure Bot Framework's default channel list.

- On *Slack*, it uses the [Full-Fidelity Slack Message](https://docs.microsoft.com/it-it/azure/bot-service/bot-builder-channeldata?view=azure-bot-service-4.0#:~:text=To%20create%20a%20full%2Dfidelity,bot%20to%20the%20Slack%20channel.) feature to create beautiful and clear messages.

- On other channels, it uses the [Microsoft Adaptive Card](https://docs.microsoft.com/it-it/adaptive-cards/) to show information meaningfully.

## Authors

* **Stefano Lambiase**  - [StefanoLambiase](https://github.com/StefanoLambiase)
* **Andrea Cupito**     - [ACupito](https://github.com/ACupito)

## Bot Architecture

### Class Diagram

<img 
  src="https://raw.githubusercontent.com/StefanoLambiase/ErwinBot/master/botResources/images/ErwinBot%20ClassDiagram.png" 
  alt="ErwinBot Class diagram">

### Service Architecture

<img 
  src="https://raw.githubusercontent.com/StefanoLambiase/ErwinBot/master/botResources/images/ErwinArchitecture.png" 
  alt="Erwin Architecture">

# Prerequisites

## Needed Azure Services

These are the services you need to run the bot with all its features

- [**Web App Bot** and **App Service**](https://azure.microsoft.com/it-it/services/bot-services/)
- [**LUIS Cognitive service**](https://www.luis.ai/)
- [**Azure Cosmos DB (Mongo)**](https://azure.microsoft.com/it-it/services/cosmos-db/)
- [**Bing Resource**](https://docs.microsoft.com/en-us/azure/cognitive-services/bing-web-search/)

## Node Prerequisites

- [Node.js](https://nodejs.org) version 10.14 or higher
    ```bash
    # determine node version
    node --version
    ```
# To run the bot locally

- Clone this repo
- Create the needed Azure Resources on the Azure Portal
- Read the *.env_sample* and complete with the required keys ([dotenv documentation](https://www.npmjs.com/package/dotenv))
- Rename the *.env_sample* into *.env* 
- Save the resources' credentials in a *.env* file in your project
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

# Contributors

<a href="https://github.com/stefanolambiase/ErwinBot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=stefanolambiase/ErwinBot" />
</a>
