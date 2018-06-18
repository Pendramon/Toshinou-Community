/*
Created by Freshek on 10.10.2017
*/

class ShipCreateHandler {
  static get ID() {
    return 29088;
  }

  constructor() {
    this._handler = function (e, a) {
      e.detail = e.wholeMessage.split("|").slice(1).join("");

      var shipCreateCmd = JSON.parse(e.detail);
      a.ships[shipCreateCmd.userId] = new Ship(shipCreateCmd.x, shipCreateCmd.y, shipCreateCmd.userId, shipCreateCmd.npc, shipCreateCmd.userName, shipCreateCmd.factionId);
      if (window.settings.fleeFromEnemy && (a.ships[shipCreateCmd.userId] && a.ships[shipCreateCmd.userId].isEnemy && !a.ships[shipCreateCmd.userId].isNpc)) {
        let gate = api.findNearestGate();
        if (gate.gate) {
          let x = gate.gate.position.x;
          let y = gate.gate.position.y;
          api.targetShip = null;
          api.attacking = false;
          api.triedToLock = false;
          api.lockedShip = null;
          api.targetBoxHash = null;
          api.move(x, y);
          window.movementDone = false;
          window.fleeingFromEnemy = true;
          console.log("ENEMY SHIP DETECTED - RUNNING TO x=" + x + ", y=" + y + "; PAUSING FOR 3 MINUTES");
          setTimeout(() => {
            window.movementDone = true;
            window.fleeingFromEnemy = false;
          }, 180000);
        }
      }
    }
  }

  get handler() {
    return this._handler;
  }
}