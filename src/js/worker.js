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

  if (!window.settings.status) {
    return
  }

  if (api.isDisconnected) {
    if (window.fleeingFromEnemy) {
      window.fleeFromEnemy = false;
    }
    if (api.disconnectTime && $.now() - api.disconnectTime > 10000 && (!api.reconnectTime || (api.reconnectTime && $.now() - api.reconnectTime > 15000))) {
      api.reconnect();
    }
    return;
  }

  if (window.pauseTime && window.pauseTime - $.now() > 0) {
    return
  }

  if (window.settings.fleeFromEnemy) {
    if (!window.fleeingFromEnemy) {

      for (let property in api.ships) {
        let ship = api.ships[property];
        if (!ship.isNpc && ship.isEnemy) {
          window.fleeingFromEnemy = true;
          api.targetShip = null;
          api.attacking = false;
          api.triedToLock = false;
          api.lockedShip = null;
          api.targetBoxHash = null;
          api.forceCollecting = null;
          let minDist = 999999;

          api.gates.forEach(gate => {
            let distGate = gate.distanceTo(window.hero.position);
            if (distGate < minDist && gate.distanceTo(ship.position) > distGate) {
              let minDist = distGate;
              window.fleeingGate = gate;
            }
          });
        }
      }
    } else {
      if (window.fleeingGate) {
        let distGate = window.fleeingGate.distanceTo(window.hero.position);
        if (distGate > 350) {
          let x = fleeingGate.position.x + MathUtils.random(-100, 100);
          let y = fleeingGate.position.y + MathUtils.random(-100, 100);
          api.move(x, y);
          api.movementDone = false;
        } else {
          api.jumpGate();
          window.fleeingGate = false;
        }
      }
      return;
    }
  }

  if (window.settings.fleeFromEnemy && window.fleeingFromEnemy) {
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
      api.forceCollecting = null;
      api.move(x, y);
      window.movementDone = false;
      api.isRepairing = true;
    }
  }

  let box = api.findNearestBox();
  let ship = api.findNearestShip();

  //Failsafe in case collecting a box gets stuck
  if (api.targetBoxHash && $.now() - api.collectTime > 5000) {
    let box = api.boxes[api.targetBoxHash];
    if (box && box.distanceTo(window.hero.position) > 1000) {
      api.collectTime = $.now();
    } else {
      delete api.boxes[api.targetBoxHash];
      api.blackListHash(api.targetBoxHash);
      api.targetBoxHash = null;
      api.forceCollecting = null;
    }
  }

  if ((window.settings.collectBoxes || window.settings.collectMaterials) && box.box) {
    if (api.forceCollecting == null && !api.lockedShip && (ship.distance > 900 && box.box.distanceTo(hero.position) < 1200 || !window.settings.killNpcs)) {
      api.collectBox(box.box);
      api.targetBoxHash = box.box.hash;
      api.forceCollecting = true;
    } else if (window.settings.killNpcs && (api.lockedShip && api.lockedShip.percentOfHp > 25 && (api.lockedShip.distanceTo(box.box.position) < 700))) {
      api.collectBox(box.box);
      api.targetBoxHash = box.box.hash;
      api.forceCollecting = null;
      return;
    }
  }

  //Failsafe in case attacking a npc gets stuck
  if ((api.targetShip && $.now() - api.lockTime > 5000 && !api.attacking) || $.now() - api.lastAttack > 12000) {
    api.targetShip = null;
    api.attacking = false;
    api.triedToLock = false;
    api.lockedShip = null;
  }

  if (window.settings.killNpcs) {
    if (ship.ship) {
      if (!api.targetShip) {
        api.targetShip = ship.ship;
      }
      if (api.targetShip) {
        let dist = api.targetShip.distanceTo(hero.position);
        if (dist < 900 && !api.triedToLock) {
          api.lockShip(api.targetShip);
          api.triedToLock = true;
        }
        // Failsafe in case attack starts too early
        if (api.lockedShip && ($.now() - api.lockTime > 3000 && $.now() - api.lockTime < 6000) && $.now() - api.lastAttack > 2000 && api.lockedShip.distanceTo(hero.position) < 1000) {
          api.startLaserAttack();
          api.lastAttack = $.now();
        }
        if (window.settings.circleNpc && dist < 900 && (!window.settings.dontCircleWhenHpBelow25Percent || api.targetShip.percentOfHp > 25)) {
          let enemy = api.targetShip.position;
          let f = Math.atan2(window.hero.position.x - enemy.x, window.hero.position.y - enemy.y) + 0.5;
          let s = Math.PI / 180;
          f += s;
          x = enemy.x + window.settings.npcCircleRadius * Math.sin(f);
          y = enemy.y + window.settings.npcCircleRadius * Math.cos(f);
          api.move(x, y);
          return;
        }
        if (window.settings.dontCircleWhenHpBelow25Percent && api.targetShip.percentOfHp < 23 && api.targetShip) {
          let suck = Math.atan2(window.hero.position.x - enemy.x, window.hero.position.y - enemy.y);
          let suckX = Math.sin(suck)*700;
          let suckY = Math.cos(suck)*700;
          x = Math.abs(suckX + enemy.x);
          y = Math.abs(suckY + enemy.y);
          api.move(x,y);
          return;
        } 
        if (dist > 500 && !api.forceCollecting) {
          api.move(api.targetShip.position.x - MathUtils.random(-100, 100), api.targetShip.position.y - MathUtils.random(-100, 100));
        }
      }
    }
  }

  if (!api.targetBoxHash && !api.targetShip && window.movementDone && window.settings.moveRandomly) {
    let x = MathUtils.random(100, 20732);
    let y = MathUtils.random(58, 12830);
    api.move(x, y);
    window.movementDone = false;
  }

}
