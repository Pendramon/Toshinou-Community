class Portal {
    constructor(id, x, y, newX, newY, map) {
        this._id = id;
        this._position = new Vector2D(x, y);
        this._newPosition = new Vector2D(x, y);
        this._map = map;
    }

    get id() {
        return this._id;
    }

    get position() {
        return this._position;
    }

    get newPosition() {
        return this._newPosition;
    }

    get map() {
        return this._map;
    }
}