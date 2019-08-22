const { createHmac } = require('crypto');
const OAuth = require('oauth-1.0a');
const moment = require('moment');

/**
 * Generate oauth request
 * credentials must contain
 *  {
 *    customer : 'oauth_consumer_key',
 *    user : 'consumer_secret',
 *    password : 'oauth_token',
 *    oauth_token_secret : 'oauth_token_secret',
 *  }
 *
 * @param {object} credentials
 * @returns {string} Authorization header
 */
const getBasicAuthorization = credentials => {
  const { customer, user, password } = credentials;
  return `Basic ${Buffer.from(`${customer}/${user}:${password}`).toString('base64')}`;
};

/**
 * Generate oauth request
 * credentials must contain
 *  {
 *    oauth_consumer_key : 'oauth_consumer_key',
 *    consumer_secret : 'consumer_secret',
 *    oauth_token : 'oauth_token',
 *    oauth_token_secret : 'oauth_token_secret',
 *  }
 *
 * @param {string} url
 * @param {object} credentials
 * @param {string} [method='GET']
 * @returns {string} Authorization header
 */
const getOauthAuthorization = (url, credentials, method = 'GET') => {
  const { oauth_consumer_key, consumer_secret, oauth_token, oauth_token_secret } = credentials;
  const oauth = OAuth({
    consumer: {
      key: oauth_consumer_key,
      secret: consumer_secret,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString, key) {
      return createHmac('sha1', key)
        .update(baseString)
        .digest('base64');
    },
  });
  return oauth.toHeader(
    oauth.authorize(
      { url, method },
      {
        key: oauth_token,
        secret: oauth_token_secret,
      }
    )
  ).Authorization;
};

/**
 * Sanitize the date and return epoch time
 * @param {string|number} date
 * @returns {number}
 */
const sanitizeDate = date => {
  if (!isNaN(date)) return date;
  return moment(date).valueOf();
};

/**
 * Check if keys are available in object
 * @param {array<string>} keys
 * @param {object} object
 * @param {string} name
 * @throws
 */
const checkKeys = (keys, object, name = 'Credentials') => {
  const missing = keys.filter(key => !object[key]);
  if (missing.length) throw `${name} validation failed - "${missing.join('", "')}" missing`;
  return true;
};

/**
 * Check if keys are available in object
 * @param {array<string>} keys
 * @param {object} [object={}]
 * @throws
 */
const getCredentials = (keys, object = {}) => {
  const { env } = process;
  const credentials = keys.reduce(
    (red, key) => ({
      ...red,
      [key]: object[key] || env[key] || env[key.toUpperCase()],
    }),
    {}
  );
  checkKeys(keys, credentials);
  return credentials;
};

/**
 * Sanitize the state of the estate
 *
 * @param {string} [state='']
 * @returns {boolean}
 */
const isActive = (state = '') => {
  return !state.match(/(INACTIVE)/i);
};

/**
 * Sanitize the state of the estate
 *
 * @param {string} [state='']
 * @returns {boolean}
 */
const isArchived = (state = '') => {
  return !!state.match(/(ARCHIVED|TO_BE_DELETED)/i);
};

/**
 * Return only the needed parts of the object as an ids array
 * @param {object} res
 * @returns {array<object>}
 */
const getMeta = items => {
  return items.map(element => ({
    id: element.id || element['@id'],
    active: element.active || isActive(element.realEstateState),
    archived: element.archived || isArchived(element.realEstateState),
    createdAt: sanitizeDate(
      element.created || // for flowfact
        element.creationDate ||
        element['@creation']
    ),
    updatedAt: sanitizeDate(
      element.modified || // for flowfact
        element.lastModificationDate ||
        element['@modified'] ||
        element['@modification']
    ),
  }));
};

const transform = require('lodash.transform');
const isObject = require('lodash.isobject');

/**
 * Deep map/alter the props in a (nested) object
 * @param {object/array} obj
 * @param {object} [mapping={}]
 * @param {object} [replace={substr: '@'}]
 */
const deepRenameProps = (obj, mapping = {}, replace = { substr: '@' }) => {
  const { substr, newSubstr = '' } = replace;
  return transform(obj, (result, value, key) => {
    // Use mapped key if applicable
    let currentKey = mapping[key] || key;
    // replace parts of the key if needed
    if (typeof currentKey === 'string' && substr) {
      currentKey = currentKey.replace(substr, newSubstr);
    }
    // if key is an object recurse
    result[currentKey] = isObject(value) ? deepRenameProps(value, mapping, replace) : value;
  });
};

module.exports = {
  getOauthAuthorization,
  getBasicAuthorization,
  sanitizeDate,
  getMeta,
  checkKeys,
  getCredentials,
  deepRenameProps,
};
