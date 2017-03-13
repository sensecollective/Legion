function Legion(options, onFailCallback) {
    //TODO: use onFailCallback if auth fails.
    if (!options) {
        options = {};
    }
    this.options = options;
    this.joined = false;
    this.onJoinCallback = null;

    if (!options.client) {
        options.client = {id: this.randInt(5), secret: this.randInt(5)};
    }

    this.client = options.client;

    this.messageCount = this.randInt(5);
    this.id = null;

    if (!options.overlayProtocol) {
        options.overlayProtocol = {
            type: GeoOptimizedOverlay,
            parameters: {
                locator: HTTPPinger,
                locations: ["https://di.fct.unl.pt", "https://di.fct.unl.pt"],
                MIN_CLOSE_NODES: 3,
                MAX_CLOSE_NODES: 5,
                MIN_FAR_NODES: 1,
                MAX_FAR_NODES: 2,
                CLOSE_NODES_TIMER: 15 * 1000,
                FAR_NODES_TIMER: 55 * 1000,
                LOCAL_FAILS_TILL_RESET: 20
            }
        };
    }
    if (!options.messagingProtocol) {
        options.messagingProtocol = FloodMessaging;
    }
    if (!options.objectOptions) {
        options.objectOptions = {
            serverInterval: 5000,
            peerInterval: 10
        };
    }
    if (!options.bullyProtocol) {
        options.bullyProtocol = {
            type: ServerBully
        };
    }
    if (!options.signallingConnection) {
        options.signallingConnection = {
            type: ServerConnection,
            server: {ip: window.location.hostname, port: 443}
        };
    }
    if (!options.objectServerConnection) {
        options.objectServerConnection = {
            type: ObjectServerConnection,
            server: {ip: window.location.hostname, port: 8000}
        };
    }
    if (!options.securityProtocol) {
        options.securityProtocol = SecurityProtocol;
    }

    this.secure = new this.options.securityProtocol(this);

    this.messagingAPI = new MessagingAPI(this);

    if (this.options.bullyProtocol)
        this.bullyProtocol = new this.options.bullyProtocol.type(this);

    this.overlay = new Overlay(this, this);

    this.connectionManager = new ConnectionManager(this);

    this.objectStore = new ObjectStore(this);

    this.connectionManager.startSignallingConnection();
}

/**
 * Joins the overlay.
 */
Legion.prototype.joinGroup = function (groupOptions, onJoinCallback, onFailCallback) {

    if (!groupOptions) groupOptions = {};

    if (!groupOptions.id)
        groupOptions.id = "default";
    if (!groupOptions.secret) groupOptions.secret = "default";
    this.group = groupOptions;
    this.connectionManager.joinGroup(groupOptions, onJoinCallback, onFailCallback);
};
/**
 *
 * @returns {MessagingAPI}
 */
Legion.prototype.getMessageAPI = function () {
    return this.messagingAPI;
};

/**
 *
 * @returns {ObjectStore}
 */
Legion.prototype.getObjectStore = function () {
    return this.objectStore;
};


/**
 * For generating messages that can be sent.
 * Type is required.
 * @param type {String}
 * @param data {Object}
 * @param callback {Function}
 */
Legion.prototype.generateMessage = function (type, data, callback) {
    var message = {
        type: type,
        group: this.group,
        s: this.id,
        ID: ++this.messageCount
    };

    if (data) {
        message.data = data;
    }

    callback(message);
};

/**
 * Adds new content to an existing message.
 * Does not override message sender or message id!
 * Will remove existing content (even if no newData is given!).
 * @param oldMessage {{type:String, sender: String, ID: number, content: Object|null}}
 * @param newData {Object|null}
 * @param callback {Function}
 */
Legion.prototype.reGenerateMessage = function (oldMessage, newData, callback) {
    //TODO: this seems like a hammered fix.
    if (!newData) {
        if (oldMessage.data)
            delete oldMessage.data;
    } else {
        oldMessage.data = newData;
    }
    callback(oldMessage);
};

/**
 * Returns a number representation of the local clock.
 * @returns {number}
 */
Legion.prototype.getTime = function () {
    //TODO: this should be fixed.
    return Date.now();
};

/**
 * Returns a random integer.
 * @returns {number}
 */
Legion.prototype.randInt = function (N) {
    //TODO: why does the API export this?
    return Math.floor((Math.random() * Number.MAX_VALUE) % (Math.pow(10, N)));
};

/**
 * Sets a callback which is called when a connection is first established to a signalling server.
 * If a connection has already been made the callback is called immediately.
 * @param callback {Function}
 */
Legion.prototype.onJoin = function (callback) {
    if (this.joined) {
        callback();
    } else {
        this.onJoinCallback = callback;
    }
};