import { assert } from 'chai';
import sinon from 'sinon';

import Logger from '../../src/logger/logger';
import stubConfig from '../test_utils/stubs/stub_config.test';
import uniqueID from '../test_utils/unique_id.test';

describe('Profiler', () => {
  beforeEach(function () {
    stubConfig({ logger_config: { log_file: false, log_console: false } });

    this.name = uniqueID();
    this.logger = new Logger(this.name);

    this.debug_spy = sinon.spy(this.logger, 'debug');
    this.info_spy = sinon.spy(this.logger, 'info');
    this.warn_spy = sinon.spy(this.logger, 'warn');
    this.error_spy = sinon.spy(this.logger, 'error');
    this.fatal_spy = sinon.spy(this.logger, 'fatal');
  });

  it('returns accurate time and writes default log message', function () {
    const clock = sinon.useFakeTimers();

    const profile0 = this.logger.profile('profile0');

    clock.tick(100);
    const time = profile0.stop();
    clock.restore();

    assert(
      this.debug_spy.getCall(0).calledWith('Task "profile0" completed successfully after 100 milliseconds'),
      'Logs correct message'
    );
    assert(time === 100, 'Returns correct duration');
    assert(time === profile0.stop(), 'Calling stop again returns same duration');
  });

  it('writes custom log message and success', async () => {
    const clock = sinon.useFakeTimers();

    const logger = new Logger('TestLogger');
    const debug_spy = sinon.spy(logger, 'debug');

    const profile0 = logger.profile('profile0');
    const profile1 = logger.profile('profile1');
    const profile2 = logger.profile('profile2');

    clock.tick(100);
    profile0.stop({ message: 'with message' });
    profile1.stop({ success: false });
    profile2.stop({ message: 'not successful with message', success: false });
    clock.restore();

    assert(debug_spy.getCall(0).calledWith('with message'), 'Logs correct message');
    assert(
      debug_spy.getCall(1).calledWith('Task "profile1" completed unsuccessfully after 100 milliseconds'),
      'Logs correct message'
    );
    assert(debug_spy.getCall(2).calledWith('not successful with message'), 'Logs correct message');
  });

  it('writes message with custom log level', function () {
    const clock = sinon.useFakeTimers();
    sinon.stub(process, 'exit');

    const profile0 = this.logger.profile('profile0');
    const profile1 = this.logger.profile('profile1');
    const profile2 = this.logger.profile('profile2');
    const profile3 = this.logger.profile('profile3');
    const profile4 = this.logger.profile('profile4');

    clock.tick(100);
    profile0.stop({ level: 'debug' });
    profile1.stop({ level: 'info' });
    profile2.stop({ level: 'warn' });
    profile3.stop({ level: 'error' });
    profile4.stop({ level: 'fatal' });
    clock.restore();

    assert(
      this.debug_spy.getCall(0).calledWith('Task "profile0" completed successfully after 100 milliseconds'),
      'Logs correct message'
    );
    assert(
      this.info_spy.getCall(0).calledWith('Task "profile1" completed successfully after 100 milliseconds'),
      'Logs correct message'
    );
    assert(
      this.warn_spy.getCall(0).calledWith('Task "profile2" completed successfully after 100 milliseconds'),
      'Logs correct message'
    );
    assert(
      this.error_spy.getCall(0).calledWith('Task "profile3" completed successfully after 100 milliseconds'),
      'Logs correct message'
    );
    assert(
      this.fatal_spy.getCall(0).calledWith('Task "profile4" completed successfully after 100 milliseconds'),
      'Logs correct message'
    );
  });

  it('write message with automatically determined log levels', function () {
    const clock = sinon.useFakeTimers();

    const profile0 = this.logger.profile('profile0', { debug: 100, info: 100, warn: 100, error: 100, fatal: 100 });
    const profile1 = this.logger.profile('profile1', { debug: 100, info: 100, warn: 100, error: 100, fatal: 101 });
    const profile2 = this.logger.profile('profile2', { debug: 100, info: 100, warn: 100, error: 101, fatal: 101 });
    const profile3 = this.logger.profile('profile3', { debug: 100, info: 100, warn: 101, error: 101, fatal: 101 });
    const profile4 = this.logger.profile('profile4', { debug: 100, info: 101, warn: 101, error: 101, fatal: 101 });
    const profile5 = this.logger.profile('profile5', { debug: 101, info: 101, warn: 101, error: 101, fatal: 101 });

    clock.tick(100);
    profile0.stop();
    profile1.stop();
    profile2.stop();
    profile3.stop();
    profile4.stop();
    profile5.stop();
    clock.restore();

    assert(
      this.fatal_spy.getCall(0).calledWith('Task "profile0" completed successfully after 100 milliseconds'),
      'Logs correct message'
    );
    assert(
      this.error_spy.getCall(0).calledWith('Task "profile1" completed successfully after 100 milliseconds'),
      'Logs correct message'
    );
    assert(
      this.warn_spy.getCall(0).calledWith('Task "profile2" completed successfully after 100 milliseconds'),
      'Logs correct message'
    );
    assert(
      this.info_spy.getCall(0).calledWith('Task "profile3" completed successfully after 100 milliseconds'),
      'Logs correct message'
    );
    assert(
      this.debug_spy.getCall(0).calledWith('Task "profile4" completed successfully after 100 milliseconds'),
      'Logs correct message'
    );
    assert(
      this.debug_spy.getCall(1).calledWith('Task "profile5" completed successfully after 100 milliseconds'),
      'Logs correct message'
    );
  });

  it('writes message with complex settings', function () {
    const clock = sinon.useFakeTimers();

    const profile0 = this.logger.profile('profile0', { debug: 100, info: 100, warn: 100, error: 100, fatal: 101 });
    const profile1 = this.logger.profile('profile1');
    const profile2 = this.logger.profile('profile2');

    clock.tick(100);
    profile0.stop({ message: 'with message', level: 'info', success: false });
    profile1.stop({ level: 'fatal', success: false });
    profile2.stop({ message: 'with message', level: 'error', success: true });
    clock.restore();

    assert(this.info_spy.getCall(0).calledWith('with message'), 'Logs correct message');
    assert(
      this.fatal_spy.getCall(0).calledWith('Task "profile1" completed unsuccessfully after 100 milliseconds'),
      'Logs correct message'
    );
    assert(this.error_spy.getCall(0).calledWith('with message'), 'Logs correct message');
  });
});
