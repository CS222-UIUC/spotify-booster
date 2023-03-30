import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import sinon from 'sinon';
import { verifyProfilersStopped } from '../stubs/stub_logger.test';

afterEach(() => {
  verifyProfilersStopped();
  sinon.restore();
});
