# cncjs-controller [![build status](https://travis-ci.org/cncjs/cncjs-controller.svg?branch=master)](https://travis-ci.org/cncjs/cncjs-controller) [![Coverage Status](https://coveralls.io/repos/github/cncjs/cncjs-controller/badge.svg?branch=master)](https://coveralls.io/github/cncjs/cncjs-controller?branch=master)

[![NPM](https://nodei.co/npm/cncjs-controller.png?downloads=true&stars=true)](https://www.npmjs.com/package/cncjs-controller)

**A controller library for event-based communication between client and CNCjs server**
 
## Installation

```sh
npm install --save cncjs-controller@latest
npm install --save socket.io-client@1.7  # socket.io-client 1.7 is recommended
```

## Usage

```js
import io from 'socket.io-client';
import Controller from 'cncjs-controller';

const controller = new Controller(io);
const host = ''; // or 'http://127.0.0.1:8000'
const token = '...'; // Authorization token
const options = {
    query: 'token=' + token
};

controller.connect(host, options, () => {
    const controllerType = 'Grbl'; // Grbl|Smoothie|TinyG
    const connectionType = 'serial'; // serial|socket
    const serialOptions = {
        path: '/dev/cu.wchusbserialfa130',
        baudRate: 115200
    };

    // Open a serial connection
    controller.open(controllerType, connectionType, serialOptions, (err) => {
        if (err) {
            console.error(err);
            return;
        }

        controller.writeln('$$'); // View Grbl Settings
    });

    // Disconnect after 60 seconds
    setTimeout(() => {
        controller.close((err) => {
            controller.disconnect();
        });
    }, 60 * 1000);
});

controller.addListener('connection:open', (options) => {
    const { ident, type, settings } = options;

    if (type === 'serial') {
        const { path, baudRate } = { ...settings };
        console.log(`Connected to ${path} with a baud rate of ${baudRate}`);
    } else if (type === 'socket') {
        const { host, port } = { ...settings };
        console.log(`Connected to ${host}:${port}');
    }
});

controller.addListener('connection:close', (options) => {
    const { type, settings } = options;

    console.log(`Connection closed: type=${type}, settings=${JSON.stringify(settings)}`);
});

controller.addListener('connection:write', (data, context) => {
    console.log('>', data);
});

