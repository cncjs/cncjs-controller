import mapValues from 'lodash.mapvalues';
import { in2mm } from './units';
import ensureArray from './ensure-array';
import {
    // Units
    IMPERIAL_UNITS,
    METRIC_UNITS,
    // Controller
    GRBL,
    SMOOTHIE,
    TINYG
} from './constants';

const noop = () => {};

class Controller {
    io = null;
    socket = null;

    listeners = {
        // Socket.IO Events
        // Fired upon a connection including a successful reconnection.
        'connect': [],
        // Fired upon a connection error.
        'connect_error': [],
        // Fired upon a connection timeout.
        'connect_timeout': [],
        // Fired when an error occurs.
        'error': [],
        // Fired upon a disconnection.
        'disconnect': [],
        // Fired upon a successful reconnection.
        'reconnect': [],
        // Fired upon an attempt to reconnect.
        'reconnect_attempt': [],
        // Fired upon an attempt to reconnect.
        'reconnecting': [],
        // Fired upon a reconnection attempt error.
        'reconnect_error': [],
        // Fired when couldn't reconnect within reconnectionAttempts.
        'reconnect_failed': [],

        // System Events
        'startup': [],
        'ports': [],
        'config:change': [],
        'task:start': [],
        'task:finish': [],
        'task:error': [],
        'controller:type': [],
        'controller:settings': [],
        'controller:state': [],
        'connection:open': [],
        'connection:close': [],
        'connection:change': [],
        'connection:error': [],
        'connection:read': [],
        'connection:write': [],
        'gcode:load': [],
        'gcode:unload': [],
        'feeder:status': [],
        'sender:status': [],
        'workflow:state': [],
        'message': []
    };

    context = {
        xmin: 0,
        xmax: 0,
        ymin: 0,
        ymax: 0,
        zmin: 0,
        zmax: 0
    };

    // User-defined baud rates
    baudRates = [];

    // Available controllers
    loadedControllers = [];

    // Controller
    type = ''; // Grbl|Smoothie|TinyG
    settings = {};
    state = {};

    // Connection
    connection = {
        ident: '',
        type: '', // serial|socket
        settings: {}
    };

    workflow = {
        state: 'idle' // running|paused|idle
    };

    // Whether the client is connected to the server.
    // @return {boolean} Returns true if the client is connected to the server, false otherwise.
    get connected() {
        return !!(this.socket && this.socket.connected);
    }

