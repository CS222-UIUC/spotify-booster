import sinon from 'sinon';
import * as config from '../../../src/config/config';

/**
 * stubConfig - stubs config with something else
 * @param new_config - new config to use
 */
export default function stubConfig(new_config: {
  env_config?: Partial<config.EnvironmentConfig>;
  logger_config?: Partial<config.LoggerConfig>;
  web_server_config?: Partial<config.WebServerConfig>;
  spotify_api_config?: Partial<config.SpotifyAPIConfig>;
  database_config?: Partial<config.DatabaseConfig>;
}) {
  let prop: keyof typeof new_config;
  for (prop in new_config) {
    const c = Object.assign({}, config[prop]);
    Object.assign(c, new_config[prop]);
    sinon.stub(config, prop).value(c);
  }
}
