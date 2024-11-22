import { GRBL } from '../constants';
import Controller from '../Controller';
import noop from '../noop';

describe('Controller', () => {
  let mockIo;
  let controller;

  beforeEach(() => {
    mockIo = {
      connect: jest.fn(() => ({
        on: jest.fn(),
        emit: jest.fn(),
        destroy: jest.fn(),
      })),
    };
    controller = new Controller(mockIo);
  });

  describe('constructor', () => {
    it('throws an error if io is not provided', () => {
      expect(() => new Controller()).toThrowError(
        'Expected the socket.io-client module, but got: undefined'
      );
    });

    it('sets io to the provided instance', () => {
      expect(controller.io).toBe(mockIo);
    });
  });

  describe('connect', () => {
    it('establishes a connection and sets up event listeners', () => {
      const mockSocket = {
        on: jest.fn(),
      };
      mockIo.connect.mockReturnValue(mockSocket);

      controller.connect('http://localhost', {}, noop);

      expect(mockIo.connect).toHaveBeenCalledWith('http://localhost', {});
      expect(controller.socket).toBe(mockSocket);
      expect(mockSocket.on).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('destroys the socket connection and clears it', () => {
      const mockSocket = {
        destroy: jest.fn(),
      };
      controller.socket = mockSocket;

      controller.disconnect();

      expect(mockSocket.destroy).toHaveBeenCalled();
      expect(controller.socket).toBeNull();
    });
  });

  describe('addListener', () => {
    it('adds a listener to the specified event', () => {
      const listener = jest.fn();

      const result = controller.addListener('connect', listener);

      expect(result).toBe(true);
      expect(controller.listeners['connect']).toContain(listener);
    });

    it('returns false if the event is invalid', () => {
      const listener = jest.fn();

      const result = controller.addListener('invalid:event', listener);

      expect(result).toBe(false);
    });
  });

  describe('removeListener', () => {
    it('removes a listener from the specified event', () => {
      const listener = jest.fn();
      controller.listeners['connect'].push(listener);

      const result = controller.removeListener('connect', listener);

      expect(result).toBe(true);
      expect(controller.listeners['connect']).not.toContain(listener);
    });

    it('returns false if the event is invalid', () => {
      const listener = jest.fn();

      const result = controller.removeListener('invalid:event', listener);

      expect(result).toBe(false);
    });
  });

  describe('getMachinePosition', () => {
    it('returns default machine position if type is not set', () => {
      const position = controller.getMachinePosition();
      expect(position).toEqual({
        x: '0.000',
        y: '0.000',
        z: '0.000',
        a: '0.000',
        b: '0.000',
        c: '0.000',
      });
    });

    it('returns machine position for GRBL type', () => {
      controller.type = GRBL;
      controller.state = { status: { mpos: { x: '10.000', y: '20.000', z: '30.000' } } };
      controller.settings = { settings: { $13: 0 } };

      const position = controller.getMachinePosition();

      expect(position).toEqual({
        x: '10.000',
        y: '20.000',
        z: '30.000',
        a: '0.000',
        b: '0.000',
        c: '0.000',
      });
    });
  });

  describe('getWorkPosition', () => {
    it('returns default work position if type is not set', () => {
      const position = controller.getWorkPosition();
      expect(position).toEqual({
        x: '0.000',
        y: '0.000',
        z: '0.000',
        a: '0.000',
        b: '0.000',
        c: '0.000',
      });
    });

    it('returns work position for GRBL type', () => {
      controller.type = GRBL;
      controller.state = { status: { wpos: { x: '5.000', y: '10.000', z: '15.000' } } };
      controller.settings = { settings: { $13: 0 } };

      const position = controller.getWorkPosition();

      expect(position).toEqual({
        x: '5.000',
        y: '10.000',
        z: '15.000',
        a: '0.000',
        b: '0.000',
        c: '0.000',
      });
    });
  });
});
