import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import sinon from 'sinon';
import stubConfig from '../stubs/stub_config.test';
import { verifyProfilersStopped } from '../stubs/stub_logger.test';

afterEach(() => {
  stubConfig({
    env_config: {
      in_dev_env: true,
    },
    logger_config: {
      log_console: false,
      log_file: false,
    },
  });
  verifyProfilersStopped();
  sinon.restore();
});
