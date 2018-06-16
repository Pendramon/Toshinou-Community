/*
Created on 04.11.2017 by Freshek
*/

class ShipSelectedHandler {
  static get ID() {
    return 29095;
  }

  constructor() {
    this._handler = function (e, a) {
      var parsedJson = JSON.parse(e.detail);

      var ship = a.ships[parsedJson.userId];

      ship.maxHp = parsedJson[Variables.selectMaxHp];
      ship.maxShd = parsedJson[Variables.selectMaxShd];
      ship.hp = parsedJson[Variables.selectHp];
      ship.shd = parsedJson.shield;

      if (ship != null)
        a.lockedShip = ship;
      if ((window.settings.killNpcs && ship.isNpc && window.settings.status) || (window.settings.autoAttack && ship.isEnemy && !ship.isNpc) || (window.settings.autoAttackNpcs && ship.isNpc)) {
        api.startLaserAttack();
        api.attacking = true;
      }
    }
  }

  get handler() {
    return this._handler;
  }
}