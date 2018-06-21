/*
Created by Freshek on 14.10.2017
*/

class Settings {
  constructor(collectBoxes, collectMaterials, moveRandomly, lockNpc, lockPlayers, excludeNpcs, autoAttackNpcs, autoAttack, killNpcs, status, fleeFromEnemy, dontCircleWhenHpBelow25Percent) {
    this._collectBoxes = collectBoxes === true;
    this._collectMaterials = collectMaterials === true;
    this._moveRandomly = moveRandomly === true;
    this._lockNpc = lockNpc === true;
    this._lockPlayers = lockPlayers === true;
    this._excludeNpcs = excludeNpcs === true;
    this._autoAttack = autoAttack === true;
    this._autoAttackNpcs = autoAttackNpcs === true;
    this._killNpcs = killNpcs === true;
    this._npcs = [];
    this.npcCircleRadius = 500;
    this._dontCircleWhenHpBelow25Percent = dontCircleWhenHpBelow25Percent === true;
    this.reviveLimit = 5;
    this._status = status === true;
    this._fleeFromEnemy = fleeFromEnemy === true;
  }

  get status() {
    return this._status;
  }

  set status(value) {
    this._status = value === true;
  }

  get fleeFromEnemy() {
    return this._fleeFromEnemy;
  }

  set fleeFromEnemy(value) {
    this._fleeFromEnemy = value === true;
  }

  get collectBoxes() {
    return this._collectBoxes;
  }

  set collectBoxes(value) {
    this._collectBoxes = value === true;
  }

  get collectMaterials() {
    return this._collectMaterials;
  }

  set collectMaterials(value) {
    this._collectMaterials = value === true;
  }

  get moveRandomly() {
    return this._moveRandomly;
  }

  set moveRandomly(value) {
    this._moveRandomly = value === true;
  }

  get lockNpc() {
    return this._lockNpc;
  }

  set lockNpc(value) {
    this._lockNpc = value === true;
  }

  get lockPlayers() {
    return this._lockPlayers;
  }

  set lockPlayers(value) {
    this._lockPlayers = value === true;
  }

  get excludeNpcs() {
    return this._excludeNpcs;
  }

  set excludeNpcs(value) {
    this._excludeNpcs = value === true;
  }

  get autoAttackNpcs() {
    return this._autoAttackNpcs;
  }

  set autoAttackNpcs(value) {
    this._autoAttackNpcs = value === true;
  }

  get autoAttack() {
    return this._autoAttack;
  }

  set autoAttack(value) {
    this._autoAttack = value === true;
  }

  get killNpcs() {
    return this._killNpcs;
  }

  set killNpcs(value) {
    this._killNpcs = value === true;
  }

  get dontCircleWhenHpBelow25Percent() {
    return this._dontCircleWhenHpBelow25Percent;
  }

  set dontCircleWhenHpBelow25Percent(value) {
    this._dontCircleWhenHpBelow25Percent = value === true;
  }

  setNpc(name, val) {
    this._npcs[name] = val;
  }

  getNpc(name) {
    return !this._npcs[name];
  }
}