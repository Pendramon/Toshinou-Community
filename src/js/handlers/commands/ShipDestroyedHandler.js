/*
Created by Freshek on 24.10.2017
*/

class ShipDestroyedHandler {
  static get ID() {
    return 10317;
  }

  constructor() {
    this._handler = function (e, a) {
      try {
        delete a.ships[a.targetShip.id]
        a.targetShip = null;
        a.attacking = false;
        a.triedToLock = false;
        a.lockedShip = null;
      }
      catch(e) {/*Do nothing*/}
    }
  }

  get handler() {
    return this._handler;
  }
}