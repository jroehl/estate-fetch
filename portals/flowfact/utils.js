const getValue = detail => {
  const value = detail.value.value;
  if (!value) return { unit: detail.value.unit };
  if (value.value || value.unit) {
    return {
      type: 'number',
      value_number: value.value,
      unit: value.unit,
    };
  }
  const type = typeof value;
  return {
    type,
    [`value_${type}`]: value,
    unit: detail.value.unit,
  };
};

const getTypeOfOffer = estate => {
  const { rent, purchaseprice } = estate;
  if (purchaseprice) {
    const {
      value: { value },
      unit,
      formattedValue,
    } = purchaseprice;

    return {
      type: 'PURCHASE',
      value,
      unit,
      formattedValue,
    };
  }
  if (rent) {
    const {
      value: { value },
      unit,
      formattedValue,
    } = rent;

    return {
      type: 'RENT',
      value,
      unit,
      formattedValue,
    };
  }
};
const processEstate = (estate, options = {}) => {
  const {
    features = ['kitchen', 'balcony', 'elevator', 'office'],
    excludedKeys = [
      'previewimage',
      'characteristics',
      'owner',
      'creator',
      'modifier',
      'portalpublishing',
      'children',
      'origin',
    ],
  } = options;

  const previewImageId = estate.previewimage && estate.previewimage.id;

  excludedKeys.forEach(key => delete estate[key]);

  const {
    // directly formatted keys
    pictures,
    estatetype,
    propertyassistance,
    latitude,
    longitude,
    commissions,
    details: det,
    ...data
  } = estate;

  const details =
    det && det.any
      ? det.any.map(detail => ({
          name: detail.name,
          formattedValue: detail.value.formattedValue,
          selected:
            detail.value.selected && detail.value.selected !== ''
              ? {
                  rel: detail.value.selected.rel,
                  id: detail.value.selected.id,
                }
              : undefined,
          ...getValue(detail),
        }))
      : [];

  const area = details.find(detail => detail.name === 'totalarea');
  const rooms = details.find(detail => detail.name === 'rooms');

  const images =
    pictures && pictures.total < 1
      ? []
      : pictures.estatepicture.map(pic => ({
          headline: pic.headline,
          rel: pic.placeholder.rel,
          id: pic.id,
        }));

  const availableFeatures = details.filter(({ name }) =>
    features.includes(name)
  );

  const previewImage = images.find(({ id }) => id === previewImageId);

  return {
    ...data,
    estatetype: estatetype
      ? {
          name: estatetype.name,
          id: estatetype.selected.id,
        }
      : undefined,
    tradetype: propertyassistance
      ? {
          name: propertyassistance.name,
          id: propertyassistance.id,
        }
      : undefined,
    coordinates: {
      latitude,
      longitude,
    },
    typeOfOffer: getTypeOfOffer(data),
    images,
    previewImage,
    area,
    rooms,
    availableFeatures,
    commission:
      commissions && commissions.prospectcommission
        ? {
            value: commissions.prospect.value,
            type: commissions.prospect.type,
          }
        : undefined,
    details,
  };
};

module.exports = {
  processEstate,
  getValue,
  getTypeOfOffer,
};
