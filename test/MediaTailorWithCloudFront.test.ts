import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MediaTailorWithCloudFront } from '../src';
import { CloudFront } from '../src/CloudFront';
import { MediaTailor } from '../src/MediaTailor';

test('Create MediaTailor', () => {
  const app = new App();
  const stack = new Stack(app, 'SmokeStack');

  new MediaTailor(stack, 'MediaTailor', {
    videoContentSourceUrl: 'https://example.com/out/index.mpd',
    adDecisionServerUrl: 'https://example.com/adserver',
    slateAdUrl: 'https://example.com/slate.mp4',
  });

  const template = Template.fromStack(stack);

  template.hasResource('AWS::MediaTailor::PlaybackConfiguration', 1);
});

test('Create CloudFront', () => {
  const app = new App();
  const stack = new Stack(app, 'SmokeStack');

  new CloudFront(stack, 'CloudFront', {
    videoContentSourceUrl: 'https://example.com/out/index.m3u8',
    mediaTailorEndpointUrl: 'https://example.com/manifest.m3u8',
  });

  const template = Template.fromStack(stack);

  template.hasResource('AWS::CloudFront::Distribution', 1);
});

test('Create MediaTailorWithCloudFront', () => {
  const app = new App();
  const stack = new Stack(app, 'SmokeStack');

  new MediaTailorWithCloudFront(stack, 'MediaTailorWithCloudFront', {
    videoContentSourceUrl: 'https://example.com/out/index.m3u8',
    adDecisionServerUrl: 'https://example.com/adserver',
  });

  const template = Template.fromStack(stack);

  template.hasResource('AWS::MediaTailor::PlaybackConfiguration', 1);
  template.hasResource('AWS::CloudFront::Distribution', 1);
});