    // @param {object} io The socket.io-client module.
    constructor(io) {
        if (!io) {
            throw new Error(`Expected the socket.io-client module, but got: ${io}`);
        }

        this.io = io;
    }
    // Establish a connection to the server.
    // @param {string} host
    // @param {object} options
    // @param {function} next
    connect(host = '', options = {}, next = noop) {
        if (typeof next !== 'function') {
            next = noop;
        }

        this.socket && this.socket.destroy();
        this.socket = this.io.connect(host, options);

        Object.keys(this.listeners).forEach((eventName) => {
            if (!this.socket) {
                return;
            }

            this.socket.on(eventName, (...args) => {
                if (eventName === 'controller:type') {
                    this.type = args[0];
                }
                if (eventName === 'controller:settings') {
                    this.type = args[0];
                    this.settings = { ...args[1] };
                }
                if (eventName === 'controller:state') {
                    this.type = args[0];
                    this.state = { ...args[1] };
                }
                if (eventName === 'connection:open') {
                    const { ident, type, settings } = { ...args[0] };
                    this.connection.ident = ident;
                    this.connection.type = type;
                    this.connection.settings = settings;
                }
                if (eventName === 'connection:close') {
                    this.type = '';
                    this.settings = {};
                    this.state = {};
                    this.connection.ident = '';
                    this.connection.type = '';
                    this.connection.setting = {};
                    this.workflow.state = 'idle';
                }
                if (eventName === 'workflow:state') {
                    this.workflow.state = args[0];
                }

                const listeners = ensureArray(this.listeners[eventName]);
                listeners.forEach(listener => {
                    listener(...args);
                });
            });
        });

        this.socket.on('startup', (data) => {
            const { loadedControllers, baudRates } = { ...data };

            this.loadedControllers = ensureArray(loadedControllers);

            // User-defined baud rates
            this.baudRates = ensureArray(baudRates);

            if (next) {
                next(null);

                // The callback can only be called once
                next = null;
            }
        });
    }
    // Disconnect from the server.
    disconnect() {
        this.socket && this.socket.destroy();
        this.socket = null;
    }
    // Adds the `listener` function to the end of the listeners array for the event named `eventName`.
    // @param {string} eventName The name of the event.
    // @param {function} listener The listener function.
    addListener(eventName, listener) {
        const listeners = this.listeners[eventName];
        if (!listeners || typeof listener !== 'function') {
            return false;
        }
        listeners.push(listener);
        return true;
    }
    // Removes the specified `listener` from the listener array for the event named `eventName`.
    // @param {string} eventName The name of the event.
    // @param {function} listener The listener function.
    removeListener(eventName, listener) {
        const listeners = this.listeners[eventName];
        if (!listeners || typeof listener !== 'function') {
            return false;
        }
        listeners.splice(listeners.indexOf(listener), 1);
        return true;
    }
    // Opens a connection.
    // @param {string} controllerType One of: 'Grbl', 'Smoothe', 'TinyG'. Defaults to 'Grbl'.
    // @param {string} connectionType One of: 'serial', 'socket'. Defaults to 'serial'.
    // @param {object} options The options object.
    // @param {string} options.path (serial only) The serial port referenced by the path.
    // @param {number} [options.baudRate] (serial only) Defaults to 115200.
    // @param {string} options.host (socket only) The host address.
    // @param {number} [options.port] (socket only) The port number. Defaults to 23. ()
    // @param {function} [callback] Called after a connection is opened.
    open(controllerType = 'Grbl', connectionType = 'serial', options, callback) {
        if (typeof options !== 'object') {
            options = {};
            callback = options;
        }
        if (typeof callback !== 'function') {
            callback = noop;
        }
        if (!this.socket) {
            return;
        }
        this.socket.emit('open', controllerType, connectionType, options, (err, ...args) => {
            if (!err) {
                this.connection.ident = args[0];
            }

            callback(err, ...args);
        });
    }
    // Closes an open connection.
    // @param {function} [callback] Called once a connection is closed.
    close(callback) {
        if (typeof callback !== 'function') {
            callback = noop;
        }
        if (!this.socket) {
            return;
        }
        if (!this.connection.ident) {
            return;
        }
        this.socket.emit('close', this.connection.ident, (err, ...args) => {
            this.connection.ident = '';
            callback(err, ...args);
        });
    }
    // Executes a command on the server.
    // @param {string} cmd The command string
    // @example Example Usage
    // - Load G-code
    //   controller.command('gcode:load', name, gcode, context /* optional */, callback)
    // - Unload G-code
    //   controller.command('gcode:unload')
    // - Start sending G-code
    //   controller.command('gcode:start')
    // - Stop sending G-code
    //   controller.command('gcode:stop', { force: true })
    // - Pause
    //   controller.command('gcode:pause')
    // - Resume
    //   controller.command('gcode:resume')
    // - Feeder
    //   controller.command('feeder:feed')
    //   controller.command('feeder:start')
    //   controller.command('feeder:stop')
    // - Feed Hold
    //   controller.command('feedhold')
    // - Cycle Start
    //   controller.command('cyclestart')
    // - Status Report
    //   controller.command('statusreport')
    // - Homing
    //   controller.command('homing')
    // - Sleep
    //   controller.command('sleep')
    // - Unlock
    //   controller.command('unlock')
    // - Reset
    //   controller.command('reset')
    // - Feed Override
    //   controller.command('feedOverride')
    // - Spindle Override
    //   controller.command('spindleOverride')
    // - Rapid Override
    //   controller.command('rapidOverride')
    // - Energize Motors
    //   controller.command('energizeMotors:on')
    //   controller.command('energizeMotors:off')
    // - G-code
    //   controller.command('gcode', 'G0X0Y0', context /* optional */)
    // - Load a macro
    //   controller.command('macro:load', '<macro-id>', context /* optional */, callback)
    // - Run a macro
    //   controller.command('macro:run', '<macro-id>', context /* optional */, callback)
    // - Load file from a watch directory
    //   controller.command('watchdir:load', '/path/to/file', callback)
    command(cmd, ...args) {
        if (!this.socket) {
            return;
        }
        if (!this.connection.ident) {
            return;
        }
        this.socket.emit('command', this.connection.ident, cmd, ...args);
    }
    // Writes data to the open connection.
    // @param {string} data The data to write.
    // @param {object} [context] The associated context information.
    write(data, context) {
        if (!this.socket) {
            return;
        }
        if (!this.connection.ident) {
            return;
        }
        this.socket.emit('write', this.connection.ident, data, context);
    }
    // Writes data and a newline character to the open connection.
    // @param {string} data The data to write.
    // @param {object} [context] The associated context information.
    writeln(data, context) {
        if (!this.socket) {
            return;
        }
        if (!this.connection.ident) {
            return;
        }
        this.socket.emit('writeln', this.connection.ident, data, context);
    }
    // Gets a list of available serial ports.
    // @param {function} [callback] Called once completed.
    getPorts(callback) {
        if (!this.socket) {
            return;
        }
        this.socket.emit('getPorts', callback);
    }
    // Gets the machine state.
    // @return {string|number} The machine state.
    getMachineState() {
        if ([GRBL, SMOOTHIE, TINYG].indexOf(this.type) < 0) {
            return '';
        }

        if (!this.connection.ident) {
            return '';
        }

        let machineState;

        if (this.type === GRBL) {
            machineState = this.state.machineState;
        } else if (this.type === SMOOTHIE) {
            machineState = this.state.machineState;
        } else if (this.type === TINYG) {
            machineState = this.state.machineState;
        }

        return machineState || '';
    }
    // Gets the machine position.
    // @return {object} A position object which contains x, y, z, a, b, and c properties.
    getMachinePosition() {
        const defaultMachinePosition = {
            x: '0.000',
            y: '0.000',
            z: '0.000',
            a: '0.000',
            b: '0.000',
            c: '0.000'
        };

        // Grbl
        if (this.type === GRBL) {
            const { mpos } = this.state;
            let { $13 = 0 } = { ...this.settings.settings };
            $13 = Number($13) || 0;

            // Machine position are reported in mm ($13=0) or inches ($13=1)
            return mapValues({
                ...defaultMachinePosition,
                ...mpos
            }, (val) => {
                return ($13 > 0) ? in2mm(val) : val;
            });
        }

        // Smoothieware
        if (this.type === SMOOTHIE) {
            const { mpos, modal = {} } = this.state;
            const units = {
                'G20': IMPERIAL_UNITS,
                'G21': METRIC_UNITS
            }[modal.units];

            // Machine position are reported in current units
            return mapValues({
                ...defaultMachinePosition,
                ...mpos
            }, (val) => {
                return (units === IMPERIAL_UNITS) ? in2mm(val) : val;
            });
        }

        // TinyG
        if (this.type === TINYG) {
            const { mpos } = this.state;

            // https://github.com/synthetos/g2/wiki/Status-Reports
            // Canonical machine position are always reported in millimeters with no offsets.
            return {
                ...defaultMachinePosition,
                ...mpos
            };
        }

        return defaultMachinePosition;
    }
    // Gets the work position.
    // @return {object} A position object which contains x, y, z, a, b, and c properties.
    getWorkPosition() {
        const defaultWorkPosition = {
            x: '0.000',
            y: '0.000',
            z: '0.000',
            a: '0.000',
            b: '0.000',
            c: '0.000'
        };

        // Grbl
        if (this.type === GRBL) {
            const { wpos } = this.state;
            let { $13 = 0 } = { ...this.settings.settings };
            $13 = Number($13) || 0;

            // Work position are reported in mm ($13=0) or inches ($13=1)
            return mapValues({
                ...defaultWorkPosition,
                ...wpos
            }, val => {
                return ($13 > 0) ? in2mm(val) : val;
            });
        }

        // Smoothieware
        if (this.type === SMOOTHIE) {
            const { wpos, modal = {} } = this.state;
            const units = {
                'G20': IMPERIAL_UNITS,
                'G21': METRIC_UNITS
            }[modal.units];

            // Work position are reported in current units
            return mapValues({
                ...defaultWorkPosition,
                ...wpos
            }, (val) => {
                return (units === IMPERIAL_UNITS) ? in2mm(val) : val;
            });
        }

        // TinyG
        if (this.type === TINYG) {
            const { wpos, modal = {} } = this.state;
            const units = {
                'G20': IMPERIAL_UNITS,
                'G21': METRIC_UNITS
            }[modal.units];

            // Work position are reported in current units, and also apply any offsets.
            return mapValues({
                ...defaultWorkPosition,
                ...wpos
            }, (val) => {
                return (units === IMPERIAL_UNITS) ? in2mm(val) : val;
            });
        }

        return defaultWorkPosition;
    }
    // Gets work coordinate system.
    // @return {string} Returns work coordinate system (G54-G59).
    getWorkCoordinateSystem() {
        const defaultWCS = 'G54';

        if (this.type === GRBL) {
            const { wcs } = { ...this.state.modal };
            return wcs || defaultWCS;
        }

        if (this.type === SMOOTHIE) {
            const { wcs } = { ...this.state.modal };
            return wcs || defaultWCS;
        }

        if (this.type === TINYG) {
            const { wcs } = { ...this.state.modal };
            return wcs || defaultWCS;
        }

        return defaultWCS;
    }
}

export default Controller;
