# estate-fetch

This module helps to fetch real estate data from [immobilienscout24](https://www.immobilienscout24.de/) and/or [flowfact](https://www.flowfact.de/).

- [estate-fetch](#estate-fetch)
  - [Usage](#usage)
    - [immobilienscout24](#immobilienscout24)
    - [flowfact](#flowfact)
  - [TODO](#todo)

## Usage

### immobilienscout24

To use this module you need to pre-generate credentials for your is24 account.

```node
const { IS24, utils: { deepRenameProps } } = require('fetch-estates');

const runIs24 = async () => {
  const is24 = new IS24({
    oauth_consumer_key: 'oauth_consumer_key',
    consumer_secret: 'consumer_secret',
    oauth_token: 'oauth_token',
    oauth_token_secret: 'oauth_token_secret',
  });

  const estates = await is24.getEstates();
  const [{ id }] = estates;

  const estate = await is24.getEstate(id);
  const sanitizedEstate = deepRenameProps(estate); // helps to get rid of weird key names in is24 data

  // Fetch (resolved) attachments
  const attachmentsByUrl = await is24.getAttachmentsByUrl(estate.attachmentUrl);
  const resolvedAttachmentsByUrl = await is24.getResolvedAttachmentsByUrl(estate.attachmentUrl);
  const attachmentsById = await is24.getAttachmentsById(id);
  const resolvedAttachmentsById = await is24.getResolvedAttachmentsById(id);
};

runIs24().then(console.log).catch(console.error);
```

### flowfact

To use this module you need to use credentials for your flowfact account.

```node
const { FlowFact, utils: { processFlowFactEstate } } = require('fetch-estates');

const runFlowFact = async () => {
  const flowFact = new FlowFact({
    user: '<user>',
    customer: '<customer>',
    password: '<password>',
  });

  const estates = await flowFact.getEstates();
  const [{ id }] = estates;

  const estate = await flowFact.getEstate(id);
  const processedEstate = processEstate(estate);

  // Fetch (resolved) images
  const pictures = await flowFact.getPictures(id);
  const resolvedPictures = await flowFact.getResolvedPictures(id);
};

runFlowFact().then(console.log).catch(console.error);
```

## TODO

- [ ] tests
- [ ] integrate ci (github actions)
- [ ] integrate [semantic-release](https://www.npmjs.com/package/semantic-release)
