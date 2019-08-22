const rp = require('request-promise-native');
const { getMeta, checkKeys, getBasicAuthorization } = require('../../lib');

module.exports = class FlowFact {
  constructor(credentials) {
    checkKeys(['customer', 'user', 'password'], credentials);
    this.credentials = credentials;
    const { customer, user } = this.credentials;
    this.baseUrl = `https://flowfactapi.flowfact.com/com.flowfact.server/api/rest/v1.0/customers/${customer}/users/${user}/estates`;
    this.defaultOptions = {
      method: 'GET',
      headers: {
        Authorization: getBasicAuthorization(this.credentials),
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
      json: true,
    };
  }

  /**
   * Fetch an estate
   * @param {number} [page=1]
   * @param {array<object>} [items=[]]
   * @returns {promise}
   */
  async fetchEstates(page = 1, items = []) {
    const uri = `${this.baseUrl}?size=50&page=${page}`;

    const res = await rp({
      ...this.defaultOptions,
      uri,
    });

    const {
      value: { estateshort, total },
    } = res;

    const elements = [...items, ...estateshort];
    if (elements.length < total) {
      return this.fetchEstates(page + 1, elements);
    }
    return elements;
  }

  /**
   * Get pictures by estate id
   * @param {string} id
   * @returns {promise<object>}
   */
  async getPictures(id) {
    const pictures = await rp({
      ...this.defaultOptions,
      uri: `${this.baseUrl}/${id}/pictures`,
    });
    if (pictures) return pictures.value;
  }

  /**
   * Receive image from the flowfact image endpoint
   *
   * @param {object} picture object
   * @param {object} options for image sizes
   * @returns {promise} resolves to object
   */
  async getPicture({ file, ...rest }, options = {}) {
    const {
      width = 720,
      height = 720,
      remoteMethod = 'resizeContraint', // flowfact spelling -.-
      quality = 80,
    } = options;

    const qs = {
      width,
      height,
      remoteMethod,
      quality,
    };

    let picture;
    try {
      picture = await rp({
        ...this.defaultOptions,
        uri: file.href,
        headers: {
          ...this.defaultOptions.headers,
          accept: 'application/octet-stream',
        },
        qs,
        encoding: 'binary',
      });
    } catch (_) {}

    return { ...rest, picture, options: qs };
  }

  /**
   * Get resolved pictures by estate id
   * @param {string} id
   * @returns {promise<array<object>>}
   */
  async getResolvedPictures(id, options) {
    const pictures = await this.getPictures(id);
    if (!pictures) return [];
    const { estatepicture } = pictures;
    return Promise.all(
      estatepicture.map(picture => this.getPicture(picture, options))
    );
  }

  /**
   * Get all estates of customer, and process them further
   * @returns {promise<object>}
   */
  async getEstates() {
    const items = await this.fetchEstates();
    const meta = getMeta(items);
    return meta;
  }

  /**
   * Get estate by id
   * @param {string} id
   * @returns {promise<object>}
   */
  async getEstate(id) {
    const estate = await rp({
      ...this.defaultOptions,
      uri: `${this.baseUrl}/${id}`,
    });
    return estate.value;
  }
};
