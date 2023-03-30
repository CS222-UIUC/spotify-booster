import sinon from 'sinon';
import { verifyProfilersStopped } from '../stubs/stub_logger.test';

afterEach(() => {
  verifyProfilersStopped();
  sinon.restore();
});