controller.addListener('connection:read', (data) => {
    console.log('<', data);
});
```

## API Events 

### CNCjs Events

#### Event: 'startup'
* `data` *(Object)* data object
* `data.availableControllers` *(Array)* A list of available controllers

#### Event: 'config:change'

#### Event: 'task:start'
* `taskId` *(String)* task id

#### Event: 'task:finish'
* `taskId` *(String)* task id
* `code` *(Number)* exit code

#### Event: 'task:error'
* `taskId` *(String)* task id
* `error` *(Object)* error object

#### Event: 'controller:type'
* `type` *(String)* controller type

#### Event: 'controller:settings'
* `type` *(String)* controller type
* `settings` *(Object)* controller settings

#### Event: 'controller:state'
* `type` *(String)* controller type
* `state` *(Object)* controller state

#### Event: 'connection:open'
* `options` *(Object)* connection options

#### Event: 'connection:close'
* `options` *(Object)* connection options

#### Event: 'connection:change'
* `options` *(Object)* connection options
* `isOpen` *(Boolean)* True if the connection is open, flase otherwise.

#### Event: 'connection:error'
* `options` *(Object)* connection options
* `error`*(Object)* error object

#### Event: 'connection:read'
* `options` *(Object)* connection options
* `data` *(String)* data to read

#### Event: 'connection:write'
* `options` *(Object)* connection options
* `data` *(String)* data to write
* `context` *(Object)* associated context information

#### Event: 'feeder:status'
* `status` *(Object)* feeder status object

#### Event: 'sender:status'
* `status` *(Object)* sender status object

#### Event: 'sender:load'
* `data` *(String)* data to load
* `context` *(Object)* associated context information

#### Event: 'sender:unload'

#### Event: 'workflow:state'
* `state` *(String)* workflow state

#### Event: 'message'
* `message` *(String)* message string

### Socket.IO Events

#### Event: 'connect'
Fired upon a connection including a successful reconnection.

#### Event: 'connect_error'
* `error` *(Object)* error object
Fired upon a connection error.

#### Event: 'connect_timeout'
Fired upon a connection timeout.

#### Event: 'error'
* `error` *(Object)* error object
Fired when an error occurs.

#### Event: 'disconnect'
* `reason` *(String)* either 'io server disconnect' or 'io client disconnect'
Fired upon a disconnection.

#### Event: 'reconnect'
* `attempt` *(Number)* reconnection attempt number
Fired upon a successful reconnection.

#### Event: 'reconnect_attempt'
Fired upon an attempt to reconnect.

#### Event: 'reconnecting'
* `attempt` *(Number)* reconnection attempt number
Fired upon a successful reconnection.

#### Event: 'reconnect_error'
Fired upon a reconnection attempt error.

#### Event: 'reconnect_failed'
Fired when couldn't reconnect within `reconnectionAttempts`.

## API Methods

### connect(host = '', options, [callback])
Establish a connection to the server.

#### Arguments
1. host <i>(string)</i>:
2. options <i>(object)</i>:
3. [callback] <i>(function)</i>: The callback function.

### disconnect([callback])
Disconnect from the server.

#### Arguments
1. [callback] <i>(function)</i>: The callback function.

### addListener(eventName, listener)
Adds the `listener` function to the end of the listeners array for the event named `eventName`.

#### Arguments
1. eventName <i>(string)</i>: The name of the event.
2. listener <i>(function)</i>: The listener function.

### removeListener(eventName, listener)
Removes the specified `listener` from the listener array for the event named `eventName`.

#### Arguments
1. eventName <i>(string)</i>: The name of the event.
2. listener <i>(function)</i>: The listener function.

### open(controllerType, connectionType, options, [callback])
Opens a connection.

#### Arguments
1. controllerType <i>(string)</i>: One of: 'Grbl', 'Smoothe', 'TinyG'.
2. connectionType <i>(string)</i>: One of: 'serial', 'socket'.
3. options <i>(object)</i>: The options object.
4. options.path <i>(string)</i>: `serial` The serial port referenced by the path.
5. [options.baudRate=115200] <i>(string)</i>: `serial` The baud rate.
6. options.host <i>(string)</i>: `socket` The host address to connect.
7. [options.port=23] <i>(string)</i>: `socket` The port number.
8. [callback] <i>(string)</i>: Called after a connection is opened.

### close([callback])
Closes an open connection.

#### Arguments
1. [callback] <i>(string)</i>: Called once a connection is closed.

### command(cmd, ...args)
Executes a command on the server.

#### Arguments
1. cmd <i>(string)</i>: The command to execute.

### write(data, [context)
Writes data to the open connection.

#### Arguments
1. data <i>(string)</i>: The data to write.
2. [context] <i>(object)</i>: The associated context information.

#### writeln(data, [context])
Writes data and a newline character to the open connection.

#### Arguments
1. data <i>(string)</i>: The data to write.
2. [context] <i>(object)</i>: The associated context information.

### getPorts([callback])
Gets a list of available serial ports.

#### Arguments
1. [callback] <i>(function)</i>: The error-first callback.

### getBaudRates([callback])
Gets a list of supported baud rates.

#### Arguments
1. [callback] <i>(function)</i>: The error-first callback.

### getMachineState()
Gets the machine state.

#### Return
<i>(string|number)</i>: Returns the machine state.

### getMachinePosition()
Gets the machine position.

#### Return
<i>(object)</i>: Returns a position object which contains x, y, z, a, b, and c properties.

### getWorkPosition()
Gets the work position.

#### Return
<i>(object)</i>: Returns a position object which contains x, y, z, a, b, and c properties.

### getModalState()
Gets modal state.

#### Return
<i>(object)</i>: Returns the modal state.

## API Properties

Name | Type | Default | Description 
:--- | :--- | :------ | :----------
connected | boolean | | Whether the client is connected to the server.
availableControllers | array | | A list of available controllers.
type | string | | The controller type. One of: Grbl, Smoothie, TinyG.
settings | object | | The controller settings.
state | object | | The controller state.
connection | object | | The connection object.
connection.ident | string | | The connection identifier.
connection.type | string | | The connection type. One of: serial, socket.
connection.settings | object | | The connection settings.<br>serial: `{ path, baudRate }`<br>socket: `{ host, port }`
workflow | object | | The workflow object.
workflow.state | string | | The workflow state. One of: idle, paused, running.

## License

MIT
