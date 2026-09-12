const {
  diagnoseCarouselExportStorage,
} = require('../../services/pivotExportArtifactStorage');

function s3Client({ listError, presign } = {}) {
  return {
    listObjectsV2: jest.fn(() => ({
      promise: listError
        ? jest.fn().mockRejectedValue(listError)
        : jest.fn().mockResolvedValue({ Contents: [] }),
    })),
    getSignedUrlPromise: jest.fn().mockResolvedValue(presign === undefined ? 'https://s3.test/put' : presign),
  };
}

const ENV = {
  AWS_S3_BUCKET_NAME: 'pivot-exports',
  AWS_REGION: 'us-west-2',
  AWS_ACCESS_KEY_ID: 'AKIA_TEST',
  AWS_SECRET_ACCESS_KEY: 'secret',
};

describe('diagnoseCarouselExportStorage', () => {
  it('fails closed when the bucket is missing', async () => {
    const diagnostic = await diagnoseCarouselExportStorage({
      env: {},
      s3Client: s3Client(),
      now: () => Date.parse('2026-09-12T08:00:00.000Z'),
    });
    expect(diagnostic.status).toBe('failed');
    expect(diagnostic.code).toBe('CAROUSEL_EXPORT_STORAGE_UNCONFIGURED');
    expect(diagnostic.checks[0]).toMatchObject({ name: 'Bucket configuration', status: 'failed' });
  });

  it('lists the export prefix and mints a PUT URL without writing an object', async () => {
    const client = s3Client();
    const diagnostic = await diagnoseCarouselExportStorage({
      env: ENV,
      s3Client: client,
      now: () => Date.parse('2026-09-12T08:00:00.000Z'),
    });
    expect(diagnostic.status).toBe('accepted');
    expect(diagnostic.code).toBe('CAROUSEL_EXPORT_STORAGE_OK');
    expect(client.listObjectsV2).toHaveBeenCalledWith(expect.objectContaining({
      Bucket: 'pivot-exports',
      Prefix: 'pivot-exports/',
      MaxKeys: 1,
    }));
    expect(client.getSignedUrlPromise).toHaveBeenCalledWith(
      'putObject',
      expect.objectContaining({ Key: 'pivot-exports/_diagnostic/probe.bin' }),
    );
    expect(diagnostic.checks.map((check) => check.status)).toEqual(['passed', 'passed', 'passed', 'passed']);
  });
});
