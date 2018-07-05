class Map {
    constructor(id, level, faction, name, starterMap, portals = []) {
        this._id = id;
        this._level = level;
        this._faction = faction;
        this._name = name;
        this._starterMap = starterMap;
        this._portals = portals;
    }

    get id() {
        return this._id;
    }

    get level() {
        return this._level;
    }

    get faction() {
        return this._faction;
    }

    get name() {
        return this._name;
    }

    get starterMap() {
        return this._starterMap;
    }

    get portals() {
        return this._portals;
    }       
}