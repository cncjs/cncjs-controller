import Controller from '../controller';

describe('Controller', () => {
  let ioMock;
  let socketMock;

  beforeEach(() => {
    socketMock = {
      on: jest.fn(),
      emit: jest.fn(),
      destroy: jest.fn(),
      connected: true,
    };
    ioMock = {
      connect: jest.fn().mockReturnValue(socketMock),
    };
  });

  it('should throw an error if io is not provided', () => {
    expect(() => new Controller()).toThrow('Expected the socket.io-client module, but got: undefined');
  });

  it('should initialize with io', () => {
    const controller = new Controller(ioMock);
    expect(controller.io).toBe(ioMock);
  });

  it('should return connected status', () => {
    const controller = new Controller(ioMock);
    controller.socket = socketMock;
    expect(controller.connected).toBe(true);
  });

  it('should connect to the server', () => {
    const controller = new Controller(ioMock);
    const host = 'http://localhost';
    const options = {};
    const next = jest.fn();

    controller.connect(host, options, next);

    expect(ioMock.connect).toHaveBeenCalledWith(host, options);
    expect(socketMock.on).toHaveBeenCalled();
  });

  it('should disconnect from the server', () => {
    const controller = new Controller(ioMock);
    controller.socket = socketMock;

    controller.disconnect();

    expect(socketMock.destroy).toHaveBeenCalled();
    expect(controller.socket).toBeNull();
  });

  it('should add a listener', () => {
    const controller = new Controller(ioMock);
    const listener = jest.fn();

    const result = controller.addListener('connect', listener);

    expect(result).toBe(true);
    expect(controller.listeners['connect']).toContain(listener);
  });

  it('should remove a listener', () => {
    const controller = new Controller(ioMock);
    const listener = jest.fn();

    controller.addListener('connect', listener);
    const result = controller.removeListener('connect', listener);

    expect(result).toBe(true);
    expect(controller.listeners['connect']).not.toContain(listener);
  });

  it('should open a port', () => {
    const controller = new Controller(ioMock);
    controller.socket = socketMock;
    const port = 'COM1';
    const options = { controllerType: 'Grbl', baudrate: 115200 };
    const callback = jest.fn();

    controller.openPort(port, options, callback);

    expect(socketMock.emit).toHaveBeenCalledWith('open', port, options, callback);
  });

  it('should close a port', () => {
    const controller = new Controller(ioMock);
    controller.socket = socketMock;
    const port = 'COM1';
    const callback = jest.fn();

    controller.closePort(port, callback);

    expect(socketMock.emit).toHaveBeenCalledWith('close', port, callback);
  });

  it('should list ports', () => {
    const controller = new Controller(ioMock);
    controller.socket = socketMock;
    const callback = jest.fn();
  
    // Mock the implementation of socketMock.emit for 'list'
    socketMock.emit.mockImplementation((event, cb) => {
      if (event === 'list') {
        cb(null, [{ comName: 'COM1' }, { comName: 'COM2' }]);
      }
    });
  
    controller.listPorts(callback);
  
    expect(socketMock.emit).toHaveBeenCalledWith('list', callback);
    expect(callback).toHaveBeenCalledWith(null, [{ comName: 'COM1' }, { comName: 'COM2' }]);
  });

  it('should execute a command', () => {
    const controller = new Controller(ioMock);
    controller.socket = socketMock;
    controller.port = 'COM1';
    const cmd = 'gcode:load';
    const args = ['name', 'gcode', {}, jest.fn()];

    controller.command(cmd, ...args);

    expect(socketMock.emit).toHaveBeenCalledWith('command', 'COM1', cmd, ...args);
  });

  it('should write data to the serial port', () => {
    const controller = new Controller(ioMock);
    controller.socket = socketMock;
    controller.port = 'COM1';
    const data = 'G0X0Y0';
    const context = {};

    controller.write(data, context);

    expect(socketMock.emit).toHaveBeenCalledWith('write', 'COM1', data, context);
  });

  it('should write data with newline to the serial port', () => {
    const controller = new Controller(ioMock);
    controller.socket = socketMock;
    controller.port = 'COM1';
    const data = 'G0X0Y0';
    const context = {};

    controller.writeln(data, context);

    expect(socketMock.emit).toHaveBeenCalledWith('writeln', 'COM1', data, context);
  });
});
