const test = require('node:test');
const assert = require('node:assert/strict');
const { isAllowedFileUrl, parseFileUrl } = require('../utils/fileUrl');
const { matchesSignature } = require('../middleware/upload');

test('file URLs are accepted only from our Cloudinary account', () => {
  const original = process.env.CLOUDINARY_CLOUD_NAME;
  process.env.CLOUDINARY_CLOUD_NAME = 'mycloud';
  try {
    assert.equal(isAllowedFileUrl('https://res.cloudinary.com/mycloud/image/upload/v1/a.jpg'), true);
    assert.equal(isAllowedFileUrl('https://res.cloudinary.com/othercloud/image/upload/a.jpg'), false);
    assert.equal(isAllowedFileUrl('http://res.cloudinary.com/mycloud/a.jpg'), false);
    assert.equal(isAllowedFileUrl('https://evil.example/res.cloudinary.com/mycloud/a.jpg'), false);
    assert.equal(isAllowedFileUrl('javascript:alert(1)'), false);
    assert.deepEqual(parseFileUrl(undefined), { value: undefined });
    assert.deepEqual(parseFileUrl(''), { value: null });
    assert.ok(parseFileUrl('https://example.com/x.pdf').error);
  } finally {
    process.env.CLOUDINARY_CLOUD_NAME = original;
  }
});

test('uploaded files must match their declared type by content', () => {
  const pad = (hex) => Buffer.concat([Buffer.from(hex, 'hex'), Buffer.alloc(16)]);
  assert.equal(matchesSignature(pad('ffd8ffe0'), 'image/jpeg'), true);
  assert.equal(matchesSignature(pad('89504e470d0a1a0a'), 'image/png'), true);
  assert.equal(matchesSignature(Buffer.concat([Buffer.from('RIFF\0\0\0\0WEBP'), Buffer.alloc(8)]), 'image/webp'), true);
  assert.equal(matchesSignature(Buffer.concat([Buffer.from('%PDF-1.7'), Buffer.alloc(8)]), 'application/pdf'), true);
  // HTML převlečené za obrázek neprojde
  assert.equal(matchesSignature(Buffer.from('<html><script>alert(1)</script>'), 'image/jpeg'), false);
  assert.equal(matchesSignature(pad('89504e470d0a1a0a'), 'image/jpeg'), false);
});
