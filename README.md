# Discord Activity Video
Welcome. This README provides an overview of how the project works and its structure.

## Flowchart
Below is the flowchart illustrating the internal workings of the project:

![diagrama](https://github.com/user-attachments/assets/d316f61e-1897-43a5-bcf5-3816e83b9de6)

##Repository Structure
- /bot -> Contains all information related to the Discord bot. It uses the [handler](https://github.com/Fyxren/discord.js-v14-handler) provided by Fyxren.
  - /src -> Contains the bot's code.
    - /commands/info -> This directory includes the bot's single command.

- /api -> Contains the API, which includes the video proxy and functionality for storing user information.

- /activity -> The web application built with Next.js, featuring a video player using video.js.

## Contributions
The project is open-source, and anyone is free and encouraged to contribute to the project.

## License
The project is licensed under the MIT License. More information can be found [here](https://github.com/polo-1245-oficial/discordVideoActivity/blob/main/LICENSE).
