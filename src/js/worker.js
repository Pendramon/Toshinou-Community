/*
Created by Freshek on 07.10.2017
*/
window.globalSettings = new GlobalSettings();
var api;

$(document).ready(function () {
  api = new Api();

  var preloader = $("#preloader").attr("wmode", "opaque");
  $("#preloader").remove();

  var check = SafetyChecker.check();

  if (check !== true) {
    var warning = jQuery("<div>");
    warning.css({
      top: 0,
      left: 0,
      position: "absolute",
      width: "100%",
      height: "100%",
      backgroundColor: "gray",
      textAlign: "center"
    });

    jQuery("<h1>").text("The tool detected changes in the game.").appendTo(warning);
    jQuery("<h2>").text("Loading stopped! Your account has to stay safe.").appendTo(warning);
    jQuery("<h3>").text("Reason: " + check).appendTo(warning);

    warning.appendTo("body");
    throw new Error("Safety tests failed!");
  }

  preloader.appendTo($("#container"));

  window.settings = new Settings();
  window.initialized = false;
  window.reviveCount = 0;

  window.movementDone = true;

  var hm = new HandlersManager(api);

  hm.registerCommand(BoxInitHandler.ID, new BoxInitHandler());
  hm.registerCommand(ShipAttackHandler.ID, new ShipAttackHandler());
  hm.registerCommand(ShipCreateHandler.ID, new ShipCreateHandler());
  hm.registerCommand(ShipMoveHandler.ID, new ShipMoveHandler());
  hm.registerCommand(AssetRemovedHandler.ID, new AssetRemovedHandler());
  hm.registerCommand(HeroInitHandler.ID, new HeroInitHandler(init));
  hm.registerCommand(ShipDestroyedHandler.ID, new ShipDestroyedHandler());
  hm.registerCommand(ShipRemovedHandler.ID, new ShipRemovedHandler());
  hm.registerCommand(GateInitHandler.ID, new GateInitHandler());
  hm.registerCommand(ShipSelectedHandler.ID, new ShipSelectedHandler());
  hm.registerCommand(MessagesHandler.ID, new MessagesHandler());
  hm.registerCommand(HeroDiedHandler.ID, new HeroDiedHandler());
  hm.registerCommand(HeroUpdateHitpointsHandler.ID, new HeroUpdateHitpointsHandler());

  hm.registerEvent("updateHeroPos", new HeroPositionUpdateEventHandler());
  hm.registerEvent("movementDone", new MovementDoneEventHandler());
  hm.registerEvent("isConnected", new HeroConnectedEventHandler());
  hm.registerEvent("isDisconnected", new HeroDisconnectedEventHandler());

  hm.listen();
});

function init() {
  if (window.initialized)
    return;

  window.minimap = new Minimap(api);
  window.minimap.createWindow();

  window.attackWindow = new AttackWindow();
  window.attackWindow.createWindow();

  window.generalSettingsWindow = new GeneralSettingsWindow();
  window.generalSettingsWindow.createWindow();

  window.autolockWindow = new AutolockWindow();
  window.autolockWindow.createWindow();

  window.npcSettingsWindow = new NpcSettingsWindow();
  window.npcSettingsWindow.createWindow();

  window.statisticWindow = new StatisticWindow();
  window.statisticWindow.createWindow();

  Injector.injectScriptFromResource("res/injectables/HeroPositionUpdater.js");

  window.setInterval(logic, window.globalSettings.timerTick);

  $(document).keypress(function keyLock(e) {
    let key = e.key;

    if (key == "x" || key == "z") {
      let maxDist = 1000;
      let finDist = 1000000;
      let finalShip;

      for (let property in api.ships) {
        let ship = api.ships[property];
        let dist = ship.distanceTo(window.hero.position);

        if ((ship.isNpc && window.settings.lockNpc && key == "x" && dist < maxDist && dist < finDist && (!window.settings.excludeNpcs || window.settings.getNpc(ship.name))) || (!ship.isNpc && ship.isEnemy && window.settings.lockPlayers && key == "z")) {
          finalShip = ship;
          finDist = dist;
        }
      }

      if (finalShip != null) {
        api.lockShip(finalShip);
      }
    }
  });
}

function logic() {

  if (api.heroDied) {
    return;
  }

  window.minimap.draw();
  
  if (api.isDisconnected) {
    if (window.fleeingFromEnemy) {
      window.fleeFromEnemy = false;
    }
    if (api.disconnectTime && $.now() - api.disconnectTime > 10000 && (!api.reconnectTime || (api.reconnectTime && $.now() - api.reconnectTime > 15000))) {
      api.reconnect();
    }
    return;
  }

  if (!window.settings.status) {
    return
  }

  if (window.settings.flee && window.fleeingFromEnemy) {
    return
  }

  if (api.isRepairing && window.hero.hp !== window.hero.maxHp) {
    let gate = api.findNearestGate();
    if (gate.gate && window.hero.position.x != gate.gate.position.x || window.hero.position.y != gate.gate.position.y) {
      let x = gate.gate.position.x;
      let y = gate.gate.position.y;
      api.move(x, y);
      window.movementDone = false;
    }
    return;
  } else if (api.isRepairing && window.hero.hp === window.hero.maxHp) {
    api.isRepairing = false;
  }

  if (MathUtils.percentFrom(window.hero.hp, window.hero.maxHp) < window.settings.repairWhenHpIsLowerThanPercent) {
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
      api.isRepairing = true;
    }
  }

  let box = api.findNearestBox();
  let ship = api.findNearestShip();

  if ((window.settings.collectBoxes || window.settings.collectMaterials) && box.box) {
    if (api.targetBoxHash == null && (ship.distance > 900 || !window.settings.killNpcs)) {
      api.collectBox(box.box);
      api.targetBoxHash = box.box.hash;
    }
    if (window.settings.killNpcs && (api.lockedShip && api.lockedShip.percentOfHp > 15 && (api.lockedShip.distanceTo(box.box.position) < 700))) {
      api.collectBox(box.box);
      api.targetBoxHash = null;
      return;
    }
  }

  if (window.settings.killNpcs && !window.settings.npcDontChase) {
    if (ship.ship) {
      if (ship.distance < 900 && api.targetShip == null) {
        api.lockShip(ship.ship);
        api.triedToLock = true;
        api.targetShip = ship.ship;
        return;
      } else if (api.targetShip != null && api.targetShip != ship.ship && api.targetBoxHash == null) {
        api.targetShip.update();
        let dist = api.targetShip.distanceTo(window.hero.position);
        if (dist > 250) {
          api.move(api.targetShip.position.x - MathUtils.random(-100, 100), api.targetShip.position.y - MathUtils.random(-100, 100))
          return;
        }
      } else if (ship.distance > 350 && api.targetBoxHash == null) {
        ship.ship.update();
        api.move(ship.ship.position.x - MathUtils.random(-100, 100), ship.ship.position.y - MathUtils.random(-100, 100));
        return;
      }
      //Failsafe in case attacking gets stuck
      if ((api.targetShip && $.now() - api.lockTime > 5000 && !api.attacking) || $.now() - api.lastAttack > 12000) {
        api.targetShip = null;
        api.attacking = false;
        api.triedToLock = false;
        api.lockedShip = null;
      }
    }
  }

  if (api.targetBoxHash == null && api.targetShip == null && window.movementDone && window.settings.moveRandomly) {
    let x = MathUtils.random(100, 20732);
    let y = MathUtils.random(58, 12830);
    api.move(x, y);
    window.movementDone = false;
  }

}
