# cncjs-controller [![build status](https://travis-ci.org/cncjs/cncjs-controller.svg?branch=master)](https://travis-ci.org/cncjs/cncjs-controller) [![Coverage Status](https://coveralls.io/repos/github/cncjs/cncjs-controller/badge.svg?branch=master)](https://coveralls.io/github/cncjs/cncjs-controller?branch=master)

[![NPM](https://nodei.co/npm/cncjs-controller.png?downloads=true&stars=true)](https://www.npmjs.com/package/cncjs-controller)

**A controller library for event-based communication between client and CNCjs server**
 
## Installation

```sh
npm install --save cncjs-controller
npm install --save socket.io-client@1.7  # socket.io-client 1.7 is recommended
```

## Usage

```js
import io from 'socket.io-client';
import Controller from 'cncjs-controller';

const controller = new Controller(io);
const host = ''; // e.g. http://127.0.0.1:8000
const token = '<security-token>';
const options = {
    query: 'token=' + token
};

controller.connect(host, options, () => {
    const port = '/dev/cu.wchusbserialfa130';

    controller.openPort(port, {
        controllerType: 'Grbl', // Grbl|Smoothie|TinyG
        baudrate: 115200
    }, (err) => {
        if (err) {
            console.error(err);
            return;
        }

        controller.writeln('$$'); // View Grbl Settings
    });

    // Disconnect after 60 seconds
    setTimeout(() => {
        // Close port
        controller.closePort();

        // Close connection
        controller.disconnect();
    }, 60 * 1000);
});

controller.addListener('serialport:open', (options) => {
    const {
        port,
        baudrate,
        controllerType
    } = options;
    console.log(`Connected to the port "${port}" with a baud rate of ${baudrate}.`, { port, baudrate });
});

controller.addListener('serialport:close', (options) => {
    const { port } = options;
    console.log(`The port "${port}" is disconnected.`);
});

controller.addListener('serialport:write', (data, context) => {
    console.log('>', data);
});

controller.addListener('serialport:read', (data) => {
    console.log('<', data);
});
```

## License

MIT
