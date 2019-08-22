const rp = require('request-promise-native');
const { getMeta, checkKeys, getOauthAuthorization } = require('../../lib');

module.exports = class IS24 {
  constructor(credentials, baseUrl = 'https://rest.immobilienscout24.de/restapi/api/offer/v1.0/user/me/realestate') {
    checkKeys(['oauth_consumer_key', 'consumer_secret', 'oauth_token', 'oauth_token_secret'], credentials);
    this.credentials = credentials;
    this.baseUrl = baseUrl;
  }

  /**
   * Get attachments by estate id
   * @param {string} id
   * @returns {promise<object>}
   */
  async getAttachmentsById(id) {
    const { attachmentUrl } = await this.getEstate(id);
    return this.getAttachmentsByUrl(attachmentUrl);
  }

  /**
   * Get attachments by attachment url
   * @param {string} id
   * @returns {promise<object>}
   */
  async getAttachmentsByUrl(uri) {
    const result = await rp({
      uri,
      headers: {
        Authorization: getOauthAuthorization(uri, this.credentials),
        accept: 'application/json',
      },
      json: true,
    });
    const key = 'common.attachments';
    return result[key] && result[key][0] ? result[key][0].attachment : [];
  }

  /**
   * Get resolved attachments by attachment url
   * @param {string} uri
   * @returns {promise<object>}
   */
  async getResolvedAttachmentsByUrl(uri, options) {
    const attachments = await this.getAttachmentsByUrl(uri);
    return Promise.all(attachments.map(attachment => this.getResolvedAttachment(attachment, options)));
  }

  /**
   * Get resolved attachments by estate id
   * @param {string} id
   * @returns {promise<object>}
   */
  async getResolvedAttachmentsById(id, options) {
    const attachments = await this.getAttachmentsById(id);
    return Promise.all(attachments.map(attachment => this.getResolvedAttachment(attachment, options)));
  }

  async getResolvedAttachment(attachment, options = {}) {
    const {
      urls: [{ url: uris }],
      ...rest
    } = attachment;

    const {
      width = 720,
      height = 720,
      method = 'SCALE', // SCALE_AND_CROP, WHITE_FILLING
    } = options;

    const uri = uris.find(uri => uri['@scale'] === method)['@href'];

    const picture = await rp({
      method: 'GET',
      uri: uri.replace('%WIDTH%', width).replace('%HEIGHT%', height),
      headers: {
        'Cache-Control': 'no-cache',
        accept: 'application/octet-stream',
      },
      encoding: 'binary',
    });

    return { ...rest, picture, options: { width, height, method } };
  }

  /**
   * Make a request
   * @param {string} uri
   * @param {array<object>} [items=[]]
   * @returns {promise}
   */
  async fetchEstates(uri, items = []) {
    const options = {
      uri,
      headers: {
        Authorization: getOauthAuthorization(uri, this.credentials),
        accept: 'application/json',
      },
      json: true,
    };

    const res = await rp(options);

    const {
      realEstateList: { realEstateElement },
      Paging,
    } = res['realestates.realEstates'];

    const { pageNumber, numberOfPages, next } = Paging;

    const elements = [...items, ...realEstateElement];
    if (pageNumber < numberOfPages) {
      return this.fetchEstates(next['@xlink.href'], elements);
    }
    return elements;
  }

  /**
   * Get estate by id
   * @param {string} id
   * @returns {promise<object>}
   */
  async getEstate(id) {
    const uri = `${this.baseUrl}/${id}`;
    const detail = await rp({
      uri,
      headers: {
        Authorization: getOauthAuthorization(uri, this.credentials),
        accept: 'application/json',
      },
      json: true,
    });
    // remove weird is24 nesting
    const [type] = Object.keys(detail);
    const estate = detail[type];
    const attachmentUrl = estate.attachments && estate.attachments[0] ? estate.attachments[0]['@xlink.href'] : undefined;
    return { ...estate, type, attachmentUrl };
  }

  /**
   * Get all estates of customer, and process them further
   * @returns {promise<object>}
   */
  async getEstates() {
    const items = await this.fetchEstates(this.baseUrl);
    const meta = getMeta(items);
    return meta;
  }
};
