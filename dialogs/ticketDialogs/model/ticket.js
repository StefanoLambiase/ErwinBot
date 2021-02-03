/**
 * @description Rapresents the ticket to send to the manager.
 */
class Ticket {
    constructor(user, problemDefinition, problemCause, problemSolution) {
        this.user = user;
        this.problemDefinition = problemDefinition;
        this.problemCause = problemCause;
        this.problemPossibilities = [];
        this.problemSolution = problemSolution;
    }
}

module.exports.Ticket = Ticket;
