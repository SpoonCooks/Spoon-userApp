import { Platform } from 'react-native';

import { VIDEO_COMPRESS_BITRATE, VIDEO_MAX_EDGE, compressGalleryVideo } from './compressVideo';

const mockCompress = jest.fn<Promise<string>, [string, Record<string, unknown>]>();
let mockLinked = true;
jest.mock('@core/native', () => ({
  loadVideoCompressor: () => (mockLinked ? { compress: mockCompress } : null),
}));
jest.mock('@features/booking', () => ({ localFileSize: async () => 5_600_000 }));

describe('Android gallery video compression', () => {
  beforeEach(() => {
    mockCompress.mockReset();
    mockLinked = true;
    jest.replaceProperty(Platform, 'OS', 'android');
  });
  afterEach(() => jest.restoreAllMocks());

  it('re-encodes to 960 px at 1.5 Mbps and hands back the mp4', async () => {
    mockCompress.mockResolvedValue('file:///cache/out.mp4');
    await expect(compressGalleryVideo('file:///picked.mp4')).resolves.toEqual({
      uri: 'file:///cache/out.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 5_600_000,
    });
    expect(mockCompress).toHaveBeenCalledWith('file:///picked.mp4', {
      compressionMethod: 'manual',
      maxSize: VIDEO_MAX_EDGE,
      bitrate: VIDEO_COMPRESS_BITRATE,
    });
  });

  it('reports a failure, for the video to be turned away rather than sent full size', async () => {
    mockCompress.mockRejectedValue(new Error('Failed to read the input video dimensions'));
    await expect(compressGalleryVideo('file:///picked.mp4')).resolves.toBe('failed');
  });

  it('leaves it to the iPhone picker, and to a build without the compressor', async () => {
    mockLinked = false;
    await expect(compressGalleryVideo('file:///picked.mp4')).resolves.toBeNull();
    mockLinked = true;
    jest.replaceProperty(Platform, 'OS', 'ios');
    await expect(compressGalleryVideo('file:///picked.mov')).resolves.toBeNull();
    expect(mockCompress).not.toHaveBeenCalled();
  });
});
